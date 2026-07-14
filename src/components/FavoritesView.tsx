/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from './AppContext';
import { Product } from '../types';
import { Heart, Plus, Search, Layers, CheckCircle2, ChevronDown, Trash2 } from 'lucide-react';

export const FavoritesView: React.FC = () => {
  const { products, lists, addFavoriteToList, toggleFavorite, config } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedListMap, setSelectedListMap] = useState<Record<string, string>>({}); // { productId: targetListId }
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter out duplicate favorite items by name so we have a clean template list of favorites
  const uniqueFavorites: Product[] = [];
  const seenNames = new Set<string>();

  products.forEach(p => {
    if (p.isFavorite && !seenNames.has(p.name.toLowerCase())) {
      uniqueFavorites.push(p);
      seenNames.add(p.name.toLowerCase());
    }
  });

  const activeLists = lists.filter(l => l.status === 'active');

  const filteredFavorites = uniqueFavorites.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatValue = (val: number) => {
    const symbol = config.currency === 'BRL' ? 'R$' : config.currency === 'USD' ? 'U$' : '€';
    return `${symbol} ${val.toFixed(2)}`;
  };

  const handleAddToList = (productId: string) => {
    const targetListId = selectedListMap[productId];
    if (!targetListId) return;

    addFavoriteToList(productId, targetListId);
    
    const targetList = lists.find(l => l.id === targetListId);
    const prod = products.find(p => p.id === productId);
    
    if (targetList && prod) {
      setSuccessMessage(`"${prod.name}" adicionado com sucesso à lista "${targetList.name}"!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleSelectChange = (productId: string, listId: string) => {
    setSelectedListMap(prev => ({ ...prev, [productId]: listId }));
  };

  return (
    <div className="space-y-6">
      {/* Header - Styled as a Premium Bento Box */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-slate-800/80 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <Heart className="text-pink-500 animate-pulse" fill="currentColor" size={24} />
          Produtos Favoritos
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Área exclusiva para itens salvos. Planeje compras frequentes e adicione-os às suas listas com um clique.
        </p>
      </div>

      {/* Success alert */}
      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} />
          {successMessage}
        </div>
      )}

      {/* Search Bar - Sleek Bento input */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
          <Search size={16} />
        </span>
        <input
          type="text"
          placeholder="Pesquisar nos favoritos..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 text-slate-700 dark:text-slate-200 transition-all shadow-sm"
        />
      </div>

      {/* Grid of Favorites - Styled as beautiful Bento cells */}
      {filteredFavorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFavorites.map(prod => {
            const currentSelectedList = selectedListMap[prod.id] || (activeLists[0]?.id || '');
            
            return (
              <div 
                key={prod.id}
                className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all flex flex-col justify-between h-48"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-250 tracking-tight">{prod.name}</h3>
                        {prod.brand && (
                          <span className="text-[9px] bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold px-1.5 py-0.5 rounded">
                            {prod.brand}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-semibold mt-1">{prod.category || 'Alimentação'}</p>
                    </div>

                    <button
                      onClick={() => toggleFavorite(prod.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors"
                      title="Remover dos favoritos"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <span>Base: {formatValue(prod.estimatedPrice)}</span>
                    <span>•</span>
                    <span>Unit: {prod.unit}</span>
                  </div>
                </div>

                {/* Dropdown list insert option */}
                <div className="flex gap-2.5 items-center pt-4 border-t border-gray-100 dark:border-slate-800/40">
                  {activeLists.length > 0 ? (
                    <>
                      <div className="relative flex-1">
                        <select
                          value={currentSelectedList}
                          onChange={e => handleSelectChange(prod.id, e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none appearance-none"
                        >
                          {activeLists.map(list => (
                            <option key={list.id} value={list.id}>{list.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                      </div>

                      <button
                        onClick={() => handleAddToList(prod.id)}
                        className="flex items-center gap-1 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black font-extrabold text-[11px] px-3.5 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-sm hover:scale-[1.02]"
                        title="Adicionar à lista selecionada"
                      >
                        <Plus size={12} strokeWidth={2.5} />
                        Adicionar
                      </button>
                    </>
                  ) : (
                    <p className="text-[10px] text-slate-400 font-medium">Nenhuma lista ativa para adicionar favoritos.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800 text-center p-6 space-y-3">
          <Heart size={36} className="text-slate-300" />
          <h3 className="text-sm font-bold text-slate-750 dark:text-slate-300">Nenhum favorito salvo</h3>
          <p className="text-xs text-slate-400 max-w-xs font-medium">Marque o ícone de coração nos produtos das suas listas de compras para salvá-los nesta seção!</p>
        </div>
      )}
    </div>
  );
};
