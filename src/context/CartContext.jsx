import { useState, useCallback, useMemo } from 'react';
import { CartContext } from './cartContextStore';

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  const clampQuantity = useCallback((quantity, maxQuantity) => {
    const normalized = Math.max(1, Number(quantity || 1));
    if (!Number.isFinite(Number(maxQuantity)) || Number(maxQuantity) <= 0) return normalized;
    return Math.min(normalized, Number(maxQuantity));
  }, []);

  const showToast = useCallback((message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const addToCart = useCallback((item) => {
    const quantityToAdd = clampQuantity(item.quantity, item.maxQuantity);
    setCart(prev => {
      const exists = prev.find(c => c.id === item.id && c.itemType === item.itemType);
      if (exists) {
        const nextMax = Number(item.maxQuantity || exists.maxQuantity || 0) || undefined;
        return prev.map((entry) => (
          entry.cartId === exists.cartId
            ? {
                ...entry,
                maxQuantity: nextMax,
                quantity: clampQuantity(Number(entry.quantity || 1) + quantityToAdd, nextMax),
              }
            : entry
        ));
      }
      return [...prev, { ...item, maxQuantity: item.maxQuantity, quantity: quantityToAdd, cartId: crypto.randomUUID() }];
    });
    showToast(`${item.title} sepete eklendi!`);
  }, [clampQuantity, showToast]);

  const removeFromCart = useCallback((cartId) => {
    setCart(prev => prev.filter(c => c.cartId !== cartId));
  }, []);

  const updateCartQuantity = useCallback((cartId, quantity) => {
    setCart((prev) => prev.map((item) => (
      item.cartId === cartId ? { ...item, quantity: clampQuantity(quantity, item.maxQuantity) } : item
    )));
  }, [clampQuantity]);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + (Number(item.price) || 0) * Number(item.quantity || 1), 0),
    [cart]
  );
  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0),
    [cart]
  );

  const value = useMemo(() => ({
    cart, addToCart, removeFromCart, updateCartQuantity, clearCart, cartTotal, cartCount, toastMessage, showToast
  }), [cart, addToCart, removeFromCart, updateCartQuantity, clearCart, cartTotal, cartCount, toastMessage, showToast]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}
