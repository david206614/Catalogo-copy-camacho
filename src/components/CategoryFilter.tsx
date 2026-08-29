import type { Category } from '../types/database';
import { Layers } from 'lucide-react';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export const CategoryFilter = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryFilterProps) => {
  return (
    <div className="w-full overflow-x-auto py-2 scrollbar-none no-scrollbar">
      <div className="flex items-center gap-2 min-w-max px-1">
        
        {/* All Products pill */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
            selectedCategoryId === null
              ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Todos</span>
        </button>

        {/* Category Pills */}
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                isSelected
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat.icon && <span className="text-base leading-none">{cat.icon}</span>}
              <span>{cat.name}</span>
            </button>
          );
        })}

      </div>
    </div>
  );
};
