import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  ShieldAlert, 
  Plus, 
  Barcode, 
  Layers, 
  Calendar, 
  Building2,
  Info,
  CheckCircle2,
  Download
} from 'lucide-react';
import { LoteEstoque, Medicamento } from '../types';
import { getExpiryBadgeInfo, getExpiryTier, formatDatePtBr } from '../utils/pharmacyUtils';

interface StockManagementProps {
  lots: LoteEstoque[];
  medicaments: Medicamento[];
  onOpenScanModal: () => void;
  onOpenDispenseForLote: (loteId: string) => void;
  onExportExecutivePDF?: () => void;
}

export const StockManagement: React.FC<StockManagementProps> = ({
  lots,
  medicaments,
  onOpenScanModal,
  onOpenDispenseForLote,
  onExportExecutivePDF
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = Array.from(new Set(medicaments.map(m => m.categoria)));

  const filteredMedicaments = medicaments.filter(med => {
    const matchesSearch = 
      med.nomeComercial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.principioAtivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.codigoBarrasPadrao.includes(searchTerm);
    const matchesCategory = selectedCategory === 'ALL' || med.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Package className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Contagem de Estoque do Posto
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Visão consolidada por medicamento, lotes vigentes e localizações de prateleira/geladeira.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onExportExecutivePDF && (
              <button
                onClick={onExportExecutivePDF}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all border border-slate-700 dark:border-slate-300"
                title="Gerar e Baixar Relatório Executivo em PDF"
              >
                <Download className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                <span>PDF Executivo</span>
              </button>
            )}
            <button
              onClick={onOpenScanModal}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Medicamento por Foto</span>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por Nome Comercial, Princípio Ativo ou Código de Barras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="ALL">Todas as Categorias ({medicaments.length})</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Medication List Cards */}
      <div className="space-y-4">
        {filteredMedicaments.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <Package className="w-8 h-8 text-emerald-500" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Nenhum medicamento cadastrado no estoque ainda
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tire uma foto do rótulo da embalagem. A Inteligência Artificial (Gemini) cadastrará automaticamente a medicação, a indicação de uso, a dosagem, o lote e a data de validade diretamente no seu estoque.
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
          filteredMedicaments.map((med) => {
          const medLots = lots.filter(l => l.medicamentoId === med.id && l.quantidadeAtual > 0);
          const totalQty = medLots.reduce((sum, l) => sum + l.quantidadeAtual, 0);

          return (
            <div
              key={med.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
            >
              {/* Card Title Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {med.nomeComercial}
                    </h3>
                    {med.altaVigilancia && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/40 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-amber-600" />
                        MAV
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {med.categoria}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Princípio Ativo: <strong className="text-slate-700 dark:text-slate-200">{med.principioAtivo}</strong> • Dosagem: {med.dosagem} ({med.formaFarmaceutica})
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Saldo em Estoque</span>
                    <span className={`text-lg font-black ${totalQty > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                      {totalQty} unidades
                    </span>
                  </div>
                </div>
              </div>

              {/* Therapeutic Note & Nursing Precautions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Indicação Terapêutica:</span>
                  <p className="text-slate-600 dark:text-slate-400">{med.paraQueServe}</p>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
                  <span className="font-bold text-indigo-900 dark:text-indigo-300 block mb-0.5">Cuidados de Enfermagem:</span>
                  <p className="text-indigo-800 dark:text-indigo-300">{med.cuidadosEspeciais}</p>
                </div>
              </div>

              {/* Batches Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Lotes Disponíveis no Posto ({medLots.length}):
                </span>

                {medLots.length === 0 ? (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                    ⚠️ Nenhum lote ativo disponível em estoque.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {medLots.map(lote => {
                      const tier = getExpiryTier(lote.dataValidade);
                      const badge = getExpiryBadgeInfo(tier);

                      return (
                        <div
                          key={lote.id}
                          className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">Lote: {lote.lote}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.colorClass}`}>
                              {formatDatePtBr(lote.dataValidade)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span>{lote.localizacaoPrateleira}</span>
                            <strong className="text-slate-900 dark:text-white font-black text-xs">{lote.quantidadeAtual} un</strong>
                          </div>

                          <button
                            onClick={() => onOpenDispenseForLote(lote.id)}
                            className="w-full py-1.5 px-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <Barcode className="w-3.5 h-3.5" />
                            <span>Baixar p/ Paciente</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          );
        })
        )}
      </div>

    </div>
  );
};
