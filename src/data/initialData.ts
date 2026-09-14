import { Medicamento, LoteEstoque, PacienteCaixa, MovimentacaoDispensacao, EnfermeiraProfile } from '../types';

export const INITIAL_NURSE: EnfermeiraProfile = {
  nome: "Ana Paula Silva",
  coren: "COREN-SP 248.902-TE",
  setor: "UTI Adulto - Posto 02",
  turno: "Plantão 12h"
};

export const DEFAULT_NURSE = INITIAL_NURSE;

export const INITIAL_MEDICAMENTS: Medicamento[] = [];

export const INITIAL_LOTS: LoteEstoque[] = [];

export const INITIAL_PATIENT_BOXES: PacienteCaixa[] = [];

export const INITIAL_PATIENTS: PacienteCaixa[] = [];

export const INITIAL_DISPENSATIONS: MovimentacaoDispensacao[] = [];

// Presets of real medicine images for quick testing in 1-click OCR
export const OCR_PRESET_SAMPLES = [
  {
    title: "Ceftriaxona Sódica 1g (Frasco Ampola)",
    lote: "LOT-2026-NUEVO",
    validade: "2027-01-30",
    dosagem: "1g Injetável",
    barras: "7891058011234",
    principio: "Ceftriaxona Sódica",
    cuidados: "Reconstituir em 10mL de Água p/ Injetáveis. Estável 6h em TA.",
    altaVigilancia: false,
    imageSvg: `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#0f172a"/>
      <rect x="50" y="30" width="300" height="240" rx="16" fill="#1e293b" stroke="#3b82f6" stroke-width="3"/>
      <rect x="70" y="50" width="260" height="40" rx="8" fill="#2563eb"/>
      <text x="200" y="76" font-family="sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">CEFTRIAXONA SÓDICA</text>
      <text x="200" y="115" font-family="sans-serif" font-size="28" font-weight="bold" fill="#60a5fa" text-anchor="middle">1 g INJETÁVEL</text>
      <text x="200" y="145" font-family="sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">PÓ PARA SOLUÇÃO INJETÁVEL - IV / IM</text>
      <rect x="80" y="165" width="240" height="50" rx="8" fill="#090d16" stroke="#475569"/>
      <text x="100" y="187" font-family="monospace" font-size="14" fill="#38bdf8">VAL: 01/2027</text>
      <text x="230" y="187" font-family="monospace" font-size="14" fill="#38bdf8">LOTE: 2026-NUEVO</text>
      <text x="100" y="204" font-family="monospace" font-size="12" fill="#94a3b8">EAN: 7891058011234</text>
      <path d="M90 225 h220 v20 h-220 z" fill="#ffffff"/>
      <path d="M95 225 v20 M100 225 v20 M108 225 v20 M115 225 v20 M125 225 v20 M130 225 v20 M142 225 v20 M155 225 v20 M170 225 v20 M185 225 v20 M200 225 v20 M220 225 v20 M240 225 v20 M260 225 v20 M280 225 v20 M295 225 v20" stroke="#000" stroke-width="3"/>
    </svg>`
  },
  {
    title: "Clexane 40mg (Seringa Preenchida)",
    lote: "CLX-2027-X",
    validade: "2026-12-15",
    dosagem: "40mg / 0,4mL",
    barras: "7891058022345",
    principio: "Enoxaparina Sódica",
    cuidados: "MEDICAMENTO DE ALTA VIGILÂNCIA. Via Subcutânea.",
    altaVigilancia: true,
    imageSvg: `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#0f172a"/>
      <rect x="50" y="30" width="300" height="240" rx="16" fill="#1e293b" stroke="#ef4444" stroke-width="4"/>
      <rect x="70" y="45" width="260" height="30" rx="4" fill="#dc2626"/>
      <text x="200" y="66" font-family="sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">MEDICAMENTO DE ALTA VIGILÂNCIA (MAV)</text>
      <text x="200" y="105" font-family="sans-serif" font-size="26" font-weight="bold" fill="#f87171" text-anchor="middle">CLEXANE® 40mg</text>
      <text x="200" y="130" font-family="sans-serif" font-size="15" fill="#e2e8f0" text-anchor="middle">Enoxaparina Sódica - 0.4 mL</text>
      <rect x="80" y="155" width="240" height="50" rx="8" fill="#0f172a" stroke="#ef4444"/>
      <text x="95" y="177" font-family="monospace" font-size="14" fill="#fca5a5">VAL: 12/2026</text>
      <text x="220" y="177" font-family="monospace" font-size="14" fill="#fca5a5">LOTE: CLX-2027-X</text>
      <text x="95" y="194" font-family="monospace" font-size="12" fill="#cbd5e1">BARCODE: 7891058022345</text>
      <rect x="90" y="215" width="220" height="22" fill="#ffffff"/>
      <path d="M95 215 v22 M105 215 v22 M112 215 v22 M122 215 v22 M135 215 v22 M150 215 v22 M165 215 v22 M180 215 v22 M195 215 v22 M210 215 v22 M230 215 v22 M250 215 v22 M270 215 v22 M290 215 v22" stroke="#000" stroke-width="3"/>
    </svg>`
  },
  {
    title: "NovoRapid Insulina (Frasco 10mL)",
    lote: "INS-2026-R",
    validade: "2026-10-10",
    dosagem: "100 UI/mL",
    barras: "7891058033456",
    principio: "Insulina Asparte",
    cuidados: "REFRIGERAR 2°C a 8°C. DUPLA CHECAGEM NA APLICAÇÃO.",
    altaVigilancia: true,
    imageSvg: `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#0f172a"/>
      <rect x="50" y="30" width="300" height="240" rx="16" fill="#1e293b" stroke="#eab308" stroke-width="4"/>
      <rect x="70" y="45" width="260" height="35" rx="6" fill="#ca8a04"/>
      <text x="200" y="68" font-family="sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">NOVORAPID® FlexPen</text>
      <text x="200" y="110" font-family="sans-serif" font-size="24" font-weight="bold" fill="#fde047" text-anchor="middle">100 UI/mL (Insulina Asparte)</text>
      <text x="200" y="135" font-family="sans-serif" font-size="13" fill="#cbd5e1" text-anchor="middle">Uso Subcutâneo / Refrigeração Obrigatória</text>
      <rect x="80" y="155" width="240" height="50" rx="8" fill="#0f172a" stroke="#ca8a04"/>
      <text x="95" y="177" font-family="monospace" font-size="14" fill="#fef08a">VAL: 10/2026</text>
      <text x="220" y="177" font-family="monospace" font-size="14" fill="#fef08a">LOTE: INS-2026-R</text>
      <text x="95" y="194" font-family="monospace" font-size="12" fill="#cbd5e1">EAN: 7891058033456</text>
      <rect x="90" y="215" width="220" height="22" fill="#ffffff"/>
      <path d="M95 215 v22 M108 215 v22 M120 215 v22 M135 215 v22 M155 215 v22 M175 215 v22 M190 215 v22 M210 215 v22 M235 215 v22 M260 215 v22 M285 215 v22" stroke="#000" stroke-width="3"/>
    </svg>`
  }
];
