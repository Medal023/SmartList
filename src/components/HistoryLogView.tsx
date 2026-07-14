/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from './AppContext';
import { History, RotateCcw, AlertTriangle, Calendar, FileText, Trash2 } from 'lucide-react';

export const HistoryLogView: React.FC = () => {
  const { logs, restoreListState } = useApp();

  const getActionDetails = (action: string) => {
    switch (action) {
      case 'create_list':
        return { label: 'Lista Criada', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' };
      case 'delete_list':
        return { label: 'Lista Excluída', color: 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' };
      case 'update_list':
        return { label: 'Lista Atualizada', color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400' };
      case 'add_product':
        return { label: 'Produto Adicionado', color: 'bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400' };
      case 'delete_product':
        return { label: 'Produto Removido', color: 'bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400' };
      case 'update_product':
        return { label: 'Produto Editado', color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400' };
      case 'buy_product':
        return { label: 'Estado Compra', color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400' };
      case 'restore_list':
        return { label: 'Lista Restaurada', color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400' };
      default:
        return { label: 'Alteração', color: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400' };
    }
  };

  const formatTimestamp = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="space-y-6">
      {/* Header - Styled as a Premium Bento Box */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-slate-800/80 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <History className="text-emerald-500" size={24} />
          Histórico de Alterações
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Veja a trilha de auditoria completa das suas ações e restaure listas antigas ou excluídas por engano.
        </p>
      </div>

      {/* Warning Alert - Styled cleanly */}
      <div className="bg-amber-50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/20 text-amber-850 dark:text-amber-400 p-5 rounded-2xl text-xs font-semibold flex gap-3 items-start leading-relaxed">
        <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-amber-600" />
        <div>
          <p className="font-bold text-sm text-amber-900 dark:text-amber-300">Como funciona a Restauração de Listas?</p>
          <p className="mt-1 opacity-90 text-amber-800 dark:text-amber-400">O SmartList grava o snapshot completo de suas listas e produtos associados no momento da deleção. Clique no botão de restauração na linha de exclusão correspondente abaixo para recuperá-los de forma imediata.</p>
        </div>
      </div>

      {/* Timeline List - Bento Card container */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 bg-slate-50/50 dark:bg-slate-800/10 border-b border-gray-100 dark:border-slate-800/85 flex items-center gap-2">
          <Calendar size={16} className="text-slate-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Atividades Recentes ({logs.length})</h2>
        </div>

        {logs.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-slate-800/80">
            {logs.map(log => {
              const meta = getActionDetails(log.action);
              const canRestore = log.action === 'delete_list' && log.payload;

              return (
                <div key={log.id} className="flex justify-between items-center gap-4 p-5 hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-all">
                  <div className="flex gap-3 items-start">
                    <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${meta.color}`}>
                      {meta.label}
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-normal">
                        {log.details}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                        {formatTimestamp(log.timestamp)}
                      </p>
                    </div>
                  </div>

                  {canRestore && (
                    <button
                      onClick={() => restoreListState(log.id)}
                      className="flex items-center gap-1.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black font-extrabold text-[11px] px-3.5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap hover:scale-[1.02]"
                    >
                      <RotateCcw size={12} strokeWidth={2.5} />
                      Restaurar Lista
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center p-6 space-y-3">
            <History size={36} className="text-slate-300" />
            <h3 className="text-sm font-bold text-slate-750 dark:text-slate-300">Nenhuma atividade registrada</h3>
            <p className="text-xs text-slate-400 max-w-xs font-medium">Todas as suas interações de gerenciamento de compras serão registradas aqui em tempo real.</p>
          </div>
        )}
      </div>
    </div>
  );
};
