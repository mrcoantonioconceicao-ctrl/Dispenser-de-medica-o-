import React, { useState } from 'react';
import { X, User, Building2, ShieldCheck, Trash2, Check, RefreshCw } from 'lucide-react';
import { EnfermeiraProfile } from '../types';

interface NurseProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  nurse: EnfermeiraProfile;
  onSaveNurse: (nurse: EnfermeiraProfile) => void;
  onClearAllData: () => void;
}

export const NurseProfileModal: React.FC<NurseProfileModalProps> = ({
  isOpen,
  onClose,
  nurse,
  onSaveNurse,
  onClearAllData
}) => {
  const [nome, setNome] = useState(nurse.nome);
  const [coren, setCoren] = useState(nurse.coren);
  const [setor, setSetor] = useState(nurse.setor);
  const [turno, setTurno] = useState(nurse.turno);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveNurse({ nome, coren, setor, turno });
    onClose();
  };

  const handleResetConfirm = () => {
    if (confirm("Tem certeza que deseja redefinir o sistema para o estado inicial limpo? Isso apagará todas as movimentações gravadas neste navegador.")) {
      onClearAllData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <User className="w-5 h-5" />
            </span>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Perfil do Profissional de Enfermagem
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nome Completo do Profissional *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Registro COREN (Com Categoria e UF) *
            </label>
            <input
              type="text"
              placeholder="Ex: COREN-SP 123.456-TE"
              value={coren}
              onChange={(e) => setCoren(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Unidade / Setor do Posto *
            </label>
            <input
              type="text"
              placeholder="Ex: UTI Adulto - Posto 01"
              value={setor}
              onChange={(e) => setSetor(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Turno de Trabalho *
            </label>
            <input
              type="text"
              placeholder="Ex: Plantão 12x36 Noturno"
              value={turno}
              onChange={(e) => setTurno(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleResetConfirm}
              className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-100 flex items-center gap-1 cursor-pointer"
              title="Apagar dados e reiniciar estado"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Resetar Sistema</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Perfil</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
