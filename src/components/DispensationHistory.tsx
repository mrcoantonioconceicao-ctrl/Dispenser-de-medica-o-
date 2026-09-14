import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Calendar, 
  User, 
  ShieldCheck, 
  Barcode, 
  Bed, 
  Building2,
  Clock,
  ArrowDownRight,
  Download
} from 'lucide-react';
import { MovimentacaoDispensacao, Medicamento, LoteEstoque } from '../types';

interface DispensationHistoryProps {
  dispensations: MovimentacaoDispensacao[];
  medicaments: Medicamento[];
  lots: LoteEstoque[];
  onExportExecutivePDF?: () => void;
}

export const DispensationHistory: React.FC<DispensationHistoryProps> = ({
  dispensations,
  medicaments,
  lots,
  onExportExecutivePDF
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = dispensations.filter(disp => {
    const med = medicaments.find(m => m.id === disp.medicamentoId);
    const searchLower = searchTerm.toLowerCase();
    return (
      disp.nomePaciente.toLowerCase().includes(searchLower) ||
      disp.leito.toLowerCase().includes(searchLower) ||
      disp.enfermeiraResponsavel.toLowerCase().includes(searchLower) ||
      (med && med.nomeComercial.toLowerCase().includes(searchLower)) ||
      disp.codigoBarrasUsado.includes(searchLower)
    );
  }).sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <FileText className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Rastreabilidade & Histórico de Dispensações
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Registro auditável contendo Data, Hora, Profissional (COREN), Leito de Destino e Dupla Checagem MAV.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onExportExecutivePDF && (
              <button
                onClick={onExportExecutivePDF}
                className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all border border-slate-700 dark:border-slate-300"
                title="Gerar e Baixar Relatório Executivo em PDF"
              >
                <Download className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                <span>PDF Executivo</span>
              </button>
            )}
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Movimentações</span>
              <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                {dispensations.length} saídas
              </span>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Filtrar histórico por Paciente, Leito, Enfermeira, Medicamento ou Código de Barras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
          />
        </div>
      </div>

      {/* History Table / Card Stream */}
      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-200 dark:border-slate-800">
            Nenhum registro de dispensação encontrado.
          </div>
        ) : (
          filteredHistory.map((disp) => {
            const med = medicaments.find(m => m.id === disp.medicamentoId);
            const lote = lots.find(l => l.id === disp.loteId);
            const dateObj = new Date(disp.dataHora);

            return (
              <div
                key={disp.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                {/* Left: Med & Patient Info */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-extrabold flex items-center gap-1">
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      -{disp.quantidadeDispensada} un
                    </span>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {med?.nomeComercial || 'Medicamento'}
                    </h3>
                    {med?.altaVigilancia && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold">
                        MAV
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                    <span className="font-bold flex items-center gap-1 text-slate-800 dark:text-slate-200">
                      <Bed className="w-3.5 h-3.5 text-indigo-500" />
                      {disp.leito}
                    </span>
                    <span>• {disp.nomePaciente}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Barcode className="w-3 h-3 text-slate-400" />
                      EAN: {disp.codigoBarrasUsado}
                    </span>
                    {lote && <span>• Lote: {lote.lote}</span>}
                  </div>
                </div>

                {/* Right: Nurse & Timestamp */}
                <div className="sm:text-right border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-2 sm:pt-0 space-y-1">
                  <div className="flex items-center sm:justify-end gap-1 font-semibold text-slate-700 dark:text-slate-300">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{disp.enfermeiraResponsavel}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {disp.coren}
                  </p>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center sm:justify-end gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {dateObj.toLocaleDateString('pt-BR')} às {dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {disp.duplaChecagemOK && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      Dupla Checagem OK
                    </span>
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
