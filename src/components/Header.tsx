import { ShoppingBag, Search, MessageCircle, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatCOP, sanitizePhoneNumber } from '../lib/whatsapp';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenAdmin?: () => void;
}

export const Header = ({ searchQuery, setSearchQuery, onOpenAdmin }: HeaderProps) => {
  const { totalItems, totalPrice, setIsCartOpen } = useCart();
  const phone = sanitizePhoneNumber(import.meta.env.VITE_WHATSAPP_PHONE || '573173312352');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Logo / Brand */}
          <div className="flex items-center gap-3 min-w-max cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-orange-500 via-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 font-bold text-xl">
              CC
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight leading-tight">
                  Copy Camacho
                </h1>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5" /> Útiles
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block font-medium">
                Catálogo de Útiles Escolares & Papelería
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-2 sm:mx-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar cuadernos, bolígrafos, colores..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-900 placeholder-slate-400 rounded-full border border-transparent focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-hidden transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-full w-4 h-4 flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Actions: Direct WhatsApp & Cart Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={`https://wa.me/${phone}?text=${encodeURIComponent('¡Hola Copy Camacho! Tengo una consulta sobre sus útiles escolares.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-full border border-emerald-200/60 transition-colors"
              title="Preguntar directamente por WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-500/20" />
              <span>WhatsApp</span>
            </a>

            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="hidden lg:inline-flex text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              >
                + Producto
              </button>
            )}

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2.5 px-3.5 py-2 sm:py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              aria-label="Abrir carrito"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-rose-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline font-semibold">
                {totalItems > 0 ? formatCOP(totalPrice) : 'Carrito'}
              </span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
