
export enum AppView {
  ONBOARDING = 'onboarding',
  LOGIN = 'login',
  CUSTOMER = 'customer',
  COURIER = 'courier',
  ADMIN = 'admin'
}

export interface Address {
  id: string;
  label: string; // e.g., "Home", "Work"
  details: string; // e.g., "Av. Paulista, 1578 - Bela Vista"
  complement?: string;
  type: 'home' | 'work' | 'other';
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
}

export interface Message {
  id: string;
  order_id: string;
  sender_id: string;
  text: string;
  sender: 'user' | 'store';
  timestamp: string;
  created_at?: string;
}

export interface Order {
  id: string;
  customerId: string;
  store_id: string;
  items: Array<{ product: Product; quantity: number }>;
  status: 'pending' | 'confirmed' | 'ready' | 'shipping' | 'delivered' | 'cancelled';
  total: number;
  createdAt: string;
  address: string;
  courierId?: string;
}

export interface Store {
  id: string;
  name: string;
  rating: number;
  deliveryTime: string;
  image: string;
  category: string;
}
