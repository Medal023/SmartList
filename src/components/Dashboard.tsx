/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from './AppContext';
import { ShoppingList, Product } from '../types';
import { 
  ListTodo, 
  ShoppingCart, 
  Heart, 
  DollarSign, 
  ArrowRight, 
  TrendingUp, 
  ShoppingBag, 
  Sparkles, 
  HeartHandshake, 
  Layers,
  CheckCircle,
  Plus,
  Flame,
  Wine,
  Apple as AppleIcon,
  Home as HomeIcon,
  HelpCircle,
  TrendingDown
} from 'lucide-react';
import { motion } from 'motion/react';

// Dynamic icon mapper helper
export const IconComponent: React.FC<{ name: string; className?: string; size?: number }> = ({ name, className = '', size = 20 }) => {
  const icons: Record<string, any> = {
    ListTodo,
    ShoppingCart,
    Heart,
    DollarSign,
    ShoppingBag,
    Sparkles,
    Wine,
    Apple: AppleIcon,
    Home: HomeIcon,
    Layers,
    Flame,
    HeartHandshake,
  };
  const Comp = icons[name] || HelpCircle;
  return <Comp className={className} size={size} />;
};

export const Dashboard: React.FC = () => {
  const { lists, products, setView, config, user } = useApp();

  // Active lists (active state)
  const activeLists = lists.filter(l => l.status === 'active');
  const archivedLists = lists.filter(l => l.status === 'archived');
  const completedLists = lists.filter(l => l.status === 'completed');

  // Stats calculators
  const totalListsCount = lists.length;
  const totalProductsCount = products.length;
  const favoritesCount = products.filter(p => p.isFavorite).length;
  const boughtCount = products.filter(p => p.isBought).length;

  // Currencies formatting helper
  const formatValue = (val: number) => {
    const symbol = config.currency === 'BRL' ? 'R$' : config.currency === 'USD' ? 'U$' : '€';
    return `${symbol} ${val.toFixed(2)}`;
  };

  // Calculate estimated vs paid totals
  const totalEstimated = products.reduce((acc, p) => acc + (p.estimatedPrice * p.quantity), 0);
  const totalPaid = products.reduce((acc, p) => acc + (p.isBought ? (p.paidPrice || p.estimatedPrice) * p.quantity : 0), 0);

  // Category distribution calculation
  const categoryMap: Record<string, { count: number; value: number }> = {};
  products.forEach(p => {
    const cat = p.category || 'Outros';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { count: 0, value: 0 };
    }
    categoryMap[cat].count += 1;
    categoryMap[cat].value += (p.estimatedPrice * p.quantity);
  });

  const categoriesStats = Object.keys(categoryMap).map(name => ({
    name,
    count: categoryMap[name].count,
    value: categoryMap[name].value
  })).sort((a, b) => b.value - a.value);

  // Progress of list purchases helper
  const getListProgress = (listId: string) => {
    const listProducts = products.filter(p => p.listId === listId);
    if (listProducts.length === 0) return { percent: 0, bought: 0, total: 0 };
    const bought = listProducts.filter(p => p.isBought).length;
    return {
      percent: Math.round((bought / listProducts.length) * 100),
      bought,
      total: listProducts.length
    };
  };

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Welcome Banner - Styled as a premium Bento Container */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-slate-800/80 shadow-sm">
        <div>
          <h1 id="welcome-title" className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Olá, {user?.name ? user.name.split(' ')[0] : 'Alison'}! 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            Seja bem-vindo ao SmartList. Veja o resumo inteligente das suas compras hoje.
          </p>
        </div>
        <button
          id="quick-add-list-btn"
          onClick={() => setView('lists')}
          className="flex items-center gap-2 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black font-semibold text-sm px-5 py-3 rounded-2xl shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus size={16} strokeWidth={2.5} />
          Nova Lista
        </button>
      </div>

      {/* Numerical Stats Grid - Sleek Bento Cells */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-black dark:text-white">
            <ListTodo size={20} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Listas Ativas</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 tracking-tight">{activeLists.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-black dark:text-white">
            <ShoppingCart size={20} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Produtos</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 tracking-tight">{totalProductsCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-black dark:text-white">
            <Heart size={20} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Favoritos</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 tracking-tight">{favoritesCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-black dark:text-white">
            <CheckCircle size={20} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Comprados</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 tracking-tight">{boughtCount}/{totalProductsCount}</p>
          </div>
        </div>
      </div>

      {/* Financial Analytics and Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Budget comparison card - Premium Black Bento Box */}
        <div className="bg-black text-white dark:bg-slate-900 border border-neutral-900 dark:border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <DollarSign size={20} className="text-emerald-400" strokeWidth={2.5} />
              Resumo Financeiro
            </h2>
            <p className="text-xs text-neutral-400 dark:text-slate-400 mt-1.5">Comparativo do orçamento estimado contra o valor já pago.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-neutral-900/80 dark:bg-slate-950/60 border border-neutral-800 dark:border-slate-850">
              <span className="text-xs text-neutral-400 dark:text-slate-400 block font-medium">Total Estimado</span>
              <span className="text-xl font-extrabold text-white mt-1 block">
                {formatValue(totalEstimated)}
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-1.5 font-bold uppercase tracking-wider">
                <TrendingUp size={10} strokeWidth={2.5} /> Planejado
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-950/20 dark:bg-emerald-950/10 border border-emerald-900/30 dark:border-emerald-900/10">
              <span className="text-xs text-emerald-400 block font-medium">Total Pago</span>
              <span className="text-xl font-extrabold text-emerald-400 mt-1 block">
                {formatValue(totalPaid)}
              </span>
              <span className="text-[10px] text-neutral-400 dark:text-slate-400 flex items-center gap-0.5 mt-1.5 font-bold uppercase tracking-wider">
                Economia: {formatValue(Math.max(0, totalEstimated - totalPaid))}
              </span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs text-neutral-400 dark:text-slate-400 mb-2 font-medium">
              <span>Progresso Realizado</span>
              <span className="font-bold text-white">{totalEstimated > 0 ? Math.round((totalPaid / totalEstimated) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-neutral-800 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${totalEstimated > 0 ? Math.min(100, (totalPaid / totalEstimated) * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Category breakdown card - Classic White Bento Box */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 p-6 md:p-8 rounded-3xl shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers size={20} className="text-blue-500" strokeWidth={2.5} />
              Categorias Mais Caras
            </h2>
            <p className="text-xs text-slate-400 mt-1.5">Sua despesa dividida entre as categorias mais expressivas.</p>
          </div>

          <div className="space-y-4">
            {categoriesStats.length > 0 ? (
              categoriesStats.slice(0, 4).map((cat, i) => {
                const percentageOfTotal = totalEstimated > 0 ? Math.round((cat.value / totalEstimated) * 100) : 0;
                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{cat.name}</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{formatValue(cat.value)} <span className="text-[10px] font-semibold text-slate-400">({percentageOfTotal}%)</span></span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          i === 0 ? 'bg-black dark:bg-white' : i === 1 ? 'bg-blue-500' : i === 2 ? 'bg-indigo-500' : 'bg-slate-400'
                        }`}
                        style={{ width: `${percentageOfTotal}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center h-28 text-slate-400 text-xs">
                Nenhum item adicionado para exibir estatísticas.
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between font-bold pt-3 border-t border-gray-100 dark:border-slate-800/40 uppercase tracking-wider">
            <span>Mais Barato: Hortifruti</span>
            <span>Mais Caro: Alimentação</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Lists and Favorites */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Lists (Span 2) */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 p-6 md:p-8 rounded-3xl shadow-sm lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ListTodo size={20} className="text-emerald-500" strokeWidth={2.5} />
              Últimas Listas
            </h2>
            <button 
              onClick={() => setView('lists')}
              className="text-xs text-black dark:text-white hover:opacity-85 font-bold flex items-center gap-1 cursor-pointer transition-opacity"
            >
              Ver todas <ArrowRight size={14} strokeWidth={2.5} />
            </button>
          </div>

          <div className="space-y-4">
            {activeLists.length > 0 ? (
              activeLists.slice(0, 3).map((list) => {
                const progress = getListProgress(list.id);
                return (
                  <div 
                    key={list.id} 
                    onClick={() => setView('lists', list.id)}
                    className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-slate-800/60 hover:border-black/10 dark:hover:border-slate-700 hover:bg-[#F8F9FA]/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-3 rounded-2xl text-white flex items-center justify-center shadow-sm" 
                        style={{ backgroundColor: list.color }}
                      >
                        <IconComponent name={list.icon} size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 group-hover:text-black dark:group-hover:text-white transition-colors">
                          {list.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{list.description || 'Sem descrição'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 min-w-[140px] justify-between sm:justify-end">
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-300">
                          {progress.bought}/{progress.total} itens
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold">Progresso</p>
                      </div>

                      <div className="w-16 sm:w-20 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-black dark:bg-white h-full rounded-full transition-all duration-300"
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-center space-y-2">
                <ListTodo size={24} className="text-slate-300" />
                <p className="text-xs text-slate-500">Nenhuma lista ativa pendente.</p>
                <button
                  onClick={() => setView('lists')}
                  className="text-xs text-black dark:text-white font-bold hover:underline cursor-pointer"
                >
                  Criar minha primeira lista
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Popular favorites / recommendations info box (Span 1) - Gradient Bento Grid Card */}
        <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 border-0 text-white p-6 md:p-8 rounded-3xl shadow-lg flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 text-white">
              <Heart size={20} className="text-pink-300" strokeWidth={2.5} fill="currentColor" />
              Atalhos Rápidos
            </h2>
            <p className="text-xs text-indigo-100 mt-1.5">Acesso direto às ferramentas exclusivas do SmartList.</p>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => setView('favorites')}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-left transition-all cursor-pointer text-white"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10 text-white">
                  <Heart size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs font-bold">Meus Favoritos</p>
                  <p className="text-[10px] text-indigo-100 font-medium">Adicione com 1 clique</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-indigo-200" strokeWidth={2.5} />
            </button>

            <button 
              onClick={() => setView('history')}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-left transition-all cursor-pointer text-white"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10 text-white">
                  <TrendingUp size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs font-bold">Histórico & Logs</p>
                  <p className="text-[10px] text-indigo-100 font-medium">Restaurar excluídos</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-indigo-200" strokeWidth={2.5} />
            </button>

            <button 
              onClick={() => setView('settings')}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-left transition-all cursor-pointer text-white"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10 text-white">
                  <Sparkles size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs font-bold">Configurações</p>
                  <p className="text-[10px] text-indigo-100 font-medium">Moeda, idioma & backup</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-indigo-200" strokeWidth={2.5} />
            </button>
          </div>

          <div className="p-4 bg-white/10 border border-white/10 rounded-2xl text-left">
            <h4 className="text-xs font-bold text-pink-300">Plano Pro Ativo! 🎉</h4>
            <p className="text-[10px] text-indigo-100 mt-1 leading-relaxed">Você está usufruindo de listas ilimitadas, IA generativa de sugestão e leitura OCR de recibos.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
