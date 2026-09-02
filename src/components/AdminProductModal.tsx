import { useState } from 'react';
import type { Category, Product } from '../types/database';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { X, Plus, Check, Sparkles } from 'lucide-react';

interface AdminProductModalProps {
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: (newProduct: Product) => void;
}

export const AdminProductModal = ({
  categories,
  isOpen,
  onClose,
  onProductAdded,
}: AdminProductModalProps) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [inStock, setInStock] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setCategoryId(categories[0]?.id || '');
    setPrice('');
    setDescription('');
    setImageUrl('');
    setInStock(true);
    setFeatured(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      setError('Por favor completa el nombre y el precio del producto.');
      return;
    }

    setLoading(true);
    setError('');

    const newProdData: Partial<Product> = {
      name: name.trim(),
      category_id: categoryId || (categories[0]?.id ?? null),
      price: parseFloat(price),
      description: description.trim() || null,
      image_url: imageUrl.trim() || null,
      in_stock: inStock,
      featured: featured,
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error: insertError } = await supabase
          .from('products')
          .insert([newProdData])
          .select()
          .single();

        if (insertError) throw insertError;
        if (data) {
          onProductAdded(data);
          setSuccess(true);
          setTimeout(() => {
            setSuccess(false);
            resetForm();
            onClose();
          }, 800);
        }
      } catch (err: any) {
        setError(err.message || 'Error al guardar en Supabase');
      } finally {
        setLoading(false);
      }
    } else {
      // Local state fallback
      const localProduct: Product = {
        id: `local-${Date.now()}`,
        ...(newProdData as any),
      };
      onProductAdded(localProduct);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        resetForm();
        onClose();
      }, 800);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 my-8">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Agregar Nuevo Producto</h2>
              <p className="text-[11px] text-slate-500">
                {isSupabaseConfigured ? 'Se guardará en la base de datos Supabase' : 'Modo local'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del producto *</label>
            <input
              type="text"
              required
              placeholder="Ej: Marcadores Sharpie x12 Colores"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-orange-500 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-orange-500 outline-hidden cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Precio (COP) *</label>
              <input
                type="number"
                required
                min="0"
                step="50"
                placeholder="24500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-orange-500 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">URL de Imagen (Opcional)</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-orange-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción / Marca / Detalles</label>
            <textarea
              rows={2}
              placeholder="Ej: Tinta permanente de secado rápido, punta fina resistente..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-orange-500 outline-hidden resize-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500"
              />
              <span>Disponible en stock</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500"
              />
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Destacado en portada
              </span>
            </label>
          </div>

          {error && <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">{error}</p>}
          {success && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              <Check className="w-4 h-4" /> ¡Producto agregado correctamente al catálogo!
            </div>
          )}

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 disabled:opacity-50 cursor-pointer transition-all active:scale-95"
            >
              {loading ? 'Guardando...' : 'Guardar Producto'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
