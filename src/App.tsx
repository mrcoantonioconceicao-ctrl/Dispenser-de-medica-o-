import React, { useState, useEffect } from 'react';
import { HeaderNavbar } from './components/HeaderNavbar';
import { ValidityDashboard } from './components/ValidityDashboard';
import { StockManagement } from './components/StockManagement';
import { PatientBoxesView } from './components/PatientBoxesView';
import { DispensationHistory } from './components/DispensationHistory';
import { CameraOcrModal } from './components/CameraOcrModal';
import { BarcodeDispenseModal } from './components/BarcodeDispenseModal';
import { TechnicalProposalModal } from './components/TechnicalProposalModal';
import { NurseProfileModal } from './components/NurseProfileModal';
import { INITIAL_MEDICAMENTS, INITIAL_LOTS, INITIAL_PATIENTS, INITIAL_DISPENSATIONS, DEFAULT_NURSE } from './data/initialData';
import { Medicamento, LoteEstoque, PacienteCaixa, MovimentacaoDispensacao, EnfermeiraProfile } from './types';
import { playBeepSound, triggerHaptic, getExpiryTier } from './utils/pharmacyUtils';
import { generateExecutivePDFReport } from './utils/pdfExporter';

export default function App() {
  // Dark mode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('pharma_dark_mode') === 'true';
  });

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'VALIDITY' | 'STOCK' | 'PATIENTS' | 'HISTORY'>('VALIDITY');

  // Modals state
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
  const [isTechProposalOpen, setIsTechProposalOpen] = useState(false);
  const [isNurseProfileOpen, setIsNurseProfileOpen] = useState(false);

  // Pre-selected IDs for dispense modal
  const [preselectedLoteId, setPreselectedLoteId] = useState<string | undefined>(undefined);
  const [preselectedPacienteId, setPreselectedPacienteId] = useState<string | undefined>(undefined);

  // Core Data States with LocalStorage fallback (clearing any legacy pre-loaded mock data)
  const [medicaments, setMedicaments] = useState<Medicamento[]>(() => {
    const saved = localStorage.getItem('pharma_medicaments');
    if (!saved) return INITIAL_MEDICAMENTS;
    try {
      const parsed = JSON.parse(saved);
      // Filter out legacy mock data if present
      if (Array.isArray(parsed) && parsed.some((m: any) => m.id === 'med-1' || m.id === 'med-2')) {
        localStorage.removeItem('pharma_medicaments');
        return [];
      }
      return parsed;
    } catch {
      return INITIAL_MEDICAMENTS;
    }
  });

  const [lots, setLots] = useState<LoteEstoque[]>(() => {
    const saved = localStorage.getItem('pharma_lots');
    if (!saved) return INITIAL_LOTS;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.some((l: any) => l.id === 'lote-101' || l.id === 'lote-102')) {
        localStorage.removeItem('pharma_lots');
        return [];
      }
      return parsed;
    } catch {
      return INITIAL_LOTS;
    }
  });

  const [patients, setPatients] = useState<PacienteCaixa[]>(() => {
    const saved = localStorage.getItem('pharma_patients');
    if (!saved) return INITIAL_PATIENTS;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.some((p: any) => p.id === 'p-101' || p.id === 'p-102')) {
        localStorage.removeItem('pharma_patients');
        return [];
      }
      return parsed;
    } catch {
      return INITIAL_PATIENTS;
    }
  });

  const [dispensations, setDispensations] = useState<MovimentacaoDispensacao[]>(() => {
    const saved = localStorage.getItem('pharma_dispensations');
    if (!saved) return INITIAL_DISPENSATIONS;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.some((d: any) => d.id === 'disp-1' || d.id === 'disp-2')) {
        localStorage.removeItem('pharma_dispensations');
        return [];
      }
      return parsed;
    } catch {
      return INITIAL_DISPENSATIONS;
    }
  });

  const [nurse, setNurse] = useState<EnfermeiraProfile>(() => {
    const saved = localStorage.getItem('pharma_nurse');
    return saved ? JSON.parse(saved) : DEFAULT_NURSE;
  });

  // Notification Banner toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync dark mode class with document body
  useEffect(() => {
    localStorage.setItem('pharma_dark_mode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('pharma_medicaments', JSON.stringify(medicaments));
  }, [medicaments]);

  useEffect(() => {
    localStorage.setItem('pharma_lots', JSON.stringify(lots));
  }, [lots]);

  useEffect(() => {
    localStorage.setItem('pharma_patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('pharma_dispensations', JSON.stringify(dispensations));
  }, [dispensations]);

  useEffect(() => {
    localStorage.setItem('pharma_nurse', JSON.stringify(nurse));
  }, [nurse]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Open Dispense Modal with specific lote or patient preset
  const handleOpenDispenseForLote = (loteId: string) => {
    setPreselectedLoteId(loteId);
    setPreselectedPacienteId(undefined);
    setIsDispenseModalOpen(true);
  };

  const handleOpenDispenseForPatient = (pacienteId: string) => {
    setPreselectedPacienteId(pacienteId);
    setPreselectedLoteId(undefined);
    setIsDispenseModalOpen(true);
  };

  // 1. CONFIRM NEW MEDICINE / BATCH CREATION FROM REAL OCR OR MANUAL
  const handleConfirmOcrStockEntry = (data: {
    medicamento: Omit<Medicamento, 'id'>;
    lote: Omit<LoteEstoque, 'id' | 'medicamentoId'>;
  }) => {
    playBeepSound();
    triggerHaptic();

    let existingMed = medicaments.find(
      m => m.nomeComercial.toLowerCase() === data.medicamento.nomeComercial.toLowerCase() ||
           m.codigoBarrasPadrao === data.medicamento.codigoBarrasPadrao
    );

    let finalMedId = existingMed?.id;

    if (!existingMed) {
      const newMed: Medicamento = {
        ...data.medicamento,
        id: `med-${Date.now()}`
      };
      finalMedId = newMed.id;
      setMedicaments(prev => [newMed, ...prev]);
    }

    const newLote: LoteEstoque = {
      ...data.lote,
      id: `lote-${Date.now()}`,
      medicamentoId: finalMedId!
    };

    setLots(prev => [newLote, ...prev]);
    showToast(`✅ Estoque atualizado! Lote "${newLote.lote}" de ${data.medicamento.nomeComercial} adicionado com sucesso.`);
  };

  // 2. CONFIRM DISPENSATION TO PATIENT BOX
  const handleConfirmDispense = (dispenseData: {
    loteId: string;
    medicamentoId: string;
    pacienteId: string;
    quantidade: number;
    codigoBarras: string;
    duplaChecagemOK: boolean;
  }) => {
    const targetLote = lots.find(l => l.id === dispenseData.loteId);
    const targetMed = medicaments.find(m => m.id === dispenseData.medicamentoId);
    const targetPatient = patients.find(p => p.id === dispenseData.pacienteId);

    if (!targetLote || !targetMed || !targetPatient) return;

    // Decrement stock quantity
    setLots(prev => prev.map(l => {
      if (l.id === dispenseData.loteId) {
        return {
          ...l,
          quantidadeAtual: Math.max(0, l.quantidadeAtual - dispenseData.quantidade)
        };
      }
      return l;
    }));

    // Add / update medication in patient box
    setPatients(prev => prev.map(p => {
      if (p.id === dispenseData.pacienteId) {
        const existingAloc = p.medicamentosAlocados.find(m => m.medicamentoId === dispenseData.medicamentoId);
        let updatedAloc;
        if (existingAloc) {
          updatedAloc = p.medicamentosAlocados.map(m => {
            if (m.medicamentoId === dispenseData.medicamentoId) {
              return { ...m, quantidadeNaCaixa: m.quantidadeNaCaixa + dispenseData.quantidade };
            }
            return m;
          });
        } else {
          updatedAloc = [
            ...p.medicamentosAlocados,
            {
              medicamentoId: dispenseData.medicamentoId,
              loteId: dispenseData.loteId,
              dosePrescrita: `${targetMed.dosagem} a cada 12h`,
              quantidadeNaCaixa: dispenseData.quantidade,
              horarios: ['08:00', '20:00']
            }
          ];
        }
        return { ...p, medicamentosAlocados: updatedAloc };
      }
      return p;
    }));

    // Create Audit Record
    const newDispensation: MovimentacaoDispensacao = {
      id: `disp-${Date.now()}`,
      loteId: dispenseData.loteId,
      medicamentoId: dispenseData.medicamentoId,
      pacienteId: dispenseData.pacienteId,
      nomePaciente: targetPatient.nomePaciente,
      leito: targetPatient.leito,
      quantidadeDispensada: dispenseData.quantidade,
      dataHora: new Date().toISOString(),
      enfermeiraResponsavel: nurse.nome,
      coren: nurse.coren,
      codigoBarrasUsado: dispenseData.codigoBarras,
      duplaChecagemOK: dispenseData.duplaChecagemOK
    };

    setDispensations(prev => [newDispensation, ...prev]);
    showToast(`📦 ${dispenseData.quantidade}x ${targetMed.nomeComercial} colocado na caixa do ${targetPatient.leito} (${targetPatient.nomePaciente}).`);
  };

  // 3. RECOLHER LOTE VENCIDO PARA QUARENTENA
  const handleDisposeLote = (loteId: string) => {
    const targetLote = lots.find(l => l.id === loteId);
    const targetMed = targetLote ? medicaments.find(m => m.id === targetLote.medicamentoId) : undefined;

    setLots(prev => prev.filter(l => l.id !== loteId));
    showToast(`🗑️ Lote ${targetLote?.lote || ''} de ${targetMed?.nomeComercial || 'medicamento'} recolhido para a Quarentena.`);
  };

  // 4. ADD NEW PATIENT BOX
  const handleAddNewPatientBox = (patientData: {
    leito: string;
    nomePaciente: string;
    prontuario: string;
    diagnosticoResumido: string;
    alergias: string[];
  }) => {
    const newPatient: PacienteCaixa = {
      ...patientData,
      id: `pac-${Date.now()}`,
      medicamentosAlocados: []
    };
    setPatients(prev => [newPatient, ...prev]);
    showToast(`🛏️ Caixa do ${newPatient.leito} (${newPatient.nomePaciente}) cadastrada com sucesso!`);
  };

  // 5. RESET / CLEAR DATA FOR PRODUCTION START
  const handleClearAllData = () => {
    localStorage.removeItem('pharma_medicaments');
    localStorage.removeItem('pharma_lots');
    localStorage.removeItem('pharma_patients');
    localStorage.removeItem('pharma_dispensations');
    localStorage.removeItem('pharma_nurse');

    setMedicaments(INITIAL_MEDICAMENTS);
    setLots(INITIAL_LOTS);
    setPatients(INITIAL_PATIENTS);
    setDispensations(INITIAL_DISPENSATIONS);
    setNurse(DEFAULT_NURSE);

    showToast("🔄 Sistema redefinido para as configurações padrão com sucesso.");
  };

  // 6. EXPORT EXECUTIVE PDF REPORT
  const handleExportExecutivePDF = () => {
    try {
      generateExecutivePDFReport(medicaments, lots, patients, dispensations, nurse);
      showToast("📄 Relatório Executivo Oficial gerado e baixado com sucesso!");
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      showToast("❌ Erro ao gerar o Relatório Executivo PDF.");
    }
  };

  // Counts for alerts
  const expiredCount = lots.filter(l => getExpiryTier(l.dataValidade) === 'EXPIRED').length;
  const criticalCount = lots.filter(l => getExpiryTier(l.dataValidade) === 'CRITICAL').length;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 selection:bg-indigo-500 selection:text-white pb-16">
      
      {/* Top Navbar */}
      <HeaderNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        nurse={nurse}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenScanModal={() => setIsScanModalOpen(true)}
        onOpenDispenseModal={() => {
          setPreselectedLoteId(undefined);
          setPreselectedPacienteId(undefined);
          setIsDispenseModalOpen(true);
        }}
        onOpenTechProposal={() => setIsTechProposalOpen(true)}
        onOpenNurseProfile={() => setIsNurseProfileOpen(true)}
        onExportExecutivePDF={handleExportExecutivePDF}
        criticalCount={criticalCount}
        expiredCount={expiredCount}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 max-w-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl border border-indigo-500/30 font-bold text-xs flex items-center justify-between gap-3 animate-bounce">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white dark:hover:text-slate-900 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Main View Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {activeTab === 'VALIDITY' && (
          <ValidityDashboard
            lots={lots}
            medicaments={medicaments}
            onOpenDispenseForLote={handleOpenDispenseForLote}
            onOpenScanModal={() => setIsScanModalOpen(true)}
            onDisposeLote={handleDisposeLote}
            onExportExecutivePDF={handleExportExecutivePDF}
          />
        )}

        {activeTab === 'STOCK' && (
          <StockManagement
            lots={lots}
            medicaments={medicaments}
            onOpenScanModal={() => setIsScanModalOpen(true)}
            onOpenDispenseForLote={handleOpenDispenseForLote}
            onExportExecutivePDF={handleExportExecutivePDF}
          />
        )}

        {activeTab === 'PATIENTS' && (
          <PatientBoxesView
            patients={patients}
            medicaments={medicaments}
            lots={lots}
            onOpenDispenseForPatient={handleOpenDispenseForPatient}
            onAddNewPatientBox={handleAddNewPatientBox}
          />
        )}

        {activeTab === 'HISTORY' && (
          <DispensationHistory
            dispensations={dispensations}
            medicaments={medicaments}
            lots={lots}
            onExportExecutivePDF={handleExportExecutivePDF}
          />
        )}

      </main>

      {/* Modals */}
      <CameraOcrModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onConfirmStockEntry={handleConfirmOcrStockEntry}
        nurseName={nurse.nome}
      />

      <BarcodeDispenseModal
        isOpen={isDispenseModalOpen}
        onClose={() => setIsDispenseModalOpen(false)}
        lots={lots.filter(l => l.quantidadeAtual > 0)}
        medicaments={medicaments}
        patients={patients}
        nurse={nurse}
        onConfirmDispense={handleConfirmDispense}
        preselectedLoteId={preselectedLoteId}
        preselectedPacienteId={preselectedPacienteId}
      />

      <TechnicalProposalModal
        isOpen={isTechProposalOpen}
        onClose={() => setIsTechProposalOpen(false)}
      />

      <NurseProfileModal
        isOpen={isNurseProfileOpen}
        onClose={() => setIsNurseProfileOpen(false)}
        nurse={nurse}
        onSaveNurse={(updated) => {
          setNurse(updated);
          showToast(`👤 Perfil de ${updated.nome} atualizado.`);
        }}
        onClearAllData={handleClearAllData}
      />

      {/* Footer Info */}
      <footer className="mt-12 text-center text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-6">
        <p className="font-semibold">
          PharmaGuard Posto Enfermagem • PWA Hospitalar com Visão Computacional (Gemini 3.8 Flash) & Regra FEFO
        </p>
        <p className="text-[10px] text-slate-400 mt-1">
          Operado por: <strong className="text-indigo-600 dark:text-indigo-400">{nurse.nome}</strong> ({nurse.coren}) • {nurse.setor}
        </p>
      </footer>

    </div>
  );
}
