import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { type CartItem } from '../data/cart';

type NewCartItem = Omit<CartItem, 'quantity'>;
type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: NewCartItem, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => { try { const saved = localStorage.getItem('lee-cart'); return saved ? JSON.parse(saved) : []; } catch { return []; } });
  const [showAddedToast, setShowAddedToast] = useState(false);
  useEffect(() => { try { localStorage.setItem('lee-cart', JSON.stringify(items)); } catch { /* storage is optional */ } }, [items]);
  useEffect(() => {
    if (!showAddedToast) return;
    const timeout = window.setTimeout(() => setShowAddedToast(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [showAddedToast]);
  const value = useMemo<CartContextValue>(() => ({
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce((total, item) => total + item.price * item.quantity, 0),
    addItem: (item, quantity = 1) => {
      setItems(current => {
        const existing = current.find(entry => entry.id === item.id);
        return existing
          ? current.map(entry => entry.id === item.id ? { ...entry, quantity: entry.quantity + quantity } : entry)
          : [...current, { ...item, quantity }];
      });
      setShowAddedToast(true);
    },
    updateQuantity: (id, quantity) => setItems(current => current.map(item => item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item)),
    removeItem: id => setItems(current => current.filter(item => item.id !== id)),
    clear: () => setItems([]),
  }), [items]);
  return <CartContext.Provider value={value}>{children}{showAddedToast && <div role="status" className="fixed bottom-24 right-4 z-50 rounded bg-den px-4 py-3 text-sm text-white shadow-lg xl:bottom-4 xl:right-6">Đã thêm vào giỏ hàng. <Link to="/gio-hang" className="font-bold underline" onClick={() => setShowAddedToast(false)}>Xem giỏ hàng</Link></div>}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
