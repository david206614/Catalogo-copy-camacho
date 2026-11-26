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
    // Insert without .select() so anon customers can submit quotes while SELECT on orders remains admin-only via RLS.
    const { error } = await supabase.from('orders').insert({
      customer_name: record.customer_name,
      delivery_method: record.delivery_method,
      address: record.address,
      notes: record.notes,
      items: record.items,
      total: record.total,
      status: record.status,
    });
    if (!error) return record;
    console.warn('Supabase orders insert error, saving locally:', error.message);
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

export async function updateOrderStatus(
  orderId: string,
  status: 'cotizacion' | 'pedido'
): Promise<boolean> {
  if (isSupabaseConfigured && !orderId.startsWith('local-')) {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    return !error;
  }

  const localOrders = readLocalOrders().map((order) =>
    order.id === orderId ? { ...order, status } : order
  );
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(localOrders));
  return true;
}
