import React, { useState, useMemo } from 'react';
import { 
  Home, 
  User, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Package, 
  Plus, 
  Search, 
  History, 
  FileText, 
  RefreshCw, 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  ChevronRight, 
  DoorOpen,
  Check,
  AlertCircle,
  HelpCircle,
  X,
  Printer,
  QrCode,
  Camera
} from 'lucide-react';
import { Caregiver, ResidentMedicationBox, ResidentMedicationItem, CaregiverAdministrationLog } from '../types';
import { playBeepSound, triggerHaptic } from '../utils/pharmacyUtils';
import { BoxQrModal } from './BoxQrModal';
import { ScanBoxQrModal } from './ScanBoxQrModal';

interface ResidentMedicationBoxViewProps {
  caregivers: Caregiver[];
  activeCaregiver: Caregiver;
  onSelectCaregiver: (caregiver: Caregiver) => void;
  boxes: ResidentMedicationBox[];
  onUpdateBoxes: (boxes: ResidentMedicationBox[]) => void;
  showToast: (msg: string) => void;
  initialBoxId?: string;
}

export const ResidentMedicationBoxView: React.FC<ResidentMedicationBoxViewProps> = ({
  caregivers,
  activeCaregiver,
  onSelectCaregiver,
  boxes,
  onUpdateBoxes,
  showToast,
  initialBoxId
}) => {
  // Active selected resident box
  const [selectedBoxId, setSelectedBoxId] = useState<string>(() => initialBoxId || boxes[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'CARDS' | 'HISTORY_SHEET'>('CARDS');

  // Sync external initialBoxId if changed
  React.useEffect(() => {
    if (initialBoxId && boxes.some(b => b.id.toLowerCase() === initialBoxId.toLowerCase())) {
      const match = boxes.find(b => b.id.toLowerCase() === initialBoxId.toLowerCase());
      if (match) setSelectedBoxId(match.id);
    }
  }, [initialBoxId, boxes]);

  // QR Code Generation & Scanning Modals state
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrModalTargetBox, setQrModalTargetBox] = useState<ResidentMedicationBox | null>(null);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  // Modals state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinTargetCaregiver, setPinTargetCaregiver] = useState<Caregiver | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Administration confirmation modal state
  const [administerModalItem, setAdministerModalItem] = useState<{
    medication: ResidentMedicationItem;
    scheduleTime: string;
    quantity: number;
  } | null>(null);
  const [administerNotes, setAdministerNotes] = useState('');

  // Restock modal state
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockMedicationId, setRestockMedicationId] = useState<string>('');
  const [restockQuantity, setRestockQuantity] = useState<number>(10);

  // New resident modal state
  const [isNewResidentModalOpen, setIsNewResidentModalOpen] = useState(false);
  const [newResidentName, setNewResidentName] = useState('');
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newPeriodDays, setNewPeriodDays] = useState(5);

  // New medication modal state
  const [isNewMedModalOpen, setIsNewMedModalOpen] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedPresentation, setNewMedPresentation] = useState('');
  const [newMedSchedules, setNewMedSchedules] = useState('08:00, 20:00');
  const [newMedDailyUsage, setNewMedDailyUsage] = useState(2);
  const [newMedCurrentStock, setNewMedCurrentStock] = useState(10);
  const [newMedInstructions, setNewMedInstructions] = useState('');

  // Current active box
  const activeBox = useMemo(() => {
    return boxes.find(b => b.id === selectedBoxId) || boxes[0];
  }, [boxes, selectedBoxId]);

  // Filtered boxes for selector
  const filteredBoxes = useMemo(() => {
    if (!searchTerm.trim()) return boxes;
    const term = searchTerm.toLowerCase();
    return boxes.filter(b => 
      b.residentName.toLowerCase().includes(term) || 
      b.roomNumber.toLowerCase().includes(term)
    );
  }, [boxes, searchTerm]);

  // Handle Switch Caregiver PIN flow
  const handleStartSwitchCaregiver = (cg: Caregiver) => {
    setPinTargetCaregiver(cg);
    setEnteredPin('');
    setPinError(false);
    setIsPinModalOpen(true);
  };

  const handleVerifyPin = (pin: string) => {
    if (!pinTargetCaregiver) return;
    if (pin === pinTargetCaregiver.pinCode) {
      onSelectCaregiver(pinTargetCaregiver);
      setIsPinModalOpen(false);
      setEnteredPin('');
      setPinError(false);
      playBeepSound();
      triggerHaptic();
      showToast(`🔑 Sessão iniciada: Cuidador ${pinTargetCaregiver.name}`);
    } else {
      setPinError(true);
      triggerHaptic();
      setEnteredPin('');
    }
  };

  const handlePinDigit = (digit: string) => {
    if (enteredPin.length < 4) {
      const nextPin = enteredPin + digit;
      setEnteredPin(nextPin);
      setPinError(false);
      if (nextPin.length === 4) {
        handleVerifyPin(nextPin);
      }
    }
  };

  // Perform Bedside Medication Administration & Balance Deduction
  const handleConfirmAdministration = () => {
    if (!activeBox || !administerModalItem) return;

    const { medication, scheduleTime, quantity } = administerModalItem;

    if (medication.currentStock < quantity) {
      showToast(`⚠️ Saldo insuficiente! Restam apenas ${medication.currentStock} unidades.`);
      return;
    }

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('pt-BR');
    const timeFormatted = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const resultingStock = medication.currentStock - quantity;

    const newLog: CaregiverAdministrationLog = {
      id: `log-${Date.now()}`,
      timestamp: now.toISOString(),
      dateFormatted,
      timeFormatted,
      medicationName: `${medication.name} ${medication.presentation}`,
      quantityAdministered: quantity,
      remainingStock: resultingStock,
      caregiverName: activeCaregiver.name,
      scheduleTime,
      notes: administerNotes.trim() || undefined
    };

    // Update medication stock & log history in box
    const updatedBoxes = boxes.map(box => {
      if (box.id === activeBox.id) {
        const updatedMeds = box.medications.map(med => {
          if (med.id === medication.id) {
            return {
              ...med,
              currentStock: resultingStock
            };
          }
          return med;
        });

        return {
          ...box,
          medications: updatedMeds,
          history: [newLog, ...box.history],
          pendingSync: true
        };
      }
      return box;
    });

    onUpdateBoxes(updatedBoxes);
    playBeepSound();
    triggerHaptic();
    showToast(`✅ Baixa registrada! ${quantity}x ${medication.name} administrado por ${activeCaregiver.name}. Saldo: ${resultingStock}`);

    setAdministerModalItem(null);
    setAdministerNotes('');
  };

  // Quick 1-Click Administration Trigger
  const handleQuickAdministerClick = (med: ResidentMedicationItem, schedule: string, defaultQty: number = 1) => {
    setAdministerModalItem({
      medication: med,
      scheduleTime: schedule,
      quantity: defaultQty
    });
    setAdministerNotes('');
  };

  // Handle Box Restock
  const handleConfirmRestock = () => {
    if (!activeBox || !restockMedicationId || restockQuantity <= 0) return;

    const todayStr = new Date().toLocaleDateString('pt-BR');
    const targetMed = activeBox.medications.find(m => m.id === restockMedicationId);
    if (!targetMed) return;

    const newStock = targetMed.currentStock + restockQuantity;

    const restockLog: CaregiverAdministrationLog = {
      id: `log-restock-${Date.now()}`,
      timestamp: new Date().toISOString(),
      dateFormatted: todayStr,
      timeFormatted: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      medicationName: `${targetMed.name} ${targetMed.presentation}`,
      quantityAdministered: -restockQuantity, // negative denotes replenishment
      remainingStock: newStock,
      caregiverName: activeCaregiver.name,
      notes: `Reabastecimento físico da caixa (+${restockQuantity} un).`
    };

    const updatedBoxes = boxes.map(box => {
      if (box.id === activeBox.id) {
        const updatedMeds = box.medications.map(med => {
          if (med.id === restockMedicationId) {
            return { ...med, currentStock: newStock };
          }
          return med;
        });

        return {
          ...box,
          lastRestockDate: new Date().toISOString().split('T')[0],
          medications: updatedMeds,
          history: [restockLog, ...box.history],
          pendingSync: true
        };
      }
      return box;
    });

    onUpdateBoxes(updatedBoxes);
    showToast(`📦 Caixa reabastecida com sucesso! Novo saldo de ${targetMed.name}: ${newStock} un.`);
    setIsRestockModalOpen(false);
  };

  // Add New Resident Box
  const handleCreateResidentBox = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResidentName.trim() || !newRoomNumber.trim()) return;

    const today = new Date();
    const endDate = new Date(today.getTime() + newPeriodDays * 86400000);

    const newBox: ResidentMedicationBox = {
      id: `res-box-${Date.now()}`,
      residentName: newResidentName.trim(),
      roomNumber: newRoomNumber.trim(),
      startDate: today.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      periodDays: newPeriodDays,
      lastRestockDate: today.toISOString().split('T')[0],
      medications: [],
      history: [],
      pendingSync: true
    };

    onUpdateBoxes([...boxes, newBox]);
    setSelectedBoxId(newBox.id);
    setIsNewResidentModalOpen(false);
    setNewResidentName('');
    setNewRoomNumber('');
    showToast(`🏡 Caixa criada para ${newBox.residentName} (${newBox.roomNumber}).`);
  };

  // Add New Medication to Current Box
  const handleCreateMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBox || !newMedName.trim()) return;

    const scheduleList = newMedSchedules
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const periodTotal = newMedDailyUsage * activeBox.periodDays;

    const newItem: ResidentMedicationItem = {
      id: `med-item-${Date.now()}`,
      name: newMedName.trim(),
      presentation: newMedPresentation.trim() || 'Comprimido',
      schedules: scheduleList.length ? scheduleList : ['08:00'],
      dailyUsage: Number(newMedDailyUsage) || 1,
      periodTotal: periodTotal || Number(newMedCurrentStock),
      currentStock: Number(newMedCurrentStock) || 0,
      specialInstructions: newMedInstructions.trim() || undefined
    };

    const updatedBoxes = boxes.map(box => {
      if (box.id === activeBox.id) {
        return {
          ...box,
          medications: [...box.medications, newItem],
          pendingSync: true
        };
      }
      return box;
    });

    onUpdateBoxes(updatedBoxes);
    setIsNewMedModalOpen(false);
    setNewMedName('');
    setNewMedPresentation('');
    setNewMedInstructions('');
    showToast(`💊 ${newItem.name} adicionado à prescrição de ${activeBox.residentName}.`);
  };

  // Check which administrations happened today for a schedule
  const todayStrPt = new Date().toLocaleDateString('pt-BR');
  const administeredToday = useMemo(() => {
    if (!activeBox) return new Set<string>();
    const set = new Set<string>();
    activeBox.history.forEach(log => {
      if (log.dateFormatted === todayStrPt && log.scheduleTime) {
        set.add(`${log.medicationName}-${log.scheduleTime}`);
      }
    });
    return set;
  }, [activeBox, todayStrPt]);

  return (
    <div className="space-y-6">
      
      {/* 1. TOP BAR: ACTIVE CAREGIVER SHIFT & QUICK PIN LOGIN */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                  Sessão Ativa no Posto ILPI
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{activeCaregiver.name}</span>
                <span className="text-xs text-slate-500 font-normal">({activeCaregiver.role})</span>
              </h2>
            </div>
          </div>

          {/* Quick Caregiver Switcher */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden md:inline">
              Troca rápida de cuidador:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {caregivers.map(cg => {
                const isActive = cg.id === activeCaregiver.id;
                return (
                  <button
                    key={cg.id}
                    onClick={() => {
                      if (!isActive) handleStartSwitchCaregiver(cg);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[40px] whitespace-nowrap ${
                      isActive 
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {isActive ? <ShieldCheck className="w-3.5 h-3.5" /> : <KeyRound className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{cg.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 2. RESIDENT BOX SELECTION TABS & CREATE BUTTON */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Caixa de Medicamentos do Residente
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar residente ou quarto..."
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
              />
            </div>

            <button
              onClick={() => setIsScanModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm min-h-[40px] whitespace-nowrap"
              title="Aponte a câmera para ler o QR Code da caixa do residente"
            >
              <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Escanear Caixa</span>
            </button>

            <button
              onClick={() => setIsNewResidentModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm min-h-[40px] whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Residente</span>
            </button>
          </div>
        </div>

        {/* Resident Carousel / Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {filteredBoxes.map(box => {
            const isSelected = box.id === activeBox?.id;
            const hasCriticalStock = box.medications.some(m => m.currentStock <= 2);

            return (
              <div
                key={box.id}
                onClick={() => setSelectedBoxId(box.id)}
                className={`flex items-center justify-between gap-2.5 px-4 py-3 rounded-2xl border text-left transition-all cursor-pointer min-w-[230px] max-w-[290px] shrink-0 min-h-[56px] ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                }`}>
                  <DoorOpen className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[11px] font-semibold uppercase tracking-wider truncate ${
                      isSelected ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {box.roomNumber}
                    </span>
                    {hasCriticalStock && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="Possui medicamento com estoque crítico" />
                    )}
                  </div>
                  <h4 className="font-bold text-sm truncate leading-tight mt-0.5">
                    {box.residentName}
                  </h4>
                </div>

                {/* Quick QR View/Print button on card */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQrModalTargetBox(box);
                    setIsQrModalOpen(true);
                  }}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                    isSelected 
                      ? 'hover:bg-white/20 text-white/80 hover:text-white' 
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600'
                  }`}
                  title={`Ver e imprimir QR Code de ${box.residentName}`}
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. ACTIVE RESIDENT BOX CARD & CONTROL SHEET */}
      {activeBox && (
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          
          {/* Header of Active Box */}
          <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-b border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold">
                  <span>{activeBox.roomNumber}</span>
                  <span>·</span>
                  <span>Ciclo de {activeBox.periodDays} Dias</span>
                  {activeBox.lastRestockDate && (
                    <>
                      <span>·</span>
                      <span>Abastecido em: {activeBox.lastRestockDate.split('-').reverse().join('/')}</span>
                    </>
                  )}
                </div>
                <h3 className="text-2xl font-bold tracking-tight mt-1 text-white flex items-center gap-3">
                  <span>{activeBox.residentName}</span>
                </h3>
                {activeBox.notes && (
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    📝 {activeBox.notes}
                  </p>
                )}
              </div>

              {/* Action Buttons: Restock + Add Med + QR Code */}
              <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                <button
                  onClick={() => {
                    setQrModalTargetBox(activeBox);
                    setIsQrModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-indigo-500/25 hover:bg-indigo-500/40 text-indigo-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-indigo-400/30 min-h-[44px]"
                  title="Exibir e imprimir etiqueta QR Code desta caixa"
                >
                  <QrCode className="w-4 h-4 text-indigo-300" />
                  <span>Etiqueta QR</span>
                </button>

                <button
                  onClick={() => {
                    setRestockMedicationId(activeBox.medications[0]?.id || '');
                    setRestockQuantity(10);
                    setIsRestockModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm min-h-[44px]"
                >
                  <Package className="w-4 h-4" />
                  <span>Reabastecer Caixa</span>
                </button>

                <button
                  onClick={() => setIsNewMedModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-white/20 min-h-[44px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Medicamento</span>
                </button>
              </div>
            </div>

            {/* View Mode Toggle: Grid Cards vs Digital Paper Sheet */}
            <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-700/80">
              <button
                onClick={() => setActiveSubTab('CARDS')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer min-h-[40px] ${
                  activeSubTab === 'CARDS'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Medicamentos & Baixa Rápida</span>
              </button>

              <button
                onClick={() => setActiveSubTab('HISTORY_SHEET')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer min-h-[40px] ${
                  activeSubTab === 'HISTORY_SHEET'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Histórico de Uso e Saldo ({activeBox.history.length})</span>
              </button>
            </div>
          </div>

          {/* TAB 1: MEDICATIONS LIST WITH 1-CLICK DEDUCTION */}
          {activeSubTab === 'CARDS' && (
            <div className="p-5 space-y-4">
              {activeBox.medications.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Package className="w-12 h-12 text-slate-400 mx-auto" />
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    Nenhum medicamento cadastrado nesta caixa
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Adicione a primeira prescrição do residente com horários e saldo inicial.
                  </p>
                  <button
                    onClick={() => setIsNewMedModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Primeiro Medicamento</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {activeBox.medications.map(med => {
                    const isZero = med.currentStock <= 0;
                    const isLow = med.currentStock > 0 && med.currentStock <= (med.dailyUsage * 1.5 || 2);

                    return (
                      <div 
                        key={med.id}
                        className={`rounded-2xl border p-4.5 transition-all flex flex-col justify-between gap-4 ${
                          isZero 
                            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60'
                            : isLow
                              ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {/* Upper Info */}
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                                {med.name}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{med.presentation}</span>
                                <span>·</span>
                                <span>Uso: {med.dailyUsage}x/dia</span>
                                <span>·</span>
                                <span>Período: {med.periodTotal} un</span>
                              </div>
                            </div>

                            {/* Saldo Físico Destaque */}
                            <div className={`text-right px-3 py-1.5 rounded-xl border flex flex-col items-end shrink-0 ${
                              isZero 
                                ? 'bg-rose-100 dark:bg-rose-900/40 border-rose-300 text-rose-800 dark:text-rose-200' 
                                : isLow 
                                  ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 text-amber-900 dark:text-amber-200'
                                  : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                            }`}>
                              <span className="text-[10px] font-bold uppercase tracking-wider">
                                Saldo Físico
                              </span>
                              <span className="text-2xl font-black tabular-nums leading-none mt-0.5">
                                {med.currentStock}
                              </span>
                              <span className="text-[10px] font-medium opacity-90 mt-0.5">
                                {isZero ? '⚠️ Esgotado' : isLow ? '⚠️ Crítico' : '✓ Regular'}
                              </span>
                            </div>
                          </div>

                          {/* Special Instructions (e.g., Haloperidol Decanoato) */}
                          {med.specialInstructions && (
                            <div className="mt-3 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                              <span className="font-bold text-slate-900 dark:text-white block text-[11px] mb-0.5">
                                📌 Orientação Especial:
                              </span>
                              {med.specialInstructions}
                            </div>
                          )}
                        </div>

                        {/* Lower Action Buttons: Schedules 1-Click Deductions */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                            Dar baixa por horário aprazado (1 clique):
                          </span>

                          <div className="flex flex-wrap items-center gap-2">
                            {med.schedules.map(time => {
                              const alreadyAdministered = administeredToday.has(`${med.name} ${med.presentation}-${time}`);

                              return (
                                <button
                                  key={time}
                                  disabled={med.currentStock <= 0}
                                  onClick={() => handleQuickAdministerClick(med, time, 1)}
                                  className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer min-h-[46px] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
                                    alreadyAdministered
                                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                                      : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white'
                                  }`}
                                  title={alreadyAdministered ? 'Já administrado hoje neste horário. Clique para registrar dose adicional se prescrito.' : 'Dar baixa de 1 dose agora'}
                                >
                                  {alreadyAdministered ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Clock className="w-4 h-4" />}
                                  <span>{time}h</span>
                                  <span className="text-[11px] opacity-80">(-1 un)</span>
                                </button>
                              );
                            })}

                            {/* Extra / Special Dose Button */}
                            <button
                              disabled={med.currentStock <= 0}
                              onClick={() => handleQuickAdministerClick(med, 'Avulso', 1)}
                              className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 min-h-[46px] disabled:opacity-40"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Dose Avulsa</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DIGITALIZED PHYSICAL FORM LOG SHEET */}
          {activeSubTab === 'HISTORY_SHEET' && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Ficha de Controle de Uso e Saldo (Digital)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Registro cronológico auditável de saídas e reposições da caixa.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Folha</span>
                </button>
              </div>

              {activeBox.history.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Nenhum registro de administração efetuado neste ciclo ainda.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Data</th>
                        <th className="py-2.5 px-3">Hora</th>
                        <th className="py-2.5 px-3">Medicamento</th>
                        <th className="py-2.5 px-3 text-center">Horário Prescrito</th>
                        <th className="py-2.5 px-3 text-center">Movimentação</th>
                        <th className="py-2.5 px-3 text-center">Saldo Restante</th>
                        <th className="py-2.5 px-3">Responsável</th>
                        <th className="py-2.5 px-3">Observações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {activeBox.history.map((log) => {
                        const isReplenishment = log.quantityAdministered < 0;

                        return (
                          <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                              {log.dateFormatted}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {log.timeFormatted}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                              {log.medicationName}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                              {log.scheduleTime ? `${log.scheduleTime}h` : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold">
                              {isReplenishment ? (
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  +{Math.abs(log.quantityAdministered)} (Entrada)
                                </span>
                              ) : (
                                <span className="text-rose-600 dark:text-rose-400">
                                  -{log.quantityAdministered}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-black text-slate-900 dark:text-white">
                              {log.remainingStock}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {log.caregiverName}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">
                              {log.notes || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </section>
      )}

      {/* MODAL 1: CONFIRM BED-SIDE ADMINISTRATION & DEDUCTION */}
      {administerModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Confirmar Administração
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeBox?.residentName} • {activeBox?.roomNumber}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setAdministerModalItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Item details */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Medicamento:</span>
                <strong className="text-slate-900 dark:text-white text-sm">
                  {administerModalItem.medication.name}
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Apresentação:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {administerModalItem.medication.presentation}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Horário Aprazado:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {administerModalItem.scheduleTime}h
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Saldo Atual:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {administerModalItem.medication.currentStock} unidades
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-800 dark:text-slate-200">Quantidade Ministrada:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdministerModalItem(prev => prev ? ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }) : null)}
                    className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 font-bold text-slate-800 dark:text-white flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono font-black text-base text-slate-900 dark:text-white w-6 text-center">
                    {administerModalItem.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAdministerModalItem(prev => prev ? ({ ...prev, quantity: Math.min(prev.medication.currentStock, prev.quantity + 1) }) : null)}
                    className="w-8 h-8 rounded-lg bg-emerald-600 font-bold text-white flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Resulting balance preview */}
            <div className="flex items-center justify-between text-xs px-2 text-slate-600 dark:text-slate-400">
              <span>Novo saldo após confirmação:</span>
              <strong className="font-mono text-sm text-indigo-600 dark:text-indigo-400 font-black">
                {administerModalItem.medication.currentStock - administerModalItem.quantity} unidades
              </strong>
            </div>

            {/* Caregiver stamp */}
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <User className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Registrado sob a responsabilidade de: <strong>{activeCaregiver.name}</strong></span>
            </div>

            {/* Optional observation note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Observação (opcional):
              </label>
              <input
                type="text"
                value={administerNotes}
                onChange={e => setAdministerNotes(e.target.value)}
                placeholder="Ex: Administrado no café, aceitou bem..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdministerModalItem(null)}
                className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer min-h-[48px]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAdministration}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 font-bold text-xs text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 cursor-pointer min-h-[48px]"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Baixa</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: QUICK PIN LOGIN / HANDOVER */}
      {isPinModalOpen && pinTargetCaregiver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center">
            
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center font-bold">
              <KeyRound className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Identificação do Cuidador
              </h3>
              <p className="text-xs text-slate-500">
                Digite o PIN de 4 dígitos para <strong>{pinTargetCaregiver.name}</strong>
              </p>
            </div>

            {/* PIN Dots Display */}
            <div className="flex justify-center gap-3 py-2">
              {[0, 1, 2, 3].map(idx => (
                <div 
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border transition-all ${
                    idx < enteredPin.length 
                      ? 'bg-indigo-600 border-indigo-600 scale-110' 
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
              ))}
            </div>

            {pinError && (
              <p className="text-xs text-rose-500 font-bold animate-shake">
                PIN incorreto! Tente novamente.
              </p>
            )}

            {/* Numeric Keypad for fast touch usage */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (key === 'C') {
                      setEnteredPin('');
                      setPinError(false);
                    } else if (key === '⌫') {
                      setEnteredPin(prev => prev.slice(0, -1));
                      setPinError(false);
                    } else {
                      handlePinDigit(key);
                    }
                  }}
                  className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-slate-900 dark:text-white text-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                >
                  {key}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsPinModalOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold pt-2 cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: REABASTECER CAIXA */}
      {isRestockModalOpen && activeBox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Reabastecer Caixa de Medicamento
                </h3>
              </div>
              <button onClick={() => setIsRestockModalOpen(false)} className="p-1 text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Selecione o Medicamento a Reabastecer:
                </label>
                <select
                  value={restockMedicationId}
                  onChange={e => setRestockMedicationId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-medium"
                >
                  {activeBox.medications.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.presentation} (Saldo Atual: {m.currentStock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quantidade Entregue (Comprimidos/Ampolas):
                </label>
                <input
                  type="number"
                  min="1"
                  value={restockQuantity}
                  onChange={e => setRestockQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-base text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex gap-2">
                {[5, 10, 15, 30].map(qty => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setRestockQuantity(qty)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 text-xs cursor-pointer"
                  >
                    +{qty}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRestockModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 cursor-pointer min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRestock}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white shadow-md cursor-pointer min-h-[44px]"
              >
                Adicionar ao Saldo
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 4: NOVO RESIDENTE */}
      {isNewResidentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Home className="w-5 h-5 text-indigo-600" />
                <span>Cadastrar Novo Residente</span>
              </h3>
              <button onClick={() => setIsNewResidentModalOpen(false)} className="p-1 text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateResidentBox} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo do Residente *
                </label>
                <input
                  type="text"
                  required
                  value={newResidentName}
                  onChange={e => setNewResidentName(e.target.value)}
                  placeholder="Ex: Claudemir Fernandes"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quarto / Leito *
                </label>
                <input
                  type="text"
                  required
                  value={newRoomNumber}
                  onChange={e => setNewRoomNumber(e.target.value)}
                  placeholder="Ex: Quarto 07"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Duração do Ciclo de Abastecimento (Dias):
                </label>
                <select
                  value={newPeriodDays}
                  onChange={e => setNewPeriodDays(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-medium"
                >
                  <option value={5}>5 Dias (Ciclo Curto)</option>
                  <option value={7}>7 Dias (Semanal)</option>
                  <option value={15}>15 Dias (Quinzenal)</option>
                  <option value={30}>30 Dias (Mensal)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewResidentModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 cursor-pointer min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-white shadow-md cursor-pointer min-h-[44px]"
                >
                  Criar Caixa
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 5: ADICIONAR MEDICAMENTO À PRESCRIÇÃO */}
      {isNewMedModalOpen && activeBox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                <span>Adicionar Medicamento à Prescrição</span>
              </h3>
              <button onClick={() => setIsNewMedModalOpen(false)} className="p-1 text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMedication} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Medicamento *
                </label>
                <input
                  type="text"
                  required
                  value={newMedName}
                  onChange={e => setNewMedName(e.target.value)}
                  placeholder="Ex: Haldol, Biperideno..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Apresentação (mg/mL):
                  </label>
                  <input
                    type="text"
                    value={newMedPresentation}
                    onChange={e => setNewMedPresentation(e.target.value)}
                    placeholder="Ex: 5 mg, 2 mg/mL"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Saldo Físico Inicial *:
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newMedCurrentStock}
                    onChange={e => setNewMedCurrentStock(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Horários Prescritos (separados por vírgula):
                </label>
                <input
                  type="text"
                  value={newMedSchedules}
                  onChange={e => setNewMedSchedules(e.target.value)}
                  placeholder="Ex: 08:00, 20:00"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Uso Diário (Número de doses ao dia):
                </label>
                <input
                  type="number"
                  min="1"
                  value={newMedDailyUsage}
                  onChange={e => setNewMedDailyUsage(parseInt(e.target.value) || 1)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Orientação Especial (Ex: Decanoato, jejum, via IM):
                </label>
                <textarea
                  rows={2}
                  value={newMedInstructions}
                  onChange={e => setNewMedInstructions(e.target.value)}
                  placeholder="Ex: Aplicar 2 ampolas a cada 15 dias (IM)"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewMedModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 cursor-pointer min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-white shadow-md cursor-pointer min-h-[44px]"
                >
                  Salvar Medicamento
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* QR Code Identification & Label Print Modal */}
      <BoxQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        box={qrModalTargetBox || activeBox}
        allBoxes={boxes}
        onSelectBox={(box) => setSelectedBoxId(box.id)}
        showToast={showToast}
      />

      {/* Scan Box QR Code Camera Modal */}
      <ScanBoxQrModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        boxes={boxes}
        onBoxScanned={(box) => {
          setSelectedBoxId(box.id);
        }}
        showToast={showToast}
      />

    </div>
  );
};
