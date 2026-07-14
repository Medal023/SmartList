/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ListStatus = 'active' | 'completed' | 'archived';

export interface ShoppingList {
  id: string;
  name: string;
  category: string;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
  description: string;
  status: ListStatus;
}

export interface Product {
  id: string;
  listId: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  brand: string;
  estimatedPrice: number;
  paidPrice: number;
  images: string[]; // URLs or base64 data
  recommendationLink: string;
  note: string;
  barcode: string;
  isFavorite: boolean;
  isBought: boolean;
  boughtAt: string | null;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: 'create_list' | 'delete_list' | 'update_list' | 'add_product' | 'delete_product' | 'update_product' | 'buy_product' | 'restore_list';
  details: string;
  listId?: string;
  payload?: string; // Serialized list or product state for restoration
}

export interface AppConfig {
  language: 'pt-BR' | 'en' | 'es';
  theme: 'light' | 'dark';
  currency: 'BRL' | 'USD' | 'EUR';
  defaultUnit: 'un' | 'kg' | 'g' | 'l' | 'ml' | 'pacote';
  autoBackup: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  provider: 'google' | 'apple' | 'email';
  createdAt: string;
  plan?: 'Free' | 'Premium';
  settings?: any;
  stats?: any;
  lastLogin?: string;
  emailVerified?: boolean;
  role?: 'user' | 'super_admin';
}

export interface Recommendation {
  id: string;
  name: string;
  category: string;
  brand?: string;
  description: string;
  image: string; // URL (must be valid)
  link: string; // Purchase link (must be valid URL)
  store: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive';
}

export interface BroadcastMessage {
  id: string;
  title: string;
  message: string;
  image?: string;
  link?: string;
  publishedAt: string;
  expiresAt?: string;
  type: 'info' | 'promotion' | 'news' | 'warning' | 'update';
  readBy?: string[]; // array of userIds
}

export interface DashboardStats {
  totalLists: number;
  totalProducts: number;
  favoriteProductsCount: number;
  boughtProductsCount: number;
  totalEstimatedValue: number;
  totalPaidValue: number;
  categoryDistribution: { name: string; count: number; value: number }[];
  buyingTrend: { date: string; spent: number }[];
}
