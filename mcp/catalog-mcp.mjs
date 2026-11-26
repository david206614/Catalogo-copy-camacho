#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const STORAGE_BUCKET = 'product-images';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const EXT_TO_MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

function loadDotEnvFile(envPath) {
  const result = {};
  if (!fs.existsSync(envPath)) return result;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

const fileEnv = loadDotEnvFile(path.join(PROJECT_ROOT, '.env.local'));
const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  fileEnv.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey =
  serviceRoleKey ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  fileEnv.VITE_SUPABASE_ANON_KEY;
const adminEmail = process.env.SUPABASE_ADMIN_EMAIL || fileEnv.SUPABASE_ADMIN_EMAIL;
const adminPassword = process.env.SUPABASE_ADMIN_PASSWORD || fileEnv.SUPABASE_ADMIN_PASSWORD;

let cachedClient = null;
let signedInAdmin = false;

async function getSupabaseClient(requireWriteAuth = false) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local).'
    );
  }
  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: true },
    });
  }
  if (requireWriteAuth && !serviceRoleKey && !signedInAdmin) {
    if (!adminEmail || !adminPassword) {
      throw new Error(
        'Write operations require either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ADMIN_EMAIL + SUPABASE_ADMIN_PASSWORD in MCP env or .env.local.'
      );
    }
    const { error } = await cachedClient.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });
    if (error) {
      throw new Error(`Admin sign-in failed for MCP: ${error.message}`);
    }
    signedInAdmin = true;
  }
  return cachedClient;
}

