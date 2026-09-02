import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { formatCOP, generateWhatsAppOrderUrl } from '../lib/whatsapp';
import { saveQuote } from '../lib/orders';
import { X, Trash2, Plus, Minus, MessageCircle, ShoppingBag, ArrowRight, Store, Truck } from 'lucide-react';

export const CartDrawer = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalPrice,
    totalItems,
    customerDetails,
    setCustomerDetails,
  } = useCart();

  const [validationError, setValidationError] = useState('');

  if (!isCartOpen) return null;

  const handleCheckout = async () => {
    if (!customerDetails.name.trim()) {
      setValidationError('Por favor ingresa tu nombre para personalizar el pedido.');
      return;
    }
    if (customerDetails.deliveryMethod === 'domicilio' && !customerDetails.address?.trim()) {
      setValidationError('Por favor ingresa tu dirección para el domicilio.');
      return;
    }
    setValidationError('');

    // The WhatsApp action is a quotation until the store confirms the order.
    try {
      await saveQuote(cart, customerDetails, totalPrice);
    } catch (error) {
      // A WhatsApp order must still work if the history service is temporarily unavailable.
      console.warn('No se pudo registrar la cotización:', error);
    }
    const url = generateWhatsAppOrderUrl(cart, customerDetails);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Tu Pedido</h2>
                <p className="text-xs text-slate-500">
                  {totalItems} {totalItems === 1 ? 'producto' : 'productos'} seleccionados
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-slate-400 hover:text-rose-600 px-2 py-1 rounded transition-colors"
                  title="Vaciar carrito"
                >
                  Vaciar
                </button>
              )}
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body: Cart items + Order Form */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center text-orange-400 mb-4">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <h3 className="text-base font-bold text-slate-800">El carrito está vacío</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Explora nuestro catálogo de útiles escolares y agrega lo que necesites a tu lista.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-6 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
                >
                  Explorar Catálogo
                </button>
              </div>
            ) : (
              <>
                {/* List of Cart Items */}
                <div className="divide-y divide-slate-100">
                  {cart.map((item) => (
                    <div key={item.product.id} className="py-3.5 flex items-center gap-3">
                      
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                        {item.product.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-lg">
                            📦
                          </div>
                        )}
                      </div>

                      {/* Info & Quantity controls */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {item.product.name}
                        </h4>
                        <span className="text-xs font-semibold text-orange-600 block mt-0.5">
                          {formatCOP(item.product.price)}
                        </span>

                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 px-1 py-0.5">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="w-5 h-5 rounded text-slate-500 hover:text-slate-900 flex items-center justify-center"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-slate-800">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="w-5 h-5 rounded text-slate-500 hover:text-slate-900 flex items-center justify-center"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="text-[11px] font-bold text-slate-600 ml-auto">
                            {formatCOP(item.product.price * item.quantity)}
                          </span>

                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                      </div>

                    </div>
                  ))}
                </div>

                {/* Customer Details Form */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3.5">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    📋 Datos para la confirmación
                  </h3>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Carlos Gómez"
                      value={customerDetails.name}
                      onChange={(e) =>
                        setCustomerDetails((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Modalidad de entrega
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setCustomerDetails((prev) => ({ ...prev, deliveryMethod: 'recogida' }))
                        }
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          customerDetails.deliveryMethod === 'recogida'
                            ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>En tienda</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setCustomerDetails((prev) => ({ ...prev, deliveryMethod: 'domicilio' }))
                        }
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          customerDetails.deliveryMethod === 'domicilio'
                            ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Domicilio</span>
                      </button>
                    </div>
                  </div>

                  {customerDetails.deliveryMethod === 'domicilio' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Dirección y Barrio en Cali *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Cra 10 # 5-20, Barrio San Fernando"
                        value={customerDetails.address || ''}
                        onChange={(e) =>
                          setCustomerDetails((prev) => ({ ...prev, address: e.target.value }))
                        }
                        className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-hidden"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Observaciones / Notas (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Cuadernos de cuadros grandes, bolígrafo azul"
                      value={customerDetails.notes || ''}
                      onChange={(e) =>
                        setCustomerDetails((prev) => ({ ...prev, notes: e.target.value }))
                      }
                      className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-hidden"
                    />
                  </div>

                  {validationError && (
                    <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg border border-rose-200">
                      ⚠️ {validationError}
                    </p>
                  )}
                </div>
              </>
            )}

          </div>

          {/* Footer: Totals and WhatsApp CTA */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-slate-200 bg-white space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Estimado
                </span>
                <span className="text-xl font-extrabold text-slate-900">
                  {formatCOP(totalPrice)}
                </span>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-white/20" />
                <span>Pedir por WhatsApp</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <p className="text-[10px] text-center text-slate-400">
                Al enviar el pedido, se abrirá tu WhatsApp con el detalle listo para confirmar disponibilidad con Copy Camacho.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
