import { useState, useEffect, useMemo } from 'react';
import type { Category, Product } from './types/database';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from './data/mockProducts';
import { Header } from './components/Header';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { AdminProductModal } from './components/AdminProductModal';
import { useCart } from './context/CartContext';
import { 
  Sparkles, 
  ShoppingBag, 
  MessageCircle, 
  Store, 
  Truck, 
  CheckCircle2, 
  Phone, 
  MapPin, 
  SlidersHorizontal 
} from 'lucide-react';

export function App() {
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const { setIsCartOpen, totalItems } = useCart();
  const phone = import.meta.env.VITE_WHATSAPP_PHONE || '573000000000';

  // Load from Supabase if configured
  useEffect(() => {
    async function loadData() {
      if (!isSupabaseConfigured) return;

      try {
        const [catRes, prodRes] = await Promise.all([
          supabase.from('categories').select('*').order('name'),
          supabase.from('products').select('*').order('created_at', { ascending: false }),
        ]);

        if (catRes.data && catRes.data.length > 0) {
          setCategories(catRes.data);
        }
        if (prodRes.data && prodRes.data.length > 0) {
          setProducts(prodRes.data);
        }
      } catch (err) {
        console.warn('Usando catálogo inicial:', err);
      }
    }

    loadData();
  }, []);

  const handleProductAdded = (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Filter by Category
    if (selectedCategoryId) {
      list = list.filter((p) => p.category_id === selectedCategoryId);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'featured':
      default:
        list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    return list;
  }, [products, selectedCategoryId, searchQuery, sortBy]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      
      {/* Top Notification Bar */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 text-white text-[11px] sm:text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5" />
        <span>¡Temporada Escolar y Universitaria 2026 en Copy Camacho! Hacé tu pedido online y confirmá por WhatsApp.</span>
      </div>

      {/* Main Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50/70 via-white to-slate-50 border-b border-slate-200/60 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100/80 text-orange-800 text-xs font-bold">
                <Store className="w-3.5 h-3.5" /> Papelería & Fotocopiado UNIAJC
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Todos tus útiles escolares en un solo lugar. <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-rose-600">
                  Sin preguntas de stock, pedí directo.
                </span>
              </h2>
              <p className="text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed">
                Revisa disponibilidad, precios y marcas en tiempo real. Arma tu carrito de artículos y te generamos el mensaje con el total exacto listo para enviar a nuestro WhatsApp.
              </p>

              {/* Value props */}
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Precios transparentes en COP</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs">
                  <Truck className="w-4 h-4 text-orange-600" />
                  <span>Domicilios en Cali & Recogida</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Atención directa por WhatsApp</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 hidden lg:flex justify-end">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl shadow-orange-500/5 space-y-4 max-w-xs w-full">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-orange-500/20">
                    🛍️
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">¿Cómo comprar?</h3>
                    <p className="text-xs text-slate-500">En 3 sencillos pasos</p>
                  </div>
                </div>

                <ol className="text-xs space-y-2.5 text-slate-600 font-medium list-decimal list-inside">
                  <li>Selecciona tus útiles favoritos</li>
                  <li>Ajusta las cantidades en el carrito</li>
                  <li>Haz clic en <strong>Pedir por WhatsApp</strong></li>
                </ol>

                {totalItems > 0 && (
                  <button
                    onClick={() => setIsCartOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Ver carrito ({totalItems})</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Main Catalog Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        
        {/* Category Filters Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Categorías
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
            </span>
          </div>

          <CategoryFilter
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        </div>

        {/* Filter controls / Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-xs font-medium text-slate-600">
            {selectedCategoryId
              ? `Mostrando ${categories.find((c) => c.id === selectedCategoryId)?.name}`
              : 'Mostrando todas las categorías'}
            {searchQuery && ` para "${searchQuery}"`}
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-hidden focus:border-orange-500 cursor-pointer"
            >
              <option value="featured">Destacados</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
              <option value="name">Nombre (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3">
            <div className="text-4xl">🔍</div>
            <h3 className="font-bold text-base text-slate-800">No encontramos productos</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No hay artículos que coincidan con los filtros seleccionados. Probá buscando otra categoría o término.
            </p>
            <button
              onClick={() => {
                setSelectedCategoryId(null);
                setSearchQuery('');
              }}
              className="mt-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-xs font-bold shadow-xs cursor-pointer"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categories={categories}
                onOpenDetails={(p) => setSelectedProduct(p)}
              />
            ))}
          </div>
        )}

      </main>

      {/* Floating Cart Button for Mobile */}
      {totalItems > 0 && (
        <div className="sm:hidden fixed bottom-5 right-5 z-30">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-slate-900 text-white font-bold text-sm shadow-2xl active:scale-95 border-2 border-orange-500 cursor-pointer"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {totalItems}
              </span>
            </div>
            <span>Ver Pedido</span>
          </button>
        </div>
      )}

      {/* Modals & Drawers */}
      <ProductModal
        product={selectedProduct}
        categories={categories}
        onClose={() => setSelectedProduct(null)}
      />

      <CartDrawer />

      <AdminProductModal
        categories={categories}
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onProductAdded={handleProductAdded}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500 text-white font-bold flex items-center justify-center text-sm">
                  CC
                </div>
                <span className="font-extrabold text-base text-slate-900">Copy Camacho</span>
              </div>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Catálogo virtual de útiles escolares, artículos de papelería e impresiones. Pedidos rápidos con confirmación directa por WhatsApp.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Contacto & Ubicación</h4>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>Cali, Valle del Cauca — Institución Universitaria Antonio José Camacho</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>WhatsApp: +{phone}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Proyecto Académico</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Desarrollado para la Facultad de Ingeniería de Sistemas — UNIAJC. Documentado formalmente en Obsidian.
              </p>
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
            © 2026 Copy Camacho. Todos los derechos reservados.
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
