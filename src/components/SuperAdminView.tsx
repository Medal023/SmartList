/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { db } from '../services/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { 
  ShieldCheck, 
  Users, 
  ShoppingBag, 
  Heart, 
  History, 
  Settings, 
  LayoutDashboard, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Filter, 
  Sparkles, 
  Send, 
  Bell, 
  ArrowRight, 
  TrendingUp, 
  Check, 
  X, 
  Star, 
  FileText, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  ChevronRight, 
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  ShoppingBag as ProductIcon,
  PieChart as PieIcon,
  Activity
} from 'lucide-react';
import { UserProfile, ShoppingList, Product, Recommendation, BroadcastMessage } from '../types';

export const SuperAdminView: React.FC = () => {
  const { user, config, lists: myLists, products: myProducts } = useApp();
  
  // Navigation inside Admin Panel
  const [adminTab, setAdminTab] = useState<'dashboard' | 'users' | 'products' | 'recommendations' | 'messages' | 'stats'>('dashboard');
  
  // Data State
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allLists, setAllLists] = useState<ShoppingList[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [broadcastMessages, setBroadcastMessages] = useState<BroadcastMessage[]>([]);
  
  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Detail Views / Popups
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userLists, setUserLists] = useState<ShoppingList[]>([]);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  
  // Recommendation Modal
  const [showRecModal, setShowRecModal] = useState(false);
  const [editingRecommendation, setEditingRecommendation] = useState<Recommendation | null>(null);
  const [recForm, setRecForm] = useState({
    name: '',
    category: 'Alimentos',
    brand: '',
    description: '',
    image: '',
    link: '',
    store: '',
    status: 'active' as 'active' | 'inactive'
  });

  // Message Modal
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageForm, setMessageForm] = useState({
    title: '',
    message: '',
    image: '',
    link: '',
    type: 'info' as 'info' | 'promotion' | 'news' | 'warning' | 'update',
    expiresAt: ''
  });

  // Fetch admin-level telemetry data on load
  useEffect(() => {
    if (!user || user.role !== 'super_admin') return;
    
    setIsLoading(true);
    setErrorMsg(null);
    
    // Set up Real-time listener for Recommendations
    const unsubRecs = onSnapshot(collection(db, 'recommendations'), (snap) => {
      const recs: Recommendation[] = [];
      snap.forEach(d => {
        recs.push({ id: d.id, ...d.data() } as Recommendation);
      });
      setRecommendations(recs);
    }, (err) => {
      console.warn("Could not load recommendations (likely permission):", err);
    });

    // Set up Real-time listener for Broadcast Messages
    const unsubMsgs = onSnapshot(collection(db, 'broadcast_messages'), (snap) => {
      const msgs: BroadcastMessage[] = [];
      snap.forEach(d => {
        msgs.push({ id: d.id, ...d.data() } as BroadcastMessage);
      });
      msgs.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      setBroadcastMessages(msgs);
    }, (err) => {
      console.warn("Could not load broadcast messages:", err);
    });

    // Fetch collections
    const fetchAdminData = async () => {
      try {
        const [usersSnap, listsSnap, productsSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'listas')),
          getDocs(collection(db, 'produtos'))
        ]);

        const fetchedUsers: UserProfile[] = [];
        usersSnap.forEach(d => {
          fetchedUsers.push({ id: d.id, ...d.data() } as UserProfile);
        });
        setAllUsers(fetchedUsers);

        const fetchedLists: ShoppingList[] = [];
        listsSnap.forEach(d => {
          fetchedLists.push({ id: d.id, ...d.data() } as ShoppingList);
        });
        setAllLists(fetchedLists);

        const fetchedProducts: Product[] = [];
        productsSnap.forEach(d => {
          fetchedProducts.push({ id: d.id, ...d.data() } as Product);
        });
        setAllProducts(fetchedProducts);

      } catch (err: any) {
        console.error("Super Admin fetch error:", err);
        setErrorMsg("Erro de permissão no Firestore ou rede offline. Configure as regras ou torne-se Admin.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();

    return () => {
      unsubRecs();
      unsubMsgs();
    };
  }, [user]);

  // Handle User Profile click
  const handleViewUser = (profile: UserProfile) => {
    setSelectedUser(profile);
    // filter user specific lists/products
    const uLists = allLists.filter(l => l.ownerId === profile.id || l.id === profile.id); // backup fallback
    const uProducts = allProducts.filter(p => p.ownerId === profile.id);
    setUserLists(uLists);
    setUserProducts(uProducts);
  };

  // Helper normalizer for Text matching
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .trim();
  };

  // Group similar user products for "Produtos Cadastrados"
  const getConsolidatedProducts = () => {
    const map: { [key: string]: { name: string; brand: string; category: string; count: number; userIds: Set<string> } } = {};
    
    allProducts.forEach(p => {
      const normName = normalizeText(p.name);
      const key = `${normName}_${normalizeText(p.brand || '')}_${normalizeText(p.category || 'Outros')}`;
      if (map[key]) {
        map[key].count += 1;
        map[key].userIds.add(p.ownerId || '');
      } else {
        map[key] = {
          name: p.name,
          brand: p.brand || '',
          category: p.category || 'Outros',
          count: 1,
          userIds: new Set([p.ownerId || ''])
        };
      }
    });

    return Object.values(map)
      .map(item => ({
        name: item.name,
        brand: item.brand,
        category: item.category,
        totalCount: item.count,
        uniqueUsers: item.userIds.size
      }))
      .sort((a, b) => b.totalCount - a.totalCount);
  };

  // Recommendation Submission
  const handleSaveRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recForm.name || !recForm.image || !recForm.link || !recForm.store) {
      setErrorMsg("Nome, Imagem, Link de Compra e Loja são obrigatórios.");
      return;
    }

    // simple url validation
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    if (!urlPattern.test(recForm.image) || !urlPattern.test(recForm.link)) {
      setErrorMsg("Por favor, forneça URLs de imagem e de link válidas.");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const now = new Date().toISOString();
      const recData = {
        ...recForm,
        createdAt: editingRecommendation ? editingRecommendation.createdAt : now,
        updatedAt: now
      };

      if (editingRecommendation) {
        await updateDoc(doc(db, 'recommendations', editingRecommendation.id), recData);
        setSuccessMsg("Recomendação atualizada com sucesso!");
      } else {
        await addDoc(collection(db, 'recommendations'), recData);
        setSuccessMsg("Recomendação cadastrada com sucesso!");
      }

      setShowRecModal(false);
      setEditingRecommendation(null);
      setRecForm({
        name: '',
        category: 'Alimentos',
        brand: '',
        description: '',
        image: '',
        link: '',
        store: '',
        status: 'active'
      });
      
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao salvar recomendação.");
    } finally {
      setIsSaving(false);
    }
  };

  // Broadcast message submission
  const handleSendBroadcastMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageForm.title || !messageForm.message) {
      setErrorMsg("Título e Mensagem são campos obrigatórios.");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const now = new Date().toISOString();
      const broadcastData = {
        ...messageForm,
        publishedAt: now,
        readBy: []
      };

      await addDoc(collection(db, 'broadcast_messages'), broadcastData);
      setSuccessMsg("Mensagem global publicada com sucesso!");
      setShowMessageModal(false);
      setMessageForm({
        title: '',
        message: '',
        image: '',
        link: '',
        type: 'info',
        expiresAt: ''
      });

      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao enviar mensagem global.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete actions
  const handleDeleteRec = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir esta recomendação?")) return;
    try {
      await deleteDoc(doc(db, 'recommendations', id));
      setSuccessMsg("Recomendação excluída.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg("Falha ao excluir.");
    }
  };

  const handleDeleteMsg = async (id: string) => {
    if (!window.confirm("Deseja realmente apagar esta mensagem global?")) return;
    try {
      await deleteDoc(doc(db, 'broadcast_messages', id));
      setSuccessMsg("Mensagem global removida.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg("Falha ao remover mensagem.");
    }
  };

  // Toggle role of current user to standard "user" easily for testing
  const toggleMyRole = async () => {
    if (!user) return;
    try {
      const newRole = user.role === 'super_admin' ? 'user' : 'super_admin';
      await updateDoc(doc(db, 'users', user.id), { role: newRole });
      window.location.reload();
    } catch (err) {
      alert("Erro ao alterar cargo. Verifique sua conexão.");
    }
  };

  // Stats / Growth computation helpers
  const getGrowthStats = () => {
    const dailyMap: { [key: string]: number } = {};
    allUsers.forEach(u => {
      if (u.createdAt) {
        const dateStr = u.createdAt.split('T')[0];
        dailyMap[dateStr] = (dailyMap[dateStr] || 0) + 1;
      }
    });
    // Convert to sorted array
    return Object.entries(dailyMap)
      .map(([date, count]) => ({ date, cadastros: count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10); // last 10 days
  };

  const getCategoryStats = () => {
    const catMap: { [key: string]: number } = {};
    allProducts.forEach(p => {
      const cat = p.category || 'Outros';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    return Object.entries(catMap).map(([name, value]) => ({ name, value }));
  };

  const filteredUsers = allUsers.filter(u => {
    const queryNorm = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(queryNorm) ||
      u.email.toLowerCase().includes(queryNorm)
    );
  });

  const consolidatedProducts = getConsolidatedProducts().filter(p => {
    const queryNorm = searchQuery.toLowerCase();
    const nameMatch = p.name.toLowerCase().includes(queryNorm) || p.brand.toLowerCase().includes(queryNorm);
    const catMatch = categoryFilter === 'All' || p.category === categoryFilter;
    return nameMatch && catMatch;
  });

  const categoriesList = Array.from(new Set(allProducts.map(p => p.category || 'Outros')));

  if (user?.role !== 'super_admin') {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-400 p-8 rounded-3xl text-center space-y-4">
        <AlertTriangle size={48} className="mx-auto text-amber-500 animate-bounce" />
        <h2 className="text-lg font-black tracking-tight">Acesso Restrito - Super Admin</h2>
        <p className="text-xs max-w-md mx-auto leading-relaxed">
          Sua conta atual ({user?.email}) possui o cargo de <strong>Usuário Padrão</strong>.
          Para habilitar a auditoria administrativa completa, você pode se auto-promover abaixo para fins de homologação.
        </p>
        <button
          onClick={toggleMyRole}
          className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer transition-all shadow-md"
        >
          Ativar Modo Super Admin nesta Conta
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Admin Panel Header Bento Box */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-slate-800/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <ShieldCheck className="text-emerald-500" size={26} />
            Painel Super Admin
            <span className="text-[9px] font-bold tracking-widest uppercase bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full">
              Homologação Ativa
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Gerencie o ecossistema, crie recomendações de compra inteligentes e publique avisos globais.
          </p>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <button
            onClick={toggleMyRole}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-all border border-gray-100 dark:border-slate-800 cursor-pointer"
          >
            Voltar para Usuário Comum
          </button>
          {adminTab === 'recommendations' && (
            <button
              onClick={() => {
                setEditingRecommendation(null);
                setRecForm({
                  name: '',
                  category: 'Alimentos',
                  brand: '',
                  description: '',
                  image: '',
                  link: '',
                  store: '',
                  status: 'active'
                });
                setShowRecModal(true);
              }}
              className="bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-transform hover:scale-[1.01]"
            >
              <Plus size={16} /> Nova Recomendação
            </button>
          )}
          {adminTab === 'messages' && (
            <button
              onClick={() => setShowMessageModal(true)}
              className="bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-transform hover:scale-[1.01]"
            >
              <Plus size={16} /> Nova Mensagem Global
            </button>
          )}
        </div>
      </div>

      {/* Success/Error Alerts */}
      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Check size={16} />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <AlertTriangle size={16} />
          {errorMsg}
        </div>
      )}

      {/* Admin Panel Sub-navigation */}
      <div className="flex gap-1 overflow-x-auto pb-1.5 scrollbar-thin border-b border-gray-100 dark:border-slate-800/80">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'users', label: `Usuários (${allUsers.length})`, icon: Users },
          { id: 'products', label: 'Produtos Cadastrados', icon: ShoppingBag },
          { id: 'recommendations', label: `Recomendações (${recommendations.length})`, icon: Sparkles },
          { id: 'messages', label: `Avisos Globais (${broadcastMessages.length})`, icon: Bell },
          { id: 'stats', label: 'Estatísticas', icon: Activity },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = adminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setAdminTab(tab.id as any);
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                isActive 
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-black font-black' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw size={24} className="text-emerald-500 animate-spin" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">Consolidando métricas e dados...</span>
        </div>
      ) : (
        <div className="animate-fade-in">
          
          {/* TAB 1: DASHBOARD */}
          {adminTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Telemetry Indicator Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm text-left">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total de Usuários</span>
                  <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{allUsers.length}</p>
                  <p className="text-[10px] text-emerald-500 font-semibold mt-1 flex items-center gap-1">
                    <TrendingUp size={10} /> +100% cloud connected
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm text-left">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Listas Criadas</span>
                  <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{allLists.length}</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">Sincronia ativa em tempo real</p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm text-left">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Itens Totais</span>
                  <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{allProducts.length}</p>
                  <p className="text-[10px] text-blue-500 font-semibold mt-1">Mapeados via catálogo inteligente</p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm text-left">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Conversão de Recomendações</span>
                  <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                    {recommendations.filter(r => r.status === 'active').length} ativas
                  </p>
                  <p className="text-[10px] text-amber-500 font-semibold mt-1 flex items-center gap-1">
                    <Sparkles size={10} /> Inteligência Artificial ligada
                  </p>
                </div>
              </div>

              {/* Graphical Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Users Growth */}
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm text-left">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Crescimento de Cadastros (Histórico)</h3>
                  <div className="flex items-end justify-between h-48 pt-4 px-2 gap-2">
                    {getGrowthStats().length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center w-full py-16">Sem histórico de cadastros suficiente.</p>
                    ) : (
                      getGrowthStats().map((d, index) => {
                        const maxVal = Math.max(...getGrowthStats().map(g => g.cadastros), 1);
                        const percentage = (d.cadastros / maxVal) * 100;
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer h-full justify-end">
                            <div className="w-full bg-slate-50 dark:bg-slate-950/60 rounded-t-lg relative flex items-end h-[120px]">
                              <div 
                                className="w-full bg-emerald-500 dark:bg-emerald-400 rounded-t-md transition-all duration-300 hover:bg-emerald-600 dark:hover:bg-emerald-500 origin-bottom" 
                                style={{ height: `${percentage}%` }}
                              />
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-black text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow">
                                {d.cadastros} user
                              </div>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">{d.date.split('-')[2]} / {d.date.split('-')[1]}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Categories Distribution */}
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm text-left">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Distribuição de Categorias</h3>
                  <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1">
                    {getCategoryStats().length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center w-full py-16">Nenhum produto cadastrado.</p>
                    ) : (
                      getCategoryStats().sort((a,b) => b.value - a.value).slice(0, 5).map((cat, i) => {
                        const maxVal = Math.max(...getCategoryStats().map(c => c.value), 1);
                        const percentage = (cat.value / maxVal) * 100;
                        const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500'];
                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                              <span className="text-slate-700 dark:text-slate-300">{cat.name}</span>
                              <span className="text-slate-400">{cat.value} itens</span>
                            </div>
                            <div className="w-full h-2 bg-slate-50 dark:bg-slate-950 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${colors[i % colors.length]} transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

              {/* Quick Products overview */}
              <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                  <ProductIcon size={16} />
                  Top Produtos Frequentes
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-slate-800 text-slate-400">
                        <th className="py-3 font-bold">PRODUTO</th>
                        <th className="py-3 font-bold">MARCA</th>
                        <th className="py-3 font-bold">CATEGORIA</th>
                        <th className="py-3 font-bold text-center">CADASTROS</th>
                        <th className="py-3 font-bold text-center">USUÁRIOS DIVERSOS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getConsolidatedProducts().slice(0, 5).map((prod, i) => (
                        <tr key={i} className="border-b border-gray-50 dark:border-slate-800/40 text-slate-700 dark:text-slate-300">
                          <td className="py-3 font-semibold">{prod.name}</td>
                          <td className="py-3 text-slate-400 font-medium">{prod.brand || 'Não informada'}</td>
                          <td className="py-3">
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {prod.category}
                            </span>
                          </td>
                          <td className="py-3 text-center font-bold text-slate-900 dark:text-slate-100">{prod.totalCount}</td>
                          <td className="py-3 text-center font-semibold text-emerald-500">{prod.uniqueUsers}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {adminTab === 'users' && (
            <div className="space-y-6">
              
              {/* Search Bar */}
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar usuários por nome, email ou ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 pl-11 pr-4 py-3 text-xs font-semibold rounded-2xl focus:outline-none focus:border-slate-400"
                />
              </div>

              {/* Users Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map(profile => {
                  const userListsCount = allLists.filter(l => l.ownerId === profile.id || l.id === profile.id).length;
                  const userProdsCount = allProducts.filter(p => p.ownerId === profile.id).length;
                  
                  return (
                    <div 
                      key={profile.id}
                      onClick={() => handleViewUser(profile)}
                      className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-3xl hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm cursor-pointer text-left flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {profile.photoUrl ? (
                          <img src={profile.photoUrl} alt={profile.name} className="w-10 h-10 rounded-full border border-gray-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-850 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center text-sm">
                            {profile.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate">{profile.name}</h4>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{profile.email}</p>
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1.5 inline-block ${
                            profile.role === 'super_admin' 
                              ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600' 
                              : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600'
                          }`}>
                            {profile.role === 'super_admin' ? 'Super Admin' : 'Usuário'}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-gray-50 dark:border-slate-850 pt-4 mt-4 grid grid-cols-2 gap-2 text-center">
                        <div className="bg-slate-50 dark:bg-slate-950/40 p-2 rounded-xl">
                          <p className="text-xs font-black text-slate-900 dark:text-slate-100">{userListsCount}</p>
                          <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Listas</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950/40 p-2 rounded-xl">
                          <p className="text-xs font-black text-slate-900 dark:text-slate-100">{userProdsCount}</p>
                          <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Produtos</p>
                        </div>
                      </div>

                      <div className="text-[9px] text-slate-400 font-medium text-right mt-3">
                        Acesso: {profile.lastLogin ? new Date(profile.lastLogin).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* User Details Modal */}
              {selectedUser && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl border border-gray-100 dark:border-slate-800 p-6 space-y-6 text-left relative shadow-2xl max-h-[90vh] overflow-y-auto">
                    
                    <button 
                      onClick={() => setSelectedUser(null)}
                      className="absolute right-5 top-5 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-400 transition-all cursor-pointer"
                    >
                      <X size={18} />
                    </button>

                    <div className="flex items-center gap-4 border-b border-gray-100 dark:border-slate-850 pb-5">
                      {selectedUser.photoUrl ? (
                        <img src={selectedUser.photoUrl} alt={selectedUser.name} className="w-12 h-12 rounded-full border border-gray-100" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center text-base">
                          {selectedUser.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-slate-100">{selectedUser.name}</h3>
                        <p className="text-xs text-slate-400 font-medium">{selectedUser.email}</p>
                        <p className="text-[9px] text-slate-500 font-medium mt-1">ID: {selectedUser.id}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl text-center">
                        <p className="text-xs text-slate-400 font-bold uppercase">Provedor</p>
                        <p className="text-xs font-black mt-1 uppercase text-slate-800 dark:text-slate-200">{selectedUser.provider}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl text-center">
                        <p className="text-xs text-slate-400 font-bold uppercase">Plano</p>
                        <p className="text-xs font-black mt-1 text-emerald-500">{selectedUser.plan || 'Free'}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl text-center">
                        <p className="text-xs text-slate-400 font-bold uppercase">Listas</p>
                        <p className="text-xs font-black mt-1 text-slate-800 dark:text-slate-200">{userLists.length}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl text-center">
                        <p className="text-xs text-slate-400 font-bold uppercase">Produtos</p>
                        <p className="text-xs font-black mt-1 text-slate-800 dark:text-slate-200">{userProducts.length}</p>
                      </div>
                    </div>

                    {/* Lists created by this user */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Listas Criadas pelo Usuário</h4>
                      {userLists.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Nenhuma lista ativa sincronizada na nuvem.</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {userLists.map(l => (
                            <div key={l.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl border border-gray-100/50 dark:border-slate-800/40 text-xs font-semibold">
                              <span className="text-slate-800 dark:text-slate-200 font-bold">{l.name}</span>
                              <span className="text-[10px] text-slate-400 uppercase font-bold">{l.category}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: REGISTERED PRODUCTS */}
          {adminTab === 'products' && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrar produtos por nome ou marca..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 pl-11 pr-4 py-3 text-xs font-semibold rounded-2xl focus:outline-none"
                  />
                </div>
                <div className="sm:w-48">
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 px-3.5 py-3 text-xs font-bold rounded-2xl text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="All">Todas Categorias</option>
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-slate-800 text-slate-400 uppercase tracking-widest text-[9px] font-bold">
                        <th className="py-3">Nome Consolidado</th>
                        <th className="py-3">Marca</th>
                        <th className="py-3">Categoria</th>
                        <th className="py-3 text-center">Frequência Total</th>
                        <th className="py-3 text-center">Usuários Únicos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consolidatedProducts.map((prod, i) => (
                        <tr key={i} className="border-b border-gray-50 dark:border-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-colors">
                          <td className="py-3.5 font-bold text-slate-900 dark:text-slate-100">{prod.name}</td>
                          <td className="py-3.5 font-medium text-slate-400">{prod.brand || '---'}</td>
                          <td className="py-3.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {prod.category}
                            </span>
                          </td>
                          <td className="py-3.5 text-center font-black text-slate-800 dark:text-slate-200">{prod.totalCount}</td>
                          <td className="py-3.5 text-center font-extrabold text-blue-500">{prod.uniqueUsers}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: RECOMMENDATIONS */}
          {adminTab === 'recommendations' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map(rec => (
                  <div key={rec.id} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="relative h-40 bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                        <img 
                          src={rec.image} 
                          referrerPolicy="no-referrer"
                          alt={rec.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as any).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400';
                          }}
                        />
                        <span className={`absolute top-3 right-3 text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                          rec.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {rec.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      
                      <div className="p-5 space-y-2 text-left">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">
                          {rec.category}
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1">{rec.name}</h4>
                        {rec.brand && <p className="text-xs text-slate-400 font-semibold">{rec.brand}</p>}
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mt-1.5 font-medium leading-relaxed">
                          {rec.description}
                        </p>
                        <div className="flex gap-2 items-center text-[10px] font-bold text-slate-400 pt-2 border-t border-gray-100 dark:border-slate-850 mt-3">
                          <span className="text-slate-600 dark:text-slate-300">Loja: {rec.store}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0 border-t border-gray-50 dark:border-slate-850/50 flex gap-2">
                      <button
                        onClick={() => {
                          setEditingRecommendation(rec);
                          setRecForm({
                            name: rec.name,
                            category: rec.category,
                            brand: rec.brand || '',
                            description: rec.description,
                            image: rec.image,
                            link: rec.link,
                            store: rec.store,
                            status: rec.status
                          });
                          setShowRecModal(true);
                        }}
                        className="flex-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold py-2.5 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center justify-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-200"
                      >
                        <Edit2 size={12} /> Editar
                      </button>
                      <button
                        onClick={() => handleDeleteRec(rec.id)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 p-2.5 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendation Form Modal */}
              {showRecModal && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <form 
                    onSubmit={handleSaveRecommendation}
                    className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg border border-gray-100 dark:border-slate-800 p-6 space-y-4 text-left shadow-2xl relative max-h-[90vh] overflow-y-auto"
                  >
                    <button 
                      type="button"
                      onClick={() => {
                        setShowRecModal(false);
                        setEditingRecommendation(null);
                      }}
                      className="absolute right-5 top-5 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
                    >
                      <X size={18} />
                    </button>

                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                      {editingRecommendation ? 'Editar Recomendação' : 'Cadastrar Nova Recomendação'}
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-400">Nome do Produto</label>
                        <input
                          type="text"
                          required
                          value={recForm.name}
                          onChange={e => setRecForm({ ...recForm, name: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold mt-1 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-400">Categoria</label>
                          <select
                            value={recForm.category}
                            onChange={e => setRecForm({ ...recForm, category: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold mt-1 focus:outline-none"
                          >
                            <option value="Alimentos">Alimentos</option>
                            <option value="Bebidas">Bebidas</option>
                            <option value="Higiene">Higiene</option>
                            <option value="Limpeza">Limpeza</option>
                            <option value="Pet Shop">Pet Shop</option>
                            <option value="Hortifruti">Hortifruti</option>
                            <option value="Açougue">Açougue</option>
                            <option value="Padaria">Padaria</option>
                            <option value="Outros">Outros</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-400">Marca (opcional)</label>
                          <input
                            type="text"
                            value={recForm.brand}
                            onChange={e => setRecForm({ ...recForm, brand: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold mt-1 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-400">Loja Parceira</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Amazon, Carrefour"
                            value={recForm.store}
                            onChange={e => setRecForm({ ...recForm, store: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold mt-1 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-400">Status</label>
                          <select
                            value={recForm.status}
                            onChange={e => setRecForm({ ...recForm, status: e.target.value as any })}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold mt-1 focus:outline-none"
                          >
                            <option value="active">Ativo (Publicado)</option>
                            <option value="inactive">Inativo (Rascunho)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-400">Imagem Ilustrativa URL (Obrigatória)</label>
                        <input
                          type="url"
                          required
                          placeholder="https://..."
                          value={recForm.image}
                          onChange={e => setRecForm({ ...recForm, image: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold mt-1 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-400">Link de Compra Direto (Obrigatório)</label>
                        <input
                          type="url"
                          required
                          placeholder="https://..."
                          value={recForm.link}
                          onChange={e => setRecForm({ ...recForm, link: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold mt-1 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-400">Descrição do Produto</label>
                        <textarea
                          rows={3}
                          value={recForm.description}
                          onChange={e => setRecForm({ ...recForm, description: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold mt-1 focus:outline-none resize-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black font-extrabold text-xs py-3 rounded-2xl cursor-pointer shadow-md mt-4 transition-all flex items-center justify-center gap-2"
                    >
                      {isSaving && <RefreshCw size={14} className="animate-spin" />}
                      {editingRecommendation ? 'Salvar Alterações' : 'Publicar Recomendação'}
                    </button>
                  </form>
                </div>
              )}

            </div>
          )}

          {/* TAB 5: BROADCAST MESSAGES */}
          {adminTab === 'messages' && (
            <div className="space-y-6">
              
              <div className="space-y-4">
                {broadcastMessages.map(msg => (
                  <div key={msg.id} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-3xl shadow-sm text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex gap-3.5 items-start">
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 rounded-2xl">
                        <Bell size={20} />
                      </div>
                      <div className="space-y-1">
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          msg.type === 'promotion' ? 'bg-amber-50 text-amber-600' :
                          msg.type === 'warning' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {msg.type}
                        </span>
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">{msg.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                          {msg.message}
                        </p>
                        <p className="text-[9px] text-slate-400">Publicado em: {new Date(msg.publishedAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteMsg(msg.id)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Remover Mensagem
                    </button>
                  </div>
                ))}
              </div>

              {/* Message Modal */}
              {showMessageModal && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <form 
                    onSubmit={handleSendBroadcastMessage}
                    className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg border border-gray-100 dark:border-slate-800 p-6 space-y-4 text-left shadow-2xl relative"
                  >
                    <button 
                      type="button"
                      onClick={() => setShowMessageModal(false)}
                      className="absolute right-5 top-5 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
                    >
                      <X size={18} />
                    </button>

                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Enviar Aviso Global</h3>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-400">Título</label>
                        <input
                          type="text"
                          required
                          value={messageForm.title}
                          onChange={e => setMessageForm({ ...messageForm, title: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold mt-1 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-400">Tipo de Mensagem</label>
                          <select
                            value={messageForm.type}
                            onChange={e => setMessageForm({ ...messageForm, type: e.target.value as any })}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold mt-1 focus:outline-none"
                          >
                            <option value="info">Informação</option>
                            <option value="promotion">Promoção</option>
                            <option value="news">Novidade</option>
                            <option value="warning">Alerta</option>
                            <option value="update">Atualização</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-400">Link Opcional</label>
                          <input
                            type="url"
                            value={messageForm.link}
                            onChange={e => setMessageForm({ ...messageForm, link: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold mt-1 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-400">Mensagem</label>
                        <textarea
                          rows={4}
                          required
                          value={messageForm.message}
                          onChange={e => setMessageForm({ ...messageForm, message: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold mt-1 focus:outline-none resize-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black font-extrabold text-xs py-3 rounded-2xl cursor-pointer shadow-md mt-4 transition-all flex items-center justify-center gap-2"
                    >
                      {isSaving && <RefreshCw size={14} className="animate-spin" />}
                      Publicar para Todos Usuários
                    </button>
                  </form>
                </div>
              )}

            </div>
          )}

          {/* TAB 6: STATISTICS */}
          {adminTab === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 mb-4 uppercase">Métricas Consolidadas</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold">Total de Listas Criadas</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{allLists.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold">Média de Itens por Lista</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {allLists.length > 0 ? (allProducts.length / allLists.length).toFixed(1) : 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold">Proporção de Itens Comprados</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-emerald-500">
                        {allProducts.length > 0 ? ((allProducts.filter(p => p.isBought).length / allProducts.length) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold">Usuários com Plano Premium</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {allUsers.filter(u => u.plan === 'Premium').length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 mb-4 uppercase">Status Operacional</h3>
                  <div className="space-y-4 text-xs font-semibold">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Banco de Dados Firestore</span>
                      <span className="text-emerald-500 font-bold flex items-center gap-1">● Conectado ({db.app.options.projectId})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Autenticação (Firebase Auth)</span>
                      <span className="text-emerald-500 font-bold flex items-center gap-1">● Online</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Regras de Segurança Firestore</span>
                      <span className="text-emerald-500 font-bold flex items-center gap-1">● Ativas (Isoladas)</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
