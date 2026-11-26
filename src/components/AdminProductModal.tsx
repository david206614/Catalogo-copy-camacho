import { useState, useRef, useEffect, type DragEvent, type ChangeEvent } from 'react';
import type { Category, Product } from '../types/database';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { uploadProductImage, fileToDataUrl } from '../lib/storage';
import {
  X,
  Plus,
  Pencil,
  Check,
  Sparkles,
  UploadCloud,
  Trash2,
  Link as LinkIcon,
  Loader2,
} from 'lucide-react';

interface AdminProductModalProps {
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onProductSaved: (savedProduct: Product) => void;
  editingProduct?: Product | null;
}

export const AdminProductModal = ({
  categories,
  isOpen,
  onClose,
  onProductSaved,
  editingProduct = null,
}: AdminProductModalProps) => {
  const isEditing = Boolean(editingProduct);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageRemoved, setImageRemoved] = useState(false);
  const [useManualUrl, setUseManualUrl] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [inStock, setInStock] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (editingProduct) {
      setName(editingProduct.name);
      setCategoryId(editingProduct.category_id || categories[0]?.id || '');
      setPrice(String(editingProduct.price));
      setDescription(editingProduct.description || '');
      setImageUrl(editingProduct.image_url || '');
      setImagePreview(editingProduct.image_url || '');
      setImageFile(null);
      setImageRemoved(false);
      setUseManualUrl(false);
      setInStock(editingProduct.in_stock);
      setFeatured(Boolean(editingProduct.featured));
    } else {
      setName('');
      setCategoryId(categories[0]?.id || '');
      setPrice('');
      setDescription('');
      setImageUrl('');
      setImageFile(null);
      setImagePreview('');
      setImageRemoved(false);
      setUseManualUrl(false);
      setInStock(true);
      setFeatured(false);
    }

    setIsDragging(false);
    setError('');
    setSuccess(false);
    setUploadStatus('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [isOpen, editingProduct, categories]);

  if (!isOpen) return null;

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido (PNG, JPG, WebP o SVG).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen es demasiado pesada (máximo 10MB).');
      return;
    }

    setError('');
    setImageFile(file);
    setImageRemoved(false);
    try {
      const preview = await fileToDataUrl(file);
      setImagePreview(preview);
    } catch {
      setError('No se pudo previsualizar la imagen.');
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const removeSelectedImage = () => {
    setImageFile(null);
    setImagePreview('');
    setImageUrl('');
    setImageRemoved(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      setError('Por favor completa el nombre y el precio del producto.');
      return;
    }

    setLoading(true);
    setError('');
    setUploadStatus('Procesando imagen...');

    let finalImageUrl: string | null = editingProduct?.image_url ?? null;

    try {
      if (useManualUrl) {
        finalImageUrl = imageUrl.trim() || null;
      } else if (imageFile) {
        setUploadStatus('Optimizando y subiendo imagen...');
        finalImageUrl = await uploadProductImage(imageFile);
      } else if (imageRemoved) {
        finalImageUrl = null;
      }

      setUploadStatus(isEditing ? 'Actualizando producto...' : 'Guardando producto...');

      const productPayload = {
        name: name.trim(),
        category_id: categoryId || (categories[0]?.id ?? null),
        price: parseFloat(price),
        description: description.trim() || null,
        image_url: finalImageUrl,
        in_stock: inStock,
        featured,
      };

      if (isSupabaseConfigured && !(editingProduct && editingProduct.id.startsWith('local-'))) {
        const query = editingProduct
          ? supabase
              .from('products')
              .update(productPayload)
              .eq('id', editingProduct.id)
              .select()
              .single()
          : supabase
              .from('products')
              .insert([productPayload])
              .select()
              .single();

        const { data, error: saveError } = await query;

        if (saveError) {
          if (saveError.code === '42501') {
            throw new Error(
              'Permisos RLS bloqueados en Supabase: verifica que hayas iniciado sesión con tu usuario de Supabase Auth y ejecutado supabase/schema.sql.'
            );
          }
          throw saveError;
        }
        if (data) {
          onProductSaved(data as Product);
          setSuccess(true);
          setTimeout(() => {
            setSuccess(false);
            onClose();
          }, 700);
        }
      } else {
        const localProduct: Product = {
          id: editingProduct?.id || `local-${Date.now()}`,
          ...productPayload,
          created_at: editingProduct?.created_at || new Date().toISOString(),
        };
        onProductSaved(localProduct);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 700);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar el producto';
      setError(message);
    } finally {
      setLoading(false);
      setUploadStatus('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              {isEditing ? <Pencil className="w-4 h-4" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? 'Editar Producto' : 'Agregar Nuevo Producto'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {isSupabaseConfigured
                  ? 'Los cambios se sincronizan con Supabase'
                  : 'Modo local de pruebas'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre del producto *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Marcadores Sharpie x12 Colores"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 focus:bg-white focus:border-orange-500 outline-hidden transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-orange-500 outline-hidden cursor-pointer font-medium"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="text-slate-900 bg-white">
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Precio (COP) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="50"
                placeholder="24500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 focus:bg-white focus:border-orange-500 outline-hidden font-medium"
              />
            </div>
          </div>

          {/* Image Upload Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Imagen del producto
              </label>
              <button
                type="button"
                onClick={() => {
                  setUseManualUrl((prev) => !prev);
                  setImageFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-[11px] text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 cursor-pointer"
              >
                {useManualUrl ? (
                  <>
                    <UploadCloud className="w-3 h-3" /> Subir archivo directo
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-3 h-3" /> Usar enlace URL externo
                  </>
                )}
              </button>
            </div>

            {useManualUrl ? (
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setImageRemoved(false);
                }}
                className="w-full text-xs px-3 py-2 bg-slate-50 text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 focus:bg-white focus:border-orange-500 outline-hidden font-medium"
              />
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  onChange={handleInputChange}
                  className="hidden"
                  id="product-image-upload"
                />

                {!imagePreview ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-orange-500 bg-orange-50/70 scale-[0.99]'
                        : 'border-slate-200 hover:border-orange-400 hover:bg-orange-50/20 bg-slate-50/60'
                    }`}
                  >
                    <div className="w-10 h-10 mx-auto rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-2 shadow-xs">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">
                      Haz clic para seleccionar o arrastra una imagen aquí
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      PNG, JPG, WebP o SVG (Se optimizará automáticamente)
                    </p>
                  </div>
                ) : (
                  <div className="relative flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-xs shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {imageFile?.name || 'Imagen actual del producto'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : 'Guardada en catálogo'}
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-1 text-[11px] text-orange-600 hover:text-orange-700 font-medium cursor-pointer"
                      >
                        Cambiar imagen
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={removeSelectedImage}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Eliminar imagen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descripción / Marca / Detalles
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Tinta permanente de secado rápido, punta fina resistente..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 focus:bg-white focus:border-orange-500 outline-hidden resize-none font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 accent-orange-500"
              />
              <span>Disponible en stock</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 accent-orange-500"
              />
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Destacado en portada
              </span>
            </label>
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              {error}
            </p>
          )}
          {success && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              <Check className="w-4 h-4" />{' '}
              {isEditing
                ? '¡Producto actualizado correctamente!'
                : '¡Producto agregado correctamente al catálogo!'}
            </div>
          )}

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 disabled:opacity-50 cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {uploadStatus || 'Guardando...'}
                </>
              ) : isEditing ? (
                'Guardar Cambios'
              ) : (
                'Guardar Producto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
