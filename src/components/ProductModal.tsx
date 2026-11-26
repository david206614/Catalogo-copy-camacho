import { useState, useEffect } from 'react';
import type { Product, Category } from '../types/database';
import { useCart } from '../context/CartContext';
import { formatCOP, generateWhatsAppProductUrl } from '../lib/whatsapp';
import { X, Plus, Minus, ShoppingBag, MessageCircle, Share2, Check } from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
}

export const ProductModal = ({ product, categories, onClose }: ProductModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    setQuantity(1);
    setCopiedLink(false);
  }, [product?.id]);

  if (!product) return null;

  const category = categories.find((c) => c.id === product.category_id);

  const handleAdd = () => {
    addToCart(product, quantity);
    onClose();
  };

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}${import.meta.env.BASE_URL}?product=${encodeURIComponent(product.id)}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1800);
    } catch {
      window.prompt('Copia este enlace del producto:', shareUrl);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
      >
        {/* Top Action Buttons */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="h-9 px-3 rounded-full bg-white/90 backdrop-blur-md text-slate-600 hover:text-slate-900 flex items-center gap-1.5 shadow-md transition-colors text-xs font-semibold cursor-pointer"
            title="Copiar enlace directo del producto"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copiado</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compartir</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md text-slate-500 hover:text-slate-900 flex items-center justify-center shadow-md transition-colors cursor-pointer"
            aria-label="Cerrar detalle"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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

          <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between gap-4">
              {/* Quantity Stepper */}
              <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg bg-white shadow-xs text-slate-600 hover:text-slate-900 flex items-center justify-center font-bold cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-bold text-sm text-slate-800">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-lg bg-white shadow-xs text-slate-600 hover:text-slate-900 flex items-center justify-center font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add Button */}
              <button
                disabled={!product.in_stock}
                onClick={handleAdd}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {product.in_stock
                    ? `Agregar ${formatCOP(product.price * quantity)}`
                    : 'Agotado'}
                </span>
              </button>
            </div>

            <a
              href={generateWhatsAppProductUrl(product, quantity)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Consultar este producto por WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
