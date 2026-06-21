"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "./auth-context";
import { getWishlist, addToWishlist as apiAddToWishlist, removeFromWishlist as apiRemoveFromWishlist } from "@/lib/api/cart-wishlist";

interface WishlistItem {
  id: string;
  addedAt: Date;
}

interface WishlistContextType {
  items: WishlistItem[];
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  toggleItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  totalItems: number;
  refreshWishlist: () => Promise<void>;
}

const STORAGE_KEY = "thrifted-wishlist";

export function useWishlist(): WishlistContextType {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync with server when authenticated
  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const serverItems = await getWishlist();
      setItems(serverItems.map((i) => ({ id: i.productId, addedAt: new Date(i.addedAt) })));
    } catch {
      // ignore errors silently
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshWishlist().finally(() => setIsLoaded(true));
    } else {
      // Load from localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setItems(JSON.parse(stored));
        }
      } catch {
        console.error("Failed to load wishlist from localStorage");
      }
      setIsLoaded(true);
    }
  }, [isAuthenticated, refreshWishlist]);

  // Save to localStorage when not authenticated
  useEffect(() => {
    if (isLoaded && !isAuthenticated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isLoaded, isAuthenticated]);

  const addItem = useCallback(async (productId: string) => {
    if (items.find(item => item.id === productId)) return;

    // Optimistic UI Update
    const newItem = { id: productId, addedAt: new Date() };
    setItems((prev) => [...prev, newItem]);

    if (isAuthenticated) {
      try {
        await apiAddToWishlist(productId);
      } catch (error) {
        console.error("Failed to add to wishlist on server", error);
        // Rollback on error
        setItems((prev) => prev.filter(item => item.id !== productId));
      }
    }
  }, [items, isAuthenticated]);

  const removeItem = useCallback(async (productId: string) => {
    const originalItems = [...items];
    
    // Optimistic UI Update
    setItems((prev) => prev.filter(item => item.id !== productId));

    if (isAuthenticated) {
      try {
        await apiRemoveFromWishlist(productId);
      } catch (error) {
        console.error("Failed to remove from wishlist on server", error);
        // Rollback on error
        setItems(originalItems);
      }
    }
  }, [items, isAuthenticated]);

  const isInWishlist = useCallback((productId: string) => {
    return items.some(item => item.id === productId);
  }, [items]);

  const toggleItem = useCallback((productId: string) => {
    if (isInWishlist(productId)) {
      removeItem(productId);
    } else {
      addItem(productId);
    }
  }, [isInWishlist, removeItem, addItem]);

  return {
    items,
    addItem,
    removeItem,
    toggleItem,
    isInWishlist,
    totalItems: items.length,
    refreshWishlist,
  };
}
