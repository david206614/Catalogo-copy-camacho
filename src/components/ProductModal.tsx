import { useState } from 'react';
import type { Product, Category } from '../types/database';
import { useCart } from '../context/CartContext';
import { formatCOP } from '../lib/whatsapp';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
}

export const ProductModal = ({ product, categories, onClose }: ProductModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  if (!product) return null;

  const category = categories.find((c) => c.id === product.category_id);

  const handleAdd = () => {
    addToCart(product, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md text-slate-500 hover:text-slate-900 flex items-center justify-center shadow-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image */}
        <div className="relative aspect-16/10 w-full bg-slate-100">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-slate-300">
              {category?.icon || '📦'}
            </div>
          )}
        </div>

        {/* Modal Info */}
        <div className="p-6">
          {category && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 mb-2">
              {category.icon} {category.name}
            </span>
          )}

          <h2 className="text-xl font-bold text-slate-900">{product.name}</h2>
          
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {formatCOP(product.price)}
          </div>

          {product.description && (
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              {product.description}
            </p>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
            
            {/* Quantity Stepper */}
            <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg bg-white shadow-xs text-slate-600 hover:text-slate-900 flex items-center justify-center font-bold"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center font-bold text-sm text-slate-800">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-lg bg-white shadow-xs text-slate-600 hover:text-slate-900 flex items-center justify-center font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Add Button */}
            <button
              disabled={!product.in_stock}
              onClick={handleAdd}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 active:scale-95 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Agregar {formatCOP(product.price * quantity)}</span>
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};
