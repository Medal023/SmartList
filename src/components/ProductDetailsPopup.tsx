/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Edit, 
  Trash2, 
  Heart, 
  Share2, 
  Camera, 
  Check, 
  ExternalLink, 
  Barcode, 
  Layers, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  CheckCircle2, 
  Tag, 
  Package, 
  Clock, 
  ArrowUpRight,
  Maximize2,
  Bookmark,
  FileText
} from 'lucide-react';

interface ProductDetailsPopupProps {
  productId: string;
  onClose: () => void;
}

export const ProductDetailsPopup: React.FC<ProductDetailsPopupProps> = ({ productId, onClose }) => {
  const { 
    products, 
    categories, 
    config, 
    updateProduct, 
    deleteProduct, 
    toggleBought, 
    toggleFavorite 
  } = useApp();

  // Find the live product from context so updates are reflected in real-time
  const product = products.find(p => p.id === productId);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editFields, setEditFields] = useState<Partial<Product>>({});
  
  // Image gallery and Zoom
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Notifications/Alerts inside popup
  const [popupMessage, setPopupMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Keep local edit fields synchronized with the active product when not editing
  useEffect(() => {
    if (product) {
      setEditFields({
        name: product.name,
        category: product.category,
        brand: product.brand,
        quantity: product.quantity,
        unit: product.unit,
        estimatedPrice: product.estimatedPrice,
        paidPrice: product.paidPrice,
        note: product.note,
        barcode: product.barcode,
        recommendationLink: product.recommendationLink,
        images: product.images || []
      });
    }
  }, [product, isEditing]);

  if (!product) {
    return null; // Product might have been deleted
  }

  // Currencies formatting helper
  const formatValue = (val: number) => {
    const symbol = config.currency === 'BRL' ? 'R$' : config.currency === 'USD' ? 'U$' : '€';
    return `${symbol} ${val.toFixed(2)}`;
  };

  // ----------------------------------------------------
  // Statistics Calculations (Real-time historical data)
  // ----------------------------------------------------
  const sameNameProducts = products.filter(p => p.name.toLowerCase().trim() === product.name.toLowerCase().trim());
  const boughtSameProducts = sameNameProducts.filter(p => p.isBought);
  
  // 1. Quantidade comprada anteriormente (Total quantity bought previously)
  const totalBoughtQuantity = boughtSameProducts.reduce((sum, p) => sum + p.quantity, 0);

  // 2. Último preço pago (Last price paid)
  const lastPaidPrice = boughtSameProducts.length > 0 
    ? boughtSameProducts[boughtSameProducts.length - 1].paidPrice || boughtSameProducts[boughtSameProducts.length - 1].estimatedPrice
    : 0;

  // 3. Preço médio (Average price paid or estimated across all items)
  const totalPrices = sameNameProducts.map(p => p.isBought ? (p.paidPrice || p.estimatedPrice) : p.estimatedPrice);
  const averagePrice = totalPrices.length > 0 
    ? totalPrices.reduce((sum, price) => sum + price, 0) / totalPrices.length 
    : product.estimatedPrice;

  // 4. Última compra (Date of the last bought item)
  const lastBoughtItem = boughtSameProducts.find(p => p.boughtAt !== null);
  const lastBoughtDateString = lastBoughtItem?.boughtAt 
    ? new Date(lastBoughtItem.boughtAt).toLocaleDateString('pt-BR') 
    : 'Sem compras';

  // 5. Variação de preço (Price variation paid vs estimated or average)
  const currentPrice = product.isBought ? (product.paidPrice || product.estimatedPrice) : product.estimatedPrice;
  const priceVariationPercent = averagePrice > 0 
    ? ((currentPrice - averagePrice) / averagePrice) * 100 
    : 0;

  // ----------------------------------------------------
  // Actions Handlers
  // ----------------------------------------------------

  const handleToggleBought = () => {
    toggleBought(product.id);
    showNotification('info', product.isBought ? 'Produto marcado como Pendente' : 'Produto marcado como Comprado!');
  };

  const handleToggleFavorite = () => {
    toggleFavorite(product.id);
    showNotification('success', product.isFavorite ? 'Removido dos Favoritos' : 'Adicionado aos Favoritos!');
  };

  const showNotification = (type: 'success' | 'info', text: string) => {
    setPopupMessage({ type, text });
    setTimeout(() => setPopupMessage(null), 3000);
  };

  // Auto-saves fields to Firestore (simulated context)
  const handleFieldChange = (field: keyof Product, value: any) => {
    setEditFields(prev => ({ ...prev, [field]: value }));
    
    // Save automatically on change/blur to reflect immediately in real-time
    updateProduct(product.id, { [field]: value });
  };

  // Safe manual image upload (converts to base64 and stores inside Firestore-like context)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      if (typeof base64 === 'string') {
        const updatedImages = [...(product.images || []), base64];
        updateProduct(product.id, { images: updatedImages });
        setActiveImageIndex(updatedImages.length - 1);
        showNotification('success', 'Imagem enviada com sucesso!');
      }
    };
    reader.readAsText(file);
  };

  const handleShareProduct = () => {
    const text = `🛒 *SmartList - Produto Compartilhado* \n\n🔹 *${product.name}*\n🏷️ Marca: ${product.brand || 'Não especificada'}\n📂 Categoria: ${product.category}\n🔢 Quantidade: ${product.quantity} ${product.unit}\n💰 Preço Estimado: ${formatValue(product.estimatedPrice)}\n📝 Observações: ${product.note || 'Sem observações.'}\n\nEnviado através do SmartList Premium.`;
    
    navigator.clipboard.writeText(text)
      .then(() => showNotification('success', 'Informações copiadas para a área de transferência!'))
      .catch(() => showNotification('info', 'Falha ao copiar dados de compartilhamento.'));
  };

  const handleDeleteProduct = () => {
    deleteProduct(product.id);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/40 backdrop-blur-sm">
        {/* Backdrop clickable overlay */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Modal Window Container (Bottom sheet on mobile, centered card on desktop) */}
        <motion.div
          id="product-details-popup"
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-h-[92vh] sm:max-h-[85vh] sm:max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10 border border-gray-100 dark:border-slate-800"
        >
          {/* Header Close Trigger */}
          <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-200/65 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Bookmark size={10} />
                Detalhes do Item
              </span>
              {product.isFavorite && (
                <span className="text-[9px] font-extrabold uppercase tracking-wider bg-pink-50 dark:bg-pink-950/20 text-pink-500 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  ★ Favorito
                </span>
              )}
            </div>
            
            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>

          {/* Scrolling Content Panel */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* Notification alert */}
            <AnimatePresence>
              {popupMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                    popupMessage.type === 'success' 
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-100/30' 
                      : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-400 border border-indigo-100/30'
                  }`}
                >
                  <CheckCircle2 size={15} />
                  {popupMessage.text}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Top Showcase: Beautiful Header Cover & Avatar Info */}
            <div className="flex flex-col sm:flex-row gap-5 items-stretch bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-3xl border border-gray-100 dark:border-slate-800/40">
              
              {/* Image Showcase Frame with Lazy Loading & Fallback */}
              <div className="relative w-full sm:w-44 h-44 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-gray-150 dark:border-slate-850 flex-shrink-0 flex items-center justify-center group shadow-inner">
                {product.images && product.images.length > 0 ? (
                  <>
                    <img 
                      src={product.images[activeImageIndex]} 
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      alt={product.name} 
                      className="w-full h-full object-cover transition-all duration-300 transform group-hover:scale-105" 
                    />
                    {/* View full screen action button */}
                    <button 
                      onClick={() => setZoomImage(product.images[activeImageIndex])}
                      className="absolute bottom-2.5 right-2.5 p-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white transition-all scale-90 group-hover:scale-100 cursor-pointer"
                      title="Ver Tela Cheia"
                    >
                      <Maximize2 size={12} />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-350 dark:text-slate-600 gap-2">
                    <Camera size={36} strokeWidth={1.5} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Sem Foto</span>
                  </div>
                )}
              </div>

              {/* Title & Brand Meta Area */}
              <div className="flex flex-col justify-between flex-1 min-w-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md">
                      {product.category || 'Outros'}
                    </span>
                    {product.brand && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md">
                        {product.brand}
                      </span>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <input 
                      type="text"
                      value={editFields.name || ''}
                      onChange={e => handleFieldChange('name', e.target.value)}
                      className="w-full text-lg font-bold bg-white dark:bg-slate-950 border border-gray-250 dark:border-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 text-slate-900 dark:text-white"
                    />
                  ) : (
                    <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                      {product.name}
                    </h2>
                  )}

                  <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
                    {product.description || 'Nenhuma descrição detalhada.'}
                  </p>
                </div>

                {/* Status Indicator Bar */}
                <div className="pt-4 border-t border-gray-100 dark:border-slate-800/40 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Status de Compra</span>
                  <button 
                    onClick={handleToggleBought}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:scale-[1.01] ${
                      product.isBought 
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-100/50' 
                        : 'bg-amber-50 dark:bg-amber-950/10 text-amber-700 dark:text-amber-450 border border-amber-100/50'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${product.isBought ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    {product.isBought ? 'Comprado' : 'Pendente'}
                  </button>
                </div>
              </div>
            </div>

            {/* General Info Bento Grid Cards */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <Layers size={14} /> Informações do Produto
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Quantity */}
                <div className="bg-slate-50/50 dark:bg-slate-800/20 border border-gray-100 dark:border-slate-800/50 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Package size={10} /> Quantidade
                  </span>
                  {isEditing ? (
                    <input 
                      type="number"
                      step="any"
                      value={editFields.quantity || 0}
                      onChange={e => handleFieldChange('quantity', parseFloat(e.target.value) || 0)}
                      className="mt-2 w-full text-sm font-extrabold bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg p-1 text-slate-850 dark:text-white"
                    />
                  ) : (
                    <span className="mt-2 text-sm font-black text-slate-800 dark:text-slate-100">
                      {product.quantity}
                    </span>
                  )}
                </div>

                {/* Unit */}
                <div className="bg-slate-50/50 dark:bg-slate-800/20 border border-gray-100 dark:border-slate-800/50 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Tag size={10} /> Unidade
                  </span>
                  {isEditing ? (
                    <select 
                      value={editFields.unit || 'un'}
                      onChange={e => handleFieldChange('unit', e.target.value)}
                      className="mt-2 w-full text-xs font-extrabold bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg p-1 text-slate-850 dark:text-white"
                    >
                      <option value="un">un (unidades)</option>
                      <option value="kg">kg (quilos)</option>
                      <option value="g">g (gramas)</option>
                      <option value="l">l (litros)</option>
                      <option value="ml">ml (mililitros)</option>
                      <option value="pacote">pacote</option>
                    </select>
                  ) : (
                    <span className="mt-2 text-xs font-extrabold uppercase bg-slate-100/60 dark:bg-slate-850 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 w-max">
                      {product.unit}
                    </span>
                  )}
                </div>

                {/* Estimated Price */}
                <div className="bg-slate-50/50 dark:bg-slate-800/20 border border-gray-100 dark:border-slate-800/50 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <DollarSign size={10} /> Preço Estimado
                  </span>
                  {isEditing ? (
                    <input 
                      type="number"
                      step="any"
                      value={editFields.estimatedPrice || 0}
                      onChange={e => handleFieldChange('estimatedPrice', parseFloat(e.target.value) || 0)}
                      className="mt-2 w-full text-sm font-extrabold bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg p-1 text-slate-850 dark:text-white"
                    />
                  ) : (
                    <span className="mt-2 text-sm font-black text-slate-800 dark:text-slate-100">
                      {formatValue(product.estimatedPrice)}
                    </span>
                  )}
                </div>

                {/* Paid Price */}
                <div className="bg-slate-50/50 dark:bg-slate-800/20 border border-gray-100 dark:border-slate-800/50 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                    <Check size={10} /> Preço Pago
                  </span>
                  {isEditing ? (
                    <input 
                      type="number"
                      step="any"
                      value={editFields.paidPrice || 0}
                      onChange={e => handleFieldChange('paidPrice', parseFloat(e.target.value) || 0)}
                      className="mt-2 w-full text-sm font-extrabold bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg p-1 text-slate-850 dark:text-white"
                    />
                  ) : (
                    <span className="mt-2 text-sm font-black text-emerald-600">
                      {product.paidPrice > 0 ? formatValue(product.paidPrice) : 'Pendente'}
                    </span>
                  )}
                </div>

                {/* Register/Registration Date */}
                <div className="bg-slate-50/50 dark:bg-slate-800/20 border border-gray-100 dark:border-slate-800/50 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={10} /> Cadastro
                  </span>
                  <span className="mt-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {/* fallback on a reasonable mock date or creation time */}
                    {product.boughtAt ? new Date(product.boughtAt).toLocaleDateString('pt-BR') : new Date(product.updatedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                {/* Last Update */}
                <div className="bg-slate-50/50 dark:bg-slate-800/20 border border-gray-100 dark:border-slate-800/50 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Clock size={10} /> Última Alt.
                  </span>
                  <span className="mt-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {new Date(product.updatedAt).toLocaleDateString('pt-BR')} às {new Date(product.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Barcode details card (when existing) */}
              {(product.barcode || isEditing) && (
                <div className="bg-slate-55 dark:bg-slate-950/20 border border-gray-100 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <Barcode className="text-slate-450" size={18} />
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Código de Barras EAN</span>
                      {isEditing ? (
                        <input 
                          type="text"
                          value={editFields.barcode || ''}
                          onChange={e => handleFieldChange('barcode', e.target.value)}
                          placeholder="Código de barras..."
                          className="mt-1 text-xs font-bold bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-800 rounded-lg px-2 py-0.5 text-slate-800 dark:text-white"
                        />
                      ) : (
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{product.barcode}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Observations Area */}
            <div className="space-y-2 bg-slate-50/25 dark:bg-slate-950/5 border border-gray-100 dark:border-slate-800/60 p-5 rounded-3xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <FileText size={14} /> Observações de Compra
              </h3>
              {isEditing ? (
                <textarea 
                  value={editFields.note || ''}
                  onChange={e => handleFieldChange('note', e.target.value)}
                  placeholder="Escreva observações personalizadas aqui..."
                  rows={2}
                  className="w-full mt-1.5 text-xs font-semibold bg-white dark:bg-slate-950 border border-gray-250 dark:border-slate-800 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 text-slate-800 dark:text-white"
                />
              ) : (
                <p className="text-xs font-medium text-slate-650 dark:text-slate-350 italic mt-1 leading-relaxed">
                  {product.note ? product.note : "Sem observações."}
                </p>
              )}
            </div>

            {/* Images Gallery Block */}
            {product.images && product.images.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Galeria de Imagens</h3>
                
                {/* Horizontal scrollable gallery list */}
                <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-200">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden border bg-slate-55 flex-shrink-0 transition-all cursor-pointer ${
                        activeImageIndex === idx 
                          ? 'ring-2 ring-emerald-500 border-transparent scale-95 shadow-md' 
                          : 'border-gray-150 dark:border-slate-800 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} referrerPolicy="no-referrer" alt={`Produto img-${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendation Link Card Block */}
            <div className="bg-slate-50/50 dark:bg-slate-800/10 border border-gray-100 dark:border-slate-800/40 p-5 rounded-3xl shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 mt-0.5">
                  <ExternalLink size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Link de Recomendação</h4>
                  {product.recommendationLink ? (
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Utilize o link recomendado pelo administrador para comprar este produto com segurança pela internet.</p>
                  ) : (
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Nenhum link recomendado para este produto no momento.</p>
                  )}
                </div>
              </div>

              {product.recommendationLink ? (
                <button 
                  onClick={() => window.open(product.recommendationLink, '_blank')}
                  className="w-full mt-1 flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 border border-indigo-100/35 text-indigo-700 dark:text-indigo-400 text-xs font-bold py-3 rounded-2xl cursor-pointer transition-all hover:scale-[1.01]"
                >
                  Abrir Link no Navegador
                  <ArrowUpRight size={13} strokeWidth={2.5} />
                </button>
              ) : (
                <div className="mt-1 bg-slate-100/50 dark:bg-slate-900/60 rounded-2xl p-3.5 border border-slate-200/40 dark:border-slate-800/40">
                  <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
                    💡 Os links recomendados para compras online são gerenciados pelo <strong>administrador do aplicativo</strong>. Usuários básicos não podem alterar ou inserir esses links.
                  </p>
                </div>
              )}
            </div>

            {/* Stats Block (Preparado para versões futuras) */}
            <div className="space-y-3 bg-slate-50/50 dark:bg-slate-800/10 border border-gray-100 dark:border-slate-800/40 p-5 rounded-3xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <TrendingUp size={14} /> Estatísticas de Consumo
              </h3>
              
              <div className="grid grid-cols-2 gap-3.5 pt-1.5">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Quantidade comprada</span>
                  <span className="text-sm font-black text-slate-750 dark:text-slate-200 mt-0.5 block">{totalBoughtQuantity} {product.unit}</span>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Último preço pago</span>
                  <span className="text-sm font-black text-slate-750 dark:text-slate-200 mt-0.5 block">
                    {lastPaidPrice > 0 ? formatValue(lastPaidPrice) : 'Sem registro'}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Preço médio histórico</span>
                  <span className="text-sm font-black text-slate-750 dark:text-slate-200 mt-0.5 block">{formatValue(averagePrice)}</span>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Última Compra</span>
                  <span className="text-sm font-black text-slate-750 dark:text-slate-200 mt-0.5 block">{lastBoughtDateString}</span>
                </div>
              </div>

              <div className="mt-3.5 pt-3.5 border-t border-gray-150 dark:border-slate-800/35 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Variação de Preço</span>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                  priceVariationPercent > 0 
                    ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450' 
                    : priceVariationPercent < 0 
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {priceVariationPercent > 0 ? '+' : ''}{priceVariationPercent.toFixed(1)}% vs média
                </span>
              </div>
            </div>

            {/* Delete Confirmation Overlay */}
            {showDeleteConfirm && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50/90 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 p-5 rounded-3xl space-y-3 shadow-sm"
              >
                <h4 className="text-xs font-extrabold text-red-900 dark:text-red-400 uppercase tracking-wide flex items-center gap-1.5">
                  ⚠ Confirmar Exclusão
                </h4>
                <p className="text-[11px] font-semibold text-red-850 dark:text-red-300">
                  Deseja mesmo remover "{product.name}" permanentemente? Essa ação irá excluir este item do banco de dados (Firestore) e descartar suas imagens (Storage).
                </p>
                <div className="flex gap-2 justify-end">
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleDeleteProduct}
                    className="px-4 py-2 bg-red-650 hover:bg-red-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm"
                  >
                    Confirmar Exclusão
                  </button>
                </div>
              </motion.div>
            )}

          </div>

          {/* Action Footer Buttons Drawer */}
          <div className="p-5 border-t border-gray-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/40 grid grid-cols-2 gap-2.5">
            {/* Bought Status toggle button */}
            <button 
              onClick={handleToggleBought}
              className={`w-full flex items-center justify-center gap-1.5 font-extrabold text-xs py-3.5 rounded-2xl cursor-pointer transition-all shadow-sm hover:scale-[1.01] active:scale-[0.99] ${
                product.isBought 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-150' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <CheckCircle2 size={14} />
              {product.isBought ? 'Marcar Pendente' : 'Marcar Comprado'}
            </button>

            {/* Edit toggle button */}
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`w-full flex items-center justify-center gap-1.5 font-extrabold text-xs py-3.5 rounded-2xl cursor-pointer transition-all shadow-sm hover:scale-[1.01] active:scale-[0.99] ${
                isEditing 
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
                  : 'bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black'
              }`}
            >
              <Edit size={14} />
              {isEditing ? 'Pronto (Salvar)' : 'Editar Produto'}
            </button>

            {/* Favorite button */}
            <button 
              onClick={handleToggleFavorite}
              className={`w-full flex items-center justify-center gap-1.5 font-extrabold text-xs py-3.5 rounded-2xl cursor-pointer transition-all border border-gray-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-250 hover:scale-[1.01] active:scale-[0.99]`}
            >
              <Heart size={14} className={product.isFavorite ? 'text-pink-500' : 'text-slate-400'} fill={product.isFavorite ? 'currentColor' : 'none'} />
              {product.isFavorite ? 'Favoritado' : 'Favoritar'}
            </button>

            {/* Share button */}
            <button 
              onClick={handleShareProduct}
              className="w-full flex items-center justify-center gap-1.5 font-extrabold text-xs py-3.5 rounded-2xl cursor-pointer transition-all border border-gray-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-250 hover:scale-[1.01] active:scale-[0.99]"
            >
              <Share2 size={14} />
              Compartilhar
            </button>

            {/* Photo / Add Images button */}
            <label className="w-full flex items-center justify-center gap-1.5 font-extrabold text-xs py-3.5 rounded-2xl cursor-pointer transition-all border border-gray-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-250 hover:scale-[1.01] active:scale-[0.99]">
              <Camera size={14} />
              Inserir Imagem
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="hidden" 
              />
            </label>

            {/* Delete button */}
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-1.5 font-extrabold text-xs py-3.5 rounded-2xl cursor-pointer transition-all bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 hover:bg-rose-100 dark:hover:bg-rose-950/40 hover:scale-[1.01] active:scale-[0.99]"
            >
              <Trash2 size={14} />
              Excluir Produto
            </button>
          </div>
        </motion.div>
      </div>

      {/* Full-Screen Zoom overlay for high-resolution gallery viewing */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setZoomImage(null)}
          >
            {/* Fullscreen image with transition */}
            <motion.img 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={zoomImage} 
              referrerPolicy="no-referrer"
              alt="Zoomed Product" 
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" 
            />

            {/* Close fullscreen button */}
            <button 
              onClick={() => setZoomImage(null)}
              className="absolute top-5 right-5 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};
