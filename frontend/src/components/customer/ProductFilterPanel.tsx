import { Check, ChevronDown, RotateCcw, X } from "lucide-react";
import { useState, type ReactElement, type ReactNode } from "react";
import type { Brand } from "../../services/brandService";
import type { CategoryResponse } from "../../services/categoryService";
import type { SilhouetteResponse } from "../../services/silhouetteService";

interface FilterSectionProps {
  title: string;
  selection?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

interface FilterOptionProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
  count?: number;
}

interface ProductFilterPanelProps {
  categories: CategoryResponse[];
  brands: Brand[];
  silhouettes: SilhouetteResponse[];
  sizes: string[];
  selectedCategory?: CategoryResponse;
  selectedBrand?: Brand;
  selectedSilhouette?: SilhouetteResponse;
  selectedGender?: 'MEN' | 'WOMEN' | 'UNISEX' | 'KIDS' | null;
  selectedSize: string | null;
  minPrice: string | null;
  maxPrice: string | null;
  inStockOnly?: boolean;
  onSale?: boolean;
  activeFilterCount: number;
  resultCount: number;
  showSilhouettes: boolean;
  showShoeFilters: boolean;
  mobile?: boolean;
  onCategoryChange: (slug: string | null) => void;
  onBrandChange: (slug: string | null) => void;
  onSilhouetteChange: (slug: string | null) => void;
  onGenderChange?: (gender: 'MEN' | 'WOMEN' | 'UNISEX' | 'KIDS' | null) => void;
  onSizeChange: (size: string | null) => void;
  onPriceChange: (minimum: string | null, maximum: string | null) => void;
  onInStockOnlyChange?: (inStockOnly: boolean) => void;
  onSaleChange?: (onSale: boolean) => void;
  onReset: () => void;
  onClose?: () => void;
}

function FilterSection({ title, selection, children, defaultOpen = true }: FilterSectionProps): ReactElement {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="border-t border-zinc-200">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 py-5 text-left active:translate-y-px"
      >
        <span>
          <span className="block text-xs font-black uppercase tracking-[0.16em] text-zinc-900">{title}</span>
          {selection && <span className="mt-1 block truncate text-xs text-zinc-500">{selection}</span>}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && <div className="pb-5">{children}</div>}
    </section>
  );
}

