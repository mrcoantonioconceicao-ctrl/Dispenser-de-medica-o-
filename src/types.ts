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

export interface SyncQueueItem {
  id: string;
  type: 'ADD_STOCK' | 'DISPENSE' | 'ALLOCATE_PATIENT' | 'UPDATE_NURSE' | 'GENERIC_SYNC';
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
