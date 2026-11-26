import { useEffect, useState, useMemo } from 'react';
import {
  LogIn,
  LogOut,
  PackagePlus,
  ShieldCheck,
  Trash2,
  X,
  Search,
  Truck,
  Store,
  RefreshCw,
  Clock,
  AlertCircle,
  FileText,
  Boxes,
  Mail,
  Lock,
  Pencil,
  Tag,
  Plus,
  CheckCircle2,
  ImageOff,
} from 'lucide-react';
import type { Category, OrderRecord, Product } from '../types/database';
import { getOrderHistory, updateOrderStatus } from '../lib/orders';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { formatCOP } from '../lib/whatsapp';
import { AdminProductModal } from './AdminProductModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  products: Product[];
  onProductSaved: (product: Product) => void;
  onProductDeleted: (id: string) => void;
  onCategoryAdded: (category: Category) => void;
  onCategoryDeleted: (id: string) => void;
  standalone?: boolean;
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function AdminPanel({
  isOpen,
  onClose,
  categories,
  products,
  onProductSaved,
  onProductDeleted,
  onCategoryAdded,
  onCategoryDeleted,
  standalone = false,
}: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'orders'>('products');
  const [productSearch, setProductSearch] = useState('');
  const [onlyWithoutImage, setOnlyWithoutImage] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📦');
  const [savingCategory, setSavingCategory] = useState(false);

  useEffect(() => {
    if (!isOpen || !isSupabaseConfigured) return;

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session?.user) {
        setIsAdmin(true);
        setUserEmail(data.session.user.email || 'Administrador');
      } else {
        setIsAdmin(false);
        setUserEmail(null);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.user) {
        setIsAdmin(true);
        setUserEmail(session.user.email || 'Administrador');
      } else {
        setIsAdmin(false);
        setUserEmail(null);
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [isOpen]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const history = await getOrderHistory();
      setOrders(history);
    } catch (err) {
      console.error('Error al cargar historial:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadOrders();
    }
  }, [isAdmin, activeTab]);

  if (!isOpen) return null;

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (!isSupabaseConfigured) {
      setError(
        'Supabase no está configurado. Verifica las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.'
      );
      setLoading(false);
      return;
    }

    const cleanEmail = email.trim();

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (loginError || !data.user) {
        setError('Correo o contraseña incorrectos. Verifica las credenciales e intenta nuevamente.');
        setLoading(false);
        return;
      }

      setUserEmail(data.user.email || 'Administrador');
      setIsAdmin(true);
      setPassword('');
    } catch {
      setError('No se pudo conectar con Supabase Auth. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore signout error
      }
    }
    setIsAdmin(false);
    setUserEmail(null);
    setEmail('');
    setPassword('');
  };

  const openCreateProductModal = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar "${product.name}"? Esta acción no se puede deshacer.`
    );
    if (!confirmDelete) return;

    if (isSupabaseConfigured && !product.id.startsWith('local-')) {
      try {
        const { error: deleteError } = await supabase
          .from('products')
          .delete()
          .eq('id', product.id);
        if (deleteError) {
          setError(`No se pudo eliminar el producto: ${deleteError.message}`);
          return;
        }
      } catch (err: unknown) {
        setError(`Error: ${err instanceof Error ? err.message : 'No se pudo eliminar'}`);
        return;
      }
    }

    onProductDeleted(product.id);
  };

  const handleToggleStock = async (product: Product) => {
    const newStock = !product.in_stock;
    if (isSupabaseConfigured && !product.id.startsWith('local-')) {
      try {
        const { error: updateError } = await supabase
          .from('products')
          .update({ in_stock: newStock })
          .eq('id', product.id);
        if (updateError) {
          setError(
            `No se pudo actualizar stock: ${updateError.message}. Verifica las políticas RLS en Supabase.`
          );
          return;
        }
      } catch (err: unknown) {
        setError(`Error: ${err instanceof Error ? err.message : 'No se pudo actualizar stock'}`);
        return;
      }
    }

    onProductSaved({ ...product, in_stock: newStock });
  };

  const handleCreateCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanName = newCategoryName.trim();
    if (!cleanName) return;

    setSavingCategory(true);
    setError('');
    const slug = slugify(cleanName) || `cat-${Date.now()}`;
    const icon = newCategoryIcon.trim() || '📦';

    try {
      if (isSupabaseConfigured) {
        const { data, error: insertError } = await supabase
          .from('categories')
          .insert([{ name: cleanName, slug, icon }])
          .select()
          .single();

        if (insertError) {
          setError(`No se pudo crear la categoría: ${insertError.message}`);
          return;
        }
        if (data) {
          onCategoryAdded(data as Category);
        }
      } else {
        onCategoryAdded({
          id: `local-cat-${Date.now()}`,
          name: cleanName,
          slug,
          icon,
          created_at: new Date().toISOString(),
        });
      }

      setNewCategoryName('');
      setNewCategoryIcon('📦');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    const count = products.filter((p) => p.category_id === category.id).length;
    const confirmMsg =
      count > 0
        ? `La categoría "${category.name}" tiene ${count} producto(s). Si la eliminas, esos productos quedarán sin categoría. ¿Continuar?`
        : `¿Eliminar la categoría "${category.name}"?`;
    if (!window.confirm(confirmMsg)) return;

    if (isSupabaseConfigured && !category.id.startsWith('local-')) {
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id);
      if (deleteError) {
        setError(`No se pudo eliminar la categoría: ${deleteError.message}`);
        return;
      }
    }

    onCategoryDeleted(category.id);
  };

  const handleToggleOrderStatus = async (order: OrderRecord) => {
    const nextStatus = order.status === 'cotizacion' ? 'pedido' : 'cotizacion';
    const updated = await updateOrderStatus(order.id, nextStatus);
    if (!updated) {
      setError('No se pudo actualizar el estado de la orden.');
      return;
    }
    setOrders((prev) =>
      prev.map((item) => (item.id === order.id ? { ...item, status: nextStatus } : item))
    );
  };

  const missingImageCount = useMemo(
    () => products.filter((p) => !p.image_url || !p.image_url.trim()).length,
    [products]
  );

  const filteredProductsList = useMemo(() => {
    let list = products;
    if (onlyWithoutImage) {
      list = list.filter((p) => !p.image_url || !p.image_url.trim());
    }
    if (!productSearch.trim()) return list;
    const q = productSearch.toLowerCase();
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [products, productSearch, onlyWithoutImage]);

  const filteredOrdersList = useMemo(() => {
    if (!orderSearch.trim()) return orders;
    const q = orderSearch.toLowerCase();
    return orders.filter(
      (o) =>
        o.customer_name.toLowerCase().includes(q) ||
        (o.address && o.address.toLowerCase().includes(q)) ||
        o.items.some((i) => i.product.name.toLowerCase().includes(q))
    );
  }, [orders, orderSearch]);

  const totalRevenue = useMemo(
    () => orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
    [orders]
  );

  return (
    <div
      className={`${
        standalone ? 'min-h-screen bg-slate-900/10' : 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs'
      } p-3 sm:p-6 overflow-y-auto flex items-center justify-center`}
    >
      <section className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <header className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg">Panel de Administración</h2>
                {isAdmin && (
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Activo
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Gestión de catálogo, categorías e historial de cotizaciones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && userEmail && (
              <span className="hidden sm:inline-block text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 font-semibold">
                👤 {userEmail}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Cerrar panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        {!isAdmin ? (
          <div className="p-6 sm:p-12 overflow-y-auto max-w-md mx-auto w-full space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-xl text-slate-900">Ingreso de Administrador</h3>
              <p className="text-xs text-slate-500">
                Inicia sesión con tu cuenta de administrador de Supabase para gestionar productos, categorías y pedidos.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo de administrador
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@copycamacho.com"
                    className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-300 focus:bg-white focus:border-blue-500 outline-hidden font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    required
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-300 focus:bg-white focus:border-blue-500 outline-hidden font-medium text-slate-800"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Verificando...' : 'Iniciar Sesión'}</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Navigation Tabs */}
            <div className="bg-slate-100 px-4 sm:px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveTab('products')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'products'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Boxes className="w-4 h-4 text-blue-500" />
                  <span>Productos ({products.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('categories')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'categories'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Tag className="w-4 h-4 text-indigo-500" />
                  <span>Categorías ({categories.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'orders'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span>Cotizaciones ({orders.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {activeTab === 'products' && (
                  <button
                    onClick={openCreateProductModal}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <PackagePlus className="w-4 h-4" />
                    <span>Añadir Producto</span>
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                  title="Cerrar sesión de administrador"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cerrar Sesión</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={() => setError('')}
                  className="text-rose-500 hover:text-rose-800 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* TAB 1: PRODUCTS MANAGEMENT */}
            {activeTab === 'products' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar producto por nombre o descripción..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-white text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 focus:border-blue-500 outline-hidden font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setOnlyWithoutImage((prev) => !prev)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        onlyWithoutImage
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50'
                      }`}
                    >
                      <ImageOff className="w-3.5 h-3.5" />
                      <span>Sin foto ({missingImageCount})</span>
                    </button>

                    <div className="text-xs text-slate-500 font-medium">
                      <strong className="text-slate-900">{filteredProductsList.length}</strong> /{' '}
                      {products.length}
                    </div>
                  </div>
                </div>

                {filteredProductsList.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
                    <p className="text-sm font-semibold text-slate-600">
                      {onlyWithoutImage
                        ? 'Todos los productos tienen foto cargada.'
                        : 'No se encontraron productos.'}
                    </p>
                    {!onlyWithoutImage && (
                      <button
                        onClick={openCreateProductModal}
                        className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Crear primer producto
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
                    {filteredProductsList.map((product) => {
                      const category = categories.find((c) => c.id === product.category_id);
                      const hasImage = Boolean(product.image_url && product.image_url.trim());
                      return (
                        <div
                          key={product.id}
                          className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {hasImage ? (
                                <img
                                  src={product.image_url!}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-lg">📦</span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {product.name}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                                <span className="font-semibold text-blue-600">
                                  {formatCOP(product.price)}
                                </span>
                                {category && (
                                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 text-[10px]">
                                    {category.icon} {category.name}
                                  </span>
                                )}
                                {!hasImage && (
                                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                                    Sin foto
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            <button
                              onClick={() => handleToggleStock(product)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                                product.in_stock
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              }`}
                              title="Cambiar estado de inventario"
                            >
                              {product.in_stock ? 'En Stock' : 'Agotado'}
                            </button>

                            <button
                              onClick={() => openEditProductModal(product)}
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                              title="Editar producto o subir foto"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteProduct(product)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="Eliminar producto del catálogo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CATEGORIES MANAGEMENT */}
            {activeTab === 'categories' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                <form
                  onSubmit={handleCreateCategory}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-end gap-3"
                >
                  <div className="w-20">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Icono
                    </label>
                    <input
                      type="text"
                      value={newCategoryIcon}
                      onChange={(e) => setNewCategoryIcon(e.target.value)}
                      maxLength={4}
                      placeholder="📦"
                      className="w-full text-center text-sm px-2 py-2 bg-white text-slate-900 rounded-xl border border-slate-200 focus:border-blue-500 outline-hidden"
                    />
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nombre de la nueva categoría
                    </label>
                    <input
                      type="text"
                      required
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Ej: Impresiones y Fotocopiado"
                      className="w-full text-xs px-3 py-2.5 bg-white text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 focus:border-blue-500 outline-hidden font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingCategory}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{savingCategory ? 'Creando...' : 'Agregar Categoría'}</span>
                  </button>
                </form>

                <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
                  {categories.map((cat) => {
                    const productCount = products.filter((p) => p.category_id === cat.id).length;
                    return (
                      <div
                        key={cat.id}
                        className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/70"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-lg shrink-0">
                            {cat.icon || '📦'}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {cat.name}
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              /{cat.slug} · {productCount}{' '}
                              {productCount === 1 ? 'producto' : 'productos'}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Eliminar categoría"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: QUOTATIONS / ORDERS HISTORY */}
            {activeTab === 'orders' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <p className="text-xs text-slate-500 font-semibold uppercase">
                      Cotizaciones registradas
                    </p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{orders.length}</p>
                  </div>
                  <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/60">
                    <p className="text-xs text-emerald-700 font-semibold uppercase">
                      Total valor cotizado
                    </p>
                    <p className="text-2xl font-black text-emerald-800 mt-1">
                      {formatCOP(totalRevenue)}
                    </p>
                  </div>
                  <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200/60 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-800 font-semibold uppercase">
                        Sincronización
                      </p>
                      <p className="text-xs text-blue-600 mt-1">Tiempo real</p>
                    </div>
                    <button
                      onClick={loadOrders}
                      disabled={loadingOrders}
                      className="p-2 bg-white rounded-xl text-blue-600 shadow-2xs border border-blue-200 hover:bg-blue-100 cursor-pointer"
                      title="Refrescar historial"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingOrders ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre de cliente, dirección o producto..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 focus:border-blue-500 outline-hidden font-medium"
                  />
                </div>

                {filteredOrdersList.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">
                      Aún no hay cotizaciones registradas
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Cada vez que un cliente configure su carrito y haga clic en "Pedir por
                      WhatsApp", se registrará automáticamente aquí.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredOrdersList.map((order) => {
                      const dateFormatted = new Date(order.created_at).toLocaleString('es-CO', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      });
                      const isConfirmed = order.status === 'pedido';

                      return (
                        <article
                          key={order.id}
                          className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3 hover:border-blue-300 transition-all"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                                  {order.customer_name}
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => handleToggleOrderStatus(order)}
                                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full cursor-pointer transition-colors ${
                                    isConfirmed
                                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                  }`}
                                  title="Clic para cambiar estado entre Cotización y Pedido confirmado"
                                >
                                  {isConfirmed ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3" /> Pedido Confirmado
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3 h-3" /> Cotización WhatsApp
                                    </>
                                  )}
                                </button>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                                <span>📅 {dateFormatted}</span>
                              </p>
                            </div>

                            <div className="text-right">
                              <span className="text-xs text-slate-400 block">Total</span>
                              <span className="text-base sm:text-lg font-black text-slate-900">
                                {formatCOP(order.total)}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-1 font-semibold text-slate-800">
                              {order.delivery_method === 'domicilio' ? (
                                <>
                                  <Truck className="w-3.5 h-3.5 text-blue-500" />
                                  <span>Domicilio en Cali:</span>
                                  <span className="font-normal text-slate-600">
                                    {order.address || 'Sin dirección especificada'}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Store className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Recogida en Tienda Copy Camacho (UNIAJC)</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-1">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              Artículos pedidos:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {order.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-xs bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-slate-100"
                                >
                                  <span className="font-medium text-slate-800 truncate mr-2">
                                    <strong className="text-blue-600">{item.quantity}×</strong>{' '}
                                    {item.product.name}
                                  </span>
                                  <span className="text-slate-500 text-[11px] font-semibold shrink-0">
                                    {formatCOP(item.product.price * item.quantity)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {order.notes && (
                            <p className="text-xs text-slate-500 italic bg-blue-50/60 p-2 rounded-lg border border-blue-200/50">
                              💬 Nota del cliente: "{order.notes}"
                            </p>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      <AdminProductModal
        categories={categories}
        isOpen={showProductModal}
        editingProduct={editingProduct}
        onClose={() => {
          setShowProductModal(false);
          setEditingProduct(null);
        }}
        onProductSaved={(savedProduct) => {
          onProductSaved(savedProduct);
          setShowProductModal(false);
          setEditingProduct(null);
        }}
      />
    </div>
  );
}
