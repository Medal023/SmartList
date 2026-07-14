/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { useApp } from './AppContext';
import { 
  Settings, 
  User, 
  Languages, 
  DollarSign, 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  RefreshCw, 
  LogOut, 
  ShieldAlert,
  Moon,
  Sun,
  Lock,
  Scale,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { 
    config, 
    user, 
    lists,
    syncStatus, 
    updateConfig, 
    triggerSync, 
    exportData, 
    importData, 
    login, 
    logout, 
    deleteAccount, 
    resetPassword 
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Manual trigger simulation
  const handleManualSync = async () => {
    setIsSyncing(true);
    await triggerSync();
    setIsSyncing(false);
    setSuccessMsg('Sincronização em nuvem concluída com sucesso!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Export JSON file downloader
  const handleExportClick = () => {
    try {
      const dataStr = exportData();
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `smartlist_backup_${new Date().toISOString().slice(0, 10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      setSuccessMsg('Backup exportado com sucesso! Salve o arquivo .json em local seguro.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e) {
      setErrorMsg('Falha ao exportar backup.');
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  // Import JSON file reader
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        const success = importData(text);
        if (success) {
          setSuccessMsg('Backup importado e restaurado com sucesso!');
          setErrorMsg(null);
        } else {
          setErrorMsg('Arquivo de backup inválido. Por favor, envie um arquivo .json do SmartList.');
          setSuccessMsg(null);
        }
        setTimeout(() => {
          setSuccessMsg(null);
          setErrorMsg(null);
        }, 4000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header - Styled as a Premium Bento Box */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-slate-800/80 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <Settings className="text-emerald-500" size={24} />
          Configurações
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Ajuste as preferências de idioma, moedas, backups e gerencie sua conta de usuário.
        </p>
      </div>

      {/* Success/Error Alerts */}
      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      {successMsg === null && errorMsg && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-100/50 dark:border-red-900/30 text-red-800 dark:text-red-400 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <XCircle size={16} />
          {errorMsg}
        </div>
      )}

      {/* User Account Section - Bento Cell */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 p-6 md:p-8 rounded-3xl shadow-sm">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-6 flex items-center gap-2">
          <User size={16} className="text-emerald-500" />
          Perfil de Usuário (Firebase Auth)
        </h2>

        {user ? (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              {user.photoUrl ? (
                <img src={user.photoUrl} referrerPolicy="no-referrer" alt={user.name} className="w-12 h-12 rounded-full border border-gray-100" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-black dark:text-white flex items-center justify-center font-black text-base">
                  {user.name.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{user.name}</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{user.email}</p>
                <div className="flex gap-2.5 flex-wrap mt-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                    Conectado via {user.provider.toUpperCase()}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400">
                    {lists.length} {lists.length === 1 ? 'Lista de Compras' : 'Listas de Compras'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={logout}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 px-4 py-2.5 rounded-xl transition-all cursor-pointer border border-gray-100 dark:border-slate-800"
              >
                <LogOut size={14} />
                Sair
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 space-y-4">
            <p className="text-xs text-slate-400 font-semibold">Você está navegando em modo convidado localmente. Conecte sua conta para usufruir de backup avançado na nuvem.</p>
            <div className="flex gap-2.5 justify-center flex-wrap">
              <button
                onClick={() => login('google')}
                className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200 hover:scale-[1.01] transition-all"
              >
                Google Login
              </button>
              <button
                onClick={() => login('apple')}
                className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200 hover:scale-[1.01] transition-all"
              >
                Apple ID
              </button>
              <button
                onClick={() => login('email')}
                className="bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2 cursor-pointer hover:scale-[1.01] transition-all shadow-sm"
              >
                E-mail e Senha
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preferences Section - Bento Cell */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-800/40">
          <Settings size={16} className="text-emerald-500" />
          Preferências Regionais & Visual
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Language Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
              <Languages size={14} /> Idioma do Sistema
            </label>
            <select
              value={config.language}
              onChange={e => updateConfig({ language: e.target.value as any })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 px-3.5 py-3 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en">English (US)</option>
              <option value="es">Español</option>
            </select>
          </div>

          {/* Currency Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
              <DollarSign size={14} /> Moeda Padrão
            </label>
            <select
              value={config.currency}
              onChange={e => updateConfig({ currency: e.target.value as any })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 px-3.5 py-3 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="BRL">Real Brasileiro (R$)</option>
              <option value="USD">Dólar Americano ($)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </div>

          {/* Default Measurement Unit */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
              <Scale size={14} /> Unidade Padrão
            </label>
            <select
              value={config.defaultUnit}
              onChange={e => updateConfig({ defaultUnit: e.target.value as any })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 px-3.5 py-3 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="un">un (Unidade)</option>
              <option value="kg">kg (Quilo)</option>
              <option value="g">g (Grama)</option>
              <option value="l">l (Litro)</option>
              <option value="ml">ml (Mililitro)</option>
              <option value="pacote">pacote</option>
            </select>
          </div>

          {/* Color theme mode */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
              <Moon size={14} /> Tema Visual
            </label>
            <div className="flex bg-slate-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl p-1 gap-1">
              <button
                onClick={() => updateConfig({ theme: 'light' })}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-extrabold rounded-lg cursor-pointer ${
                  config.theme === 'light' 
                    ? 'bg-white text-black shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Sun size={12} /> Claro
              </button>
              <button
                onClick={() => updateConfig({ theme: 'dark' })}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-extrabold rounded-lg cursor-pointer ${
                  config.theme === 'dark' 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Moon size={12} /> Escuro
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Backup & Sincronizacao - Bento Cell */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-2 pb-2 border-b border-gray-100 dark:border-slate-800/40">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
            <Database size={16} className="text-emerald-500" />
            Backup Automático na Nuvem
          </h2>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
            syncStatus === 'synced' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
          }`}>
            {syncStatus === 'synced' ? 'Sincronizado' : 'Offline'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-xs text-slate-800 dark:text-slate-100 font-bold">Ativar Sincronização Inteligente</p>
            <p className="text-[11px] text-slate-400 max-w-sm mt-0.5">Sincroniza automaticamente todos os dados com o Cloud Firestore ao retornar sinal de internet.</p>
          </div>

          <button
            onClick={() => updateConfig({ autoBackup: !config.autoBackup })}
            className={`w-12 h-6 rounded-full p-1 transition-all ${
              config.autoBackup ? 'bg-emerald-500 pl-7' : 'bg-slate-200 pl-1'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md" />
          </button>
        </div>

        {/* Action Button backups */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center justify-center gap-2 border border-gray-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin text-emerald-500' : ''} />
            Forçar Sincronismo
          </button>

          <button
            onClick={handleExportClick}
            className="flex items-center justify-center gap-2 border border-gray-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
          >
            <Download size={14} />
            Exportar Backup
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 border border-gray-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
          >
            <Upload size={14} />
            Importar Backup
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFileChange}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50/20 dark:bg-red-950/10 border border-red-100/50 dark:border-red-900/10 p-6 md:p-8 rounded-3xl">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
          <ShieldAlert size={16} />
          Zona de Perigo
        </h2>

        {!showDeleteConfirm ? (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-xs font-bold text-red-800 dark:text-red-400">Excluir Conta Permanentemente</p>
              <p className="text-[11px] text-red-700/80 dark:text-red-400/80 max-w-sm mt-0.5 font-semibold">Apaga todas as suas listas, histórico de compras, favoritos e dados sensíveis permanentemente do banco de dados na nuvem.</p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer"
            >
              Apagar Tudo
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-bold text-red-800 dark:text-red-400">⚠️ Tem certeza absoluta? Essa ação é IRREVERSÍVEL e apagará todos os dados locais e na nuvem!</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-slate-50 dark:bg-slate-800 text-xs font-bold px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={deleteAccount}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
              >
                Sim, Apagar Tudo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
