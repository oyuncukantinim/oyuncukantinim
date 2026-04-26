import { useContext } from 'react';
import { CartContext } from './cartContextStore';

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be inside CartProvider');
  }
  return context;
}