function FilterOption({ label, selected, onSelect, count }: FilterOptionProps): ReactElement {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={`group flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors active:translate-y-px ${
          selected
            ? "bg-zinc-900 font-bold text-white"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        }`}
      >
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center border ${
            selected ? "border-white bg-white text-zinc-900" : "border-zinc-400 group-hover:border-zinc-900"
          }`}
          aria-hidden="true"
        >
          {selected && <Check className="h-3 w-3" strokeWidth={3} />}
        </span>
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {typeof count === "number" && (
          <span className={`text-xs tabular-nums ${selected ? "text-zinc-300" : "text-zinc-400"}`}>{count}</span>
        )}
      </button>
    </li>
  );
}

const GENDER_FILTER_OPTIONS: Array<{ key: 'MEN' | 'WOMEN' | 'UNISEX' | 'KIDS'; label: string }> = [
  { key: 'MEN', label: 'Nam' },
  { key: 'WOMEN', label: 'Nữ' },
  { key: 'UNISEX', label: 'Unisex' },
  { key: 'KIDS', label: 'Trẻ em' },
];

function getPriceSelection(minPrice: string | null, maxPrice: string | null): string {
  if (!minPrice && !maxPrice) return "Tất cả mức giá";
  if (!minPrice && maxPrice === "2000000") return "Dưới 2 triệu";
  if (minPrice === "2000000" && maxPrice === "5000000") return "Từ 2 đến 5 triệu";
  if (minPrice === "5000000" && !maxPrice) return "Trên 5 triệu";
  return "Khoảng giá tùy chọn";
}

export default function ProductFilterPanel({
  categories,
  brands,
  silhouettes,
  sizes,
  selectedCategory,
  selectedBrand,
  selectedSilhouette,
  selectedGender,
  selectedSize,
  minPrice,
  maxPrice,
  inStockOnly = false,
  onSale = false,
  activeFilterCount,
  resultCount,
  showSilhouettes,
  showShoeFilters,
  mobile = false,
  onCategoryChange,
  onBrandChange,
  onSilhouetteChange,
  onGenderChange,
  onSizeChange,
  onPriceChange,
  onInStockOnlyChange,
  onSaleChange,
  onReset,
  onClose,
}: ProductFilterPanelProps): ReactElement {
  const content = (
    <>
      <FilterSection title="Danh mục" selection={selectedCategory?.name || "Tất cả sản phẩm"}>
        <ul className="space-y-1">
          <FilterOption label="Tất cả sản phẩm" selected={!selectedCategory} onSelect={() => onCategoryChange(null)} />
          {categories.map((category) => (
            <FilterOption
              key={category.id}
              label={category.name}
              selected={selectedCategory?.id === category.id}
              onSelect={() => onCategoryChange(category.slug)}
            />
          ))}
        </ul>
      </FilterSection>

      {onGenderChange && (
        <FilterSection
          title="Giới tính"
          selection={
            selectedGender
              ? GENDER_FILTER_OPTIONS.find((g) => g.key === selectedGender)?.label || "Tất cả giới tính"
              : "Tất cả giới tính"
          }
        >
          <ul className="space-y-1">
            <FilterOption
              label="Tất cả giới tính"
              selected={!selectedGender}
              onSelect={() => onGenderChange(null)}
            />
            {GENDER_FILTER_OPTIONS.map((g) => (
              <FilterOption
                key={g.key}
                label={g.label}
                selected={selectedGender === g.key}
                onSelect={() => onGenderChange(g.key)}
              />
            ))}
          </ul>
        </FilterSection>
      )}

      <FilterSection title="Thương hiệu" selection={selectedBrand?.name || "Tất cả thương hiệu"}>
        <ul className="max-h-72 space-y-1 overflow-y-auto pr-1 custom-scrollbar">
          <FilterOption label="Tất cả thương hiệu" selected={!selectedBrand} onSelect={() => onBrandChange(null)} />
          {brands.map((brand) => (
            <FilterOption
              key={brand.id}
              label={brand.name}
              count={brand.activeProductCount}
              selected={selectedBrand?.id === brand.id}
              onSelect={() => onBrandChange(brand.slug)}
            />
          ))}
        </ul>
      </FilterSection>

      {showSilhouettes && silhouettes.length > 0 && (
        <FilterSection title="Dòng sản phẩm" selection={selectedSilhouette?.name || "Tất cả dòng sản phẩm"}>
          <ul className="max-h-72 space-y-1 overflow-y-auto pr-1 custom-scrollbar">
            <FilterOption label="Tất cả dòng sản phẩm" selected={!selectedSilhouette} onSelect={() => onSilhouetteChange(null)} />
            {silhouettes.map((silhouette) => (
              <FilterOption
                key={silhouette.id}
                label={silhouette.name}
                count={silhouette.activeProductCount}
                selected={selectedSilhouette?.id === silhouette.id}
                onSelect={() => onSilhouetteChange(silhouette.slug)}
              />
            ))}
          </ul>
        </FilterSection>
      )}

      {showShoeFilters && sizes.length > 0 && (
        <FilterSection title="Kích thước" selection={selectedSize ? `Size ${selectedSize}` : "Tất cả kích thước"}>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onSizeChange(null)}
              aria-pressed={!selectedSize}
              className={`col-span-3 min-h-10 border px-3 text-xs font-bold transition-colors ${!selectedSize ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 text-zinc-600 hover:border-zinc-900 hover:text-zinc-900"}`}
            >
              Tất cả size
            </button>
            {sizes.map((size) => (
              <button
                type="button"
                key={size}
                onClick={() => onSizeChange(size)}
                aria-pressed={selectedSize === size}
                className={`min-h-10 border px-2 text-xs font-bold transition-colors active:translate-y-px ${selectedSize === size ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 text-zinc-700 hover:border-zinc-900"}`}
              >
                {size}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Mức giá" selection={getPriceSelection(minPrice, maxPrice)}>
        <ul className="space-y-1">
          <FilterOption label="Tất cả mức giá" selected={!minPrice && !maxPrice} onSelect={() => onPriceChange(null, null)} />
          <FilterOption label="Dưới 2.000.000đ" selected={!minPrice && maxPrice === "2000000"} onSelect={() => onPriceChange(null, "2000000")} />
          <FilterOption label="2.000.000đ đến 5.000.000đ" selected={minPrice === "2000000" && maxPrice === "5000000"} onSelect={() => onPriceChange("2000000", "5000000")} />
          <FilterOption label="Trên 5.000.000đ" selected={minPrice === "5000000" && !maxPrice} onSelect={() => onPriceChange("5000000", null)} />
        </ul>
      </FilterSection>

      {onInStockOnlyChange && (
        <FilterSection title="Tình trạng" selection={inStockOnly ? "Chỉ còn hàng" : "Tất cả sản phẩm"}>
          <ul className="space-y-1">
            <FilterOption label="Tất cả sản phẩm" selected={!inStockOnly} onSelect={() => onInStockOnlyChange(false)} />
            <FilterOption label="Chỉ sản phẩm còn hàng" selected={inStockOnly} onSelect={() => onInStockOnlyChange(true)} />
          </ul>
        </FilterSection>
      )}

      {onSaleChange && (
        <FilterSection title="Khuyến mãi" selection={onSale ? "Đang giảm giá" : "Tất cả sản phẩm"}>
          <ul className="space-y-1">
            <FilterOption label="Tất cả sản phẩm" selected={!onSale} onSelect={() => onSaleChange(false)} />
            <FilterOption label="Đang giảm giá" selected={Boolean(onSale)} onSelect={() => onSaleChange(true)} />
          </ul>
        </FilterSection>
      )}
    </>
  );

  if (mobile) {
    return (
      <div className="fixed inset-0 z-[65] flex flex-col bg-white lg:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-filter-title">
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-zinc-200 px-5">
          <div className="flex items-center gap-3">
            <h2 id="mobile-filter-title" className="text-lg font-black uppercase tracking-tight text-zinc-900">Bộ lọc</h2>
            {activeFilterCount > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center bg-zinc-900 px-1.5 text-xs font-bold text-white">{activeFilterCount}</span>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng bộ lọc" className="flex h-10 w-10 items-center justify-center border border-zinc-200 text-zinc-900 active:translate-y-px">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5">{content}</div>

        <div className="grid shrink-0 grid-cols-[auto_1fr] gap-3 border-t border-zinc-200 bg-white p-4">
          <button type="button" onClick={onReset} disabled={activeFilterCount === 0} className="flex h-12 items-center justify-center gap-2 border border-zinc-300 px-4 text-sm font-bold text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40">
            <RotateCcw className="h-4 w-4" /> Đặt lại
          </button>
          <button type="button" onClick={onClose} className="h-12 bg-zinc-900 px-5 text-sm font-bold text-white transition-colors hover:bg-zinc-800 active:translate-y-px">
            Xem {resultCount} sản phẩm
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside className="sticky top-28 hidden w-64 shrink-0 self-start lg:block xl:w-72" aria-label="Bộ lọc sản phẩm">
      <div className="flex items-center justify-between pb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-900">Bộ lọc</h2>
          {activeFilterCount > 0 && (
            <span className="flex h-6 min-w-6 items-center justify-center bg-zinc-900 px-1.5 text-xs font-bold text-white">{activeFilterCount}</span>
          )}
        </div>
        <button type="button" onClick={onReset} disabled={activeFilterCount === 0} className="text-xs font-bold text-zinc-500 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-30">
          Đặt lại
        </button>
      </div>
      {content}
    </aside>
  );
}
