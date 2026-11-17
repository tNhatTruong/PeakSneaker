import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../../components/customer/ProductCard";
import ProductFilterPanel from "../../components/customer/ProductFilterPanel";
import { BrandService, type Brand } from "../../services/brandService";
import { CategoryService, type CategoryResponse } from "../../services/categoryService";
import { ProductService, type PaginatedResponse, type ProductResponse, type ProductFilterOptionResponse } from "../../services/productService";
import { SilhouetteService, type SilhouetteResponse } from "../../services/silhouetteService";

const NON_SHOE_CATEGORY_SLUGS = new Set(["phu-kien-sneaker", "cham-soc-giay", "cham-soc-ve-sinh-giay"]);
const SIZE_COLLATOR = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
const GENDER_LABELS: Record<string, string> = {
  MEN: "Nam",
  WOMEN: "Nữ",
  UNISEX: "Unisex",
  KIDS: "Trẻ em",
};

const parseId = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const parsedValue = Number.parseInt(value, 10);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : undefined;
};

interface ActiveFilterChipProps {
  label: string;
  value: string;
  onRemove: () => void;
}

function ActiveFilterChip({ label, value, onRemove }: ActiveFilterChipProps): ReactElement {
  return (
    <span className="inline-flex min-h-9 items-center border border-zinc-300 bg-white pl-3 text-xs text-zinc-700">
      <span className="mr-1 font-semibold text-zinc-500">{label}:</span>
      <span className="max-w-48 truncate font-bold text-zinc-900">{value}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Xóa bộ lọc ${label}: ${value}`}
        className="ml-2 flex h-8 w-8 items-center justify-center border-l border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-white"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

export default function ShopPage(): ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filterOptions, setFilterOptions] = useState<ProductFilterOptionResponse[]>([]);
  const [silhouettes, setSilhouettes] = useState<SilhouetteResponse[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [areBaseFiltersLoaded, setAreBaseFiltersLoaded] = useState(false);
  const [loadedSilhouetteScope, setLoadedSilhouetteScope] = useState<string | null>(null);
  const [loadedProductQuery, setLoadedProductQuery] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const catalogStartRef = useRef<HTMLDivElement>(null);

  const categorySlug = searchParams.get("category");
  const brandSlug = searchParams.get("brand");
  const silhouetteSlug = searchParams.get("silhouette");
  const genderParam = searchParams.get("gender") as 'MEN' | 'WOMEN' | 'UNISEX' | 'KIDS' | null;
  const selectedGender = genderParam && ['MEN', 'WOMEN', 'UNISEX', 'KIDS'].includes(genderParam) ? genderParam : null;
  const selectedSize = searchParams.get("shoeSize");
  const legacyCategoryId = parseId(searchParams.get("categoryId"));
  const legacyBrandId = parseId(searchParams.get("brandId"));
  const legacySilhouetteId = parseId(searchParams.get("silhouetteId"));
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const inStockOnly = searchParams.get("inStockOnly") === "true";
  const onSale = searchParams.get("onSale") === "true";
  const searchKeyword = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortDirection = searchParams.get("sortDirection") || "desc";
  const page = Math.max(Number.parseInt(searchParams.get("page") || "0", 10) || 0, 0);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.slug === categorySlug || category.id === legacyCategoryId),
    [categories, categorySlug, legacyCategoryId],
  );
  const selectedBrand = useMemo(
    () => brands.find((brand) => brand.slug === brandSlug || brand.id === legacyBrandId),
    [brands, brandSlug, legacyBrandId],
  );
  const displayedBrands = useMemo(() => {
    if (!selectedCategory || filterOptions.length === 0) return brands;
    const categoryBrandIds = new Set(
      filterOptions
        .filter((opt) => opt.categoryId === selectedCategory.id && opt.brandId !== null)
        .map((opt) => opt.brandId as number)
    );
    if (categoryBrandIds.size > 0) {
      return brands.filter((brand) => categoryBrandIds.has(brand.id));
    }
    return brands;
  }, [brands, selectedCategory, filterOptions]);
  const displayedSilhouettes = useMemo(() => {
    if (silhouettes.length === 0) return [];
    if (!selectedCategory || filterOptions.length === 0) return silhouettes;
    const categorySilhouetteIds = new Set(
      filterOptions
        .filter((opt) => opt.categoryId === selectedCategory.id && opt.silhouetteId !== null)
        .map((opt) => opt.silhouetteId as number)
    );
    if (categorySilhouetteIds.size > 0) {
      return silhouettes.filter((sil) => categorySilhouetteIds.has(sil.id));
    }
    return [];
  }, [silhouettes, selectedCategory, filterOptions]);

  const selectedSilhouette = useMemo(
    () => displayedSilhouettes.find((silhouette) => silhouette.slug === silhouetteSlug || silhouette.id === legacySilhouetteId),
    [displayedSilhouettes, silhouetteSlug, legacySilhouetteId],
  );
  const showShoeFilters = !selectedCategory || !NON_SHOE_CATEGORY_SLUGS.has(selectedCategory.slug);
  const showSilhouettes = showShoeFilters;
  const activeFilterCount = [
    Boolean(selectedCategory),
    Boolean(selectedBrand),
    Boolean(selectedSilhouette),
    Boolean(selectedGender),
    Boolean(selectedSize),
    Boolean(minPrice || maxPrice),
    Boolean(inStockOnly),
    Boolean(onSale),
  ].filter(Boolean).length;

  const hasInvalidFilter = Boolean(
    ((categorySlug || legacyCategoryId) && !selectedCategory)
    || ((brandSlug || legacyBrandId) && !selectedBrand)
    || ((silhouetteSlug || legacySilhouetteId) && !selectedSilhouette),
  );
  const silhouetteScope = selectedBrand ? `brand:${selectedBrand.id}` : "all";
  const areSilhouettesLoaded = loadedSilhouetteScope === silhouetteScope;
  const productQueryKey = [
    selectedCategory?.id,
    selectedBrand?.id,
    selectedSilhouette?.id,
    selectedGender,
    selectedSize,
    minPrice,
    maxPrice,
    inStockOnly,
    onSale,
    searchKeyword,
    sortBy,
    sortDirection,
    page,
  ].join("|");
  const isProductLoading = !areBaseFiltersLoaded
    || !areSilhouettesLoaded
    || (!hasInvalidFilter && loadedProductQuery !== productQueryKey);

  const filteredProducts = useMemo(() => {
    if (hasInvalidFilter) return [];
    if (!inStockOnly) return products;
    return products.filter((p) => (p.totalStock ?? 0) > 0);
  }, [hasInvalidFilter, inStockOnly, products]);

  const displayedProducts = filteredProducts;
  const displayedTotalPages = hasInvalidFilter ? 0 : totalPages;
  const displayedTotalElements = hasInvalidFilter ? 0 : totalElements;

  useEffect(() => {
    let isActive = true;

    Promise.all([
      CategoryService.getAllCategories(),
      BrandService.getAllBrands(),
      ProductService.getFilterOptions().catch(() => [] as ProductFilterOptionResponse[]),
    ])
      .then(([categoryData, brandData, filterOptionData]) => {
        if (!isActive) return;
        setCategories(categoryData);
        setBrands(brandData);
        setFilterOptions(filterOptionData || []);
      })
      .catch(console.error)
      .finally(() => {
        if (isActive) setAreBaseFiltersLoaded(true);
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!areBaseFiltersLoaded) return;

    let isActive = true;
    const request = selectedBrand
      ? SilhouetteService.getSilhouettesByBrand(selectedBrand.id)
      : SilhouetteService.getAllSilhouettes();

    request
      .then((data) => {
        if (!isActive) return;
        setSilhouettes(data);
        setLoadedSilhouetteScope(silhouetteScope);
      })
      .catch((error: unknown) => {
        console.error(error);
        if (!isActive) return;
        setSilhouettes([]);
        setLoadedSilhouetteScope(silhouetteScope);
      });

    return () => {
      isActive = false;
    };
  }, [areBaseFiltersLoaded, selectedBrand, silhouetteScope]);

  useEffect(() => {
    if (!areBaseFiltersLoaded || !showShoeFilters) {
      setAvailableSizes([]);
      return;
    }

    let isActive = true;
    ProductService.getAvailableSizes({
      categoryId: selectedCategory?.id,
      brandId: selectedBrand?.id,
      silhouetteId: selectedSilhouette?.id,
    })
      .then((sizes) => {
        if (isActive) setAvailableSizes([...sizes].sort(SIZE_COLLATOR.compare));
      })
      .catch((error: unknown) => {
        console.error(error);
        if (isActive) setAvailableSizes([]);
      });

    return () => {
      isActive = false;
    };
  }, [areBaseFiltersLoaded, selectedBrand, selectedCategory, selectedSilhouette, showShoeFilters]);

  useEffect(() => {
    if (!areBaseFiltersLoaded || !areSilhouettesLoaded || hasInvalidFilter) return;

    let isActive = true;
    ProductService.filterProducts({
      categoryId: selectedCategory?.id,
      brandId: selectedBrand?.id,
      silhouetteId: selectedSilhouette?.id,
      gender: selectedGender || undefined,
      onSale: onSale || undefined,
      inStockOnly: inStockOnly || undefined,
      variantSize: selectedSize || undefined,
      minPrice: minPrice ? Number.parseInt(minPrice, 10) : undefined,
      maxPrice: maxPrice ? Number.parseInt(maxPrice, 10) : undefined,
      search: searchKeyword,
      sortBy: sortBy === "basePrice" ? "price" : sortBy,
      sortDirection,
      page,
      size: 12,
    })
      .then((response: PaginatedResponse<ProductResponse>) => {
        if (!isActive) return;
        setProducts(response.items);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
      })
      .catch(console.error)
      .finally(() => {
        if (isActive) setLoadedProductQuery(productQueryKey);
      });

    return () => {
      isActive = false;
    };
  }, [areBaseFiltersLoaded, areSilhouettesLoaded, hasInvalidFilter, selectedCategory, selectedBrand, selectedSilhouette, selectedGender, selectedSize, minPrice, maxPrice, searchKeyword, sortBy, sortDirection, page, inStockOnly, onSale, productQueryKey]);

  useEffect(() => {
    if (!isMobileFilterOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileFilterOpen(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileFilterOpen]);

  const scrollToCatalog = useCallback(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    catalogStartRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, []);

  const updateParams = useCallback((key: string, value: string | null) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) nextParams.set(key, value); else nextParams.delete(key);
    if (key !== "page") nextParams.set("page", "0");

    if (key === "category") {
      nextParams.delete("categoryId");
      nextParams.delete("silhouette");
      nextParams.delete("silhouetteId");
      nextParams.delete("shoeSize");
      if (value && filterOptions.length > 0) {
        const targetCategory = categories.find((c) => c.slug === value);
        if (targetCategory && selectedBrand) {
          const validBrandIds = new Set(
            filterOptions
              .filter((opt) => opt.categoryId === targetCategory.id && opt.brandId !== null)
              .map((opt) => opt.brandId as number)
          );
          if (validBrandIds.size > 0 && !validBrandIds.has(selectedBrand.id)) {
            nextParams.delete("brand");
            nextParams.delete("brandId");
          }
        }
      }
    }
    if (key === "brand") {
      nextParams.delete("brandId");
      nextParams.delete("silhouette");
      nextParams.delete("silhouetteId");
      nextParams.delete("shoeSize");
    }
    if (key === "silhouette") {
      nextParams.delete("silhouetteId");
      nextParams.delete("shoeSize");
    }

    setSearchParams(nextParams);
    requestAnimationFrame(scrollToCatalog);
  }, [scrollToCatalog, searchParams, setSearchParams]);

  const updatePriceRange = useCallback((minimum: string | null, maximum: string | null) => {
    const nextParams = new URLSearchParams(searchParams);
    if (minimum) nextParams.set("minPrice", minimum); else nextParams.delete("minPrice");
    if (maximum) nextParams.set("maxPrice", maximum); else nextParams.delete("maxPrice");
    nextParams.set("page", "0");
    setSearchParams(nextParams);
    requestAnimationFrame(scrollToCatalog);
  }, [scrollToCatalog, searchParams, setSearchParams]);

  const resetProductFilters = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams);
    ["category", "categoryId", "brand", "brandId", "silhouette", "silhouetteId", "shoeSize", "minPrice", "maxPrice", "featured", "tag", "onSale"].forEach((key) => nextParams.delete(key));
    nextParams.set("page", "0");
    setSearchParams(nextParams);
    requestAnimationFrame(scrollToCatalog);
  }, [scrollToCatalog, searchParams, setSearchParams]);

  const clearAllDiscoveryState = useCallback(() => {
    const nextParams = new URLSearchParams();
    nextParams.set("sortBy", sortBy === "isFeatured" ? "totalSold" : sortBy);
    nextParams.set("sortDirection", sortDirection);
    setSearchParams(nextParams);
    requestAnimationFrame(scrollToCatalog);
  }, [scrollToCatalog, setSearchParams, sortBy, sortDirection]);

  const currentSortValue =
    (sortBy === "isFeatured" || sortBy === "totalSold") && sortDirection === "desc"
      ? "totalSold:desc"
      : sortBy === "basePrice"
        ? `price:${sortDirection}`
        : `${sortBy}:${sortDirection}`;

  const handleSortChange = useCallback((value: string) => {
    const [nextSortBy, nextSortDirection] = value.split(":");
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("sortBy", nextSortBy);
    nextParams.set("sortDirection", nextSortDirection);
    nextParams.delete("featured");
    nextParams.delete("tag");
    nextParams.set("page", "0");
    setSearchParams(nextParams);
    requestAnimationFrame(scrollToCatalog);
  }, [scrollToCatalog, searchParams, setSearchParams]);

  const priceLabel = minPrice === "5000000"
    ? "Trên 5.000.000đ"
    : minPrice === "2000000" && maxPrice === "5000000"
      ? "2.000.000đ đến 5.000.000đ"
      : maxPrice === "2000000"
        ? "Dưới 2.000.000đ"
        : "Khoảng giá";

  return (
    <div className="container mx-auto px-4 py-10 md:px-8">
      <div className="mb-8 flex flex-col gap-6 text-center md:text-left lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-zinc-900 sm:text-4xl lg:text-5xl">
            {searchKeyword ? `Kết Quả Cho “${searchKeyword}”` : "Khám Phá Sản Phẩm"}
          </h1>
          <p className="mt-3 max-w-2xl text-zinc-500">
            {searchKeyword
              ? isProductLoading
                ? "Đang tìm sản phẩm phù hợp..."
                : `${displayedTotalElements} sản phẩm được tìm thấy. Sử dụng bộ lọc để thu hẹp kết quả.`
              : "Tất cả những phiên bản mới nhất, độc quyền và giới hạn được tổng hợp tại đây."}
          </p>
        </div>

        <label className="hidden items-center gap-3 lg:flex">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Sắp xếp</span>
          <select
            value={currentSortValue}
            onChange={(event) => handleSortChange(event.target.value)}
            className="h-11 min-w-48 border border-zinc-300 bg-white px-3 text-sm font-bold text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
          >
            <option value="createdAt:desc">Mới nhất</option>
            <option value="totalSold:desc">Bán chạy nhất</option>
            <option value="price:asc">Giá tăng dần</option>
            <option value="price:desc">Giá giảm dần</option>
          </select>
        </label>
      </div>

      <div className="mb-7 grid grid-cols-[1fr_auto] border-y border-zinc-200 lg:hidden">
        <button
          type="button"
          onClick={() => setIsMobileFilterOpen(true)}
          className="flex h-14 items-center gap-2 border-r border-zinc-200 px-1 text-sm font-black uppercase tracking-wide text-zinc-900 active:translate-y-px"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Bộ lọc
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center bg-zinc-900 px-1 text-[11px] text-white">{activeFilterCount}</span>
          )}
        </button>
        <select
          aria-label="Sắp xếp sản phẩm"
          value={currentSortValue}
          onChange={(event) => handleSortChange(event.target.value)}
          className="h-14 max-w-40 bg-white px-3 text-sm font-bold text-zinc-900 outline-none"
        >
          <option value="createdAt:desc">Mới nhất</option>
          <option value="totalSold:desc">Bán chạy nhất</option>
          <option value="basePrice:asc">Giá tăng dần</option>
          <option value="basePrice:desc">Giá giảm dần</option>
        </select>
      </div>

      {isMobileFilterOpen && (
        <ProductFilterPanel
          mobile
          categories={categories}
          brands={displayedBrands}
          silhouettes={displayedSilhouettes}
          sizes={availableSizes}
          selectedCategory={selectedCategory}
          selectedBrand={selectedBrand}
          selectedSilhouette={selectedSilhouette}
          selectedGender={selectedGender}
          selectedSize={selectedSize}
          minPrice={minPrice}
          maxPrice={maxPrice}
          inStockOnly={inStockOnly}
          onSale={onSale}
          activeFilterCount={activeFilterCount}
          resultCount={displayedTotalElements}
          showSilhouettes={showSilhouettes}
          showShoeFilters={showShoeFilters}
          onCategoryChange={(slug) => updateParams("category", slug)}
          onBrandChange={(slug) => updateParams("brand", slug)}
          onSilhouetteChange={(slug) => updateParams("silhouette", slug)}
          onGenderChange={(gender) => updateParams("gender", gender)}
          onSizeChange={(size) => updateParams("shoeSize", size)}
          onPriceChange={updatePriceRange}
          onInStockOnlyChange={(val) => updateParams("inStockOnly", val ? "true" : null)}
          onSaleChange={(val) => updateParams("onSale", val ? "true" : null)}
          onReset={resetProductFilters}
          onClose={() => {
            setIsMobileFilterOpen(false);
            requestAnimationFrame(scrollToCatalog);
          }}
        />
      )}

      <div className="flex gap-10 lg:scroll-mt-28 xl:gap-14" ref={catalogStartRef}>
        <ProductFilterPanel
          categories={categories}
          brands={displayedBrands}
          silhouettes={displayedSilhouettes}
          sizes={availableSizes}
          selectedCategory={selectedCategory}
          selectedBrand={selectedBrand}
          selectedSilhouette={selectedSilhouette}
          selectedGender={selectedGender}
          selectedSize={selectedSize}
          minPrice={minPrice}
          maxPrice={maxPrice}
          inStockOnly={inStockOnly}
          onSale={onSale}
          activeFilterCount={activeFilterCount}
          resultCount={displayedTotalElements}
          showSilhouettes={showSilhouettes}
          showShoeFilters={showShoeFilters}
          onCategoryChange={(slug) => updateParams("category", slug)}
          onBrandChange={(slug) => updateParams("brand", slug)}
          onSilhouetteChange={(slug) => updateParams("silhouette", slug)}
          onGenderChange={(gender) => updateParams("gender", gender)}
          onSizeChange={(size) => updateParams("shoeSize", size)}
          onPriceChange={updatePriceRange}
          onInStockOnlyChange={(val) => updateParams("inStockOnly", val ? "true" : null)}
          onSaleChange={(val) => updateParams("onSale", val ? "true" : null)}
          onReset={resetProductFilters}
        />

        <div className="min-h-[900px] min-w-0 flex-1 [overflow-anchor:none]">
          <div className="mb-6 flex items-center justify-between border-b border-zinc-200 pb-4">
            <p className="text-sm font-semibold text-zinc-500">
              <span className="font-black text-zinc-900">{displayedTotalElements}</span> sản phẩm
            </p>
            {activeFilterCount > 0 && (
              <button type="button" onClick={resetProductFilters} className="text-xs font-bold text-zinc-500 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900 lg:hidden">
                Đặt lại bộ lọc
              </button>
            )}
          </div>

          {(searchKeyword || selectedCategory || selectedBrand || selectedSilhouette || selectedGender || selectedSize || minPrice || maxPrice || inStockOnly || onSale) && (
            <div className="mb-8 flex flex-wrap items-center gap-2">
              {searchKeyword && <ActiveFilterChip label="Từ khóa" value={searchKeyword} onRemove={() => updateParams("search", null)} />}
              {selectedCategory && <ActiveFilterChip label="Danh mục" value={selectedCategory.name} onRemove={() => updateParams("category", null)} />}
              {selectedBrand && <ActiveFilterChip label="Thương hiệu" value={selectedBrand.name} onRemove={() => updateParams("brand", null)} />}
              {selectedSilhouette && <ActiveFilterChip label="Dòng sản phẩm" value={selectedSilhouette.name} onRemove={() => updateParams("silhouette", null)} />}
              {selectedGender && <ActiveFilterChip label="Giới tính" value={GENDER_LABELS[selectedGender] || selectedGender} onRemove={() => updateParams("gender", null)} />}
              {selectedSize && <ActiveFilterChip label="Kích thước" value={`Size ${selectedSize}`} onRemove={() => updateParams("shoeSize", null)} />}
              {(minPrice || maxPrice) && <ActiveFilterChip label="Mức giá" value={priceLabel} onRemove={() => updatePriceRange(null, null)} />}
              {inStockOnly && <ActiveFilterChip label="Tình trạng" value="Chỉ còn hàng" onRemove={() => updateParams("inStockOnly", null)} />}
              {onSale && <ActiveFilterChip label="Khuyến mãi" value="Đang giảm giá" onRemove={() => updateParams("onSale", null)} />}
              {(searchKeyword || activeFilterCount > 0) && (
                <button type="button" onClick={clearAllDiscoveryState} className="min-h-9 px-2 text-xs font-bold text-zinc-500 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900">
                  Xóa tất cả
                </button>
              )}
            </div>
          )}

          {isProductLoading ? (
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3" aria-label="Đang tải sản phẩm">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="aspect-square bg-zinc-100" />
                  <div className="mt-4 h-3 w-20 bg-zinc-100" />
                  <div className="mt-3 h-4 w-4/5 bg-zinc-100" />
                  <div className="mt-3 h-4 w-28 bg-zinc-100" />
                </div>
              ))}
            </div>
          ) : displayedProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id.toString()}
                  name={product.name}
                  price={product.price ?? product.basePrice}
                  basePrice={product.basePrice}
                  discountPercent={product.discountPercent}
                  totalStock={product.totalStock}
                  totalSold={product.totalSold}
                  isNew={product.isNew}
                  isFeatured={product.isFeatured}
                  category={product.brand?.name}
                  imageUrl={product.defaultImageUrl}
                />
              ))}
            </div>
          ) : (
            <div className="border-y border-zinc-200 py-20 text-center">
              <p className="text-xl font-black uppercase tracking-tight text-zinc-900">Không có sản phẩm phù hợp</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">Hãy bỏ bớt một vài điều kiện hoặc xóa toàn bộ bộ lọc để xem lại danh sách sản phẩm.</p>
              <button type="button" onClick={clearAllDiscoveryState} className="mt-6 h-11 bg-zinc-900 px-6 text-sm font-bold text-white hover:bg-zinc-800 active:translate-y-px">
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}

          {displayedTotalPages > 1 && (
            <nav className="mt-16 flex justify-center" aria-label="Phân trang sản phẩm">
              <div className="flex">
                <button type="button" onClick={() => updateParams("page", (page - 1).toString())} disabled={page === 0} className="h-11 border border-zinc-200 px-4 text-sm font-bold text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40">
                  Trước
                </button>
                {Array.from({ length: displayedTotalPages }).map((_, index) => (
                  <button
                    type="button"
                    key={index}
                    onClick={() => updateParams("page", index.toString())}
                    aria-current={page === index ? "page" : undefined}
                    className={`h-11 min-w-11 border-y border-r border-zinc-200 text-sm font-bold ${page === index ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100"}`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button type="button" onClick={() => updateParams("page", (page + 1).toString())} disabled={page >= displayedTotalPages - 1} className="h-11 border-y border-r border-zinc-200 px-4 text-sm font-bold text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40">
                  Sau
                </button>
              </div>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
