import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const addToCart = useCallback((item) => {
    setCart(prev => {
      const exists = prev.find(c => c.id === item.id && c.itemType === item.itemType);
      if (exists) return prev;
      return [...prev, { ...item, cartId: crypto.randomUUID() }];
    });
    showToast(`${item.title} sepete eklendi!`);
  }, [showToast]);

  const removeFromCart = useCallback((cartId) => {
    setCart(prev => prev.filter(c => c.cartId !== cartId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price || 0), 0), [cart]);

  const value = useMemo(() => ({
    cart, addToCart, removeFromCart, clearCart, cartTotal, toastMessage, showToast
  }), [cart, addToCart, removeFromCart, clearCart, cartTotal, toastMessage, showToast]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
}
