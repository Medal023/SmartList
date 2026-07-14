/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShoppingList, Product, Category, AppConfig, UserProfile } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-alimentacao', name: 'Alimentação', color: '#10B981', icon: 'ShoppingBag' },
  { id: 'cat-limpeza', name: 'Limpeza', color: '#3B82F6', icon: 'Sparkles' },
  { id: 'cat-higiene', name: 'Higiene', color: '#EC4899', icon: 'Heart' },
  { id: 'cat-bebidas', name: 'Bebidas', color: '#F59E0B', icon: 'Wine' },
  { id: 'cat-hortifruti', name: 'Hortifruti', color: '#84CC16', icon: 'Apple' },
  { id: 'cat-casa', name: 'Casa', color: '#6366F1', icon: 'Home' },
  { id: 'cat-outros', name: 'Outros', color: '#6B7280', icon: 'Layers' },
];

export const INITIAL_LISTS: ShoppingList[] = [
  {
    id: 'list-1',
    name: 'Churrasco de Fim de Semana',
    category: 'Alimentação',
    color: '#EF4444',
    icon: 'Flame',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Ingredientes para o churrasco com a família no domingo.',
    status: 'active'
  },
  {
    id: 'list-2',
    name: 'Compras Mensais Supermercado',
    category: 'Alimentação',
    color: '#10B981',
    icon: 'ShoppingCart',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Lista geral de abastecimento mensal de dispensa.',
    status: 'active'
  },
  {
    id: 'list-3',
    name: 'Produtos para Faxina',
    category: 'Limpeza',
    color: '#3B82F6',
    icon: 'Sparkles',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Produtos de limpeza para a faxina geral da casa.',
    status: 'completed'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    listId: 'list-1',
    name: 'Picanha Bovina Premium',
    description: 'Peça maturada de picanha, aprox 1.2kg.',
    category: 'Alimentação',
    quantity: 1.5,
    unit: 'kg',
    brand: 'Friboi Black',
    estimatedPrice: 89.90,
    paidPrice: 0,
    images: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80'],
    recommendationLink: '',
    note: 'Escolher peça com boa capa de gordura uniforme.',
    barcode: '7891234560012',
    isFavorite: true,
    isBought: false,
    boughtAt: null,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-2',
    listId: 'list-1',
    name: 'Cerveja IPA Artesanal',
    description: 'Lata 473ml cerveja tipo IPA.',
    category: 'Bebidas',
    quantity: 12,
    unit: 'un',
    brand: 'Lagunitas',
    estimatedPrice: 12.50,
    paidPrice: 0,
    images: ['https://images.unsplash.com/photo-1532634922-8fe0b757fb13?w=500&q=80'],
    recommendationLink: 'https://supermercado.com/cerveja-ipa',
    note: 'Gelar logo ao chegar.',
    barcode: '7891234560029',
    isFavorite: false,
    isBought: false,
    boughtAt: null,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-3',
    listId: 'list-1',
    name: 'Carvão Vegetal Eucalipto',
    description: 'Saco de carvão grande de 5kg.',
    category: 'Outros',
    quantity: 2,
    unit: 'un',
    brand: 'Tio Chico',
    estimatedPrice: 22.00,
    paidPrice: 21.50,
    images: [],
    recommendationLink: '',
    note: 'Comprar do saco que não esteja rasgado.',
    barcode: '7891234560036',
    isFavorite: true,
    isBought: true,
    boughtAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-4',
    listId: 'list-2',
    name: 'Arroz Integral Tipo 1',
    description: 'Pacote de arroz integral 1kg.',
    category: 'Alimentação',
    quantity: 3,
    unit: 'un',
    brand: 'Tio João',
    estimatedPrice: 7.90,
    paidPrice: 0,
    images: [],
    recommendationLink: '',
    note: '',
    barcode: '7891234560043',
    isFavorite: true,
    isBought: false,
    boughtAt: null,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-5',
    listId: 'list-2',
    name: 'Azeite de Oliva Extra Virgem',
    description: 'Garrafa de vidro 500ml, acidez menor que 0.5%.',
    category: 'Alimentação',
    quantity: 1,
    unit: 'un',
    brand: 'Andorinha',
    estimatedPrice: 38.90,
    paidPrice: 39.90,
    images: [],
    recommendationLink: '',
    note: 'Pegar o mais recente de fabricação.',
    barcode: '7891234560050',
    isFavorite: true,
    isBought: true,
    boughtAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-6',
    listId: 'list-2',
    name: 'Sabão em Pó Multiação',
    description: 'Caixa de sabão em pó 1.6kg.',
    category: 'Limpeza',
    quantity: 2,
    unit: 'un',
    brand: 'Omo',
    estimatedPrice: 24.90,
    paidPrice: 0,
    images: [],
    recommendationLink: '',
    note: 'Levar o refil se estiver mais barato.',
    barcode: '7891234560067',
    isFavorite: false,
    isBought: false,
    boughtAt: null,
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_CONFIG: AppConfig = {
  language: 'pt-BR',
  theme: 'light',
  currency: 'BRL',
  defaultUnit: 'un',
  autoBackup: true
};

export const INITIAL_USER: UserProfile = {
  id: 'user-default',
  name: 'Alison Vitório',
  email: 'alisonvitoriomedal@gmail.com',
  photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80',
  provider: 'google',
  createdAt: new Date('2026-01-01').toISOString()
};
