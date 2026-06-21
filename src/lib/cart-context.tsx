"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from "react";
import type { Product, CartItem } from "./api/types";

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, size?: string, quantity?: number) => void;
  removeItem: (productId: string, size?: string) => void;
  updateQuantity: (productId: string, quantity: number, size?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  appliedCoupon: any;
  setAppliedCoupon: (coupon: any) => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "thrifted-cart";
const COUPON_STORAGE_KEY = "thrifted-coupon";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from local storage
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (storedCart) {
        setItems(JSON.parse(storedCart));
      }
    } catch (e) {
      console.error("Failed to parse cart from localStorage", e);
    }
    
    try {
      const storedCoupon = localStorage.getItem(COUPON_STORAGE_KEY);
      if (storedCoupon) {
        setAppliedCoupon(JSON.parse(storedCoupon));
      }
    } catch (e) {
      console.error("Failed to parse coupon from localStorage", e);
    }
    setIsInitialized(true);
  }, []);

  // Save to local storage
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        console.error("Failed to save cart to localStorage", e);
      }
    }
  }, [items, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      try {
        if (appliedCoupon) {
          localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(appliedCoupon));
        } else {
          localStorage.removeItem(COUPON_STORAGE_KEY);
        }
      } catch (e) {
        console.error("Failed to save coupon to localStorage", e);
      }
    }
  }, [appliedCoupon, isInitialized]);

  const addItem = useCallback((product: Product, size?: string, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && item.size === size
      );
      const stockPerSize = (product.stockPerSize as Record<string, number> | null) ?? {};
      const maxAllowed = size ? (stockPerSize[size] ?? product.stock) : product.stock;
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, maxAllowed);
        return prev.map((item) =>
          item.product.id === product.id && item.size === size
            ? { ...item, quantity: newQty }
            : item
        );
      }
      return [...prev, { product, quantity: Math.min(quantity, maxAllowed), size }];
    });
    setIsOpen(true); // Open cart when item is added
  }, []);

  const removeItem = useCallback((productId: string, size?: string) => {
    setItems((prev) =>
      prev.filter((item) => !(item.product.id === productId && (item.size || undefined) === (size || undefined)))
    );
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, size?: string) => {
    if (quantity <= 0) {
      removeItem(productId, size);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId && (item.size || undefined) === (size || undefined)) {
          const stockPerSize = (item.product.stockPerSize as Record<string, number> | null) ?? {};
          const maxAllowed = size ? (stockPerSize[size] ?? item.product.stock) : item.product.stock;
          return { ...item, quantity: Math.min(quantity, maxAllowed) };
        }
        return item;
      })
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    setAppliedCoupon(null);
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((prev) => !prev), []);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );
  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      appliedCoupon,
      setAppliedCoupon,
      isOpen,
      openCart,
      closeCart,
      toggleCart,
    }),
    [items, totalItems, totalPrice, appliedCoupon, isOpen, addItem, removeItem, updateQuantity, clearCart, openCart, closeCart, toggleCart]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
