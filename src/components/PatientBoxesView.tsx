import React, { useState } from 'react';
import { 
  Users, 
  Bed, 
  AlertTriangle, 
  Barcode, 
  Plus, 
  Clock, 
  CheckCircle2, 
  Pill,
  UserCheck,
  Building2,
  FileText
} from 'lucide-react';
import { PacienteCaixa, Medicamento, LoteEstoque } from '../types';
import { formatDatePtBr } from '../utils/pharmacyUtils';

interface PatientBoxesViewProps {
  patients: PacienteCaixa[];
  medicaments: Medicamento[];
  lots: LoteEstoque[];
  onOpenDispenseForPatient: (pacienteId: string) => void;
  onAddNewPatientBox: (patient: {
    leito: string;
    nomePaciente: string;
    prontuario: string;
    diagnosticoResumido: string;
    alergias: string[];
  }) => void;
}

export const PatientBoxesView: React.FC<PatientBoxesViewProps> = ({
  patients,
  medicaments,
  lots,
  onOpenDispenseForPatient,
  onAddNewPatientBox
}) => {
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
  const [leitoInput, setLeitoInput] = useState('');
  const [nomeInput, setNomeInput] = useState('');
  const [prontuarioInput, setProntuarioInput] = useState('');
  const [diagnosticoInput, setDiagnosticoInput] = useState('');
  const [alergiaInput, setAlergiaInput] = useState('');

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leitoInput || !nomeInput) {
      alert("Preencha o leito e o nome do paciente.");
      return;
    }
    const alergiasArray = alergiaInput.split(',').map(s => s.trim()).filter(Boolean);
    onAddNewPatientBox({
      leito: leitoInput,
      nomePaciente: nomeInput,
      prontuario: prontuarioInput || `PRON-${Math.floor(100000 + Math.random() * 900000)}`,
      diagnosticoResumido: diagnosticoInput || "Em acompanhamento de enfermagem",
      alergias: alergiasArray
    });

    setLeitoInput('');
    setNomeInput('');
    setProntuarioInput('');
    setDiagnosticoInput('');
    setAlergiaInput('');
    setIsAddPatientModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Caixas Organizadoras de Pacientes
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Controle de medicamentos segregados por leito para o aprazamento da enfermagem.
          </p>
        </div>

        <button
          onClick={() => setIsAddPatientModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Caixa de Paciente</span>
        </button>
      </div>

      {/* Grid of Patient Boxes */}
      {patients.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center mx-auto">
            <Bed className="w-8 h-8 text-purple-600" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Nenhuma caixa de paciente cadastrada
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Cadastre as caixas de leitos do posto de enfermagem para organizar a dispensação e aprazamento direto por código de barras.
            </p>
          </div>
          <button
            onClick={() => setIsAddPatientModalOpen(true)}
            className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 inline-flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeira Caixa de Paciente</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patients.map((paciente) => (
          <div
            key={paciente.id}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between"
          >
            {/* Box Header */}
            <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center gap-1.5 shadow-sm">
                    <Bed className="w-4 h-4" />
                    {paciente.leito}
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {paciente.prontuario}
                  </span>
                </div>

                <button
                  onClick={() => onOpenDispenseForPatient(paciente.id)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Barcode className="w-3.5 h-3.5" />
                  <span>+ Retirar Medicamento</span>
                </button>
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {paciente.nomePaciente}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {paciente.diagnosticoResumido}
                </p>
              </div>

              {/* Allergies Alert */}
              {paciente.alergias.length > 0 ? (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>ALERGIAS REGISTRADAS: {paciente.alergias.join(', ')}</span>
                </div>
              ) : (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Sem alergias medicamentosas relatadas no prontuário
                </span>
              )}
            </div>

            {/* List of Medications inside this Patient Box */}
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Medicamentos na Caixa do Leito</span>
                <span>{paciente.medicamentosAlocados.length} itens</span>
              </div>

              {paciente.medicamentosAlocados.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-400 text-xs">
                  Caixa vazia. Clique em "+ Retirar Medicamento" para dispensar do estoque.
                </div>
              ) : (
                <div className="space-y-2">
                  {paciente.medicamentosAlocados.map((item, idx) => {
                    const med = medicaments.find(m => m.id === item.medicamentoId);
                    const lote = lots.find(l => l.id === item.loteId);

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Pill className="w-3.5 h-3.5 text-indigo-500" />
                            <strong className="text-slate-900 dark:text-white font-bold">
                              {med?.nomeComercial || 'Medicamento'}
                            </strong>
                            {med?.altaVigilancia && (
                              <span className="px-1 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold">
                                MAV
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            Dose Prescrita: <span className="text-slate-800 dark:text-slate-200 font-semibold">{item.dosePrescrita}</span>
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Horários: {item.horarios.join(', ')}</span>
                            {lote && <span className="ml-2">• Lote: {lote.lote}</span>}
                          </div>
                        </div>

                        <div className="text-right pl-2">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Na Caixa</span>
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-black text-xs">
                            {item.quantidadeNaCaixa} un
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        ))}
        </div>
      )}

      {/* Modal Add Patient */}
      {isAddPatientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Bed className="w-5 h-5 text-purple-600" />
                Cadastrar Nova Caixa de Paciente
              </h3>
              <button
                onClick={() => setIsAddPatientModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Número do Leito / Quarto *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Leito 105-A"
                  value={leitoInput}
                  onChange={(e) => setLeitoInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo do Paciente *
                </label>
                <input
                  type="text"
                  placeholder="Ex: João Roberto Alcantara"
                  value={nomeInput}
                  onChange={(e) => setNomeInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold text-slate-900 dark:text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Número do Prontuario Hospitalar
                </label>
                <input
                  type="text"
                  placeholder="Ex: PRON-884920"
                  value={prontuarioInput}
                  onChange={(e) => setProntuarioInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Diagnóstico Resumido / Motivo Internação
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pós-operatório de Colecistectomia"
                  value={diagnosticoInput}
                  onChange={(e) => setDiagnosticoInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-rose-600 dark:text-rose-400 mb-1">
                  Alergias Conocidas (Separadas por vírgula)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Dipirona, Penicilina, Sulfa"
                  value={alergiaInput}
                  onChange={(e) => setAlergiaInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPatientModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold text-white shadow-md"
                >
                  Salvar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
