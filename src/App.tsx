/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './components/AppContext';
import { Dashboard } from './components/Dashboard';
import { ListDetails } from './components/ListDetails';
import { FavoritesView } from './components/FavoritesView';
import { HistoryLogView } from './components/HistoryLogView';
import { SettingsView } from './components/SettingsView';
import { SuperAdminView } from './components/SuperAdminView';
import { 
  LayoutDashboard, 
  ListTodo, 
  Heart, 
  History, 
  Settings, 
  Cloud, 
  CloudOff, 
  RefreshCw,
  Menu,
  X,
  User,
  ShoppingBag,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { AuthView } from './components/AuthView';

const AppShell: React.FC = () => {
  const { 
    currentView, 
    setView, 
    syncStatus, 
    user, 
    config, 
    triggerSync, 
    isLoadingAuth, 
    isEmailVerified 
  } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'lists' as const, label: 'Minhas Listas', icon: ListTodo },
    { id: 'favorites' as const, label: 'Favoritos', icon: Heart },
    { id: 'history' as const, label: 'Histórico', icon: History },
    { id: 'settings' as const, label: 'Configurações', icon: Settings },
    ...(user?.role === 'super_admin' ? [{ id: 'super_admin' as const, label: 'Super Admin Panel', icon: ShieldCheck }] : []),
  ];

  const handleNavClick = (view: 'dashboard' | 'lists' | 'favorites' | 'history' | 'settings' | 'super_admin') => {
    setView(view, null); // Clear selected list when clicking main navigation
    setMobileMenuOpen(false);
  };

  if (isLoadingAuth) {
    return (
      <div className={config.theme === 'dark' ? 'dark' : ''}>
        <div className="min-h-screen bg-[#F8F9FA] dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 bg-black dark:bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <ShoppingBag size={24} className="text-white dark:text-black animate-pulse" />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <RefreshCw size={14} className="animate-spin text-emerald-500" />
            Carregando SmartList...
          </div>
        </div>
      </div>
    );
  }

  if (!user || (!isEmailVerified && user.provider === 'email')) {
    return (
      <div className={config.theme === 'dark' ? 'dark' : ''}>
        <AuthView />
      </div>
    );
  }

  return (
    <div className={config.theme === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen bg-[#F8F9FA] dark:bg-slate-950 text-[#1A1A1A] dark:text-slate-100 transition-colors duration-200 flex flex-col font-sans">
        
        {/* Top Navbar / Header Bar */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800/80 px-6 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center">
              <ShoppingBag size={20} className="text-white dark:text-black" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-slate-100">
                SmartList
              </span>
              <span className="text-[10px] text-emerald-600 font-bold ml-1.5 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">PRO</span>
            </div>
          </div>

          {/* Sync status and User display */}
          <div className="flex items-center gap-4">
            {/* Sync Cloud Widget */}
            <div 
              onClick={() => triggerSync()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-full border border-gray-100 dark:border-slate-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-all text-xs font-semibold"
            >
              {syncStatus === 'synced' ? (
                <>
                  <Cloud size={14} className="text-emerald-500 animate-pulse" />
                  <span className="text-emerald-600 dark:text-emerald-400 text-[10px] hidden sm:inline font-bold">Nuvem Sincronizada</span>
                </>
              ) : syncStatus === 'syncing' ? (
                <>
                  <RefreshCw size={14} className="text-blue-500 animate-spin" />
                  <span className="text-blue-600 text-[10px] hidden sm:inline font-bold">Fazendo Backup...</span>
                </>
              ) : (
                <>
                  <CloudOff size={14} className="text-amber-500" />
                  <span className="text-amber-600 text-[10px] hidden sm:inline font-bold">Modo Offline</span>
                </>
              )}
            </div>

            {/* Profile Avatar Quick Indicator */}
            {user && (
              <div 
                onClick={() => setView('settings')}
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-all bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-gray-100 dark:border-slate-800"
                title="Minha Conta"
              >
                {user.photoUrl ? (
                  <img src={user.photoUrl} referrerPolicy="no-referrer" alt={user.name} className="w-6 h-6 rounded-full border border-gray-100 dark:border-slate-800" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black font-extrabold flex items-center justify-center text-[10px]">
                    {user.name.charAt(0)}
                  </div>
                )}
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 hidden lg:inline max-w-[100px] truncate">{user.name}</span>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 md:hidden transition-all cursor-pointer"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </header>

        {/* Desktop Split Layout */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Bento Sidebar (Desktop View Only) */}
          <aside className="hidden md:flex flex-col justify-between w-64 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800/80 p-6 space-y-6">
            <div className="space-y-6">
              {/* Logo in sidebar */}
              <div className="flex items-center gap-3 pl-1">
                <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                  <ShoppingBag size={16} className="text-white dark:text-black" />
                </div>
                <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-slate-100">SmartList</span>
              </div>

              <div className="space-y-1">
                {navigationItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-gray-50 dark:bg-slate-800 text-black dark:text-white font-bold' 
                          : 'text-gray-500 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-gray-50/50 dark:hover:bg-slate-850'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-black dark:text-white opacity-100' : 'text-gray-400 dark:text-slate-500 opacity-80'} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Premium Block inside sidebar */}
            <div className="mt-auto">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-2xl mb-2 text-left">
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-1 tracking-wider">Plano Premium</p>
                <p className="text-sm text-blue-900 dark:text-blue-100 leading-tight">Libere listas ilimitadas e OCR inteligente.</p>
              </div>
            </div>
          </aside>

          {/* Core Content Area */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8 pb-24 md:pb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="max-w-6xl mx-auto"
              >
                {currentView === 'dashboard' && <Dashboard />}
                {currentView === 'lists' && <ListDetails />}
                {currentView === 'favorites' && <FavoritesView />}
                {currentView === 'history' && <HistoryLogView />}
                {currentView === 'settings' && <SettingsView />}
                {currentView === 'super_admin' && <SuperAdminView />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Floating Action Button */}
        <button 
          onClick={() => setView('lists', null)}
          className="fixed bottom-24 md:bottom-8 right-8 w-16 h-16 bg-black dark:bg-white text-white dark:text-black rounded-3xl shadow-2xl flex items-center justify-center hover:scale-110 transition-transform group z-40 cursor-pointer"
          title="Ver Listas / Criar Nova Lista"
        >
          <svg className="w-8 h-8 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path>
          </svg>
        </button>

        {/* Mobile Navigation Drawer Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
            >
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                onClick={e => e.stopPropagation()}
                className="absolute right-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 shadow-2xl p-6 flex flex-col justify-between"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-slate-800">
                    <span className="font-extrabold text-lg text-slate-800 dark:text-slate-200">SmartList</span>
                    <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg text-slate-400">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {navigationItems.map(item => {
                      const Icon = item.icon;
                      const isActive = currentView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                            isActive 
                              ? 'bg-gray-100 text-black dark:bg-slate-800 dark:text-white font-bold' 
                              : 'text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <Icon size={16} />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Account info inside mobile drawer */}
                {user && (
                  <div className="p-3.5 bg-gray-50 dark:bg-slate-850 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-black text-white font-bold flex items-center justify-center text-xs">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[120px]">{user.name}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{user.email}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Material Bottom Navigation Bar (Mobile View Only) */}
        <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-100 dark:border-slate-800/80 px-2 py-1.5 flex justify-around items-center z-30">
          {navigationItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
                  isActive 
                    ? 'text-black dark:text-white' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className={`p-1.5 rounded-full transition-all ${
                  isActive ? 'bg-gray-100 dark:bg-slate-800' : ''
                }`}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[9px] font-bold mt-0.5 tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
