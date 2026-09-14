import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  ArrowUpRight, 
  Barcode, 
  Trash2, 
  Plus,
  Building2,
  Calendar,
  Sparkles,
  Download
} from 'lucide-react';
import { LoteEstoque, Medicamento } from '../types';
import { getExpiryBadgeInfo, getExpiryTier, getDaysUntilExpiration, formatDatePtBr } from '../utils/pharmacyUtils';

interface ValidityDashboardProps {
  lots: LoteEstoque[];
  medicaments: Medicamento[];
  onOpenDispenseForLote: (loteId: string) => void;
  onOpenScanModal: () => void;
  onDisposeLote: (loteId: string) => void;
  onExportExecutivePDF?: () => void;
}

export const ValidityDashboard: React.FC<ValidityDashboardProps> = ({
  lots,
  medicaments,
  onOpenDispenseForLote,
  onOpenScanModal,
  onDisposeLote,
  onExportExecutivePDF
}) => {
  const [filterTier, setFilterTier] = useState<'ALL' | 'CRITICAL_AND_EXPIRED' | 'WARNING' | 'SAFE'>('ALL');

  // Grouping metrics
  const expiredLots = lots.filter(l => getExpiryTier(l.dataValidade) === 'EXPIRED');
  const criticalLots = lots.filter(l => getExpiryTier(l.dataValidade) === 'CRITICAL');
  const warningLots = lots.filter(l => getExpiryTier(l.dataValidade) === 'WARNING');
  const safeLots = lots.filter(l => getExpiryTier(l.dataValidade) === 'SAFE');

  const filteredLots = lots.filter(l => {
    const tier = getExpiryTier(l.dataValidade);
    if (filterTier === 'CRITICAL_AND_EXPIRED') return tier === 'EXPIRED' || tier === 'CRITICAL';
    if (filterTier === 'WARNING') return tier === 'WARNING';
    if (filterTier === 'SAFE') return tier === 'SAFE';
    return true;
  }).sort((a, b) => new Date(a.dataValidade).getTime() - new Date(b.dataValidade).getTime());

  const totalUnitsInStock = lots.reduce((acc, l) => acc + l.quantidadeAtual, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Thermometer Metrics */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Flame className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Termômetro de Vencimentos & Controle FEFO
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Organização por prioridade de saída (First Expired, First Out) para prevenir perdas hospitalares.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onExportExecutivePDF && (
              <button
                onClick={onExportExecutivePDF}
                className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-extrabold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all border border-slate-700 dark:border-slate-300"
                title="Gerar e Baixar Relatório Executivo em PDF"
              >
                <Download className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                <span>PDF Executivo</span>
              </button>
            )}
            <button
              onClick={onOpenScanModal}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Entrada por Foto (IA)</span>
            </button>
          </div>
        </div>

        {/* Thermometer Visual Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          {/* Card Vencidos */}
          <button
            onClick={() => setFilterTier('CRITICAL_AND_EXPIRED')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              filterTier === 'CRITICAL_AND_EXPIRED'
                ? 'bg-rose-500/15 border-rose-500 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/40'
                : 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 hover:border-rose-400'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400 mb-1">
              <span>CRÍTICO / VENCIDO</span>
              <AlertCircle className="w-4 h-4 animate-bounce" />
            </div>
            <div className="text-2xl font-black text-rose-700 dark:text-rose-300">
              {expiredLots.length + criticalLots.length} <span className="text-xs font-medium">lotes</span>
            </div>
            <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
              Vencidos ou &lt; 30 dias
            </p>
          </button>

          {/* Card Atenção */}
          <button
            onClick={() => setFilterTier('WARNING')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              filterTier === 'WARNING'
                ? 'bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/40'
                : 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">
              <span>ATENÇÃO</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-amber-700 dark:text-amber-300">
              {warningLots.length} <span className="text-xs font-medium">lotes</span>
            </div>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
              Entre 30 e 90 dias
            </p>
          </button>

          {/* Card Seguro */}
          <button
            onClick={() => setFilterTier('SAFE')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              filterTier === 'SAFE'
                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/40'
                : 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
              <span>SEGURO</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
              {safeLots.length} <span className="text-xs font-medium">lotes</span>
            </div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              Validade &gt; 90 dias
            </p>
          </button>

          {/* Card Total Unidades */}
          <button
            onClick={() => setFilterTier('ALL')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              filterTier === 'ALL'
                ? 'bg-slate-200 dark:bg-slate-800 border-slate-400 dark:border-slate-600 ring-2 ring-slate-400/40'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-400'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              <span>ESTOQUE TOTAL</span>
              <Building2 className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {totalUnitsInStock} <span className="text-xs font-medium">unid.</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
              Todos os {lots.length} lotes ativos
            </p>
          </button>

        </div>
      </div>

      {/* Filter Tabs & List Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterTier('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTier === 'ALL'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Todos ({lots.length})
          </button>
          <button
            onClick={() => setFilterTier('CRITICAL_AND_EXPIRED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTier === 'CRITICAL_AND_EXPIRED'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60'
            }`}
          >
            🔴 Críticos/Vencidos ({expiredLots.length + criticalLots.length})
          </button>
          <button
            onClick={() => setFilterTier('WARNING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTier === 'WARNING'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60'
            }`}
          >
            🟡 Atenção ({warningLots.length})
          </button>
          <button
            onClick={() => setFilterTier('SAFE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTier === 'SAFE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60'
            }`}
          >
            🟢 Seguros ({safeLots.length})
          </button>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Ordenado por Vencimento mais Próximo
        </span>
      </div>

      {/* Lot Expiration Cards Grid */}
      {filteredLots.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 text-emerald-500" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Nenhum lote registrado no controle de validade
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Fotografe a embalagem ou frasco do medicamento. O leitor OCR Gemini extrai a data de validade, o número do lote e a indicação de uso automaticamente para cadastrar no estoque.
            </p>
          </div>
          <button
            onClick={onOpenScanModal}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 inline-flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tirar Foto e Cadastrar no Estoque</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLots.map((lote) => {
          const med = medicaments.find(m => m.id === lote.medicamentoId);
          if (!med) return null;

          const daysLeft = getDaysUntilExpiration(lote.dataValidade);
          const tier = getExpiryTier(lote.dataValidade);
          const badge = getExpiryBadgeInfo(tier);

          return (
            <div
              key={lote.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border ${badge.cardBorder} shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3 relative overflow-hidden`}
            >
              {/* Corner Badge */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {med.nomeComercial}
                    </h3>
                    {med.altaVigilancia && (
                      <span className="px-1.5 py-0.5 text-[9px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded border border-amber-400/40">
                        MAV
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {med.principioAtivo} • {med.dosagem}
                  </p>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${badge.colorClass}`}>
                  {badge.label}
                </span>
              </div>

              {/* Countdown / Days left indicator */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Data de Validade</span>
                    <strong className="text-slate-900 dark:text-white text-xs font-mono">{formatDatePtBr(lote.dataValidade)}</strong>
                  </div>
                </div>

                <div className="text-right">
                  {daysLeft < 0 ? (
                    <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400 block">
                      VENCIDO HÁ {Math.abs(daysLeft)} DIAS
                    </span>
                  ) : (
                    <span className={`text-xs font-extrabold block ${
                      daysLeft <= 30 ? 'text-rose-600 dark:text-rose-400' : (daysLeft <= 90 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400')
                    }`}>
                      Vence em {daysLeft} dias
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 font-mono block">Lote: {lote.lote}</span>
                </div>
              </div>

              {/* Shelf location & stock count */}
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 pt-1">
                <div>
                  <span className="text-slate-400 text-[10px] block">Localização</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{lote.localizacaoPrateleira}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] block">Saldo Atual</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">{lote.quantidadeAtual} un</span>
                </div>
              </div>

              {/* Therapeutic Description */}
              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-2">
                {med.paraQueServe}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {tier === 'EXPIRED' ? (
                  <button
                    onClick={() => onDisposeLote(lote.id)}
                    className="w-full py-2 px-3 rounded-xl bg-rose-100 dark:bg-rose-950/80 hover:bg-rose-200 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Recolher p/ Quarentena</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onOpenDispenseForLote(lote.id)}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Barcode className="w-4 h-4" />
                    <span>Dispensar FEFO para Paciente</span>
                  </button>
                )}
              </div>

            </div>
          );
        })}
        </div>
      )}

    </div>
  );
};
