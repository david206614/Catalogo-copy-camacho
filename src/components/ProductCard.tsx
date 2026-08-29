import type { Product, Category } from '../types/database';
import { useCart } from '../context/CartContext';
import { formatCOP } from '../lib/whatsapp';
import { Plus, Check, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  categories: Category[];
  onOpenDetails?: (product: Product) => void;
}

export const ProductCard = ({
  product,
  categories,
  onOpenDetails,
}: ProductCardProps) => {
  const { addToCart, cart } = useCart();
  const cartItem = cart.find((item) => item.product.id === product.id);
  const inCart = Boolean(cartItem);

  const category = categories.find((c) => c.id === product.category_id);

  return (
    <div className="group flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-orange-500/30 transition-all duration-300 overflow-hidden">
      
      {/* Image container */}
      <div 
        className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden cursor-pointer"
        onClick={() => onOpenDetails && onOpenDetails(product)}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
            <span className="text-3xl mb-1">{category?.icon || '📦'}</span>
            <span className="text-xs">Sin imagen</span>
          </div>
        )}

        {/* Category badge */}
        {category && (
          <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/90 backdrop-blur-md text-slate-800 shadow-xs border border-white/40">
            {category.icon} {category.name}
          </span>
        )}

        {/* Quick detail overlay button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails && onOpenDetails(product);
          }}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md text-slate-700 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-xs"
          title="Ver detalles"
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Out of stock badge */}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white tracking-wide uppercase">
              Agotado
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 
            onClick={() => onOpenDetails && onOpenDetails(product)}
            className="font-bold text-slate-900 text-sm sm:text-base line-clamp-2 hover:text-orange-600 transition-colors cursor-pointer"
          >
            {product.name}
          </h3>

          {product.description && (
            <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* Price & Action */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Precio
            </span>
            <span className="text-base sm:text-lg font-extrabold text-slate-900">
              {formatCOP(product.price)}
            </span>
          </div>

          <button
            disabled={!product.in_stock}
            onClick={() => addToCart(product, 1)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              !product.in_stock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : inCart
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 active:scale-95'
                : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20 active:scale-95'
            }`}
          >
            {inCart ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Agregado ({cartItem?.quantity})</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
};
