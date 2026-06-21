"use client";

import { useState } from "react";

interface FilterSidebarProps {
  onFilterChange?: (categories: string[], brands: string[], priceRange: [number, number]) => void;
  categories?: string[];
  brands?: string[];
  priceRange?: [number, number];
  hotDealsOnly?: boolean;
}

const CATEGORIES = ["Bags", "Shoes", "Watches", "Clothing", "Accessories", "Jewelry"];
const BRANDS = ["Hermès", "Chanel", "Louis Vuitton", "Gucci", "Prada", "Balenciaga", "Burberry", "Cartier", "Dior", "YSL", "Rolex"];
const CONDITIONS = ["New with tags", "Like New", "Excellent", "Good"];

export function FilterSidebar({ 
  onFilterChange,
  categories: externalCategories = [],
  brands: externalBrands = [],
  priceRange: externalPriceRange = [0, 500000000],
}: FilterSidebarProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(externalCategories);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(externalBrands);
  const [priceMin, setPriceMin] = useState(externalPriceRange[0]);
  const [priceMax, setPriceMax] = useState(externalPriceRange[1]);

  const notifyChange = (cats: string[], brds: string[], prRange: [number, number]) => {
    onFilterChange?.(cats, brds, prRange);
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    setSelectedCategories(newCategories);
    notifyChange(newCategories, selectedBrands, [priceMin, priceMax]);
  };

  const handleBrandToggle = (brand: string) => {
    const newBrands = selectedBrands.includes(brand)
      ? selectedBrands.filter((b) => b !== brand)
      : [...selectedBrands, brand];
    setSelectedBrands(newBrands);
    notifyChange(selectedCategories, newBrands, [priceMin, priceMax]);
  };

  const handlePriceChange = () => {
    notifyChange(selectedCategories, selectedBrands, [priceMin, priceMax]);
  };

  const handleClearAll = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setPriceMin(0);
    setPriceMax(500000000);
    notifyChange([], [], [0, 500000000]);
  };

  const hasFilters = selectedCategories.length > 0 || selectedBrands.length > 0 || priceMin > 0 || priceMax < 500000000;

  return (
    <aside className="w-64 flex-shrink-0">
      <div className="bg-white border border-zinc-200 p-6">
        {/* Header */}
        <div className="flex justify-between items-center pb-6 border-b border-zinc-200">
          <h3 className="font-bold text-sm">Bộ lọc</h3>
          {hasFilters && (
            <button
              onClick={handleClearAll}
              className="text-xs text-brand-red hover:underline"
            >
              Xóa tất cả
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="py-6 border-b border-zinc-200">
          <h4 className="font-label text-zinc-700 mb-4">Danh mục</h4>
          <div className="space-y-2">
            {CATEGORIES.map((category) => (
              <label key={category} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category)}
                  onChange={() => handleCategoryToggle(category)}
                  className="w-4 h-4 border-zinc-300 rounded-sm accent-black"
                />
                <span className="text-sm text-zinc-600 group-hover:text-black transition-colors">
                  {category}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Brands */}
        <div className="py-6 border-b border-zinc-200">
          <h4 className="font-label text-zinc-700 mb-4">Thương hiệu</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {BRANDS.map((brand) => (
              <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => handleBrandToggle(brand)}
                  className="w-4 h-4 border-zinc-300 rounded-sm accent-black"
                />
                <span className="text-sm text-zinc-600 group-hover:text-black transition-colors">
                  {brand}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="py-6 border-b border-zinc-200">
          <h4 className="font-label text-zinc-700 mb-4">Khoảng giá</h4>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs text-zinc-500 mb-1 block">Min</label>
              <input
                type="number"
                value={priceMin}
                onChange={(e) => setPriceMin(parseInt(e.target.value) || 0)}
                onBlur={handlePriceChange}
                className="w-full border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                placeholder="0đ"
              />
            </div>
            <span className="text-zinc-400 mt-5">–</span>
            <div className="flex-1">
              <label className="text-xs text-zinc-500 mb-1 block">Max</label>
              <input
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(parseInt(e.target.value) || 500000000)}
                onBlur={handlePriceChange}
                className="w-full border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                placeholder="500.000.000đ"
              />
            </div>
          </div>
        </div>

        {/* Apply Filters Button */}
        <button
          onClick={handleClearAll}
          className="w-full btn-primary mt-6"
        >
          Áp dụng bộ lọc
        </button>
      </div>
    </aside>
  );
}
