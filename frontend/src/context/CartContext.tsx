import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { CartService } from '../services/cartService';
import type { CartResponse } from '../services/cartService';

interface CartContextType {
  cart: CartResponse | null;
  loading: boolean;
  itemCount: number;
  fetchCart: () => Promise<void>;
  addToCart: (variantId: number, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Computed total items in cart
  const itemCount = cart?.items.reduce((total, item) => total + item.quantity, 0) || 0;

  const fetchCart = async () => {
    try {
      setLoading(true);
      // Only fetch cart if logged in (token exists)
      const token = localStorage.getItem('token');
      if (!token) {
        setCart(null);
        return;
      }
      const cartData = await CartService.getCart();
      setCart(cartData);
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
    
    // Listen for storage events to update cart when token changes (login/logout in other tabs)
    const handleStorageChange = () => {
      fetchCart();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addToCart = async (variantId: number, quantity: number = 1) => {
    await CartService.addToCart(variantId, quantity);
    await fetchCart(); // Refresh cart after adding
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }
    await CartService.updateCartItem(itemId, quantity);
    await fetchCart();
  };

  const removeItem = async (itemId: number) => {
    await CartService.removeCartItem(itemId);
    await fetchCart();
  };

  const clearCart = async () => {
    await CartService.clearCart();
    await fetchCart();
  };

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      itemCount,
      fetchCart,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
