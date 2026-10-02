import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  QrCode, 
  Camera, 
  AlertTriangle, 
  CheckCircle2, 
  Upload, 
  RefreshCw, 
  Search,
  DoorOpen,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { ResidentMedicationBox } from '../types';
import { parseBoxQrCode } from '../utils/boxQrCodeUtils';
import { playBeepSound, triggerHaptic } from '../utils/pharmacyUtils';

interface ScanBoxQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  boxes: ResidentMedicationBox[];
  onBoxScanned: (box: ResidentMedicationBox) => void;
  showToast: (msg: string) => void;
}

export const ScanBoxQrModal: React.FC<ScanBoxQrModalProps> = ({
  isOpen,
  onClose,
  boxes,
  onBoxScanned,
  showToast
}) => {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Iniciando câmera...');
  const [scanError, setScanError] = useState<string | null>(null);
  const [unrecognizedText, setUnrecognizedText] = useState<string | null>(null);
  const [manualSearch, setManualSearch] = useState<string>('');
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isStoppingRef = useRef<boolean>(false);

  // Initialize camera scanner when modal opens
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      setScanError(null);
      setUnrecognizedText(null);
      // Wait for DOM container 'box-qr-reader-container' to mount
      timer = setTimeout(() => {
        startScanner();
      }, 150);
    } else {
      stopScanner();
    }

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      if (isStoppingRef.current) return;
      isStoppingRef.current = true;
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Erro ao finalizar scanner:', e);
      } finally {
        isStoppingRef.current = false;
        html5QrCodeRef.current = null;
        setCameraActive(false);
      }
    }
  };

  const handleSuccessfulScan = async (decodedText: string) => {
    // Parse the scanned code using the box QR code parser
    const matchedBox = parseBoxQrCode(decodedText, boxes);

    if (matchedBox) {
      playBeepSound();
      triggerHaptic();
      await stopScanner();
      showToast(`📦 Caixa carregada: ${matchedBox.residentName} (${matchedBox.roomNumber})`);
      onBoxScanned(matchedBox);
      onClose();
    } else {
      triggerHaptic();
      setUnrecognizedText(decodedText);
      setStatusMessage('QR Code lido, mas não corresponde a nenhuma caixa cadastrada.');
    }
  };

  const startScanner = async () => {
    try {
      await stopScanner();
      const containerId = 'box-qr-reader-container';
      const container = document.getElementById(containerId);
      if (!container) return;

      const html5QrCode = new Html5Qrcode(containerId);
      html5QrCodeRef.current = html5QrCode;

      setCameraActive(true);
      setStatusMessage('Aponte a câmera para o QR Code colado na caixa do residente...');
      setScanError(null);

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13
        ]
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          handleSuccessfulScan(decodedText);
        },
        () => {
          // Frame scanned without code detected (silent)
        }
      );
    } catch (err: any) {
      console.warn('Não foi possível iniciar leitor de câmera:', err);
      setCameraActive(false);
      setScanError(
        err?.message?.includes('Permission') 
          ? 'Permissão de câmera negada. Permita o acesso à câmera nas configurações do navegador ou use o envio de foto/busca manual.'
          : 'Não foi possível acessar a câmera do dispositivo. Use a busca manual ou envie uma foto da etiqueta.'
      );
    }
  };

  // Process image file uploaded from gallery or camera snapshot
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setScanError(null);
    setUnrecognizedText(null);

    try {
      // Create temporary scanner instance for file
      let scanner = html5QrCodeRef.current;
      if (!scanner || scanner.isScanning) {
        await stopScanner();
        scanner = new Html5Qrcode('box-qr-reader-container');
        html5QrCodeRef.current = scanner;
      }

      const scanResult = await scanner.scanFileV2(file, true);
      const decodedText = scanResult.decodedText;

      if (decodedText) {
        await handleSuccessfulScan(decodedText);
      } else {
        setScanError('Nenhum código QR detectado na imagem enviada.');
      }
    } catch (err: any) {
      console.error('Erro ao ler QR de arquivo:', err);
      setScanError('Não foi possível identificar o QR Code na imagem enviada. Tente com melhor iluminação.');
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Filtered boxes for manual fallback
  const filteredBoxes = boxes.filter(b => 
    b.residentName.toLowerCase().includes(manualSearch.toLowerCase()) ||
    b.roomNumber.toLowerCase().includes(manualSearch.toLowerCase()) ||
    b.id.toLowerCase().includes(manualSearch.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold tracking-wider text-indigo-300 uppercase block">
                Leitor de Caixa ILPI
              </span>
              <h3 className="text-base font-bold text-white">
                Escanear QR Code da Caixa
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Camera Viewport / Container */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex flex-col items-center justify-center min-h-[280px]">
            
            {/* Target element for html5-qrcode */}
            <div 
              id="box-qr-reader-container" 
              className="w-full h-full min-h-[280px] max-h-[340px] flex items-center justify-center"
            />

            {/* Visual Viewfinder Overlay when scanning is active */}
            {cameraActive && !scanError && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                <div className="relative w-56 h-56 border-2 border-indigo-400/60 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden">
                  {/* Corner accents */}
                  <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />
                  
                  {/* Animated laser scan line */}
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_12px_#818cf8] animate-pulse" />
                </div>
                <span className="text-[11px] font-semibold text-white/90 bg-slate-900/80 px-3 py-1 rounded-full mt-3 backdrop-blur-xs">
                  Enquadre o QR Code colado na caixa
                </span>
              </div>
            )}

            {/* Error or stopped state fallback */}
            {(!cameraActive || scanError) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900 text-slate-300">
                <AlertTriangle className="w-10 h-10 text-amber-400 mb-2" />
                <p className="text-xs text-slate-300 max-w-xs leading-relaxed mb-4">
                  {scanError || 'Câmera inativa no momento.'}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={startScanner}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Tentar Novamente</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Carregar Foto</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span className="truncate">{statusMessage}</span>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileUpload} 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingFile}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isProcessingFile ? 'Lendo imagem...' : 'Enviar foto do QR'}</span>
            </button>
          </div>

          {/* Unrecognized QR Code Warning */}
          {unrecognizedText && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>QR Code não associado a uma caixa:</span>
              </div>
              <p className="font-mono text-[11px] bg-white/60 dark:bg-black/40 p-1.5 rounded truncate">
                {unrecognizedText}
              </p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                Selecione a caixa manualmente abaixo para associar ou tentar outro código.
              </p>
            </div>
          )}

          {/* Manual Quick Selection Fallback */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>Ou selecione a caixa do residente:</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {boxes.length} caixas cadastradas
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={manualSearch}
                onChange={e => setManualSearch(e.target.value)}
                placeholder="Buscar por nome, quarto ou ID..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {filteredBoxes.map(b => (
                <button
                  key={b.id}
                  onClick={async () => {
                    playBeepSound();
                    triggerHaptic();
                    await stopScanner();
                    showToast(`📦 Caixa selecionada: ${b.residentName} (${b.roomNumber})`);
                    onBoxScanned(b);
                    onClose();
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 text-left transition-all cursor-pointer flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded font-mono text-[10px]">
                      {b.roomNumber}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {b.residentName}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {b.medications.length} meds
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={async () => {
              await stopScanner();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
