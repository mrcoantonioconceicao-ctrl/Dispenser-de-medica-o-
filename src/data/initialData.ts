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
