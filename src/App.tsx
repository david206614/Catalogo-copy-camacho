import { useState, useEffect, useMemo } from 'react';
import type { Category, Product } from './types/database';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from './data/mockProducts';
import { Header } from './components/Header';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { AdminPanel } from './components/AdminPanel';
import { useCart } from './context/CartContext';
import bannerImg from './assets/banner.jpg';
import { 
  ShoppingBag, 
  MessageCircle, 
  Truck, 
  CheckCircle2, 
  Phone, 
  MapPin, 
  SlidersHorizontal 
} from 'lucide-react';

export function App() {
  const isAdminRoute = window.location.pathname.replace(/\/+$/, '') === '/admin';
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === newProd.id);
      if (exists) {
        return prev.map((p) => (p.id === newProd.id ? newProd : p));
      }
      return [newProd, ...prev];
    });
  };

  const handleProductDeleted = (id: string) => {
    setProducts((prev) => prev.filter((product) => product.id !== id));
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

  // If opened directly as /admin (e.g. in a new tab)
  if (isAdminRoute) {
    return (
      <AdminPanel
        isOpen={true}
        onClose={() => {
          window.location.href = '/';
        }}
        categories={categories}
        products={products}
        onProductAdded={handleProductAdded}
        onProductDeleted={handleProductDeleted}
        standalone={true}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#140763] text-slate-100">
      
      {/* Main Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Hero Banner Section (Occupies full container seamlessly with #140763 background) */}
      <section className="w-full bg-[#140763] pt-4 sm:pt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/50 border border-white/10 bg-[#140763]">
            <img
              src={bannerImg}
              alt="Copy Camacho - Catálogo de Útiles Escolares y Papelería"
              className="w-full h-auto max-h-[380px] sm:max-h-[440px] object-contain object-center mx-auto"
            />
          </div>

          {/* Value props pill bar */}
          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-100 bg-white/10 backdrop-blur-md p-3 sm:px-5 rounded-2xl border border-white/15 shadow-lg">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Precios transparentes en COP</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-orange-400 shrink-0" />
              <span>Domicilios en Cali & Recogida UNIAJC</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Atención y pedidos por WhatsApp</span>
            </div>
          </div>

        </div>
      </section>

      {/* Main Catalog Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        
        {/* Category Filters Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-orange-400 uppercase tracking-wider">
              Categorías
            </h3>
            <span className="text-xs text-slate-300 font-medium">
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
          <div className="text-xs font-medium text-slate-200">
            {selectedCategoryId
              ? `Mostrando ${categories.find((c) => c.id === selectedCategoryId)?.name}`
              : 'Mostrando todas las categorías'}
            {searchQuery && ` para "${searchQuery}"`}
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-xs text-slate-300 font-medium">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="text-xs font-semibold bg-white/10 text-white border border-white/20 rounded-lg px-2.5 py-1.5 outline-hidden focus:border-orange-400 backdrop-blur-md cursor-pointer"
            >
              <option value="featured" className="bg-slate-900 text-white">Destacados</option>
              <option value="price-asc" className="bg-slate-900 text-white">Menor precio</option>
              <option value="price-desc" className="bg-slate-900 text-white">Mayor precio</option>
              <option value="name" className="bg-slate-900 text-white">Nombre (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/15 p-12 text-center space-y-3 shadow-lg">
            <div className="text-4xl">🔍</div>
            <h3 className="font-bold text-base text-white">No encontramos productos</h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
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
            className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-orange-500 text-white font-bold text-sm shadow-2xl active:scale-95 border-2 border-white cursor-pointer"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
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

      {/* Admin Panel Modal */}
      {isAdminOpen && (
        <AdminPanel
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          categories={categories}
          products={products}
          onProductAdded={handleProductAdded}
          onProductDeleted={handleProductDeleted}
          standalone={false}
        />
      )}

      {/* Footer */}
      <footer className="bg-[#0b0338] border-t border-white/10 mt-16 py-12 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500 text-white font-bold flex items-center justify-center text-sm shadow-md">
                  CC
                </div>
                <span className="font-extrabold text-base text-white">Copy Camacho</span>
              </div>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Catálogo virtual de útiles escolares, artículos de papelería e impresiones. Pedidos rápidos con confirmación directa por WhatsApp.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-xs text-white uppercase tracking-wider">Contacto & Ubicación</h4>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>Cali, Valle del Cauca — Institución Universitaria Antonio José Camacho</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>WhatsApp: +{phone}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-xs text-white uppercase tracking-wider">Atención & Entregas</h4>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>Entregas en sede o a domicilio en Cali</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Atención y despachos de Lunes a Sábado</span>
                </div>
              </div>
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-slate-400">
            © 2026 Copy Camacho. Todos los derechos reservados.
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
