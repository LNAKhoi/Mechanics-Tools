import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { initialCartItems, type CartItem } from '../data/cart';

type NewCartItem = Omit<CartItem, 'quantity'>;
type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: NewCartItem, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(initialCartItems);
  const value = useMemo<CartContextValue>(() => ({
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce((total, item) => total + item.price * item.quantity, 0),
    addItem: (item, quantity = 1) => setItems(current => {
      const existing = current.find(entry => entry.id === item.id);
      return existing
        ? current.map(entry => entry.id === item.id ? { ...entry, quantity: entry.quantity + quantity } : entry)
        : [...current, { ...item, quantity }];
    }),
    updateQuantity: (id, quantity) => setItems(current => current.map(item => item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item)),
    removeItem: id => setItems(current => current.filter(item => item.id !== id)),
  }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
