import React, { useState, useEffect } from 'react';
import { 
  X, 
  QrCode, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  DoorOpen, 
  Calendar, 
  Package, 
  Layers,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { ResidentMedicationBox } from '../types';
import { 
  generateBoxQrDataUrl, 
  printSingleBoxLabel, 
  printAllBoxesQrSheet, 
  downloadBoxQrImage,
  getBoxQrPayload
} from '../utils/boxQrCodeUtils';
import { playBeepSound, triggerHaptic } from '../utils/pharmacyUtils';

interface BoxQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  box: ResidentMedicationBox | null;
  allBoxes: ResidentMedicationBox[];
  onSelectBox?: (box: ResidentMedicationBox) => void;
  showToast: (msg: string) => void;
}

export const BoxQrModal: React.FC<BoxQrModalProps> = ({
  isOpen,
  onClose,
  box,
  allBoxes,
  onSelectBox,
  showToast
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [currentBox, setCurrentBox] = useState<ResidentMedicationBox | null>(box);

  useEffect(() => {
    setCurrentBox(box);
  }, [box]);

  useEffect(() => {
    if (!isOpen || !currentBox) return;

    let isMounted = true;
    setLoading(true);

    generateBoxQrDataUrl(currentBox, { width: 360, margin: 2 })
      .then(url => {
        if (isMounted) {
          setQrDataUrl(url);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Falha ao gerar QR:', err);
        if (isMounted) {
          setLoading(false);
          showToast('Erro ao renderizar QR code.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentBox, showToast]);

  if (!isOpen || !currentBox) return null;

  const payload = getBoxQrPayload(currentBox);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      playBeepSound();
      triggerHaptic();
      showToast('📋 Link do QR Code copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Não foi possível copiar o link.');
    }
  };

  const handlePrintSingle = () => {
    if (!qrDataUrl) return;
    printSingleBoxLabel(currentBox, qrDataUrl);
    playBeepSound();
    triggerHaptic();
  };

  const handlePrintAll = async () => {
    try {
      showToast('Preparando folha geral de etiquetas da ILPI...');
      await printAllBoxesQrSheet(allBoxes);
      playBeepSound();
      triggerHaptic();
    } catch (e) {
      console.error(e);
      showToast('Erro ao preparar folha de etiquetas.');
    }
  };

  const handleDownloadImage = () => {
    if (!qrDataUrl) return;
    downloadBoxQrImage(currentBox, qrDataUrl);
    playBeepSound();
    triggerHaptic();
    showToast('💾 Imagem do QR Code baixada.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold tracking-wider text-indigo-300 uppercase block">
                Etiqueta de Identificação
              </span>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>QR Code da Caixa</span>
                <span className="text-xs bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full font-mono">
                  {currentBox.roomNumber}
                </span>
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-200">
          
          {/* Box Selector if multiple boxes exist */}
          {allBoxes.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Alternar Caixa:
              </label>
              <select
                value={currentBox.id}
                onChange={e => {
                  const target = allBoxes.find(b => b.id === e.target.value);
                  if (target) {
                    setCurrentBox(target);
                    if (onSelectBox) onSelectBox(target);
                  }
                }}
                className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                {allBoxes.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.roomNumber} · {b.residentName} ({b.medications.length} meds)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 relative">
            <div className="bg-white p-3.5 rounded-2xl shadow-md border border-slate-200 inline-block transition-transform hover:scale-[1.02]">
              {loading ? (
                <div className="w-56 h-56 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-medium">Gerando QR Code...</span>
                </div>
              ) : qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt={`QR Code da Caixa de ${currentBox.residentName}`}
                  className="w-56 h-56 object-contain rounded-lg"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-rose-500 text-xs text-center p-4">
                  Não foi possível gerar a imagem do código.
                </div>
              )}
            </div>

            {/* Instruction Callout */}
            <div className="mt-4 text-center max-w-sm">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 mb-1.5">
                <Sparkles className="w-3 h-3" />
                <span>Leitura Instantânea</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Cole esta etiqueta na caixa acrílica de <strong>{currentBox.residentName}</strong>. 
                Ao apontar a câmera do cuidador, a ficha de administração abre diretamente.
              </p>
            </div>
          </div>

          {/* Summary Details */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-slate-500 dark:text-slate-400">Residente:</span>
              <span className="text-slate-900 dark:text-white font-bold">{currentBox.residentName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Quarto:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{currentBox.roomNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Ciclo Atual:</span>
              <span>{currentBox.periodDays} Dias ({currentBox.startDate ? currentBox.startDate.split('-').reverse().join('/') : ''} a {currentBox.endDate ? currentBox.endDate.split('-').reverse().join('/') : ''})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Medicamentos:</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {currentBox.medications.length} itens prescritos
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-mono text-[10px]">
              <span className="text-slate-400">ID Identificador:</span>
              <span className="text-slate-600 dark:text-slate-400">{currentBox.id}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={handlePrintSingle}
                disabled={loading || !qrDataUrl}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer disabled:opacity-50 min-h-[44px]"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Etiqueta</span>
              </button>

              <button
                onClick={handleDownloadImage}
                disabled={loading || !qrDataUrl}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50 min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Imagem PNG</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 font-medium text-xs border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer min-h-[40px]"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Link Copiado!' : 'Copiar Link / Payload'}</span>
              </button>

              <button
                onClick={handlePrintAll}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 font-medium text-xs border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer min-h-[40px]"
                title="Imprime folha com todos os residentes cadastrados"
              >
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>Imprimir Todas da ILPI</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
