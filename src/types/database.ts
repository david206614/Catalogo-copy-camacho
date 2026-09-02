export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  created_at?: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  in_stock: boolean;
  featured?: boolean;
  created_at?: string;
  categories?: Category;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CustomerDetails {
  name: string;
  deliveryMethod: 'recogida' | 'domicilio';
  address?: string;
  notes?: string;
}

export interface OrderRecord {
  id: string;
  customer_name: string;
  delivery_method: 'recogida' | 'domicilio';
  address?: string | null;
  notes?: string | null;
  items: CartItem[];
  total: number;
  status: 'cotizacion' | 'pedido';
  created_at: string;
}
