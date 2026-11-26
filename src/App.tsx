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
  SlidersHorizontal,
} from 'lucide-react';

export function App() {
  const normalizedPath = window.location.pathname.replace(/\/+$/, '');
  const isAdminRoute =
    normalizedPath.endsWith('/admin') ||
    window.location.hash.replace(/\/+$/, '') === '#/admin';

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>(
    isSupabaseConfigured ? [] : INITIAL_CATEGORIES
  );
  const [products, setProducts] = useState<Product[]>(
    isSupabaseConfigured ? [] : INITIAL_PRODUCTS
  );
  const [loadingCatalog, setLoadingCatalog] = useState(isSupabaseConfigured);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { setIsCartOpen, totalItems } = useCart();
  const phone = import.meta.env.VITE_WHATSAPP_PHONE || '573173312352';

  useEffect(() => {
    async function loadData() {
      if (!isSupabaseConfigured) {
        setLoadingCatalog(false);
        return;
      }

      try {
        const [catRes, prodRes] = await Promise.all([
          supabase.from('categories').select('*').order('name'),
          supabase.from('products').select('*').order('created_at', { ascending: false }),
        ]);

        setCategories(catRes.data && catRes.data.length > 0 ? catRes.data : INITIAL_CATEGORIES);
        setProducts(prodRes.data && prodRes.data.length > 0 ? prodRes.data : INITIAL_PRODUCTS);
      } catch (err) {
        console.warn('Usando catálogo inicial:', err);
        setCategories(INITIAL_CATEGORIES);
        setProducts(INITIAL_PRODUCTS);
      } finally {
        setLoadingCatalog(false);
      }
    }

    loadData();
  }, []);

  // Open product modal automatically when visiting a shared ?product=<id> link
  useEffect(() => {
    if (products.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const sharedProductId = params.get('product');
    if (!sharedProductId) return;
    const match = products.find((p) => p.id === sharedProductId);
    if (match) {
      setSelectedProduct(match);
    }
  }, [products]);

  const handleProductSaved = (savedProd: Product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === savedProd.id);
      if (exists) {
        return prev.map((p) => (p.id === savedProd.id ? savedProd : p));
      }
      return [savedProd, ...prev];
    });
  };

  const handleProductDeleted = (id: string) => {
    setProducts((prev) => prev.filter((product) => product.id !== id));
  };

  const handleCategoryAdded = (newCat: Category) => {
    setCategories((prev) => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleCategoryDeleted = (id: string) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== id));
    setProducts((prev) =>
      prev.map((p) => (p.category_id === id ? { ...p, category_id: null } : p))
    );
    if (selectedCategoryId === id) {
      setSelectedCategoryId(null);
    }
  };

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (selectedCategoryId) {
      list = list.filter((p) => p.category_id === selectedCategoryId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

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

  if (isAdminRoute) {
    return (
      <AdminPanel
        isOpen={true}
        onClose={() => {
          window.location.href = import.meta.env.BASE_URL;
        }}
        categories={categories}
        products={products}
        onProductSaved={handleProductSaved}
        onProductDeleted={handleProductDeleted}
        onCategoryAdded={handleCategoryAdded}
        onCategoryDeleted={handleCategoryDeleted}
        standalone={true}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#061a44] via-[#0e357a] to-[#051230] text-slate-100">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Hero Banner Section */}
      <section className="w-full pt-4 sm:pt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/50 border border-white/10 bg-[#071f4e]">
            <img
              src={bannerImg}
              alt="Copy Camacho - Catálogo de Útiles Escolares y Papelería"
              className="w-full h-auto max-h-[380px] sm:max-h-[440px] object-contain object-center mx-auto"
            />
          </div>

          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-white bg-gradient-to-r from-[#0e32d8] via-[#1b5df5] to-[#081fae] p-3 sm:px-5 rounded-2xl border border-blue-400/40 shadow-lg">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Precios transparentes en COP</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[#1d9bf0] shrink-0" />
              <span>Domicilios en Cali &amp; Recogida UNIAJC</span>
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
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
              Categorías
            </h3>
            <span className="text-xs text-white font-medium">
              {loadingCatalog
                ? 'Cargando catálogo...'
                : `${filteredProducts.length} ${
                    filteredProducts.length === 1 ? 'producto' : 'productos'
                  }`}
            </span>
          </div>

          <CategoryFilter
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-xs font-medium text-white">
            {selectedCategoryId
              ? `Mostrando ${categories.find((c) => c.id === selectedCategoryId)?.name}`
              : 'Mostrando todas las categorías'}
            {searchQuery && ` para "${searchQuery}"`}
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
            <span className="text-xs text-white font-medium">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc' | 'name')
              }
              className="text-xs font-semibold bg-white/10 !text-white border border-white/20 rounded-lg px-2.5 py-1.5 outline-hidden focus:border-[#1d9bf0] backdrop-blur-md cursor-pointer"
            >
              <option value="featured" className="bg-slate-900 text-white">
                Destacados
              </option>
              <option value="price-asc" className="bg-slate-900 text-white">
                Menor precio
              </option>
              <option value="price-desc" className="bg-slate-900 text-white">
                Mayor precio
              </option>
              <option value="name" className="bg-slate-900 text-white">
                Nombre (A-Z)
              </option>
            </select>
          </div>
        </div>

        {/* Product Grid / Skeleton */}
        {loadingCatalog ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white/10 border border-white/10 overflow-hidden animate-pulse"
              >
                <div className="aspect-4/3 bg-white/10" />
                <div className="p-4 space-y-2.5">
                  <div className="h-4 bg-white/15 rounded w-3/4" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                  <div className="pt-3 flex justify-between items-center">
                    <div className="h-5 bg-white/15 rounded w-20" />
                    <div className="h-8 bg-white/15 rounded-xl w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/15 p-12 text-center space-y-3 shadow-lg">
            <div className="text-4xl">🔍</div>
            <h3 className="font-bold text-base text-white">No encontramos productos</h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              No hay artículos que coincidan con los filtros seleccionados. Intenta buscando otra
              categoría o término.
            </p>
            <button
              onClick={() => {
                setSelectedCategoryId(null);
                setSearchQuery('');
              }}
              className="mt-2 px-4 py-2 bg-[#1d9bf0] hover:bg-[#0d84d6] text-white rounded-full text-xs font-bold shadow-xs cursor-pointer"
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
            className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-[#1d9bf0] text-white font-bold text-sm shadow-2xl active:scale-95 border-2 border-white cursor-pointer"
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
        onClose={() => {
          setSelectedProduct(null);
          if (window.location.search.includes('product=')) {
            window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash}`);
          }
        }}
      />

      <CartDrawer />

      {isAdminOpen && (
        <AdminPanel
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          categories={categories}
          products={products}
          onProductSaved={handleProductSaved}
          onProductDeleted={handleProductDeleted}
          onCategoryAdded={handleCategoryAdded}
          onCategoryDeleted={handleCategoryDeleted}
          standalone={false}
        />
      )}

      {/* Footer */}
      <footer className="bg-[#0b0338] border-t border-white/10 mt-16 py-12 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Catálogo virtual de útiles escolares, artículos de papelería e impresiones. Pedidos
                rápidos con confirmación directa por WhatsApp.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                Contacto &amp; Ubicación
              </h4>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#1d9bf0] shrink-0" />
                  <span>Cali, Valle del Cauca — Institución Universitaria Antonio José Camacho</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>WhatsApp: +{phone}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                Atención &amp; Entregas
              </h4>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1d9bf0] shrink-0" />
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
