import React from 'react';
import { 
  Building2, 
  User, 
  Sun, 
  Moon, 
  FileText, 
  AlertTriangle, 
  Camera, 
  Barcode, 
  Package, 
  Clock, 
  Users,
  Download
} from 'lucide-react';
import { EnfermeiraProfile } from '../types';

interface HeaderNavbarProps {
  nurse: EnfermeiraProfile;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  activeTab: 'VALIDITY' | 'STOCK' | 'PATIENTS' | 'HISTORY';
  setActiveTab: (tab: 'VALIDITY' | 'STOCK' | 'PATIENTS' | 'HISTORY') => void;
  onOpenScanModal: () => void;
  onOpenDispenseModal: () => void;
  onOpenTechProposal: () => void;
  onOpenNurseProfile: () => void;
  onExportExecutivePDF: () => void;
  criticalCount?: number;
  expiredCount?: number;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  nurse,
  darkMode,
  onToggleDarkMode,
  activeTab,
  setActiveTab,
  onOpenScanModal,
  onOpenDispenseModal,
  onOpenTechProposal,
  onOpenNurseProfile,
  onExportExecutivePDF,
  criticalCount = 0,
  expiredCount = 0
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      {/* Top Bar: Nurse & Shift Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 text-xs sm:text-sm">
        <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 font-medium">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {nurse.setor}
          </span>
          <span className="hidden sm:inline text-slate-400">|</span>
          <span className="hidden sm:inline text-slate-500 dark:text-slate-400">
            {nurse.turno}
          </span>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onExportExecutivePDF}
            className="px-3 py-1 rounded-full bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Extrair Relatório Executivo Oficial em PDF"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
            <span>PDF Executivo</span>
          </button>

          <button
            onClick={onOpenTechProposal}
            className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 border border-emerald-200 dark:border-emerald-800 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Ver Proposta Técnica e Arquitetura"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Proposta Técnica</span>
            <span className="sm:hidden">Arquitetura</span>
          </button>

          <button
            onClick={onOpenNurseProfile}
            className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 px-2.5 py-1 rounded-full text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
            title="Editar Perfil do Profissional"
          >
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span className="truncate max-w-[120px] sm:max-w-[180px]">{nurse.nome}</span>
          </button>

          <button
            onClick={onToggleDarkMode}
            className="p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={darkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>

      {/* Main Bar: Logo & Primary Quick Action Buttons */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 font-black text-xl">
              P
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  PharmaCare <span className="text-emerald-600 dark:text-emerald-400">Nurse</span>
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-700">
                  Hospital PWA
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Estoque Inteligente, IA/OCR & Dispensação Rápida por Código de Barras
              </p>
            </div>
          </div>

          {(expiredCount > 0 || criticalCount > 0) && (
            <button
              onClick={() => setActiveTab('VALIDITY')}
              className="md:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-bold animate-pulse"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>{expiredCount + criticalCount} Alertas</span>
            </button>
          )}
        </div>

        {/* Action Buttons for High-Speed Nurse Workflow */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onExportExecutivePDF}
            className="px-3 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer border border-slate-700 dark:border-slate-300"
            title="Extrair Relatório Executivo Oficial em PDF"
          >
            <Download className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span className="hidden sm:inline">Relatório Executivo (PDF)</span>
            <span className="sm:hidden">PDF Executivo</span>
          </button>

          <button
            onClick={onOpenScanModal}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Entrada por Foto (IA)</span>
          </button>

          <button
            onClick={onOpenDispenseModal}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Barcode className="w-4 h-4" />
            <span>Dispensar (Baixa)</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-4 border-t border-slate-100 dark:border-slate-800/80 pt-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('VALIDITY')}
            className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'VALIDITY'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Termômetro de Validades</span>
            {(expiredCount > 0 || criticalCount > 0) && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white">
                {expiredCount + criticalCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('STOCK')}
            className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'STOCK'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Estoque Geral</span>
          </button>

          <button
            onClick={() => setActiveTab('PATIENTS')}
            className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'PATIENTS'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Caixas de Pacientes</span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Histórico Dispensações</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
