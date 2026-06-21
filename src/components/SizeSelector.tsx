"use client";

import { useState } from "react";

interface SizeSelectorProps {
  sizes: string[];
  selectedSize: string;
  onSizeChange: (size: string) => void;
}

export function SizeSelector({ sizes, selectedSize, onSizeChange }: SizeSelectorProps) {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-label text-zinc-700">Chọn size</h3>
        <a href="/size-guide" className="text-xs text-brand-red hover:underline font-label">
          Hướng dẫn size
        </a>
      </div>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => onSizeChange(size)}
            className={`w-14 h-14 border text-sm font-semibold transition-colors ${
              selectedSize === size
                ? "border-brand-red bg-brand-red text-white"
                : "border-zinc-300 hover:border-black"
            }`}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}
