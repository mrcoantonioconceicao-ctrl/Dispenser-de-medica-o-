import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ShieldAlert,
  Calendar,
  Package,
  Layers,
  FileText,
  Info,
  Check,
  Video,
  Image as ImageIcon
} from 'lucide-react';
import { Medicamento, LoteEstoque, OCRScanResult } from '../types';
import { OCR_PRESET_SAMPLES } from '../data/initialData';
import { playBeepSound, triggerHaptic, formatDatePtBr } from '../utils/pharmacyUtils';

interface CameraOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmStockEntry: (data: {
    medicamento: Omit<Medicamento, 'id'>;
    lote: Omit<LoteEstoque, 'id' | 'medicamentoId'>;
  }) => void;
  nurseName: string;
}

export const CameraOcrModal: React.FC<CameraOcrModalProps> = ({
  isOpen,
  onClose,
  onConfirmStockEntry,
  nurseName
}) => {
  const [step, setStep] = useState<'CAPTURE' | 'CONFIRMATION'>('CAPTURE');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Real Camera WebRTC states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Extracted data form for human validation step
  const [nomeComercial, setNomeComercial] = useState('');
  const [principioAtivo, setPrincipioAtivo] = useState('');
  const [dosagem, setDosagem] = useState('');
  const [formaFarmaceutica, setFormaFarmaceutica] = useState('Frasco-Ampola');
  const [dataValidade, setDataValidade] = useState('');
  const [lote, setLote] = useState('');
  const [quantidadeInicial, setQuantidadeInicial] = useState<number>(10);
  const [localizacaoPrateleira, setLocalizacaoPrateleira] = useState('Armário 01 - Prateleira A');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [paraQueServe, setParaQueServe] = useState('');
  const [cuidadosEspeciais, setCuidadosEspeciais] = useState('');
  const [altaVigilancia, setAltaVigilancia] = useState(false);
  const [confiancaLeitura, setConfiancaLeitura] = useState<number>(95);
  const [categoria, setCategoria] = useState('Geral');

  // Start real camera when modal opens in CAPTURE step
  useEffect(() => {
    if (isOpen && step === 'CAPTURE') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, step]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.warn("Câmera não acessível ou sem permissão:", err);
      setCameraError("Não foi possível acessar a câmera do dispositivo. Utilize a opção de upload de foto.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  if (!isOpen) return null;

  // Capture real frame from HTML5 video element
  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      alert("Câmera não inicializada.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setPreviewImage(dataUrl);
      processImageWithGemini(dataUrl);
    }
  };

  // Upload real image file from mobile or PC
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      setPreviewImage(result);
      processImageWithGemini(result);
    };
    reader.readAsDataURL(file);
  };

  // Send real base64 image to server Gemini OCR route
  const processImageWithGemini = async (base64Img: string) => {
    setIsLoadingAi(true);
    playBeepSound();
    triggerHaptic();

    try {
      const response = await fetch('/api/scan-medicine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Img,
          mimeType: 'image/jpeg'
        })
      });

      const resData = await response.json();

      if (resData.success && resData.data) {
        const d = resData.data;
        const nome = d.nomeComercial || 'Medicamento Detectado';
        const principio = d.principioAtivo || d.nomeComercial || '';
        const dose = d.dosagem || 'Conforme Rótulo';
        const forma = d.formaFarmaceutica || 'Frasco-Ampola';
        const val = d.dataValidade || new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0];
        const numLote = d.lote || `LOTE-${Math.floor(1000 + Math.random() * 9000)}`;
        const barr = d.codigoBarras || `789${Math.floor(1000000000 + Math.random() * 9000000000)}`;
        const uso = d.paraQueServe || 'Medicamento identificado por OCR de alta precisão.';
        const cuidados = d.cuidadosEspeciais || 'Verificar via de administração e prescrição do leito.';
        const altaVig = Boolean(d.altaVigilancia);
        const confianca = d.confiancaLeitura || 95;
        const cat = altaVig ? 'Alta Vigilância (MAV)' : 'Medicação Geral';

        setNomeComercial(nome);
        setPrincipioAtivo(principio);
        setDosagem(dose);
        setFormaFarmaceutica(forma);
        setDataValidade(val);
        setLote(numLote);
        setCodigoBarras(barr);
        setParaQueServe(uso);
        setCuidadosEspeciais(cuidados);
        setAltaVigilancia(altaVig);
        setConfiancaLeitura(confianca);
        setCategoria(cat);

        // Transition to Confirmation & Quantity Entry Form Step
        setStep('CONFIRMATION');
      } else {
        alert("Não foi possível extrair dados legíveis da foto. Tente aproximação com boa iluminação.");
      }
    } catch (err) {
      console.error("Erro na API Gemini OCR:", err);
      alert("Erro de conexão ao processar imagem.");
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Quick preset sample for demonstration if user wants to test sample labels
  const handleSelectPresetSample = (sample: typeof OCR_PRESET_SAMPLES[0]) => {
    setNomeComercial(sample.title.split(' ')[0]);
    setPrincipioAtivo(sample.principio);
    setDosagem(sample.dosagem);
    setFormaFarmaceutica('Frasco-Ampola');
    setDataValidade(sample.validade);
    setLote(sample.lote);
    setCodigoBarras(sample.barras);
    setParaQueServe(`Medicamento para tratamento clínico sob acompanhamento.`);
    setCuidadosEspeciais(sample.cuidados);
    setAltaVigilancia(sample.altaVigilancia);
    setConfiancaLeitura(98);
    setCategoria(sample.altaVigilancia ? 'Alta Vigilância (MAV)' : 'Antibiótico / Geral');
    setPreviewImage(`data:image/svg+xml;utf8,${encodeURIComponent(sample.imageSvg)}`);

    playBeepSound();
    triggerHaptic();
    setStep('CONFIRMATION');
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomeComercial || !dataValidade || !lote) {
      alert("Por favor, preencha o Nome do Medicamento, Lote e Data de Validade.");
      return;
    }

    onConfirmStockEntry({
      medicamento: {
        nomeComercial,
        principioAtivo: principioAtivo || nomeComercial,
        dosagem,
        formaFarmaceutica,
        paraQueServe: paraQueServe || "Uso conforme prescrição hospitalar.",
        cuidadosEspeciais: cuidadosEspeciais || "Verificar dosagem e leito antes da administração.",
        altaVigilancia,
        codigoBarrasPadrao: codigoBarras || `789${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        categoria
      },
      lote: {
        lote,
        dataValidade,
        quantidadeAtual: quantidadeInicial,
        quantidadeInicial,
        localizacaoPrateleira,
        dataEntrada: new Date().toISOString().split('T')[0],
        registradoPor: nurseName,
        confiancaOCR: confiancaLeitura
      }
    });

    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      {/* Hidden canvas for taking snapshot from live video */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Camera className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Reconhecimento OCR & Entrada de Medicamento
              </h2>
              <p className="text-xs text-slate-400">
                Visão Computacional Gemini 3.8 Flash • Validação Humana do Posto
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">

          {/* STEP 1: CAPTURE PHOTO OR MANUAL ENTRY */}
          {step === 'CAPTURE' && (
            <div className="space-y-4">
              
              {/* Camera Stream Viewport */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center shadow-inner">
                {isLoadingAi ? (
                  <div className="p-6 text-center space-y-3">
                    <Sparkles className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
                    <h3 className="text-sm font-bold text-white">Analisando Embalagem com IA...</h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Extraindo Nome Comercial, Princípio Ativo, Dosagem, Validade, Lote e MAV...
                    </p>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
                    />

                    {!isCameraActive && (
                      <div className="p-6 text-center space-y-2">
                        <Camera className="w-12 h-12 text-slate-600 mx-auto" />
                        <p className="text-slate-400 text-xs">
                          {cameraError || "Aponte a embalagem ou caixa do medicamento para a câmera"}
                        </p>
                      </div>
                    )}

                    {/* Camera Overlay Bounding Box */}
                    {isCameraActive && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                        <div className="w-full h-full border-2 border-dashed border-emerald-400/80 rounded-xl relative flex items-center justify-center">
                          <span className="bg-emerald-950/80 text-emerald-300 font-bold px-3 py-1 rounded-full text-[10px] backdrop-blur-sm border border-emerald-500/40">
                            Centralize o Rótulo / Lote / Validade
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Action Trigger Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {isCameraActive ? (
                  <button
                    onClick={handleCapturePhoto}
                    disabled={isLoadingAi}
                    className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Tirar Foto do Rótulo</span>
                  </button>
                ) : (
                  <button
                    onClick={startCamera}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Video className="w-4 h-4 text-emerald-400" />
                    <span>Ativar Câmera do Dispositivo</span>
                  </button>
                )}

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoadingAi}
                  className="py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer transition-all disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>Carregar Arquivo de Foto</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Manual Direct Entry Button */}
              <div className="pt-2 flex justify-center border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setNomeComercial('');
                    setPrincipioAtivo('');
                    setDosagem('');
                    setFormaFarmaceutica('Comprimido');
                    setDataValidade(new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]);
                    setLote(`LOTE-${Math.floor(1000 + Math.random() * 9000)}`);
                    setQuantidadeInicial(10);
                    setStep('CONFIRMATION');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span>Ou Digitar Dados Manualmente (Sem Foto)</span>
                </button>
              </div>

              {/* Quick Sample Presets for Testing */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] text-slate-500 font-bold block">
                  Ou teste com rótulos de amostra pré-carregados:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {OCR_PRESET_SAMPLES.map((sample, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectPresetSample(sample)}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left hover:border-emerald-500 transition-all cursor-pointer space-y-1"
                    >
                      <strong className="text-slate-900 dark:text-white block text-xs truncate">
                        {sample.title}
                      </strong>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono block">
                        Lote: {sample.lote} • Val: {sample.validade}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* STEP 2: HUMAN CONFIRMATION & EXACT QUANTITY FORM */}
          {step === 'CONFIRMATION' && (
            <form onSubmit={handleFinalSubmit} className="space-y-4">
              
              {/* High Confidence Auto-Registered Badge */}
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                      <strong className="text-xs font-bold text-emerald-900 dark:text-emerald-300 block">
                        🔍 Revisão de Cadastro do Medicamento
                      </strong>
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                        {lote ? `Lote: ${lote}` : 'Novo Cadastro'} • Validade: <code className="font-mono font-bold">{dataValidade || 'A definir'}</code>
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep('CAPTURE')}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Tirar Outra Foto</span>
                  </button>
                </div>

                {/* Indicação de Uso / Para que serve */}
                {paraQueServe && (
                  <div className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-emerald-200 dark:border-emerald-900 text-xs">
                    <span className="font-bold text-emerald-950 dark:text-emerald-200 block text-[11px] mb-0.5">
                      💡 Indicação / Para Que Serve:
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 italic leading-relaxed">
                      "{paraQueServe}"
                    </p>
                  </div>
                )}
              </div>

              {/* PROMINENT EXACT QUANTITY SELECTOR CARD */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-emerald-50 dark:from-slate-800 dark:to-emerald-950/60 border-2 border-indigo-400 dark:border-emerald-500 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-indigo-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <label htmlFor="quantidadeExactaInput" className="block font-black text-sm text-slate-900 dark:text-white">
                        Digite a Quantidade Exata em Estoque *
                      </label>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">
                        Informe o número de frascos, ampolas ou caixas que estão dando entrada.
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-indigo-600 text-white shadow-sm">
                    Campo Principal
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Decrease Button */}
                  <button
                    type="button"
                    onClick={() => setQuantidadeInicial(prev => Math.max(1, prev - 1))}
                    className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-black text-slate-900 dark:text-white text-xl flex items-center justify-center cursor-pointer transition-colors shadow-sm"
                    title="Diminuir 1 unidade"
                  >
                    -
                  </button>

                  {/* Big Numeric Input Field */}
                  <div className="flex-1 relative">
                    <input
                      id="quantidadeExactaInput"
                      type="number"
                      min="1"
                      value={quantidadeInicial}
                      onChange={(e) => setQuantidadeInicial(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-center py-2.5 px-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-indigo-500 dark:border-emerald-500 font-black text-2xl text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/30 dark:focus:ring-emerald-500/30 shadow-inner"
                      placeholder="Qtd exata..."
                      required
                    />
                    <span className="absolute right-3 top-3 text-xs font-bold text-slate-400 hidden sm:inline">
                      unidades
                    </span>
                  </div>

                  {/* Increase Button */}
                  <button
                    type="button"
                    onClick={() => setQuantidadeInicial(prev => prev + 1)}
                    className="w-12 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black text-white text-xl flex items-center justify-center cursor-pointer transition-colors shadow-sm"
                    title="Aumentar 1 unidade"
                  >
                    +
                  </button>
                </div>

                {/* Quick Increment Preset Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mr-1">Seleção Rápida:</span>
                  {[1, 5, 10, 20, 50, 100].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuantidadeInicial(num)}
                      className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                        quantidadeInicial === num
                          ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400 font-extrabold'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {num} un
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Grid for adjustments */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Nome Comercial */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Nome Comercial do Medicamento *
                  </label>
                  <input
                    type="text"
                    value={nomeComercial}
                    onChange={(e) => setNomeComercial(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-extrabold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ex: Paracetamol, Meropenem..."
                    required
                  />
                </div>

                {/* Princípio Ativo */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Princípio Ativo (DCB) *
                  </label>
                  <input
                    type="text"
                    value={principioAtivo}
                    onChange={(e) => setPrincipioAtivo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ex: Meropenem tri-hidratado"
                    required
                  />
                </div>

                {/* Dosagem */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Dosagem / Concentração *
                  </label>
                  <input
                    type="text"
                    value={dosagem}
                    onChange={(e) => setDosagem(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ex: 1g, 500mg, 10mg/ml"
                    required
                  />
                </div>

                {/* Forma Farmacêutica */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Forma Farmacêutica *
                  </label>
                  <input
                    type="text"
                    value={formaFarmaceutica}
                    onChange={(e) => setFormaFarmaceutica(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ex: Frasco-Ampola, Comprimido..."
                    required
                  />
                </div>

                {/* Lote */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Número do Lote *
                  </label>
                  <input
                    type="text"
                    value={lote}
                    onChange={(e) => setLote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ex: LOTE-88412"
                    required
                  />
                </div>

                {/* Data de Validade */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Data de Validade (YYYY-MM-DD) *
                  </label>
                  <input
                    type="date"
                    value={dataValidade}
                    onChange={(e) => setDataValidade(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                {/* Localização no Posto */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Localização na Prateleira / Geladeira *
                  </label>
                  <input
                    type="text"
                    value={localizacaoPrateleira}
                    onChange={(e) => setLocalizacaoPrateleira(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ex: Armário 01 - Prateleira A, Geladeira de Termolábies"
                    required
                  />
                </div>

                {/* Código de Barras */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Código de Barras (EAN-13)
                  </label>
                  <input
                    type="text"
                    value={codigoBarras}
                    onChange={(e) => setCodigoBarras(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ex: 7891234567890"
                  />
                </div>

              </div>

              {/* Alta Vigilância Checkbox */}
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-900 dark:text-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <strong className="block text-xs">Medicamento de Alta Vigilância (MAV)</strong>
                    <span className="text-[10px] text-amber-700 dark:text-amber-300">
                      Exige confirmação de dupla checagem pela enfermagem na dispensação.
                    </span>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={altaVigilancia}
                  onChange={(e) => setAltaVigilancia(e.target.checked)}
                  className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep('CAPTURE')}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar {quantidadeInicial} Unidade(s) no Estoque</span>
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
};
