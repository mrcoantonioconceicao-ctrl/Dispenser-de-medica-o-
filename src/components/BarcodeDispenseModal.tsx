import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Barcode, 
  CheckCircle2, 
  ShieldAlert, 
  User, 
  Bed, 
  Package, 
  AlertTriangle, 
  Search,
  Zap,
  Check,
  Video,
  Camera
} from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { LoteEstoque, Medicamento, PacienteCaixa, EnfermeiraProfile } from '../types';
import { getExpiryBadgeInfo, getExpiryTier, formatDatePtBr, playBeepSound, triggerHaptic } from '../utils/pharmacyUtils';

interface BarcodeDispenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  lots: LoteEstoque[];
  medicaments: Medicamento[];
  patients: PacienteCaixa[];
  nurse: EnfermeiraProfile;
  onConfirmDispense: (dispenseData: {
    loteId: string;
    medicamentoId: string;
    pacienteId: string;
    quantidade: number;
    codigoBarras: string;
    duplaChecagemOK: boolean;
  }) => void;
  preselectedLoteId?: string;
  preselectedPacienteId?: string;
}

export const BarcodeDispenseModal: React.FC<BarcodeDispenseModalProps> = ({
  isOpen,
  onClose,
  lots,
  medicaments,
  patients,
  nurse,
  onConfirmDispense,
  preselectedLoteId,
  preselectedPacienteId
}) => {
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [selectedLoteId, setSelectedLoteId] = useState<string>(preselectedLoteId || lots[0]?.id || '');
  const [selectedPacienteId, setSelectedPacienteId] = useState<string>(preselectedPacienteId || patients[0]?.id || '');
  const [quantidadeDispensa, setQuantidadeDispensa] = useState<number>(1);
  const [duplaChecagemConfirmed, setDuplaChecagemConfirmed] = useState<boolean>(false);
  const [manualBarcodeSearch, setManualBarcodeSearch] = useState<string>('');

  // Camera Barcode Scanner state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const [isScanningActive, setIsScanningActive] = useState<boolean>(false);
  const [cameraStatus, setCameraStatus] = useState<string>('Aponte a câmera para o código de barras');

  useEffect(() => {
    if (preselectedLoteId) setSelectedLoteId(preselectedLoteId);
    if (preselectedPacienteId) setSelectedPacienteId(preselectedPacienteId);
  }, [preselectedLoteId, preselectedPacienteId]);

  useEffect(() => {
    if (isOpen) {
      startBarcodeScanner();
    } else {
      stopBarcodeScanner();
    }
    return () => {
      stopBarcodeScanner();
    };
  }, [isOpen]);

  const startBarcodeScanner = async () => {
    try {
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      if (videoRef.current) {
        setIsScanningActive(true);
        setCameraStatus('Câmera ativa. Buscando código de barras...');

        await codeReader.decodeFromVideoDevice(
          undefined, // Default environment camera
          videoRef.current,
          (result, error) => {
            if (result) {
              const barcodeText = result.getText();
              handleBarcodeScanned(barcodeText);
            }
          }
        );
      }
    } catch (err) {
      console.warn("Câmera indisponível para leitura de código de barras:", err);
      setCameraStatus("Câmera indisponível. Digite ou selecione o lote abaixo.");
      setIsScanningActive(false);
    }
  };

  const stopBarcodeScanner = () => {
    if (codeReaderRef.current) {
      // BrowserMultiFormatReader does not have a direct reset method in recent versions,
      // but stopping tracks on video stream cleans up nicely.
      codeReaderRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanningActive(false);
  };

  const handleBarcodeScanned = (barcode: string) => {
    if (!barcode || barcode === scannedBarcode) return;

    setScannedBarcode(barcode);
    playBeepSound();
    triggerHaptic();

    // Match lot with this barcode or standard barcode of medicine
    const matchedMed = medicaments.find(m => m.codigoBarrasPadrao === barcode);
    if (matchedMed) {
      const matchedLot = lots.find(l => l.medicamentoId === matchedMed.id && l.quantidadeAtual > 0);
      if (matchedLot) {
        setSelectedLoteId(matchedLot.id);
        setCameraStatus(`Código LIDO: ${barcode} (${matchedMed.nomeComercial})`);
      }
    } else {
      setCameraStatus(`Código LIDO: ${barcode} (Selecione o lote correspondente)`);
    }
  };

  const handleManualSearch = (code: string) => {
    setManualBarcodeSearch(code);
    if (code.trim().length >= 4) {
      handleBarcodeScanned(code.trim());
    }
  };

  if (!isOpen) return null;

  const selectedLote = lots.find(l => l.id === selectedLoteId) || lots[0];
  const selectedMedicamento = selectedLote 
    ? medicaments.find(m => m.id === selectedLote.medicamentoId) 
    : undefined;
  const selectedPaciente = patients.find(p => p.id === selectedPacienteId) || patients[0];

  const expiryTier = selectedLote ? getExpiryTier(selectedLote.dataValidade) : 'SAFE';
  const badgeInfo = getExpiryBadgeInfo(expiryTier);

  const handleDispense = () => {
    if (!selectedLote || !selectedMedicamento || !selectedPaciente) {
      alert("Por favor, selecione o medicamento e o paciente.");
      return;
    }

    if (selectedLote.quantidadeAtual < quantidadeDispensa) {
      alert(`Quantidade indisponível em estoque. Estoque atual: ${selectedLote.quantidadeAtual} unidades.`);
      return;
    }

    if (selectedMedicamento.altaVigilancia && !duplaChecagemConfirmed) {
      alert("⚠️ Medicamento de Alta Vigilância (MAV)! Você DEVE marcar a confirmação de dupla checagem.");
      return;
    }

    playBeepSound();
    triggerHaptic();

    onConfirmDispense({
      loteId: selectedLote.id,
      medicamentoId: selectedMedicamento.id,
      pacienteId: selectedPaciente.id,
      quantidade: quantidadeDispensa,
      codigoBarras: scannedBarcode || selectedMedicamento.codigoBarrasPadrao,
      duplaChecagemOK: duplaChecagemConfirmed
    });

    stopBarcodeScanner();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-indigo-950 text-white flex items-center justify-between border-b border-indigo-900">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Barcode className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Baixa Automática & Dispensação Rápida
              </h2>
              <p className="text-xs text-indigo-200">
                Retirada do Estoque para a Caixa do Paciente
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopBarcodeScanner();
              onClose();
            }}
            className="p-1.5 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-900/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* Live Camera Scanner Box */}
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-3 border border-indigo-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-indigo-400 text-xs">
                <Camera className="w-4 h-4 text-indigo-400 animate-pulse" />
                Leitor de Código de Barras (Câmera Nativa):
              </span>
              <span className="text-[10px] bg-indigo-900/80 text-indigo-200 px-2 py-0.5 rounded font-mono">
                {scannedBarcode ? `Lido: ${scannedBarcode}` : "Pronto para Leitura"}
              </span>
            </div>

            {/* Video Feed viewport */}
            <div className="relative h-28 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-pulse"></div>
            </div>

            {/* Manual Barcode Input Search */}
            <div className="relative pt-1">
              <input
                type="text"
                placeholder="Ou digite o código de barras (EAN) manualmente..."
                value={manualBarcodeSearch}
                onChange={(e) => handleManualSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono text-[11px] outline-none focus:border-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
            </div>
          </div>

          {/* Medication Selector & Detail Card */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700 dark:text-slate-300">
              Medicamento e Lote em Estoque *
            </label>
            <select
              value={selectedLoteId}
              onChange={(e) => setSelectedLoteId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {lots.map((lote) => {
                const med = medicaments.find(m => m.id === lote.medicamentoId);
                return (
                  <option key={lote.id} value={lote.id} disabled={lote.quantidadeAtual <= 0}>
                    {med?.nomeComercial} - {med?.dosagem} | Lote: {lote.lote} (Val: {formatDatePtBr(lote.dataValidade)}) | Qtd: {lote.quantidadeAtual} un
                  </option>
                );
              })}
            </select>

            {/* Detail Card of Selected Medication */}
            {selectedMedicamento && selectedLote && (
              <div className={`p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border ${badgeInfo.cardBorder} space-y-2`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {selectedMedicamento.nomeComercial}
                      </h4>
                      {selectedMedicamento.altaVigilancia && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/40">
                          MAV
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                      {selectedMedicamento.principioAtivo} • {selectedMedicamento.dosagem} ({selectedMedicamento.formaFarmaceutica})
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${badgeInfo.colorClass}`}>
                    {badgeInfo.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-slate-600 dark:text-slate-300">
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[10px]">Estoque Disponível</span>
                    <strong className="text-slate-900 dark:text-white text-sm">{selectedLote.quantidadeAtual} unidades</strong>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[10px]">Local no Posto</span>
                    <strong className="text-slate-900 dark:text-white">{selectedLote.localizacaoPrateleira}</strong>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  💡 {selectedMedicamento.paraQueServe}
                </p>
              </div>
            )}
          </div>

          {/* Patient Box Target Selector */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Bed className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Caixa do Paciente de Destino *
            </label>
            <select
              value={selectedPacienteId}
              onChange={(e) => setSelectedPacienteId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.leito} - {p.nomePaciente} ({p.prontuario})
                </option>
              ))}
            </select>

            {selectedPaciente && (
              <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-[11px] text-indigo-900 dark:text-indigo-200 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>Diagnóstico: {selectedPaciente.diagnosticoResumido}</span>
                </div>
                {selectedPaciente.alergias.length > 0 && (
                  <div className="text-rose-600 dark:text-rose-400 font-extrabold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>ALERGIAS RELATADAS: {selectedPaciente.alergias.join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                Quantidade a Retirar
              </span>
              <span className="text-[10px] text-slate-500">
                Baixa imediata do saldo físico
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setQuantidadeDispensa(Math.max(1, quantidadeDispensa - 1))}
                className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 font-bold text-base flex items-center justify-center border border-slate-300 dark:border-slate-600 cursor-pointer shadow-sm"
              >
                -
              </button>
              <span className="font-extrabold text-base text-slate-900 dark:text-white w-6 text-center">
                {quantidadeDispensa}
              </span>
              <button
                type="button"
                onClick={() => setQuantidadeDispensa(quantidadeDispensa + 1)}
                className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 font-bold text-base flex items-center justify-center border border-slate-300 dark:border-slate-600 cursor-pointer shadow-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* High-Alert Medication (MAV) Double Check Confirmation */}
          {selectedMedicamento?.altaVigilancia && (
            <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-amber-700 dark:text-amber-300">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Exigência Protocolar: Dupla Checagem MAV</span>
              </div>
              <p className="text-[11px]">
                Medicamentos de alta vigilância exigem verificação por dois profissionais. Confirme que a dose e o leito foram conferidos.
              </p>
              <label className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={duplaChecagemConfirmed}
                  onChange={(e) => setDuplaChecagemConfirmed(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600"
                />
                <span>Realizei a dupla checagem com a equipe de enfermagem</span>
              </label>
            </div>
          )}

          {/* Confirm Button */}
          <button
            onClick={handleDispense}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer transition-all"
          >
            <Check className="w-5 h-5" />
            <span>Confirmar Baixa & Colocar na Caixa do Paciente</span>
          </button>

        </div>
      </div>
    </div>
  );
};
