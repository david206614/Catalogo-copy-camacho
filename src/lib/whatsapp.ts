import type { CartItem, CustomerDetails } from '../types/database';

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function sanitizePhoneNumber(phone: string): string {
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.length === 10 && clean.startsWith('3')) {
    clean = `57${clean}`;
  }
  return clean;
}

export function generateWhatsAppOrderUrl(
  items: CartItem[],
  customer: CustomerDetails,
  phoneNumber: string = import.meta.env.VITE_WHATSAPP_PHONE || '573173312352',
  storeName: string = import.meta.env.VITE_STORE_NAME || 'Copy Camacho'
): string {
  const cleanPhone = sanitizePhoneNumber(phoneNumber);
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  let message = `👋 ¡Hola *${storeName}*! Quiero realizar el siguiente pedido desde el catálogo web:\n\n`;

  message += `👤 *Cliente:* ${customer.name || 'No especificado'}\n`;
  message += `📦 *Entrega:* ${customer.deliveryMethod === 'domicilio' ? '🛵 Domicilio' : '🏬 Recogida en tienda'}\n`;
  if (customer.deliveryMethod === 'domicilio' && customer.address) {
    message += `📍 *Dirección:* ${customer.address}\n`;
  }
  if (customer.notes) {
    message += `📝 *Notas:* ${customer.notes}\n`;
  }

  message += `\n🛒 *DETALLE DEL PEDIDO:*\n`;
  message += `────────────────────────────\n`;

  items.forEach((item, index) => {
    const itemSubtotal = item.product.price * item.quantity;
    message += `${index + 1}. *${item.product.name}*\n`;
    message += `   • Cantidad: ${item.quantity}\n`;
    message += `   • Precio unitario: ${formatCOP(item.product.price)}\n`;
    message += `   • Subtotal: ${formatCOP(itemSubtotal)}\n\n`;
  });

  message += `────────────────────────────\n`;
  message += `💰 *TOTAL ESTIMADO: ${formatCOP(total)}*\n\n`;
  message += `¿Tienen disponibilidad de estos productos para confirmar mi compra? ¡Muchas gracias! ✨`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