const TOOLS = [
  {
    name: 'list_categories',
    description: 'List all product categories in the Copy Camacho Supabase database.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'list_products',
    description:
      'List products from the Copy Camacho Supabase catalog. Set only_without_image=true to find products missing photos.',
    inputSchema: {
      type: 'object',
      properties: {
        only_without_image: {
          type: 'boolean',
          description: 'When true, return only products whose image_url is null or empty.',
        },
        category_id: {
          type: 'string',
          description: 'Optional category UUID filter.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'upload_product_image',
    description:
      'Upload an image (from a local file_path or a remote source_url) to the Supabase Storage "product-images" bucket and update the product image_url in public.products.',
    inputSchema: {
      type: 'object',
      properties: {
        product_id: {
          type: 'string',
          description: 'UUID of the product in public.products.',
        },
        file_path: {
          type: 'string',
          description: 'Absolute path to a local image file (.jpg, .jpeg, .png, .webp, .svg).',
        },
        source_url: {
          type: 'string',
          description: 'HTTP(S) URL of an image to download and store in Supabase Storage.',
        },
      },
      required: ['product_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'update_product',
    description:
      'Update fields (name, description, price, category_id, image_url, in_stock, featured) of an existing product in public.products.',
    inputSchema: {
      type: 'object',
      properties: {
        product_id: { type: 'string', description: 'UUID of the product to update.' },
        name: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        category_id: { type: 'string' },
        image_url: { type: 'string' },
        in_stock: { type: 'boolean' },
        featured: { type: 'boolean' },
      },
      required: ['product_id'],
      additionalProperties: false,
    },
  },
];

async function handleToolCall(name, args = {}) {
  const requiresWrite = name === 'upload_product_image' || name === 'update_product';
  const supabase = await getSupabaseClient(requiresWrite);

  if (name === 'list_categories') {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, icon')
      .order('name');
    if (error) throw new Error(`Supabase error: ${error.message}`);
    return { count: data.length, categories: data };
  }

  if (name === 'list_products') {
    let query = supabase
      .from('products')
      .select('id, name, description, price, category_id, image_url, in_stock, featured, created_at')
      .order('created_at', { ascending: false });

    if (args.category_id) {
      query = query.eq('category_id', args.category_id);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Supabase error: ${error.message}`);

    const filtered = args.only_without_image
      ? data.filter((p) => !p.image_url || !p.image_url.trim())
      : data;

    return {
      total: data.length,
      matched: filtered.length,
      products: filtered,
    };
  }

  if (name === 'upload_product_image') {
    const { product_id, file_path, source_url } = args;
    if (!product_id) throw new Error('product_id is required.');
    if ((!file_path && !source_url) || (file_path && source_url)) {
      throw new Error('Provide exactly one of file_path or source_url.');
    }

    const { data: product, error: prodErr } = await supabase
      .from('products')
      .select('id, name, image_url')
      .eq('id', product_id)
      .single();
    if (prodErr || !product) {
      throw new Error(`Product not found (${product_id}): ${prodErr?.message || 'no match'}`);
    }

    let buffer;
    let contentType;
    let baseName = product.name;

    if (file_path) {
      if (!fs.existsSync(file_path)) {
        throw new Error(`Local file not found: ${file_path}`);
      }
      const ext = path.extname(file_path).toLowerCase();
      contentType = EXT_TO_MIME[ext];
      if (!contentType) {
        throw new Error(`Unsupported file extension "${ext}". Supported: ${Object.keys(EXT_TO_MIME).join(', ')}`);
      }
      buffer = fs.readFileSync(file_path);
      baseName = path.basename(file_path, ext);
    } else {
      const parsedUrl = new URL(source_url);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new Error('source_url must use http or https.');
      }
      const res = await fetch(source_url);
      if (!res.ok) {
        throw new Error(`Failed to fetch image (${res.status} ${res.statusText})`);
      }
      const rawType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
      const urlExt = path.extname(parsedUrl.pathname).toLowerCase();
      contentType = MIME_TO_EXT[rawType] ? rawType : EXT_TO_MIME[urlExt];
      if (!contentType) {
        throw new Error(`Unsupported remote image content-type "${rawType}".`);
      }
      buffer = Buffer.from(await res.arrayBuffer());
    }

    if (buffer.byteLength > MAX_IMAGE_BYTES) {
      throw new Error(`Image exceeds 10MB limit (${(buffer.byteLength / (1024 * 1024)).toFixed(2)} MB).`);
    }

    const ext = MIME_TO_EXT[contentType];
    const safeSlug = baseName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase()
      .slice(0, 24) || 'product';
    const storageFileName = `prod_${Date.now()}_${safeSlug}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storageFileName, buffer, {
        contentType,
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storageFileName);
    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) {
      throw new Error('Could not resolve public URL after upload.');
    }

    const { data: updated, error: updateErr } = await supabase
      .from('products')
      .update({ image_url: publicUrl })
      .eq('id', product_id)
      .select('id, name, image_url')
      .single();

    if (updateErr) {
      throw new Error(`Uploaded image (${publicUrl}) but failed to update product row: ${updateErr.message}`);
    }

    return {
      status: 'uploaded_and_linked',
      storage_path: `${STORAGE_BUCKET}/${storageFileName}`,
      bytes: buffer.byteLength,
      content_type: contentType,
      product: updated,
    };
  }

  if (name === 'update_product') {
    const { product_id, ...fields } = args;
    if (!product_id) throw new Error('product_id is required.');

    const allowed = ['name', 'description', 'price', 'category_id', 'image_url', 'in_stock', 'featured'];
    const payload = {};
    for (const key of allowed) {
      if (fields[key] !== undefined) payload[key] = fields[key];
    }
    if (Object.keys(payload).length === 0) {
      throw new Error('Provide at least one field to update.');
    }

    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', product_id)
      .select('*')
      .single();

    if (error) throw new Error(`Supabase update error: ${error.message}`);
    return { status: 'updated', product: data };
  }

  throw new Error(`Unknown tool: ${name}`);
}

function sendMessage(msg) {
  process.stdout.write(`${JSON.stringify(msg)}\n`);
}

function sendResult(id, result) {
  sendMessage({ jsonrpc: '2.0', id, result });
}

function sendError(id, code, message) {
  sendMessage({ jsonrpc: '2.0', id, error: { code, message } });
}

const rl = readline.createInterface({ input: process.stdin, terminal: false });

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let req;
  try {
    req = JSON.parse(trimmed);
  } catch (err) {
    process.stderr.write(`[catalog-mcp] Invalid JSON: ${err.message}\n`);
    return;
  }

  const { id, method, params } = req;

  // Notifications have no id and require no response
  if (id === undefined || id === null) {
    return;
  }

  try {
    if (method === 'initialize') {
      sendResult(id, {
        protocolVersion: params?.protocolVersion || '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: {
          name: 'copy-camacho-catalog',
          version: '1.0.0',
        },
      });
      return;
    }

    if (method === 'ping') {
      sendResult(id, {});
      return;
    }

    if (method === 'tools/list') {
      sendResult(id, { tools: TOOLS });
      return;
    }

    if (method === 'tools/call') {
      try {
        const result = await handleToolCall(params?.name, params?.arguments);
        sendResult(id, {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: false,
        });
      } catch (toolErr) {
        sendResult(id, {
          content: [{ type: 'text', text: `Error: ${toolErr.message}` }],
          isError: true,
        });
      }
      return;
    }

    sendError(id, -32601, `Method not found: ${method}`);
  } catch (err) {
    sendError(id, -32603, err.message || 'Internal error');
  }
});
