import React, { useState } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  User, 
  Bed, 
  ShieldAlert, 
  Search, 
  Plus, 
  Calendar, 
  Syringe, 
  Check, 
  Filter, 
  FileCheck,
  AlertTriangle,
  RefreshCw,
  Info
} from 'lucide-react';
import { 
  DoseAprazada, 
  PacienteCaixa, 
  Medicamento, 
  EnfermeiraProfile, 
  AdministrationStatus 
} from '../types';
import { playBeepSound, triggerHaptic } from '../utils/pharmacyUtils';

interface DailyAdministrationTrackerProps {
  schedules: DoseAprazada[];
  patients: PacienteCaixa[];
  medicaments: Medicamento[];
  nurse: EnfermeiraProfile;
  onAdministerDose: (doseId: string, logData: {
    enfermeiraAplicadora: string;
    corenAplicadora: string;
    testemunhaDuplaChecagem?: string;
    corenTestemunha?: string;
    observacoes?: string;
  }) => void;
  onCancelDose: (doseId: string, reason: string) => void;
  onAddSchedule: (newDose: Omit<DoseAprazada, 'id' | 'status'>) => void;
  onAutoGenerateSchedules: () => void;
  onExportPDF?: () => void;
}

export const DailyAdministrationTracker: React.FC<DailyAdministrationTrackerProps> = ({
  schedules,
  patients,
  medicaments,
  nurse,
  onAdministerDose,
  onCancelDose,
  onAddSchedule,
  onAutoGenerateSchedules,
  onExportPDF
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal State for Bedside Administration Confirmation
  const [activeDoseToAdminister, setActiveDoseToAdminister] = useState<DoseAprazada | null>(null);
  const [testemunhaNome, setTestemunhaNome] = useState<string>('');
  const [testemunhaCoren, setTestemunhaCoren] = useState<string>('');
  const [observacoesAplicacao, setObservacoesAplicacao] = useState<string>('');
  const [duplaChecagemChecked, setDuplaChecagemChecked] = useState<boolean>(false);

  // Modal State for Cancellation
  const [doseToCancel, setDoseToCancel] = useState<DoseAprazada | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');

  // Modal State for New Extra Schedule
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newPacId, setNewPacId] = useState<string>(patients[0]?.id || '');
  const [newMedId, setNewMedId] = useState<string>(medicaments[0]?.id || '');
  const [newHorario, setNewHorario] = useState<string>('08:00');
  const [newDosagem, setNewDosagem] = useState<string>('');

  // Current date formatted
  const todayDateStr = new Date().toISOString().split('T')[0];

  // Helper to determine if dose is delayed
  const isDoseDelayed = (dose: DoseAprazada) => {
    if (dose.status !== 'PENDING') return false;
    const now = new Date();
    const [hours, minutes] = dose.horarioPrevisto.split(':').map(Number);
    const scheduledTime = new Date();
    scheduledTime.setHours(hours || 0, minutes || 0, 0, 0);
    return now > scheduledTime;
  };

  // Filtered list
  const filteredSchedules = schedules.filter(dose => {
    if (selectedPatientId !== 'ALL' && dose.pacienteId !== selectedPatientId) return false;
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'DELAYED') {
        if (!isDoseDelayed(dose)) return false;
      } else if (dose.status !== statusFilter) {
        return false;
      }
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchMed = dose.nomeMedicamento.toLowerCase().includes(term);
      const matchPac = dose.nomePaciente.toLowerCase().includes(term);
      const matchBed = dose.leito.toLowerCase().includes(term);
      if (!matchMed && !matchPac && !matchBed) return false;
    }
    return true;
  });

  // Stats calculation
  const totalDoses = schedules.length;
  const pendingCount = schedules.filter(d => d.status === 'PENDING' && !isDoseDelayed(d)).length;
  const delayedCount = schedules.filter(d => isDoseDelayed(d)).length;
  const administeredCount = schedules.filter(d => d.status === 'ADMINISTERED').length;
  const cancelledCount = schedules.filter(d => d.status === 'CANCELLED').length;

  const handleOpenAdministerModal = (dose: DoseAprazada) => {
    setActiveDoseToAdminister(dose);
    setTestemunhaNome('');
    setTestemunhaCoren('');
    setObservacoesAplicacao('');
    setDuplaChecagemChecked(false);
  };

  const handleConfirmAdministration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDoseToAdminister) return;

    if (activeDoseToAdminister.altaVigilancia) {
      if (!duplaChecagemChecked) {
        alert("⚠️ Medicamento MAV requer confirmação explícita de Dupla Checagem!");
        return;
      }
      if (!testemunhaNome.trim() || !testemunhaCoren.trim()) {
        alert("⚠️ Por favor, informe o Nome e COREN da enfermeira testemunha da Dupla Checagem.");
        return;
      }
    }

    playBeepSound();
    triggerHaptic();

    onAdministerDose(activeDoseToAdminister.id, {
      enfermeiraAplicadora: nurse.nome,
      corenAplicadora: nurse.coren,
      testemunhaDuplaChecagem: testemunhaNome.trim() || undefined,
      corenTestemunha: testemunhaCoren.trim() || undefined,
      observacoes: observacoesAplicacao.trim() || undefined
    });

    setActiveDoseToAdminister(null);
  };

  const handleConfirmCancellation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doseToCancel || !cancelReason.trim()) {
      alert("Por favor, informe a justificativa de não administração.");
      return;
    }

    onCancelDose(doseToCancel.id, cancelReason.trim());
    setDoseToCancel(null);
    setCancelReason('');
  };

  const handleCreateNewSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPatient = patients.find(p => p.id === newPacId);
    const targetMed = medicaments.find(m => m.id === newMedId);

    if (!targetPatient || !targetMed) {
      alert("Selecione um paciente e um medicamento válidos.");
      return;
    }

    onAddSchedule({
      pacienteId: targetPatient.id,
      leito: targetPatient.leito,
      nomePaciente: targetPatient.nomePaciente,
      medicamentoId: targetMed.id,
      nomeMedicamento: targetMed.nomeComercial,
      dosagem: newDosagem || targetMed.dosagem,
      horarioPrevisto: newHorario,
      dataPrevista: todayDateStr,
      altaVigilancia: targetMed.altaVigilancia
    });

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 text-white shadow-xl border border-teal-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-500/20 text-teal-300 font-extrabold text-sm border border-teal-500/30">
              <Syringe className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Controle Diário de Administração & Aprazamento
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-teal-200/80 max-w-2xl">
            Gestão em tempo real das doses aprazadas por leito. Registro com carimbo de COREN e protocolo de dupla checagem para MAV à beira do leito.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onAutoGenerateSchedules}
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-600/30 cursor-pointer transition-all"
            title="Sincronizar e gerar horários do dia com base nas caixas dos pacientes"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sincronizar Aprazamentos do Dia</span>
          </button>
          
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Dose Extra / SOS</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-slate-500 text-[11px] font-semibold block">Total Aprazado</span>
          <strong className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{totalDoses}</strong>
          <span className="text-[10px] text-slate-400 block">Doses para hoje</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-sm space-y-1">
          <span className="text-amber-700 dark:text-amber-300 text-[11px] font-bold block flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Pendentes
          </span>
          <strong className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-300">{pendingCount}</strong>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 block">Aguardando horário</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 shadow-sm space-y-1">
          <span className="text-rose-700 dark:text-rose-300 text-[11px] font-bold block flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Atrasados
          </span>
          <strong className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-300">{delayedCount}</strong>
          <span className="text-[10px] text-rose-600 dark:text-rose-400 block">Requer atenção imediata</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 shadow-sm space-y-1">
          <span className="text-emerald-700 dark:text-emerald-300 text-[11px] font-bold block flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Administrados
          </span>
          <strong className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300">{administeredCount}</strong>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">Com carimbo no leito</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-500/10 border border-slate-500/30 shadow-sm col-span-2 sm:col-span-1 space-y-1">
          <span className="text-slate-700 dark:text-slate-300 text-[11px] font-bold block flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Cancelados
          </span>
          <strong className="text-xl sm:text-2xl font-black text-slate-700 dark:text-slate-300">{cancelledCount}</strong>
          <span className="text-[10px] text-slate-500 block">Recusa ou suspenso</span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por leito, paciente ou medicamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-teal-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Patient Selector */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">Todos os Leitos / Pacientes</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.leito} - {p.nomePaciente}
                </option>
              ))}
            </select>
          </div>

          {/* Status Selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">Todos os Status</option>
            <option value="PENDING">Pendentes (No Prazo)</option>
            <option value="DELAYED">Atrasados ⚠️</option>
            <option value="ADMINISTERED">Administrados ✅</option>
            <option value="CANCELLED">Cancelados ❌</option>
          </select>
        </div>

      </div>

      {/* Main Timeline List of Scheduled Doses */}
      <div className="space-y-3">
        {filteredSchedules.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3">
            <Syringe className="w-10 h-10 text-slate-400 mx-auto animate-bounce" />
            <h4 className="font-bold text-slate-700 dark:text-slate-300">
              Nenhum aprazamento encontrado
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Não há horários agendados para os filtros selecionados. Clique em "Sincronizar Aprazamentos do Dia" para carregar os horários das caixas dos pacientes.
            </p>
            <button
              onClick={onAutoGenerateSchedules}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer shadow"
            >
              Gerar Aprazamentos Automáticos
            </button>
          </div>
        ) : (
          filteredSchedules.map((dose) => {
            const delayed = isDoseDelayed(dose);
            const isDone = dose.status === 'ADMINISTERED';
            const isCancelled = dose.status === 'CANCELLED';

            return (
              <div
                key={dose.id}
                className={`p-4 rounded-2xl border transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isDone 
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300/60 dark:border-emerald-800/60'
                    : isCancelled
                    ? 'bg-slate-100/80 dark:bg-slate-900/40 border-slate-300 dark:border-slate-800 opacity-60'
                    : delayed
                    ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Left Section: Time & Badge Info */}
                <div className="flex items-start gap-3.5">
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black shrink-0 ${
                    isDone
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : isCancelled
                      ? 'bg-slate-700 text-slate-300'
                      : delayed
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 animate-pulse'
                      : 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                  }`}>
                    <span className="text-base leading-none">{dose.horarioPrevisto}</span>
                    <span className="text-[9px] font-bold uppercase mt-0.5 opacity-80">Previsto</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md font-black text-xs bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                        {dose.leito}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {dose.nomePaciente}
                      </h4>
                      {dose.altaVigilancia && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400/50 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          MAV (Dupla Checagem)
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1.5">
                      <Syringe className="w-3.5 h-3.5 shrink-0" />
                      <span>{dose.nomeMedicamento}</span>
                      <span className="text-slate-500 font-normal">({dose.dosagem})</span>
                    </p>

                    {/* Audit Stamp Info if Administered */}
                    {isDone && (
                      <div className="pt-1 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1 font-bold">
                          <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Aplicado às {new Date(dose.administradoEm || '').toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>• por <strong>{dose.enfermeiraAplicadora}</strong> ({dose.corenAplicadora})</span>
                        {dose.testemunhaDuplaChecagem && (
                          <span className="text-amber-700 dark:text-amber-300 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
                            🤝 Testemunha MAV: {dose.testemunhaDuplaChecagem} ({dose.corenTestemunha})
                          </span>
                        )}
                        {dose.observacoes && (
                          <span className="italic block w-full text-slate-600 dark:text-slate-400 text-[10px]">
                            Obs: "{dose.observacoes}"
                          </span>
                        )}
                      </div>
                    )}

                    {/* Status Note if Cancelled */}
                    {isCancelled && (
                      <p className="text-[11px] text-rose-700 dark:text-rose-400 italic">
                        ❌ Não administrado: {dose.observacoes || 'Justificativa não informada'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Section: Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {dose.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleOpenAdministerModal(dose)}
                        className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                          delayed
                            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>Dar Baixa no Leito</span>
                      </button>

                      <button
                        onClick={() => setDoseToCancel(dose)}
                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Registrar recusa ou cancelamento de dose"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {isDone && (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30 font-black text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Concluído
                    </span>
                  )}

                  {isCancelled && (
                    <span className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs flex items-center gap-1">
                      <XCircle className="w-4 h-4 text-slate-500" />
                      Cancelado
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: Confirm Administration at Bedside */}
      {activeDoseToAdminister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            <div className="px-5 py-4 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-900">
              <div className="flex items-center space-x-2">
                <Syringe className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Confirmar Aplicação no Leito
                </h3>
              </div>
              <button
                onClick={() => setActiveDoseToAdminister(null)}
                className="text-emerald-300 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmAdministration} className="p-5 space-y-4 text-xs">
              
              {/* Patient & Med Summary Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                  <span>{activeDoseToAdminister.leito} - {activeDoseToAdminister.nomePaciente}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                    Horário: {activeDoseToAdminister.horarioPrevisto}
                  </span>
                </div>
                <p className="font-extrabold text-sm text-emerald-700 dark:text-emerald-300">
                  {activeDoseToAdminister.nomeMedicamento} ({activeDoseToAdminister.dosagem})
                </p>
              </div>

              {/* Responsible Nurse Audit Stamp */}
              <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 space-y-1">
                <span className="font-bold text-teal-800 dark:text-teal-300 block text-[11px]">
                  👤 Enfermeiro Aplicador Responsável:
                </span>
                <p className="font-extrabold text-slate-900 dark:text-white text-xs">
                  {nurse.nome} <span className="text-slate-500 font-mono">({nurse.coren})</span>
                </p>
                <span className="text-[10px] text-slate-400 block">
                  Carimbo com ISO Timestamp de baixa imediata.
                </span>
              </div>

              {/* MAV Double Check Requirements */}
              {activeDoseToAdminister.altaVigilancia && (
                <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-900 dark:text-amber-200 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-xs text-amber-700 dark:text-amber-300">
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>PROTOCOLAR: Dupla Checagem Obrigatória (MAV)</span>
                  </div>

                  <label className="flex items-center gap-2 font-bold text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={duplaChecagemChecked}
                      onChange={(e) => setDuplaChecagemChecked(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Confirmo a verificação independente de dose e leito por 2 profissionais</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nome da Enfermeira Testemunha *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Maria Fernandes"
                        value={testemunhaNome}
                        onChange={(e) => setTestemunhaNome(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        COREN da Testemunha *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: COREN-SP 123.456"
                        value={testemunhaCoren}
                        onChange={(e) => setTestemunhaCoren(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Clinical Notes */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Observações de Enfermagem (Opcional)
                </label>
                <textarea
                  placeholder="Ex: Administrado por via IV em 30min sem intercorrências..."
                  value={observacoesAplicacao}
                  onChange={(e) => setObservacoesAplicacao(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                <Check className="w-5 h-5" />
                <span>Confirmar e Registrar Aplicação</span>
              </button>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Cancel / Non-Administration Justification */}
      {doseToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 bg-rose-950 text-white flex items-center justify-between border-b border-rose-900">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-400" />
                Justificativa de Não Administração
              </h3>
              <button onClick={() => setDoseToCancel(null)} className="text-rose-300 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmCancellation} className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-300 font-medium">
                Informe o motivo pelo qual a dose de <strong>{doseToCancel.nomeMedicamento}</strong> não foi administrada ao paciente <strong>{doseToCancel.nomePaciente} ({doseToCancel.leito})</strong>:
              </p>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo / Justificativa Restrita *
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-rose-500 mb-2"
                >
                  <option value="">Selecione o motivo...</option>
                  <option value="Recusa do Paciente">Recusa do Paciente</option>
                  <option value="Suspenso por Ordem Médica">Suspenso por Ordem Médica</option>
                  <option value="Jejum para Exame / Procedimento">Jejum para Exame / Procedimento</option>
                  <option value="Paciente Ausente do Leito">Paciente Ausente do Leito</option>
                  <option value="Sem Acesso Venoso / Dificuldade de Punção">Sem Acesso Venoso / Dificuldade de Punção</option>
                  <option value="Alergia Identificada">Alergia Identificada</option>
                </select>

                <textarea
                  placeholder="Detalhes adicionais..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                  rows={2}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
                <span>Salvar Registro de Suspensão</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Add Manual Extra Schedule (SOS / Avulso) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 bg-indigo-950 text-white flex items-center justify-between border-b border-indigo-900">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Agendar Dose Extra / SOS
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-indigo-300 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewSchedule} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Paciente / Leito *
                </label>
                <select
                  value={newPacId}
                  onChange={(e) => setNewPacId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.leito} - {p.nomePaciente}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Medicamento Prescrito *
                </label>
                <select
                  value={newMedId}
                  onChange={(e) => setNewMedId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
                >
                  {medicaments.map(m => (
                    <option key={m.id} value={m.id}>{m.nomeComercial} ({m.dosagem}) {m.altaVigilancia ? '⚠️ MAV' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Horário de Aplicação *
                  </label>
                  <input
                    type="time"
                    value={newHorario}
                    onChange={(e) => setNewHorario(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-extrabold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Dosagem
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 500mg"
                    value={newDosagem}
                    onChange={(e) => setNewDosagem(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <Check className="w-5 h-5" />
                <span>Salvar Aprazamento</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
