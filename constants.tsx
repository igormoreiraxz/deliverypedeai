
import { Product, Store } from './types';

export const MOCK_STORES: Store[] = [
  { id: '1', name: 'Pizza di Roma', rating: 4.9, deliveryTime: '35-50 min', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80', category: 'Pizza' },
  { id: '2', name: 'Cabana do Hambúrguer', rating: 4.6, deliveryTime: '20-35 min', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&q=80', category: 'Hambúrgueres' },
  { id: '3', name: 'Sushi Zen', rating: 4.8, deliveryTime: '40-60 min', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80', category: 'Japonesa' },
  { id: '4', name: 'Taco Fiesta', rating: 4.4, deliveryTime: '25-40 min', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80', category: 'Mexicana' },
  { id: '5', name: 'Natural & Verde', rating: 4.7, deliveryTime: '15-30 min', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80', category: 'Saudável' },
];

export const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Pepperoni Clássico', description: 'Pizza grande com pepperoni levemente picante e mussarela dupla.', price: 18.99, category: 'Pizza', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=200&q=80' },
  { id: 'p2', name: 'Hambúrguer Besta', description: 'Três carnes, bacon, cebola caramelizada e molho secreto.', price: 14.50, category: 'Hambúrgueres', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=80' },
  { id: 'p3', name: 'Combo Salmão Premium', description: '12 peças de nigiri e sashimi de salmão fresco.', price: 24.00, category: 'Japonesa', image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=200&q=80' },
  { id: 'p4', name: 'Milkshake de Chocolate', description: 'Batido à mão com chocolate belga e chantilly.', price: 6.50, category: 'Bebidas', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&q=80' },
];

export const CATEGORIES = [
  { name: 'Todos', icon: '🍽️' },
  { name: 'Pizza', icon: '🍕' },
  { name: 'Hambúrgueres', icon: '🍔' },
  { name: 'Japonesa', icon: '🍣' },
  { name: 'Mexicana', icon: '🌮' },
  { name: 'Saudável', icon: '🥗' },
  { name: 'Bebidas', icon: '🥤' },
  { name: 'Sobremesas', icon: '🍰' },
];
