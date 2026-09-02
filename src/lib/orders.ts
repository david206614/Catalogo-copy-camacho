import type { CartItem, CustomerDetails, OrderRecord } from '../types/database';
import { isSupabaseConfigured, supabase } from './supabase';

const LOCAL_ORDERS_KEY = 'copy_camacho_orders_v1';

const readLocalOrders = (): OrderRecord[] => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_ORDERS_KEY) || '[]');
  } catch {
    return [];
  }
};

export async function saveQuote(items: CartItem[], customer: CustomerDetails, total: number) {
  const record: OrderRecord = {
    id: `local-${Date.now()}`,
    customer_name: customer.name,
    delivery_method: customer.deliveryMethod,
    address: customer.address || null,
    notes: customer.notes || null,
    items,
    total,
    status: 'cotizacion',
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('orders').insert({
      customer_name: record.customer_name,
      delivery_method: record.delivery_method,
      address: record.address,
      notes: record.notes,
      items: record.items,
      total: record.total,
      status: record.status,
    }).select().single();
    if (!error && data) return data as OrderRecord;
  }

  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify([record, ...readLocalOrders()]));
  return record;
}

export async function getOrderHistory(): Promise<OrderRecord[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (!error && data) return data as OrderRecord[];
  }
  return readLocalOrders();
}
