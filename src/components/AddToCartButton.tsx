"use client";

import { useState } from "react";
import type { Product } from "@/lib/api/types";
import { useCart } from "@/lib/cart-context";
import { SizeSelector } from "./SizeSelector";
import { formatPrice } from "@/lib/api";

const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

interface AddToCartButtonProps {
  product: Product;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addItem, items, updateQuantity } = useCart();
  
  const productSizes = product.sizes && product.sizes.length > 0 ? product.sizes : DEFAULT_SIZES;
  const [selectedSize, setSelectedSize] = useState(productSizes[0]);
  
  // Find item with same ID AND same Size
  const cartItem = items.find((item) => item.product.id === product.id && item.size === selectedSize);
  const isInCart = !!cartItem;
  const quantity = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    addItem(product, selectedSize);
  };

  if (product.status === 'SOLD_OUT') {
    return (
      <button 
        disabled
        className="w-full bg-zinc-300 text-zinc-100 py-4 font-black uppercase tracking-widest cursor-not-allowed"
      >
        HẾT HÀNG
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <SizeSelector 
        sizes={productSizes} 
        selectedSize={selectedSize} 
        onSizeChange={setSelectedSize} 
      />
      
      {isInCart ? (
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-zinc-200">
            <button 
              onClick={() => updateQuantity(product.id, quantity - 1, selectedSize)}
              className="w-12 h-12 flex items-center justify-center hover:bg-zinc-100 transition-colors text-lg cursor-pointer"
            >
              −
            </button>
            <span className="w-16 text-center text-lg font-medium">{quantity}</span>
            <button 
              onClick={() => updateQuantity(product.id, quantity + 1, selectedSize)}
              className="w-12 h-12 flex items-center justify-center hover:bg-zinc-100 transition-colors text-lg cursor-pointer"
            >
              +
            </button>
          </div>
          <span className="text-sm text-zinc-500 font-label">Size {selectedSize} • {quantity} trong giỏ</span>
        </div>
      ) : (
        <button 
          onClick={handleAddToCart}
          className="w-full btn-primary cursor-pointer"
        >
          Thêm vào giỏ — {formatPrice(product.price)}
        </button>
      )}
    </div>
  );
}
