/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useApp } from './AppContext';
import { ShoppingList, Product, Category } from '../types';
import { IconComponent } from './Dashboard';
import { ProductDetailsPopup } from './ProductDetailsPopup';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Share2, 
  FileText, 
  Sparkles, 
  ArrowLeft, 
  Check, 
  Camera, 
  Barcode, 
  ExternalLink, 
  Heart, 
  Image as ImageIcon,
  Copy,
  CheckCircle2,
  Calendar,
  Layers,
  MoreVertical,
  X,
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { getSmartSuggestions, parseReceiptOcr, fileToBase64 } from '../services/aiService';
import { parseImportTextLocal, parseImportTextAI, ParsedImportItem } from '../services/importService';

export const ListDetails: React.FC = () => {
  const { 
    lists, 
    products, 
    categories, 
    config, 
    selectedListId, 
    setView, 
    addList, 
    updateList, 
    deleteList, 
    addProduct, 
    addMultipleProducts,
    updateProduct, 
    deleteProduct, 
    toggleBought, 
    toggleFavorite 
  } = useApp();

  // Navigation and Search State
  const [listSearch, setListSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'archived'>('active');

  // Modal States
  const [showAddListModal, setShowAddListModal] = useState(false);
  const [showEditListModal, setShowEditListModal] = useState<string | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [showAiSuggestionsModal, setShowAiSuggestionsModal] = useState(false);
  const [showBarcodeScanModal, setShowBarcodeScanModal] = useState<string | null>(null);
  const [selectedProductPopupId, setSelectedProductPopupId] = useState<string | null>(null);

  // Form Fields - List
  const [listName, setListName] = useState('');
  const [listCategory, setListCategory] = useState('Alimentação');
  const [listColor, setListColor] = useState('#10B981');
  const [listIcon, setListIcon] = useState('ShoppingCart');
  const [listDescription, setListDescription] = useState('');

  // Form Fields - Product
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCategory, setProdCategory] = useState('Alimentação');
  const [prodQty, setProdQty] = useState(1);
  const [prodUnit, setProdUnit] = useState('un');
  const [prodBrand, setProdBrand] = useState('');
  const [prodEstPrice, setProdEstPrice] = useState(0);
  const [prodPaidPrice, setProdPaidPrice] = useState(0);
  const [prodRecLink, setProdRecLink] = useState('');
  const [prodNote, setProdNote] = useState('');
  const [prodBarcode, setProdBarcode] = useState('');
  const [prodImages, setProdImages] = useState<string[]>([]);

  // AI & OCR Processing states
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrUploadedImage, setOcrUploadedImage] = useState<string | null>(null);
  const [ocrExtractedProducts, setOcrExtractedProducts] = useState<any[]>([]);
  const [shareCopied, setShareCopied] = useState(false);

  // Enhanced Deletion States & Simulator
  const [listToDelete, setListToDelete] = useState<ShoppingList | null>(null);
  const [isDeletingList, setIsDeletingList] = useState(false);
  const [deleteStep, setDeleteStep] = useState<string>('');
  const [deleteSimulatedScenario, setDeleteSimulatedScenario] = useState<'success' | 'hundreds' | 'no_permission' | 'connection_error' | 'offline_sync'>('success');
  const [deleteProgress, setDeleteProgress] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Colors Palette
  const COLOR_PALETTE = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#EC4899', '#8B5CF6', '#14B8A6'];
  const ICON_PALETTE = ['ShoppingCart', 'ShoppingBag', 'Sparkles', 'Wine', 'Apple', 'Home', 'Flame', 'HeartHandshake', 'Layers'];

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Currencies formatting helper
  const formatValue = (val: number) => {
    const symbol = config.currency === 'BRL' ? 'R$' : config.currency === 'USD' ? 'U$' : '€';
    return `${symbol} ${val.toFixed(2)}`;
  };

  const activeList = lists.find(l => l.id === selectedListId);
  const activeListProducts = products.filter(p => p.listId === selectedListId);

  // List Import States
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [showImportTextModal, setShowImportTextModal] = useState(false);
  const [importTextContent, setImportTextContent] = useState('');
  const [showImportPreviewModal, setShowImportPreviewModal] = useState(false);
  const [parsedImportItems, setParsedImportItems] = useState<ParsedImportItem[]>([]);
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [importUseAi, setImportUseAi] = useState(false);
  const [duplicateResolution, setDuplicateResolution] = useState<'sum' | 'duplicate' | 'ignore'>('sum');

  const handleUpdatePreviewItem = (index: number, key: string, value: any) => {
    setParsedImportItems(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, [key]: value };
      }
      return item;
    }));
  };

  const handleDeletePreviewItem = (index: number) => {
    setParsedImportItems(prev => prev.filter((_, i) => i !== index));
  };

  // Filter lists
  const filteredLists = lists.filter(list => {
    const matchesSearch = list.name.toLowerCase().includes(listSearch.toLowerCase()) || 
                          list.category.toLowerCase().includes(listSearch.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    return list.status === activeTab && matchesSearch;
  });

  // Filter products inside current list
  const filteredProducts = activeListProducts.filter(prod => {
    const searchLower = itemSearch.toLowerCase();
    return prod.name.toLowerCase().includes(searchLower) || 
           prod.brand.toLowerCase().includes(searchLower) || 
           prod.category.toLowerCase().includes(searchLower) ||
           prod.note.toLowerCase().includes(searchLower) ||
           prod.barcode.includes(searchLower);
  });

  // Totals for active list
  const activeListEstimatedTotal = activeListProducts.reduce((sum, p) => sum + (p.estimatedPrice * p.quantity), 0);
  const activeListPaidTotal = activeListProducts.reduce((sum, p) => sum + ((p.isBought ? (p.paidPrice || p.estimatedPrice) : 0) * p.quantity), 0);

  // Auto-clear toast messages
  React.useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Cascade delete logic for Shopping List with scenario simulation
  const handleDeleteListConfirm = async () => {
    if (!listToDelete) return;

    setIsDeletingList(true);
    setDeleteProgress(0);

    const listId = listToDelete.id;
    const listName = listToDelete.name;

    try {
      if (deleteSimulatedScenario === 'no_permission') {
        // 1. SIMULATE NO PERMISSION SCENARIO
        setDeleteStep("Verificando regras de segurança do Firestore...");
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setDeleteStep("Verificando autenticação e permissões...");
        await new Promise(resolve => setTimeout(resolve, 600));

        // Create detailed debug log and throw
        const errorMsg = `FirebaseError: [Firestore]: Missing or insufficient permissions. User 'basic-user' is not authorized to write or delete the document at /users/alisonvitorio/lists/${listId}. Only owners can write/delete.`;
        console.error(errorMsg);
        
        throw new Error("Não foi possível excluir a lista. Tente novamente. (Erro de Permissão: Apenas o proprietário pode excluir esta lista)");

      } else if (deleteSimulatedScenario === 'connection_error') {
        // 2. SIMULATE CONNECTION FAILURE SCENARIO
        setDeleteStep("Conectando ao banco de dados Firestore...");
        await new Promise(resolve => setTimeout(resolve, 800));

        setDeleteStep("Estabelecendo conexão persistente com o gRPC gateway...");
        await new Promise(resolve => setTimeout(resolve, 800));

        const errorMsg = `FirebaseError: [Firestore]: Connection failed after 3 retries. Network unreachable. Offline operations queued.`;
        console.error(errorMsg);

        throw new Error("Não foi possível excluir a lista. Tente novamente. (Erro de Rede/Conexão com o Firebase)");

      } else if (deleteSimulatedScenario === 'offline_sync') {
        // 3. SIMULATE OFFLINE DELETION WITH LATER SYNC
        setDeleteStep("Dispositivo offline. Enfileirando exclusão no Cache local...");
        await new Promise(resolve => setTimeout(resolve, 800));

        setDeleteStep("Excluindo produtos localmente (Cascading Delete)...");
        await new Promise(resolve => setTimeout(resolve, 600));

        setDeleteStep("Limpeza de imagens marcadas no Cache local...");
        await new Promise(resolve => setTimeout(resolve, 600));

        // Call the deleteList function which removes from local state/localStorage
        deleteList(listId);

        setIsDeletingList(false);
        setListToDelete(null);
        setToastMessage({
          text: `Lista "${listName}" excluída localmente no modo offline. A sincronização com o Firestore ocorrerá assim que houver conexão estável.`,
          type: 'warning'
        });

      } else if (deleteSimulatedScenario === 'hundreds') {
        // 4. SIMULATE HUNDREDS OF PRODUCTS DELETION (BATCH WRITE)
        setDeleteStep("Preparando exclusão em lote (Batch Delete) para 125 itens...");
        await new Promise(resolve => setTimeout(resolve, 800));

        // Let's animate a progress bar for the batch deletion
        for (let p = 10; p <= 100; p += 15) {
          const clamped = Math.min(p, 100);
          setDeleteProgress(clamped);
          setDeleteStep(`Excluindo lote de produtos: ${clamped}% concluído (125 itens)...`);
          await new Promise(resolve => setTimeout(resolve, 250));
        }

        setDeleteStep("Processando exclusão de imagens associadas no Firebase Storage...");
        await new Promise(resolve => setTimeout(resolve, 800));

        setDeleteStep("Excluindo documento principal da lista no Firestore...");
        await new Promise(resolve => setTimeout(resolve, 600));

        // Call deleteList to perform the actual clean up in local state/localStorage
        deleteList(listId);

        setIsDeletingList(false);
        setListToDelete(null);
        setToastMessage({
          text: `Lista com 125 produtos, imagens e metadados foi excluída com sucesso do Firestore e Firebase Storage em lotes.`,
          type: 'success'
        });

      } else {
        // 5. STANDARD SUCCESS DELETION
        setDeleteStep("Verificando permissões e autenticação no Firestore...");
        await new Promise(resolve => setTimeout(resolve, 600));

        setDeleteStep("Executando exclusão em cascata: localizando produtos...");
        await new Promise(resolve => setTimeout(resolve, 600));

        setDeleteStep("Excluindo produtos pertencentes à lista...");
        await new Promise(resolve => setTimeout(resolve, 500));

        setDeleteStep("Excluindo todas as imagens vinculadas do Firebase Storage...");
        await new Promise(resolve => setTimeout(resolve, 600));

        setDeleteStep("Limpando dados temporários e cache relacionados...");
        await new Promise(resolve => setTimeout(resolve, 400));

        setDeleteStep("Excluindo documento principal da lista no Firestore...");
        await new Promise(resolve => setTimeout(resolve, 500));

        // Perform actual cascading deletion in state
        deleteList(listId);

        setIsDeletingList(false);
        setListToDelete(null);
        setToastMessage({
          text: "Lista excluída com sucesso.",
          type: 'success'
        });
      }
    } catch (error: any) {
      setIsDeletingList(false);
      setToastMessage({
        text: error.message || "Não foi possível excluir a lista. Tente novamente.",
        type: 'error'
      });
    }
  };

  // Handle Add List Submit
  const handleAddListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!listName.trim()) return;

    const newId = addList({
      name: listName,
      category: listCategory,
      color: listColor,
      icon: listIcon,
      description: listDescription,
      status: 'active'
    });

    // Reset Form
    setListName('');
    setListCategory('Alimentação');
    setListColor('#10B981');
    setListIcon('ShoppingCart');
    setListDescription('');
    setShowAddListModal(false);

    // Navigate straight to the new list details
    setView('lists', newId);
  };

  // Handle Edit List Submit
  const handleEditListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditListModal || !listName.trim()) return;

    updateList(showEditListModal, {
      name: listName,
      category: listCategory,
      color: listColor,
      icon: listIcon,
      description: listDescription,
    });

    setShowEditListModal(null);
  };

  // Open Edit List Modal
  const openEditList = (list: ShoppingList) => {
    setListName(list.name);
    setListCategory(list.category);
    setListColor(list.color);
    setListIcon(list.icon);
    setListDescription(list.description);
    setShowEditListModal(list.id);
  };

  // Handle Add Product Submit
  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !selectedListId) return;

    addProduct({
      listId: selectedListId,
      name: prodName,
      description: prodDesc,
      category: prodCategory,
      quantity: prodQty,
      unit: prodUnit,
      brand: prodBrand,
      estimatedPrice: prodEstPrice,
      paidPrice: prodPaidPrice || 0,
      images: prodImages,
      recommendationLink: prodRecLink,
      note: prodNote,
      barcode: prodBarcode,
      isFavorite: false,
      isBought: false,
      boughtAt: null
    });

    // Reset Product form
    setProdName('');
    setProdDesc('');
    setProdCategory('Alimentação');
    setProdQty(1);
    setProdUnit('un');
    setProdBrand('');
    setProdEstPrice(0);
    setProdPaidPrice(0);
    setProdRecLink('');
    setProdNote('');
    setProdBarcode('');
    setProdImages([]);
    setShowAddProductModal(false);
  };

  // Handle Edit Product Submit
  const handleEditProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditProductModal) return;

    updateProduct(showEditProductModal, {
      name: prodName,
      description: prodDesc,
      category: prodCategory,
      quantity: prodQty,
      unit: prodUnit,
      brand: prodBrand,
      estimatedPrice: prodEstPrice,
      paidPrice: prodPaidPrice,
      recommendationLink: prodRecLink,
      note: prodNote,
      barcode: prodBarcode,
      images: prodImages
    });

    setShowEditProductModal(null);
  };

  // Open Edit Product Modal
  const openEditProduct = (prod: Product) => {
    setProdName(prod.name);
    setProdDesc(prod.description);
    setProdCategory(prod.category);
    setProdQty(prod.quantity);
    setProdUnit(prod.unit);
    setProdBrand(prod.brand);
    setProdEstPrice(prod.estimatedPrice);
    setProdPaidPrice(prod.paidPrice || prod.estimatedPrice);
    setProdRecLink(prod.recommendationLink);
    setProdNote(prod.note);
    setProdBarcode(prod.barcode);
    setProdImages(prod.images || []);
    setShowEditProductModal(prod.id);
  };

  // File uploading handler for items images
  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const base64 = await fileToBase64(files[0]);
      setProdImages(prev => [...prev, base64]);
    } catch (err) {
      console.error('Failed to convert product image to base64', err);
    }
  };

  // OCR Upload handler
  const handleOcrImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsOcrLoading(true);
    setOcrExtractedProducts([]);
    try {
      const base64 = await fileToBase64(files[0]);
      setOcrUploadedImage(base64);

      // Call API
      const parsed = await parseReceiptOcr(base64);
      setOcrExtractedProducts(parsed);
    } catch (err) {
      console.error('OCR Parsing failed', err);
    } finally {
      setIsOcrLoading(false);
    }
  };

  // Insert scanned OCR items directly into active list
  const handleImportOcrProducts = () => {
    if (!selectedListId || ocrExtractedProducts.length === 0) return;

    ocrExtractedProducts.forEach(item => {
      addProduct({
        listId: selectedListId,
        name: item.name,
        description: item.note || 'Extraído via OCR Nota Fiscal',
        category: item.category || 'Alimentação',
        quantity: item.quantity || 1,
        unit: item.unit || 'un',
        brand: item.brand || '',
        estimatedPrice: item.paidPrice || 0,
        paidPrice: item.paidPrice || 0,
        images: [],
        recommendationLink: '',
        note: item.note || '',
        barcode: '',
        isFavorite: false,
        isBought: true, // Imported from a receipt, meaning it was bought
        boughtAt: new Date().toISOString()
      });
    });

    setOcrUploadedImage(null);
    setOcrExtractedProducts([]);
    setShowOcrModal(false);
  };

  // Trigger Gemini smart suggestions based on current context
  const triggerAiSuggestions = async () => {
    if (!activeList) return;
    setIsAiLoading(true);
    setAiSuggestions([]);
    setShowAiSuggestionsModal(true);

    try {
      const existingNames = activeListProducts.map(p => p.name);
      const suggestions = await getSmartSuggestions({
        listName: activeList.name,
        listCategory: activeList.category,
        existingProducts: existingNames
      });
      setAiSuggestions(suggestions);
    } catch (err) {
      console.error('AI Suggestions generation failed', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Add individual suggestion item
  const handleAddAiSuggestion = (item: any) => {
    if (!selectedListId) return;

    addProduct({
      listId: selectedListId,
      name: item.name,
      description: item.description || '',
      category: item.category || activeList?.category || 'Alimentação',
      quantity: item.quantity || 1,
      unit: item.unit || 'un',
      brand: item.brand || '',
      estimatedPrice: item.estimatedPrice || 0,
      paidPrice: 0,
      images: [],
      recommendationLink: '',
      note: item.note || '',
      barcode: '',
      isFavorite: false,
      isBought: false,
      boughtAt: null
    });

    // Remove from temporary modal list
    setAiSuggestions(prev => prev.filter(s => s.name !== item.name));
  };

  // Add all AI items instantly
  const handleAddAllSuggestions = () => {
    if (!selectedListId) return;

    aiSuggestions.forEach(item => {
      addProduct({
        listId: selectedListId,
        name: item.name,
        description: item.description || '',
        category: item.category || activeList?.category || 'Alimentação',
        quantity: item.quantity || 1,
        unit: item.unit || 'un',
        brand: item.brand || '',
        estimatedPrice: item.estimatedPrice || 0,
        paidPrice: 0,
        images: [],
        recommendationLink: '',
        note: item.note || '',
        barcode: '',
        isFavorite: false,
        isBought: false,
        boughtAt: null
      });
    });

    setAiSuggestions([]);
    setShowAiSuggestionsModal(false);
  };

  // Barcode mock scanning simulator
  const handleSimulatedBarcodeScan = (barcodeValue: string) => {
    if (!showBarcodeScanModal) return;
    updateProduct(showBarcodeScanModal, { barcode: barcodeValue });
    setShowBarcodeScanModal(null);
  };

  // Multi-platform format sharing copy text generator
  const getShareableText = () => {
    if (!activeList) return '';
    const dateStr = new Date(activeList.updatedAt).toLocaleDateString('pt-BR');
    
    let text = `🛒 *SmartList: ${activeList.name}*\n`;
    text += `📅 Data: ${dateStr} | Categoria: ${activeList.category}\n`;
    if (activeList.description) text += `📝 _${activeList.description}_\n`;
    text += `------------------------------------\n\n`;

    filteredProducts.forEach((p, idx) => {
      const statusSymbol = p.isBought ? '✅' : '⬜';
      const brandStr = p.brand ? ` (${p.brand})` : '';
      const priceStr = p.estimatedPrice > 0 ? ` - Est: ${formatValue(p.estimatedPrice * p.quantity)}` : '';
      text += `${statusSymbol} *${p.quantity} ${p.unit}* x ${p.name}${brandStr}${priceStr}\n`;
      if (p.note) text += `   _Nota: ${p.note}_\n`;
    });

    text += `\n------------------------------------\n`;
    text += `💰 *Total Estimado das Compras:* ${formatValue(activeListEstimatedTotal)}\n`;
    text += `💵 *Total Pago até agora:* ${formatValue(activeListPaidTotal)}\n\n`;
    text += `Gerado no aplicativo oficial *SmartList* 🚀`;

    return text;
  };

  const handleCopyToClipboard = () => {
    const text = getShareableText();
    navigator.clipboard.writeText(text);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. RENDER LIST OF ALL LISTS SCREEN IF NO ACTIVE SELECTED LIST */}
      {!selectedListId ? (
        <div className="space-y-6">
          {/* Header - Styled as a Premium Bento Box */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-slate-800/80 shadow-sm">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <Layers className="text-emerald-500" size={24} />
                Minhas Listas de Compras
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
                Gerencie, visualize e compartilhe suas listas cadastradas de forma inteligente.
              </p>
            </div>
            <button
              onClick={() => setShowAddListModal(true)}
              className="flex items-center gap-2 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black font-semibold text-sm px-5 py-3 rounded-2xl shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus size={16} strokeWidth={2.5} />
              Criar Lista
            </button>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-1 rounded-2xl w-full md:w-auto shadow-sm">
              {(['active', 'completed', 'archived', 'all'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl capitalize transition-all cursor-pointer flex-1 md:flex-none ${
                    activeTab === tab 
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm' 
                      : 'text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {tab === 'active' ? 'Ativas' : tab === 'completed' ? 'Concluídas' : tab === 'archived' ? 'Arquivadas' : 'Todas'}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Pesquisar listas..."
                value={listSearch}
                onChange={e => setListSearch(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 text-slate-700 dark:text-slate-200 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* List Cards Grid */}
          {filteredLists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLists.map(list => {
                const listProductsCount = products.filter(p => p.listId === list.id).length;
                const listBoughtCount = products.filter(p => p.listId === list.id && p.isBought).length;
                const percent = listProductsCount > 0 ? Math.round((listBoughtCount / listProductsCount) * 100) : 0;

                return (
                  <div
                    key={list.id}
                    className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer flex flex-col justify-between h-56 group relative"
                    onClick={() => setView('lists', list.id)}
                  >
                    <div>
                      {/* Top Action Bars */}
                      <div className="flex justify-between items-start">
                        <div 
                          className="p-3 rounded-2xl text-white shadow-sm flex items-center justify-center animate-fade-in"
                          style={{ backgroundColor: list.color }}
                        >
                          <IconComponent name={list.icon} size={20} />
                        </div>

                        {/* Dropdown Options or Fast Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={() => openEditList(list)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                            title="Editar Lista"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => setListToDelete(list)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                            title="Deletar Lista"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-4 group-hover:text-black dark:group-hover:text-white transition-colors line-clamp-1 tracking-tight">
                        {list.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-semibold mt-1 line-clamp-2">
                        {list.description || 'Nenhuma descrição inserida.'}
                      </p>
                    </div>

                    {/* Progress Bar & Footer */}
                    <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-slate-800/40">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <span>{listBoughtCount}/{listProductsCount} comprados</span>
                        <span>{percent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-black dark:bg-white h-full rounded-full transition-all duration-300" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800 text-center p-6 space-y-3 shadow-sm">
              <Search size={36} className="text-slate-300" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhuma lista encontrada</h3>
              <p className="text-xs text-slate-400 max-w-xs font-semibold">Tente ajustar seus termos de pesquisa ou crie uma nova lista agora mesmo!</p>
              <button
                onClick={() => setShowAddListModal(true)}
                className="bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Criar lista de compras
              </button>
            </div>
          )}
        </div>
      ) : (
        /* 2. ACTIVE VIEW DETAILS OF THE CURRENT LIST */
        <div className="space-y-6">
          {/* Active Navigation Back Bar - Bento Grid header style */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setView('lists', null)}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 transition-all cursor-pointer border border-gray-100 dark:border-slate-800/80"
              >
                <ArrowLeft size={18} strokeWidth={2.5} />
              </button>
              <div>
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-3.5 h-3.5 rounded-full shadow-inner animate-pulse" 
                    style={{ backgroundColor: activeList?.color }}
                  />
                  <h1 className="text-xl font-extrabold text-slate-950 dark:text-slate-100 tracking-tight">
                    {activeList?.name}
                  </h1>
                </div>
                <p className="text-xs text-slate-400 font-semibold mt-1 line-clamp-1">{activeList?.description || 'Lista de compras ativa'}</p>
              </div>
            </div>

            {/* Quick action triggers */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={triggerAiSuggestions}
                className="flex items-center gap-1.5 bg-gradient-to-r from-purple-650 to-indigo-650 hover:from-purple-550 hover:to-indigo-555 text-white font-extrabold text-xs px-4 py-3 rounded-2xl shadow-sm transition-all cursor-pointer flex-1 sm:flex-none justify-center hover:scale-[1.01]"
              >
                <Sparkles size={14} />
                Sugestões IA
              </button>
              <button
                onClick={() => setShowOcrModal(true)}
                className="flex items-center gap-1.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black font-extrabold text-xs px-4 py-3 rounded-2xl shadow-sm transition-all cursor-pointer flex-1 sm:flex-none justify-center hover:scale-[1.01]"
              >
                <Camera size={14} />
                Escanear Nota
              </button>
              <button
                onClick={() => setShowImportMenu(true)}
                className="flex items-center gap-1.5 bg-emerald-650 hover:bg-emerald-555 text-white font-extrabold text-xs px-4 py-3 rounded-2xl shadow-sm transition-all cursor-pointer flex-1 sm:flex-none justify-center hover:scale-[1.01]"
              >
                <span className="text-sm">📥</span>
                Importar Lista
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 border border-gray-100 dark:border-slate-800 transition-all cursor-pointer"
                title="Compartilhar Lista"
              >
                <Share2 size={16} />
              </button>
              <button
                onClick={() => activeList && openEditList(activeList)}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 border border-gray-100 dark:border-slate-800 transition-all cursor-pointer"
                title="Editar Lista"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => activeList && setListToDelete(activeList)}
                className="p-3 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100/40 dark:border-red-900/40 transition-all cursor-pointer"
                title="Excluir Lista de Compras"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Numerical overview & filters inside selected list */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Sub financial block - Premium Bento style */}
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-3xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Total Estimado</span>
                <span className="text-base font-black text-slate-955 dark:text-slate-100 block mt-1">{formatValue(activeListEstimatedTotal)}</span>
              </div>
              <div className="w-1.5 h-10 bg-slate-100 dark:bg-slate-800 rounded-full" />
              <div>
                <span className="text-[10px] text-emerald-600 block font-bold uppercase tracking-wider">Total Pago</span>
                <span className="text-base font-black text-emerald-600 block mt-1">{formatValue(activeListPaidTotal)}</span>
              </div>
            </div>

            {/* Local items search and add button */}
            <div className="md:col-span-2 flex gap-3 w-full">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Filtrar por nome, marca ou código de barras..."
                  value={itemSearch}
                  onChange={e => setItemSearch(e.target.value)}
                  className="w-full h-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 text-slate-700 dark:text-slate-200 transition-all shadow-sm"
                />
              </div>
              <button
                onClick={() => setShowAddProductModal(true)}
                className="flex items-center gap-1.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black font-extrabold text-xs px-5 rounded-2xl shadow-sm transition-all cursor-pointer whitespace-nowrap hover:scale-[1.01]"
              >
                <Plus size={15} strokeWidth={2.5} />
                Item
              </button>
            </div>
          </div>

          {/* Shopping list checklist items */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-5 bg-slate-50/50 dark:bg-slate-800/20 border-b border-gray-100 dark:border-slate-800/85 flex justify-between items-center">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Produtos Cadastrados ({filteredProducts.length})</h2>
              <span className="text-xs font-bold text-slate-450">{activeListProducts.filter(p => p.isBought).length}/{activeListProducts.length} Concluídos</span>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-slate-800/80">
                {filteredProducts.map(prod => (
                  <div 
                    key={prod.id} 
                    className={`flex items-center justify-between gap-4 p-5 hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-all ${
                      prod.isBought ? 'bg-slate-50/20 dark:bg-slate-900/10' : ''
                    }`}
                  >
                    {/* Checkbox and core product layout */}
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <button 
                        onClick={() => toggleBought(prod.id)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                          prod.isBought 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500'
                        }`}
                      >
                        {prod.isBought && <Check size={12} strokeWidth={3} />}
                      </button>

                      {/* Attached photo thumbnail if existing */}
                      {prod.images && prod.images.length > 0 && (
                        <div 
                          onClick={() => setSelectedProductPopupId(prod.id)}
                          className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 flex-shrink-0 bg-slate-50 cursor-pointer hover:opacity-95 active:scale-95 transition-all"
                        >
                          <img src={prod.images[0]} referrerPolicy="no-referrer" alt={prod.name} className="w-full h-full object-cover" />
                        </div>
                      )}

                      {/* Info lines */}
                      <div 
                        onClick={() => setSelectedProductPopupId(prod.id)}
                        className="min-w-0 flex-1 cursor-pointer group/item select-none"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`text-sm font-bold text-slate-800 dark:text-slate-200 group-hover/item:text-emerald-600 transition-colors truncate ${
                            prod.isBought ? 'line-through text-slate-400 dark:text-slate-500' : ''
                          }`}>
                            {prod.name}
                          </h4>
                          {prod.brand && (
                            <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-md">
                              {prod.brand}
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded-md">
                            {prod.quantity} {prod.unit}
                          </span>
                        </div>
                        
                        {/* Note & pricing */}
                        <div className="flex items-center gap-3 flex-wrap mt-1">
                          {prod.note && <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1">_Obs: {prod.note}_</p>}
                          <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                            Est: {formatValue(prod.estimatedPrice * prod.quantity)}
                            {prod.isBought && prod.paidPrice > 0 && (
                              <span className="text-emerald-600 font-bold">
                                (Pago: {formatValue(prod.paidPrice * prod.quantity)})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick item option rails */}
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => toggleFavorite(prod.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          prod.isFavorite 
                            ? 'text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-950/20' 
                            : 'text-slate-300 hover:text-pink-500 dark:text-slate-600 hover:bg-slate-50'
                        }`}
                        title="Adicionar aos Favoritos"
                      >
                        <Heart size={14} fill={prod.isFavorite ? 'currentColor' : 'none'} />
                      </button>
                      <button 
                        onClick={() => openEditProduct(prod)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Editar Produto"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => deleteProduct(prod.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Excluir Produto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center p-6 space-y-3">
                <Search size={36} className="text-slate-300" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhum produto cadastrado</h3>
                <p className="text-xs text-slate-400 max-w-xs">Sua lista está vazia. Adicione produtos manualmente, utilize a inteligência artificial para receber recomendações ou escaneie um recibo físico!</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddProductModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    Adicionar produto
                  </button>
                  <button
                    onClick={triggerAiSuggestions}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles size={12} /> Sugerir com IA
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== DIALOGS & MODALS ==================== */}

      {/* A. ADD LIST MODAL */}
      {showAddListModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 shadow-2xl p-6 relative overflow-hidden">
            <button 
              onClick={() => setShowAddListModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={18} />
            </button>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Plus size={18} className="text-emerald-500" />
              Criar Nova Lista
            </h2>
            <p className="text-xs text-slate-400 mt-1">Configure o nome, cor, ícone e objetivos da sua nova lista.</p>

            <form onSubmit={handleAddListSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Nome da Lista</label>
                <input
                  type="text"
                  placeholder="Ex: Almoço de Domingo, Feira Semanal"
                  value={listName}
                  onChange={e => setListName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Categoria</label>
                  <select
                    value={listCategory}
                    onChange={e => setListCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Ícone</label>
                  <select
                    value={listIcon}
                    onChange={e => setListIcon(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200"
                  >
                    {ICON_PALETTE.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-2">Cor de Identificação</label>
                <div className="flex gap-2.5 flex-wrap">
                  {COLOR_PALETTE.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setListColor(color)}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                        listColor === color ? 'scale-110 shadow-md ring-2 ring-emerald-500/20' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {listColor === color && <Check size={12} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Descrição (Opcional)</label>
                <textarea
                  placeholder="Escreva anotações importantes para esta lista..."
                  value={listDescription}
                  onChange={e => setListDescription(e.target.value)}
                  className="w-full h-16 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddListModal(false)}
                  className="px-4 py-2 bg-slate-55 dark:bg-slate-800 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-300 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Criar Lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. EDIT LIST MODAL */}
      {showEditListModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 shadow-2xl p-6 relative">
            <button 
              onClick={() => setShowEditListModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={18} />
            </button>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Editar Lista</h2>
            <form onSubmit={handleEditListSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Nome da Lista</label>
                <input
                  type="text"
                  value={listName}
                  onChange={e => setListName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Categoria</label>
                  <select
                    value={listCategory}
                    onChange={e => setListCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Ícone</label>
                  <select
                    value={listIcon}
                    onChange={e => setListIcon(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200"
                  >
                    {ICON_PALETTE.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-2">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_PALETTE.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setListColor(color)}
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Descrição</label>
                <textarea
                  value={listDescription}
                  onChange={e => setListDescription(e.target.value)}
                  className="w-full h-16 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditListModal(null)}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-500 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* C. ADD PRODUCT MODAL */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-100 dark:border-slate-800 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowAddProductModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={18} />
            </button>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Plus size={18} className="text-emerald-500" />
              Adicionar Produto à Lista
            </h2>

            <form onSubmit={handleAddProductSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Nome do Produto *</label>
                  <input
                    type="text"
                    placeholder="Ex: Leite Integral"
                    value={prodName}
                    onChange={e => setProdName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Marca / Fabricante</label>
                  <input
                    type="text"
                    placeholder="Ex: Nestlé, Omo"
                    value={prodBrand}
                    onChange={e => setProdBrand(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Quantidade</label>
                  <input
                    type="number"
                    step="any"
                    value={prodQty}
                    onChange={e => setProdQty(parseFloat(e.target.value) || 1)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200"
                    min="0.1"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Unidade</label>
                  <select
                    value={prodUnit}
                    onChange={e => setProdUnit(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200"
                  >
                    <option value="un">un (unidades)</option>
                    <option value="kg">kg (quilos)</option>
                    <option value="g">g (gramas)</option>
                    <option value="l">l (litros)</option>
                    <option value="ml">ml (mililitros)</option>
                    <option value="pacote">pacote</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Preço Est. *</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="R$ 0.00"
                    value={prodEstPrice || ''}
                    onChange={e => setProdEstPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Preço Pago</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="R$ 0.00"
                    value={prodPaidPrice || ''}
                    onChange={e => setProdPaidPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Categoria</label>
                <select
                  value={prodCategory}
                  onChange={e => setProdCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Anotações / Descrição</label>
                <textarea
                  placeholder="Ex: Pegar da prateleira do fundo para maior validade..."
                  value={prodNote}
                  onChange={e => setProdNote(e.target.value)}
                  className="w-full h-16 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200 resize-none"
                />
              </div>

              {/* Product Images base64 uploader */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-2">Imagens do Produto</label>
                <div className="flex gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-500 transition-colors cursor-pointer"
                  >
                    <Plus size={16} />
                    <span className="text-[10px] mt-0.5">Imagem</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleProductImageUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Thumbnail gallery preview */}
                  {prodImages.map((img, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-100 group">
                      <img src={img} referrerPolicy="no-referrer" className="w-full h-full object-cover" alt="Produto" />
                      <button
                        type="button"
                        onClick={() => setProdImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-500 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                >
                  Adicionar Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* D. EDIT PRODUCT MODAL */}
      {showEditProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-100 dark:border-slate-800 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowEditProductModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Editar Produto</h2>

            <form onSubmit={handleEditProductSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Nome do Produto</label>
                  <input
                    type="text"
                    value={prodName}
                    onChange={e => setProdName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Marca</label>
                  <input
                    type="text"
                    value={prodBrand}
                    onChange={e => setProdBrand(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Quantidade</label>
                  <input
                    type="number"
                    step="any"
                    value={prodQty}
                    onChange={e => setProdQty(parseFloat(e.target.value) || 1)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Unidade</label>
                  <select
                    value={prodUnit}
                    onChange={e => setProdUnit(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="un">un</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="l">l</option>
                    <option value="ml">ml</option>
                    <option value="pacote">pacote</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Preço Est.</label>
                  <input
                    type="number"
                    step="any"
                    value={prodEstPrice}
                    onChange={e => setProdEstPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Preço Pago</label>
                  <input
                    type="number"
                    step="any"
                    value={prodPaidPrice}
                    onChange={e => setProdPaidPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Categoria</label>
                <select
                  value={prodCategory}
                  onChange={e => setProdCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Anotações</label>
                <textarea
                  value={prodNote}
                  onChange={e => setProdNote(e.target.value)}
                  className="w-full h-16 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200 resize-none"
                />
              </div>

              {/* Images list upload */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-2">Imagens do Produto</label>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-14 h-14 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400"
                  >
                    <Plus size={14} />
                    <span className="text-[9px]">Inserir</span>
                  </button>
                  {prodImages.map((img, i) => (
                    <div key={i} className="relative w-14 h-14 rounded-xl overflow-hidden border">
                      <img src={img} referrerPolicy="no-referrer" className="w-full h-full object-cover" alt="Produto" />
                      <button
                        type="button"
                        onClick={() => setProdImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 hover:opacity-100"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditProductModal(null)}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-500 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* E. GEMINI IA SUGGESTIONS MODAL */}
      {showAiSuggestionsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-100 dark:border-slate-800 shadow-2xl p-6 relative overflow-hidden">
            <button 
              onClick={() => setShowAiSuggestionsModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={18} />
            </button>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sparkles size={20} className="text-purple-500 animate-pulse" />
              Recomendações Inteligentes IA
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Analisamos a lista <strong>"{activeList?.name}"</strong> e preparamos sugestões exclusivas de supermercado.
            </p>

            <div className="my-6 space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {isAiLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <div className="w-10 h-10 border-4 border-purple-500/25 border-t-purple-600 rounded-full animate-spin" />
                  <p className="text-xs text-slate-500 font-medium">Analisando tendências de compras com Inteligência Artificial...</p>
                </div>
              ) : aiSuggestions.length > 0 ? (
                aiSuggestions.map((item, index) => (
                  <div 
                    key={index}
                    className="flex justify-between items-center gap-3 p-3.5 rounded-xl border border-purple-100/50 dark:border-slate-800 hover:bg-purple-50/10 dark:hover:bg-slate-800/20 transition-all bg-gradient-to-r from-purple-50/10 to-transparent"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                        {item.brand && <span className="text-[9px] bg-purple-50 dark:bg-purple-950/30 text-purple-600 px-1.5 py-0.5 rounded-md font-bold">{item.brand}</span>}
                        <span className="text-[10px] text-slate-400">({item.quantity} {item.unit})</span>
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{item.description}</p>
                      {item.note && <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-1">💡 Dica: {item.note}</p>}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 whitespace-nowrap">{formatValue(item.estimatedPrice)}</span>
                      <button
                        onClick={() => handleAddAiSuggestion(item)}
                        className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white shadow-sm transition-all cursor-pointer"
                        title="Adicionar à Lista"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Nenhuma sugestão adicional encontrada no momento.
                </div>
              )}
            </div>

            <div className="flex justify-between gap-2 border-t border-slate-50 dark:border-slate-800/40 pt-4">
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">✨ Powered by Gemini 3.5 Flash</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAiSuggestionsModal(false)}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-500"
                >
                  Fechar
                </button>
                {aiSuggestions.length > 0 && (
                  <button
                    onClick={handleAddAllSuggestions}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                  >
                    Adicionar Todos
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* F. OCR RECEIPT MODAL */}
      {showOcrModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-100 dark:border-slate-800 shadow-2xl p-6 relative overflow-hidden">
            <button 
              onClick={() => {
                setShowOcrModal(false);
                setOcrUploadedImage(null);
                setOcrExtractedProducts([]);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={18} />
            </button>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Camera size={20} className="text-sky-500 animate-pulse" />
              Leitor de Cupom Fiscal OCR
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Envie uma foto da sua nota fiscal. A inteligência artificial irá extrair automaticamente todos os produtos, quantidades e preços pagos!
            </p>

            <div className="my-6">
              {!ocrUploadedImage ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-2 hover:border-sky-500 hover:text-sky-500 transition-all cursor-pointer bg-slate-50/50 dark:bg-slate-950/40"
                >
                  <UploadCloud size={32} className="text-slate-400" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Selecione ou Arraste a Foto da Nota</p>
                  <p className="text-[10px] text-slate-400 max-w-xs">Suporta arquivos PNG, JPG ou JPEG. Sincronização e compressão automáticas de imagem.</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleOcrImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              ) : isOcrLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3 border rounded-2xl bg-slate-50 dark:bg-slate-950/40">
                  <div className="w-10 h-10 border-4 border-sky-500/25 border-t-sky-600 rounded-full animate-spin" />
                  <p className="text-xs text-slate-500 font-medium">Extraindo itens da nota fiscal com OCR Inteligente...</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[350px] overflow-y-auto">
                  <div className="flex justify-between items-center bg-sky-50/40 dark:bg-sky-950/10 p-3 rounded-xl border border-sky-100/30">
                    <p className="text-xs font-bold text-sky-800 dark:text-sky-400">Itens Extraídos ({ocrExtractedProducts.length})</p>
                    <button 
                      onClick={() => setOcrUploadedImage(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                    >
                      Limpar Foto
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {ocrExtractedProducts.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2.5">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
                            {p.brand && <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1 rounded text-slate-400">{p.brand}</span>}
                          </div>
                          <span className="text-[10px] text-slate-400">Quantidade: {p.quantity} {p.unit || 'un'}</span>
                        </div>
                        <span className="text-xs font-extrabold text-emerald-600">{formatValue(p.paidPrice)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-50 dark:border-slate-800/40">
              <button
                type="button"
                onClick={() => {
                  setShowOcrModal(false);
                  setOcrUploadedImage(null);
                  setOcrExtractedProducts([]);
                }}
                className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-500"
              >
                Cancelar
              </button>
              {ocrExtractedProducts.length > 0 && (
                <button
                  onClick={handleImportOcrProducts}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                >
                  Importar Produtos Comprados
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* G. SHARE LIST MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 shadow-2xl p-6 relative">
            <button 
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={18} />
            </button>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Share2 size={18} className="text-emerald-500" />
              Compartilhar Lista
            </h2>
            <p className="text-xs text-slate-400 mt-1">Compartilhe os itens e quantidades formatados de maneira limpa em redes sociais.</p>

            <div className="my-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl p-4 max-h-[220px] overflow-y-auto">
              <pre className="text-[10px] font-mono text-slate-600 dark:text-slate-350 whitespace-pre-wrap">
                {getShareableText()}
              </pre>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleCopyToClipboard}
                className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
              >
                {shareCopied ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Copy size={16} />}
                {shareCopied ? 'Copiado!' : 'Copiar Texto'}
              </button>

              <button
                onClick={() => {
                  const text = encodeURIComponent(getShareableText());
                  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                }}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
              >
                <Share2 size={16} />
                WhatsApp
              </button>
            </div>
            
            <div className="mt-3 text-center">
              <button 
                onClick={() => window.print()}
                className="text-[11px] font-bold text-slate-400 hover:text-emerald-600 hover:underline cursor-pointer flex items-center justify-center gap-1 mx-auto"
              >
                <FileText size={12} /> Gerar PDF / Imprimir recibo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* H. SIMULATED BARCODE SCANNER MODAL */}
      {showBarcodeScanModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm border border-slate-100 dark:border-slate-800 shadow-2xl p-6 relative">
            <button 
              onClick={() => setShowBarcodeScanModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Barcode size={18} className="text-blue-500" />
              Simular Leitor de Código de Barras
            </h2>
            <p className="text-xs text-slate-400 mt-1">Selecione um produto comum para simular a captura e preenchimento automático do código de barras.</p>

            <div className="my-5 space-y-2">
              {[
                { name: 'Coca Cola lata 350ml', code: '7894900011517' },
                { name: 'Creme Dental Sorriso 90g', code: '7891024131555' },
                { name: 'Sabão em pó Omo 1.6kg', code: '7891150030013' },
                { name: 'Azeite Extra Virgem Gallo', code: '5601115201019' },
              ].map(b => (
                <button
                  key={b.code}
                  onClick={() => handleSimulatedBarcodeScan(b.code)}
                  className="w-full p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-xs transition-all cursor-pointer flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{b.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{b.code}</p>
                  </div>
                  <Check size={14} className="text-slate-300" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Custom Deletion Modal with Sandbox Simulator */}
      {listToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md border border-slate-100 dark:border-slate-800 shadow-2xl p-6 relative overflow-hidden flex flex-col gap-5">
            {!isDeletingList && (
              <button 
                onClick={() => setListToDelete(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            )}

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Excluir Lista</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                  Tem certeza de que deseja excluir esta lista? Esta ação não poderá ser desfeita.
                </p>
              </div>
            </div>

            {/* Cascade deletion manifest */}
            {!isDeletingList && (
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850/50 space-y-2.5">
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Manifesto de Exclusão em Cascata:</span>
                <div className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">📄 Lista no Firestore:</span>
                    <span className="truncate max-w-[200px] text-slate-800 dark:text-slate-200">{listToDelete.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">📦 Itens de Produtos:</span>
                    <span>{products.filter(p => p.listId === listToDelete.id).length} itens</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">🖼️ Firebase Storage (Imagens):</span>
                    <span>{products.filter(p => p.listId === listToDelete.id && p.images?.length > 0).reduce((acc, p) => acc + p.images.length, 0)} arquivos</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">⚡ Sincronização em Nuvem:</span>
                    <span className="text-emerald-500">Firestore Rules Guarded</span>
                  </div>
                </div>
              </div>
            )}

            {/* Sandbox Developer Simulator Controls */}
            {!isDeletingList && (
              <div className="border border-dashed border-indigo-250 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-indigo-950/10 rounded-2xl p-4">
                <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                  <Sparkles size={11} />
                  🧪 Simulador de Cenários Firebase
                </span>
                
                <div className="space-y-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Escolha o Cenário para Testar:</label>
                    <select
                      value={deleteSimulatedScenario}
                      onChange={e => setDeleteSimulatedScenario(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                    >
                      <option value="success">Cenário 1: Sucesso (Exclusão Padrão)</option>
                      <option value="hundreds">Cenário 2: Lista Gigante (Exclusão em Lote 100+)</option>
                      <option value="no_permission">Cenário 3: Erro de Permissão (Security Rules)</option>
                      <option value="connection_error">Cenário 4: Falha de Conexão (Rede Offline)</option>
                      <option value="offline_sync">Cenário 5: Offline com Sincronização Posterior</option>
                    </select>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                    {deleteSimulatedScenario === 'success' && 'Simula a exclusão limpa em cascata no Firestore e do Storage com sucesso imediato.'}
                    {deleteSimulatedScenario === 'hundreds' && 'Simula a deleção de uma lista enorme em lote (Batch Delete) mostrando o progresso em tempo real.'}
                    {deleteSimulatedScenario === 'no_permission' && 'Simula o bloqueio por Regras de Segurança do Firestore, reproduzindo erro e registrando logs de erro.'}
                    {deleteSimulatedScenario === 'connection_error' && 'Simula erro de timeout ou perda de pacotes gRPC do Firebase com feedback de falha.'}
                    {deleteSimulatedScenario === 'offline_sync' && 'Deleta a lista localmente e enfileira no cache local para sincronizar com o Firestore quando houver rede.'}
                  </p>
                </div>
              </div>
            )}

            {/* Loading state indicator during active delete */}
            {isDeletingList && (
              <div className="py-6 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
                <Loader2 className="animate-spin text-red-600 dark:text-red-500" size={32} />
                <div className="space-y-1.5 w-full">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-250 uppercase tracking-wider">{deleteStep}</p>
                  
                  {deleteSimulatedScenario === 'hundreds' && (
                    <div className="w-full max-w-[240px] mx-auto bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden mt-2">
                      <div 
                        className="bg-red-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${deleteProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons with strict visual hierarchy */}
            {!isDeletingList && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setListToDelete(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-bold text-xs py-3 rounded-2xl cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteListConfirm}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-3 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] shadow-md shadow-red-600/10 border border-red-500/20 flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={13} />
                  Excluir Lista
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import Options Dropdown/Menu Modal */}
      {showImportMenu && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm border border-slate-100 dark:border-slate-800 shadow-2xl p-6 relative overflow-hidden flex flex-col gap-4">
            <button 
              onClick={() => setShowImportMenu(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={18} />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                <span className="text-xl">📥</span>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Importar Lista de Compras</h3>
                <p className="text-[11px] text-slate-400 font-semibold leading-snug">Selecione como deseja importar seus produtos de outros aplicativos.</p>
              </div>
            </div>

            <div className="space-y-2 mt-2">
              <button
                onClick={() => {
                  setShowImportMenu(false);
                  setShowImportTextModal(true);
                }}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-left cursor-pointer transition-all border border-slate-100 dark:border-slate-800/60"
              >
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm text-slate-500">
                  <FileText size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Colar texto</span>
                  <span className="text-[10px] text-slate-400 font-medium">Copie e cole do Bloco de Notas ou WhatsApp</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowImportMenu(false);
                  const txtInput = document.getElementById('txt-import-file');
                  txtInput?.click();
                }}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-left cursor-pointer transition-all border border-slate-100 dark:border-slate-800/60"
              >
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm text-slate-500">
                  <UploadCloud size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Importar de arquivo TXT</span>
                  <span className="text-[10px] text-slate-400 font-medium">Carregue um arquivo .txt com seus itens</span>
                </div>
              </button>

              <button
                disabled
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-850/50 text-left opacity-60 border border-dashed border-slate-100 dark:border-slate-800/60 cursor-not-allowed"
              >
                <div className="p-2 rounded-xl bg-white/50 dark:bg-slate-900/50 shadow-sm text-slate-400">
                  <FileSpreadsheet size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    Importar de arquivo CSV
                    <span className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase">Futuro</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Estrutura preparada para próximas atualizações</span>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowImportMenu(false)}
              className="w-full mt-2 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Hidden inputs for text/TXT uploads */}
      <input
        type="file"
        id="txt-import-file"
        accept=".txt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (event) => {
            const text = event.target?.result as string;
            setImportTextContent(text);
            setShowImportTextModal(true);
          };
          reader.readAsText(file);
          e.target.value = '';
        }}
      />

      {/* Import Text Modal */}
      {showImportTextModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg border border-slate-100 dark:border-slate-800 shadow-2xl p-6 relative overflow-hidden flex flex-col gap-4">
            <button 
              onClick={() => {
                setShowImportTextModal(false);
                setImportTextContent('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Importar Lista por Texto</h3>
                <p className="text-[11px] text-slate-400 font-semibold leading-snug">Cole o texto do Bloco de Notas ou WhatsApp para estruturar seus itens.</p>
              </div>
            </div>

            <div className="space-y-3 mt-1">
              <textarea
                value={importTextContent}
                onChange={(e) => setImportTextContent(e.target.value)}
                rows={8}
                placeholder="Exemplo:&#10;2 Arroz&#10;5x Feijão Camil&#10;1 Leite integral (comprar do desnatado)&#10;✓ Café Pilão 500g"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 resize-none font-mono"
              />

              {/* AI Parser Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/20 dark:bg-indigo-950/10 border border-dashed border-indigo-250 dark:border-indigo-900/50">
                <div className="flex items-start gap-2.5">
                  <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-extrabold text-indigo-900 dark:text-indigo-300 block">Ativar Inteligência Artificial (Gemini)</span>
                    <span className="text-[9px] text-slate-400 font-semibold leading-normal block">Corrige grafias, autodetecta categorias, marcas e estima preços reais de mercado.</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={importUseAi}
                  onChange={(e) => setImportUseAi(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 bg-gray-150 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => {
                  setShowImportTextModal(false);
                  setImportTextContent('');
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs py-3 rounded-2xl cursor-pointer transition-all"
              >
                Cancelar
              </button>
              
              <button
                onClick={async () => {
                  if (!importTextContent.trim()) {
                    setToastMessage({ text: 'Por favor, insira algum texto para importar.', type: 'warning' });
                    return;
                  }
                  setIsProcessingImport(true);
                  try {
                    let parsed: ParsedImportItem[] = [];
                    if (importUseAi) {
                      parsed = await parseImportTextAI(importTextContent);
                    } else {
                      parsed = parseImportTextLocal(importTextContent);
                    }

                    if (parsed.length === 0) {
                      setToastMessage({ text: 'Não foi possível detectar nenhum item no texto informado.', type: 'warning' });
                      setIsProcessingImport(false);
                      return;
                    }

                    setParsedImportItems(parsed);
                    setShowImportTextModal(false);
                    setShowImportPreviewModal(true);
                  } catch (err: any) {
                    setToastMessage({ text: 'Erro ao interpretar o texto. Usando o importador rápido local.', type: 'error' });
                    const parsed = parseImportTextLocal(importTextContent);
                    setParsedImportItems(parsed);
                    setShowImportTextModal(false);
                    setShowImportPreviewModal(true);
                  } finally {
                    setIsProcessingImport(false);
                  }
                }}
                disabled={isProcessingImport}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-2xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10"
              >
                {isProcessingImport ? (
                  <>
                    <Loader2 className="animate-spin" size={13} />
                    Processando...
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    Visualizar e Importar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Preview and Conflict Resolution Modal */}
      {showImportPreviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl border border-slate-100 dark:border-slate-800 shadow-2xl p-6 relative overflow-hidden flex flex-col max-h-[85vh]">
            <button 
              onClick={() => {
                setShowImportPreviewModal(false);
                setParsedImportItems([]);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/60">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                <span className="text-xl">📋</span>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Pré-visualização da Importação</h3>
                <p className="text-[11px] text-slate-400 font-semibold leading-snug">Revise, edite ou altere as regras de importação antes de adicionar à lista.</p>
              </div>
            </div>

            {/* Global Conflict Resolution Configuration */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 my-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-250 block">Caso o produto já exista na lista:</span>
                <span className="text-[10px] text-slate-400 font-semibold">Escolha a regra de resolução padrão para produtos duplicados.</span>
              </div>
              <div className="flex bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-1 rounded-xl shadow-sm self-start sm:self-auto">
                <button
                  onClick={() => setDuplicateResolution('sum')}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                    duplicateResolution === 'sum' 
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm' 
                      : 'text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  Somar Qtd
                </button>
                <button
                  onClick={() => setDuplicateResolution('duplicate')}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                    duplicateResolution === 'duplicate' 
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm' 
                      : 'text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  Duplicar
                </button>
                <button
                  onClick={() => setDuplicateResolution('ignore')}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                    duplicateResolution === 'ignore' 
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm' 
                      : 'text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  Ignorar
                </button>
              </div>
            </div>

            {/* Scrollable Preview List */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 py-1">
              {parsedImportItems.map((item, index) => {
                const isDuplicate = activeListProducts.some(
                  p => p.name.trim().toLowerCase() === item.name.trim().toLowerCase()
                );

                return (
                  <div 
                    key={index} 
                    className={`p-4 rounded-3xl border transition-all flex flex-col gap-3 relative ${
                      isDuplicate 
                        ? 'bg-amber-50/10 border-amber-200/40 dark:border-amber-950/40' 
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-850/60'
                    }`}
                  >
                    {/* Delete button */}
                    <button 
                      onClick={() => handleDeletePreviewItem(index)}
                      className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
                      title="Remover Item"
                    >
                      <Trash2 size={13} />
                    </button>

                    {/* Line 1: Name & Brand */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                      <div>
                        <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Produto</label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={e => handleUpdatePreviewItem(index, 'name', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Marca</label>
                        <input
                          type="text"
                          placeholder="Ex: Camil"
                          value={item.brand}
                          onChange={e => handleUpdatePreviewItem(index, 'brand', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Line 2: Qty, Unit, Category */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Qtd</label>
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          value={item.quantity}
                          onChange={e => handleUpdatePreviewItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Unidade</label>
                        <select
                          value={item.unit}
                          onChange={e => handleUpdatePreviewItem(index, 'unit', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl px-2 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="un">un</option>
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="l">l</option>
                          <option value="ml">ml</option>
                          <option value="pacote">pacote</option>
                          <option value="caixa">caixa</option>
                          <option value="garrafa">garrafa</option>
                          <option value="lata">lata</option>
                          <option value="pote">pote</option>
                          <option value="bandeja">bandeja</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Categoria</label>
                        <select
                          value={item.category}
                          onChange={e => handleUpdatePreviewItem(index, 'category', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl px-2 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          {categories.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Line 3: Observações e Preço Estimado */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Observações</label>
                        <input
                          type="text"
                          placeholder="Ex: preferencialmente orgânico"
                          value={item.note}
                          onChange={e => handleUpdatePreviewItem(index, 'note', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Preço Unitário Estimado (R$)</label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.estimatedPrice}
                          onChange={e => handleUpdatePreviewItem(index, 'estimatedPrice', parseFloat(e.target.value) || 0)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Conflict override buttons if duplicate */}
                    {isDuplicate && (
                      <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-dashed border-amber-300 dark:border-amber-900/40 rounded-2xl p-3 flex flex-col gap-2 mt-1">
                        <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400 text-[10px] font-bold">
                          <AlertCircle size={12} />
                          <span>Este produto já existe na sua lista. Regra individual:</span>
                        </div>
                        <div className="flex gap-2 text-[10px] font-extrabold">
                          <button
                            onClick={() => handleUpdatePreviewItem(index, 'duplicateStrategy', 'sum')}
                            className={`px-3 py-1 rounded-xl border transition-all cursor-pointer ${
                              (item.duplicateStrategy || duplicateResolution) === 'sum'
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            Somar Qtd
                          </button>
                          <button
                            onClick={() => handleUpdatePreviewItem(index, 'duplicateStrategy', 'duplicate')}
                            className={`px-3 py-1 rounded-xl border transition-all cursor-pointer ${
                              (item.duplicateStrategy || duplicateResolution) === 'duplicate'
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            Duplicar
                          </button>
                          <button
                            onClick={() => handleUpdatePreviewItem(index, 'duplicateStrategy', 'ignore')}
                            className={`px-3 py-1 rounded-xl border transition-all cursor-pointer ${
                              (item.duplicateStrategy || duplicateResolution) === 'ignore'
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            Ignorar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-4">
              <button
                onClick={() => {
                  setShowImportPreviewModal(false);
                  setParsedImportItems([]);
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs py-3 rounded-2xl cursor-pointer transition-all"
              >
                Cancelar
              </button>
              
              <button
                onClick={() => {
                  let importedCount = 0;
                  let ignoredCount = 0;
                  let duplicatedCount = 0;
                  
                  const productsToCreate: Omit<Product, 'id' | 'updatedAt'>[] = [];
                  const productsToUpdate: { id: string; updates: Partial<Product> }[] = [];

                  parsedImportItems.forEach(item => {
                    const existingProduct = activeListProducts.find(
                      p => p.name.trim().toLowerCase() === item.name.trim().toLowerCase()
                    );

                    if (existingProduct) {
                      duplicatedCount++;
                      const strategy = item.duplicateStrategy || duplicateResolution;
                      
                      if (strategy === 'ignore') {
                        ignoredCount++;
                      } else if (strategy === 'sum') {
                        const newQty = existingProduct.quantity + item.quantity;
                        productsToUpdate.push({
                          id: existingProduct.id,
                          updates: { quantity: newQty }
                        });
                        importedCount++;
                      } else {
                        // duplicate (add as new)
                        productsToCreate.push({
                          listId: selectedListId || '',
                          name: item.name,
                          category: item.category,
                          quantity: item.quantity,
                          unit: item.unit,
                          estimatedPrice: item.estimatedPrice,
                          paidPrice: 0,
                          isBought: false,
                          boughtAt: null,
                          brand: item.brand,
                          note: item.note || 'Importado por texto',
                          images: [],
                          isFavorite: false,
                          barcode: '',
                          description: '',
                          recommendationLink: ''
                        });
                        importedCount++;
                      }
                    } else {
                      // brand new item
                      productsToCreate.push({
                        listId: selectedListId || '',
                        name: item.name,
                        category: item.category,
                        quantity: item.quantity,
                        unit: item.unit,
                        estimatedPrice: item.estimatedPrice,
                        paidPrice: 0,
                        isBought: false,
                        boughtAt: null,
                        brand: item.brand,
                        note: item.note || 'Importado por texto',
                        images: [],
                        isFavorite: false,
                        barcode: '',
                        description: '',
                        recommendationLink: ''
                      });
                      importedCount++;
                    }
                  });

                  // Execute additions
                  if (productsToCreate.length > 0) {
                    addMultipleProducts(productsToCreate);
                  }

                  // Execute updates
                  productsToUpdate.forEach(upd => {
                    updateProduct(upd.id, upd.updates);
                  });

                  setShowImportPreviewModal(false);
                  setImportTextContent('');
                  setParsedImportItems([]);

                  setToastMessage({
                    text: `Lista importada com sucesso! ${importedCount} importados, ${duplicatedCount} duplicados tratados, ${ignoredCount} ignorados.`,
                    type: 'success'
                  });
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-2xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10"
              >
                <Check size={14} />
                Concluir Importação ({parsedImportItems.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification Feedback */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 px-5 py-4 rounded-3xl shadow-xl border flex items-center gap-3.5 z-50 transition-all duration-300 animate-slide-up max-w-sm ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-50/95 backdrop-blur-md dark:bg-emerald-950/90 border-emerald-200/50 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300' 
            : toastMessage.type === 'warning'
            ? 'bg-amber-50/95 backdrop-blur-md dark:bg-amber-950/90 border-amber-250/50 dark:border-amber-800/40 text-amber-800 dark:text-amber-300'
            : 'bg-red-50/95 backdrop-blur-md dark:bg-red-950/90 border-red-200/50 dark:border-red-800/40 text-red-800 dark:text-red-300'
        }`}>
          <div className={`p-1.5 rounded-xl ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
              : toastMessage.type === 'warning'
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              : 'bg-red-500/10 text-red-600 dark:text-red-400'
          }`}>
            {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          </div>
          <p className="text-xs font-bold leading-snug flex-1">{toastMessage.text}</p>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Detailed Product View Popup */}
      {selectedProductPopupId && (
        <ProductDetailsPopup 
          productId={selectedProductPopupId} 
          onClose={() => setSelectedProductPopupId(null)} 
        />
      )}
    </div>
  );
};
