import { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  const addToCart = (item) => {
    const exists = cart.find(c => c.id === item.id && c.itemType === item.itemType);
    if (exists) { showToast('Bu urun zaten sepetinde!'); return; }
    setCart(prev => [...prev, { ...item, cartId: crypto.randomUUID() }]);
    showToast(`${item.title} sepete eklendi!`);
  };

  const removeFromCart = (cartId) => {
    setCart(prev => prev.filter(c => c.cartId !== cartId));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price || 0), 0);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, cartTotal, toastMessage, showToast }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
}
