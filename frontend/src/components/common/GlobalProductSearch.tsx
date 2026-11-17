import { ArrowRight, Loader2, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDebounce } from "../../hooks/useDebounce";
import { ProductService, type ProductResponse } from "../../services/productService";

const MINIMUM_SEARCH_LENGTH = 2;
const SEARCH_RESULT_LIMIT = 5;
const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=200&q=80";

interface GlobalProductSearchProps {
  mode?: "desktop" | "mobile";
  autoFocus?: boolean;
  onNavigate?: () => void;
}

export default function GlobalProductSearch({
  mode = "desktop",
  autoFocus = false,
  onNavigate,
}: GlobalProductSearchProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductResponse[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearchError, setHasSearchError] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState(-1);
  const debouncedSearch = useDebounce(searchQuery.trim(), 400);
  const isMobile = mode === "mobile";

  useEffect(() => {
    const currentSearch = location.pathname === "/shop"
      ? new URLSearchParams(location.search).get("search") ?? ""
      : "";

    setSearchQuery(currentSearch);
    setSearchResults([]);
    setActiveResultIndex(-1);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isSearchOpen || debouncedSearch.length < MINIMUM_SEARCH_LENGTH) {
      requestIdRef.current += 1;
      setSearchResults([]);
      setIsSearching(false);
      setHasSearchError(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsSearching(true);
    setHasSearchError(false);

    ProductService.filterProducts({ search: debouncedSearch, page: 0, size: SEARCH_RESULT_LIMIT })
      .then((response) => {
        if (requestId === requestIdRef.current) setSearchResults(response.items);
      })
      .catch((error: unknown) => {
        if (requestId !== requestIdRef.current) return;
        console.error("Không thể tải gợi ý tìm kiếm", error);
        setSearchResults([]);
        setHasSearchError(true);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setIsSearching(false);
      });
  }, [debouncedSearch, isSearchOpen]);

  useEffect(() => {
    if (isMobile) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile]);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setActiveResultIndex(-1);
  }, []);

  const navigateToSearch = useCallback((query: string) => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;

    closeSearch();
    navigate(`/shop?search=${encodeURIComponent(normalizedQuery)}`);
    onNavigate?.();
  }, [closeSearch, navigate, onNavigate]);

  const navigateToProduct = useCallback((productId: number) => {
    closeSearch();
    setSearchQuery("");
    navigate(`/products/${productId}`);
    onNavigate?.();
  }, [closeSearch, navigate, onNavigate]);

  const handleSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigateToSearch(searchQuery);
  }, [navigateToSearch, searchQuery]);

  const handleClear = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setActiveResultIndex(-1);
    setHasSearchError(false);

    if (location.pathname === "/shop") {
      const nextParams = new URLSearchParams(location.search);
      if (nextParams.has("search")) {
        nextParams.delete("search");
        nextParams.set("page", "0");
        navigate({ pathname: "/shop", search: nextParams.toString() }, { replace: true });
      }
    }
  }, [location.pathname, location.search, navigate]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      closeSearch();
      return;
    }
    if (!isSearchOpen || searchResults.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveResultIndex((currentIndex) => (currentIndex + 1) % searchResults.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveResultIndex((currentIndex) =>
        currentIndex <= 0 ? searchResults.length - 1 : currentIndex - 1,
      );
    } else if (event.key === "Enter" && activeResultIndex >= 0) {
      event.preventDefault();
      navigateToProduct(searchResults[activeResultIndex].id);
    }
  }, [activeResultIndex, closeSearch, isSearchOpen, navigateToProduct, searchResults]);

  const shouldShowPanel = isSearchOpen && debouncedSearch.length >= MINIMUM_SEARCH_LENGTH;
  const panelPositionClass = isMobile ? "relative mt-4 w-full" : "absolute right-0 top-full mt-3 w-[24rem]";

  return (
    <div ref={searchContainerRef} className={isMobile ? "w-full" : "relative w-56 xl:w-64"}>
      <form onSubmit={handleSubmit} role="search" className="relative">
        <label htmlFor={`global-product-search-${mode}`} className="sr-only">Tìm kiếm sản phẩm</label>
        <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          id={`global-product-search-${mode}`}
          type="text"
          role="searchbox"
          aria-autocomplete="list"
          aria-controls={`global-product-search-results-${mode}`}
          aria-expanded={shouldShowPanel}
          aria-activedescendant={activeResultIndex >= 0 ? `search-result-${mode}-${activeResultIndex}` : undefined}
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder="Tìm kiếm sản phẩm..."
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setIsSearchOpen(true);
            setActiveResultIndex(-1);
          }}
          onFocus={() => setIsSearchOpen(true)}
          onKeyDown={handleKeyDown}
          className={`w-full border border-zinc-300 bg-white pl-11 pr-11 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-ms-clear]:hidden ${isMobile ? "h-14 rounded-none" : "h-11 rounded-full shadow-sm"}`}
        />
        {isSearching ? (
          <Loader2 aria-label="Đang tìm kiếm" className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-400" />
        ) : searchQuery ? (
          <button type="button" onClick={handleClear} aria-label="Xóa từ khóa tìm kiếm" className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-zinc-400 transition-colors hover:text-zinc-900">
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </form>

      {shouldShowPanel && (
        <div id={`global-product-search-results-${mode}`} role="listbox" className={`${panelPositionClass} z-50 overflow-hidden border border-zinc-200 bg-white shadow-2xl`}>
          {isSearching && searchResults.length === 0 ? (
            <div className="flex items-center justify-center gap-2 px-5 py-8 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tìm sản phẩm...
            </div>
          ) : hasSearchError ? (
            <div className="px-5 py-8 text-center text-sm text-zinc-500">Không thể tải gợi ý. Bạn vẫn có thể nhấn Enter để xem kết quả.</div>
          ) : searchResults.length > 0 ? (
            <>
              <div className="px-4 pb-2 pt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">Gợi ý sản phẩm</div>
              <div className="p-2 pt-0">
                {searchResults.map((product, index) => (
                  <button
                    id={`search-result-${mode}-${index}`}
                    key={product.id}
                    type="button"
                    role="option"
                    aria-selected={activeResultIndex === index}
                    onMouseEnter={() => setActiveResultIndex(index)}
                    onClick={() => navigateToProduct(product.id)}
                    className={`flex w-full items-center gap-3 p-2 text-left transition-colors ${activeResultIndex === index ? "bg-zinc-100" : "hover:bg-zinc-50"}`}
                  >
                    <img
                      src={product.defaultImageUrl || FALLBACK_PRODUCT_IMAGE}
                      alt=""
                      className="h-14 w-14 shrink-0 bg-zinc-100 object-cover"
                      onError={(event) => { event.currentTarget.src = FALLBACK_PRODUCT_IMAGE; }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{product.brand?.name || "PeakSneaker"}</span>
                      <span className="mt-0.5 block truncate text-sm font-bold text-zinc-900">{product.name}</span>
                      <span className="mt-1 block text-xs font-semibold text-zinc-700">
                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(product.price ?? product.basePrice)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => navigateToSearch(debouncedSearch)} className="flex w-full items-center justify-between border-t border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-900 transition-colors hover:bg-zinc-100">
                <span>Xem tất cả kết quả cho “{debouncedSearch}”</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="px-5 py-8 text-center">
              <p className="text-sm font-semibold text-zinc-900">Không tìm thấy sản phẩm phù hợp</p>
              <p className="mt-1 text-xs text-zinc-500">Thử tên sản phẩm, thương hiệu hoặc dòng sản phẩm khác.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
