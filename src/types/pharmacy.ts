export type ExpiryTier = 'CRITICAL' | 'WARNING' | 'SAFE' | 'EXPIRED';

export interface Medicamento {
  id: string;
  nomeComercial: string;
  principioAtivo: string;
  dosagem: string;
  formaFarmaceutica: string;
  paraQueServe: string;
  cuidadosEspeciais: string;
  altaVigilancia: boolean; // MAV (Medicamento de Alta Vigilância)
  codigoBarrasPadrao: string;
  categoria: string;
  pendingSync?: boolean;
}

export interface LoteEstoque {
  id: string;
  medicamentoId: string;
  lote: string;
  dataValidade: string; // ISO YYYY-MM-DD
  quantidadeAtual: number;
  quantidadeInicial: number;
  localizacaoPrateleira: string;
  dataEntrada: string; // ISO YYYY-MM-DD
  registradoPor: string;
  fotoUrl?: string;
  confiancaOCR?: number;
  pendingSync?: boolean;
}

export interface PacienteCaixa {
  id: string;
  leito: string;
  nomePaciente: string;
  prontuario: string;
  diagnosticoResumido: string;
  alergias: string[];
  medicamentosAlocados: {
    loteId: string;
    medicamentoId: string;
    dosePrescrita: string;
    horarios: string[];
    quantidadeNaCaixa: number;
  }[];
  pendingSync?: boolean;
}

export interface MovimentacaoDispensacao {
  id: string;
  loteId: string;
  medicamentoId: string;
  pacienteId: string;
  leito: string;
  nomePaciente: string;
  quantidadeDispensada: number;
  dataHora: string; // ISO String
  enfermeiraResponsavel: string;
  coren: string;
  codigoBarrasUsado: string;
  duplaChecagemOK?: boolean;
  pendingSync?: boolean;
}

export type AdministrationStatus = 'PENDING' | 'ADMINISTERED' | 'DELAYED' | 'CANCELLED';

export interface DoseAprazada {
  id: string;
  pacienteId: string;
  leito: string;
  nomePaciente: string;
  medicamentoId: string;
  loteId?: string;
  nomeMedicamento: string;
  dosagem: string;
  horarioPrevisto: string; // Ex: "08:00", "12:00", "16:00"
  dataPrevista: string; // YYYY-MM-DD
  status: AdministrationStatus;
  altaVigilancia: boolean;
  administradoEm?: string; // ISO Timestamp de quando foi aplicado
  enfermeiraAplicadora?: string;
  corenAplicadora?: string;
  testemunhaDuplaChecagem?: string;
  corenTestemunha?: string;
  observacoes?: string;
  pendingSync?: boolean;
}

export interface AdministrationLog extends DoseAprazada {}

export interface SyncQueueItem {
  id: string;
  type: 'ADD_STOCK' | 'DISPENSE' | 'ALLOCATE_PATIENT' | 'ADMINISTER_DOSE' | 'ADD_SCHEDULE' | 'UPDATE_NURSE' | 'GENERIC_SYNC';
  timestamp: string;
  description: string;
  payload?: any;
}

export interface EnfermeiraProfile {
  nome: string;
  coren: string;
  setor: string;
  turno: 'Manhã' | 'Tarde' | 'Noite' | 'Plantão 12h';
}

// -------------------------------------------------------------
// MÓDULO ILPI: CONTROLE DE USO E SALDO - CAIXA DO RESIDENTE
// -------------------------------------------------------------
export interface Caregiver {
  id: string;
  name: string;
  pinCode: string;
  role: 'CUIDADOR' | 'COORDENADOR';
}

export interface ResidentMedicationBox {
  id: string;
  residentName: string;
  roomNumber: string;
  startDate: string;
  endDate: string;
  periodDays: number;
  lastRestockDate?: string;
  notes?: string;
  medications: ResidentMedicationItem[];
  history: CaregiverAdministrationLog[];
  pendingSync?: boolean;
}

export interface ResidentMedicationItem {
  id: string;
  name: string;
  presentation: string; // Ex: "5 mg"
  schedules: string[];   // Ex: ["08:00", "20:00"]
  dailyUsage: number;    // Ex: 2
  periodTotal: number;   // Ex: 10
  currentStock: number;  // Saldo Físico
  specialInstructions?: string; // Ex: "Aplicar 2 ampolas a cada 15 dias (IM)"
}

export interface CaregiverAdministrationLog {
  id: string;
  timestamp: string;     // ISO String da aplicação
  dateFormatted: string; // DD/MM/YYYY
  timeFormatted: string; // HH:mm
  medicationName: string;
  quantityAdministered: number;
  remainingStock: number;
  caregiverName: string;
  scheduleTime?: string; // Horário aprazado (ex: "08:00")
  notes?: string;
}

export interface ScanResultAI {
  nomeComercial: string;
  principioAtivo: string;
  dosagem: string;
  formaFarmaceutica: string;
  dataValidade: string;
  lote: string;
  codigoBarras: string;
  paraQueServe: string;
  cuidadosEspeciais: string;
  altaVigilancia: boolean;
  confiancaLeitura: number;
}

export type OCRScanResult = ScanResultAI;
