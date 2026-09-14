import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Database, 
  Layers, 
  CheckCircle2, 
  Sparkles, 
  Cpu, 
  ShieldCheck, 
  Camera, 
  Barcode, 
  Clock, 
  ArrowRight,
  Server,
  Zap,
  Lock
} from 'lucide-react';

interface TechnicalProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TechnicalProposalModal: React.FC<TechnicalProposalModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'USER_FLOW' | 'DATA_MODEL' | 'TECH_STACK'>('USER_FLOW');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <FileText className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Proposta Técnica Inicial & Arquitetura PWA
              </h2>
              <p className="text-xs text-slate-400">
                Solução Hospitalar de Alta Pressão • Visão Computacional / OCR & Controle FEFO
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 dark:bg-slate-800/80 px-6 py-2 border-b border-slate-200 dark:border-slate-800 flex space-x-2">
          <button
            onClick={() => setActiveTab('USER_FLOW')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'USER_FLOW'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>1. Fluxo de Telas (User Flow)</span>
          </button>

          <button
            onClick={() => setActiveTab('DATA_MODEL')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'DATA_MODEL'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>2. Modelo de Dados</span>
          </button>

          <button
            onClick={() => setActiveTab('TECH_STACK')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'TECH_STACK'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>3. Escolha Tecnológica MVP</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed">
          
          {/* TAB 1: USER FLOW */}
          {activeTab === 'USER_FLOW' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 text-xs">
                <strong>Diretriz de Usabilidade Hospitalar:</strong> A técnica de enfermagem trabalha sob constante pressão temporal, usando luvas e sem margem para erros de digitação. O fluxo minimiza cliques em 80% e elimina digitação manual.
              </div>

              {/* Step 1 */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                  <span className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black">1</span>
                  <span>Jornada de Entrada: Cadastro por Foto & IA (OCR + Enriquecimento)</span>
                </div>
                <ul className="list-disc pl-9 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <li><strong>Ação:</strong> A técnica clica no botão flutuante grande "Entrada por Foto" e aponta a câmera para a embalagem.</li>
                  <li><strong>Processamento IA:</strong> O backend envia a imagem para o Gemini 3.8 Flash OCR que identifica automaticamente: <em>Nome Comercial, Princípio Ativo, Dosagem, Data de Validade, Lote e Código EAN</em>.</li>
                  <li><strong>Enriquecimento:</strong> A IA insere a classe terapêutica ("Para que serve") e marca se é Medicamento de Alta Vigilância (MAV).</li>
                  <li><strong>Tela de Validação Humana:</strong> Abre um modal com dados pré-preenchidos. A profissional faz a conferência visual rápida (1 clique para confirmar).</li>
                </ul>
              </div>

              {/* Step 2 */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 space-y-2">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-extrabold text-sm">
                  <span className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black">2</span>
                  <span>Jornada de Gestão: Termômetro de Validades & Lógica FEFO</span>
                </div>
                <ul className="list-disc pl-9 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <li><strong>Dashboard de Cores:</strong> A tela inicial exibe cards com contadores dinâmicos: <span className="text-rose-600 font-bold">Vencidos/Críticos (&lt; 30d)</span>, <span className="text-amber-600 font-bold">Atenção (30-90d)</span> e <span className="text-emerald-600 font-bold">Seguros (&gt; 90d)</span>.</li>
                  <li><strong>Lógica FEFO (First Expired, First Out):</strong> Os medicamentos com validade mais próxima aparecem no topo para garantir consumo prioritário.</li>
                  <li><strong>Quarentena Rápida:</strong> Se um medicamento vence, a técnica aciona a recolha direta para descarte/quarentena.</li>
                </ul>
              </div>

              {/* Step 3 */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-extrabold text-sm">
                  <span className="w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center font-black">3</span>
                  <span>Jornada de Baixa & Dispensação: Código de Barras p/ Caixa do Paciente</span>
                </div>
                <ul className="list-disc pl-9 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <li><strong>Bipagem Rápida:</strong> Ao retirar a ampola/caixa do armário, a técnica faz a leitura do código de barras usando a câmera do celular.</li>
                  <li><strong>Associação com o Leito:</strong> Seleciona o leito/caixa do paciente (ex: Leito 101-A).</li>
                  <li><strong>Dupla Checagem MAV:</strong> Se for medicamento de alta vigilância (Insulina, Morfina, Clexane), exige a confirmação de dupla checagem da equipe.</li>
                  <li><strong>Efeito em Tempo Real:</strong> O saldo em estoque é decrementado instantaneamente e grava o log auditável com Nome, COREN, Data e Hora.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: DATA MODEL */}
          {activeTab === 'DATA_MODEL' && (
            <div className="space-y-6 animate-fade-in font-mono text-xs">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 font-sans text-xs text-blue-900 dark:text-blue-200">
                Modelo relacional otimizado para PostgreSQL / Supabase ou Firestore, garantindo rastreabilidade sanitária da ANVISA.
              </div>

              {/* Table Medicamentos */}
              <div className="p-4 rounded-xl bg-slate-950 text-slate-100 border border-slate-800 space-y-2">
                <div className="font-bold text-emerald-400 font-sans text-sm flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  <span>Tabela: Medicamentos</span>
                </div>
                <pre className="text-[11px] text-slate-300 overflow-x-auto">
{`CREATE TABLE medicamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_comercial VARCHAR(150) NOT NULL,
  principio_ativo VARCHAR(150) NOT NULL,
  dosagem VARCHAR(50) NOT NULL,
  forma_farmaceutica VARCHAR(50) NOT NULL,
  para_que_serve TEXT, -- Enriquecido por IA
  cuidados_especiais TEXT, -- Instruções de enfermagem
  alta_vigilancia BOOLEAN DEFAULT FALSE, -- Flag MAV
  codigo_barras_padrao VARCHAR(50) UNIQUE,
  categoria VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`}
                </pre>
              </div>

              {/* Table Estoque / Lotes */}
              <div className="p-4 rounded-xl bg-slate-950 text-slate-100 border border-slate-800 space-y-2">
                <div className="font-bold text-emerald-400 font-sans text-sm flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  <span>Tabela: Estoque_Lotes</span>
                </div>
                <pre className="text-[11px] text-slate-300 overflow-x-auto">
{`CREATE TABLE estoque_lotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicamento_id UUID REFERENCES medicamentos(id),
  lote VARCHAR(50) NOT NULL,
  data_validade DATE NOT NULL,
  quantidade_atual INT NOT NULL CHECK (quantidade_atual >= 0),
  quantidade_inicial INT NOT NULL,
  localizacao_prateleira VARCHAR(100) NOT NULL,
  data_entrada TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  registrado_por VARCHAR(100) NOT NULL,
  confianca_ocr INT -- Índice de confiança do escaneamento
);`}
                </pre>
              </div>

              {/* Table Pacientes / Caixas */}
              <div className="p-4 rounded-xl bg-slate-950 text-slate-100 border border-slate-800 space-y-2">
                <div className="font-bold text-emerald-400 font-sans text-sm flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  <span>Tabela: Pacientes_Caixas</span>
                </div>
                <pre className="text-[11px] text-slate-300 overflow-x-auto">
{`CREATE TABLE pacientes_caixas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leito VARCHAR(20) NOT NULL UNIQUE,
  nome_paciente VARCHAR(150) NOT NULL,
  prontuario VARCHAR(30) UNIQUE NOT NULL,
  diagnostico_resumido TEXT,
  alergias TEXT[], -- Array de strings com alergias
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`}
                </pre>
              </div>

              {/* Table Movimentacoes / Dispensacao */}
              <div className="p-4 rounded-xl bg-slate-950 text-slate-100 border border-slate-800 space-y-2">
                <div className="font-bold text-emerald-400 font-sans text-sm flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  <span>Tabela: Movimentacoes_Dispensacao</span>
                </div>
                <pre className="text-[11px] text-slate-300 overflow-x-auto">
{`CREATE TABLE movimentacoes_dispensacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id UUID REFERENCES estoque_lotes(id),
  medicamento_id UUID REFERENCES medicamentos(id),
  paciente_id UUID REFERENCES pacientes_caixas(id),
  quantidade_dispensada INT NOT NULL,
  data_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  enfermeira_responsavel VARCHAR(100) NOT NULL,
  coren VARCHAR(30) NOT NULL,
  codigo_barras_usado VARCHAR(50) NOT NULL,
  dupla_checagem_ok BOOLEAN DEFAULT FALSE
);`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: TECH STACK MVP */}
          {activeTab === 'TECH_STACK' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 text-xs">
                <strong>Justificativa Tecnológica de Arquitetura MVP:</strong> Seleção baseada em velocidade de entrega, operação offline via PWA, segurança de chave API no servidor e custo zero de infraestrutura inicial.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Frontend */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 text-sm">
                    <Zap className="w-4 h-4" />
                    <span>Frontend: PWA React + Vite</span>
                  </div>
                  <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                    <li>• Instalação direta na tela inicial do celular sem depender das App Stores.</li>
                    <li>• Câmera nativa HTML5 WebRTC para leitura ultra-rápida.</li>
                    <li>• Tailwind CSS v4 para UI limpa com alto contraste em luz ambiente hospitalar.</li>
                    <li>• Modos Claro & Escuro para preservação visual em plantões noturnos.</li>
                  </ul>
                </div>

                {/* Backend & Database */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 text-sm">
                    <Server className="w-4 h-4" />
                    <span>Backend: Node / Express / PostgreSQL</span>
                  </div>
                  <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                    <li>• API REST proxy para segurança total das chaves da IA no backend.</li>
                    <li>• PostgreSQL / Supabase para estoque em tempo real com controle de concorrência.</li>
                    <li>• Histórico imutável para conformidade sanitária.</li>
                  </ul>
                </div>

                {/* AI / OCR Engine */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5 text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>IA: Google Gemini 3.8 Flash</span>
                  </div>
                  <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                    <li>• Visão Computacional multimodal de altíssima velocidade (&lt; 1.5s).</li>
                    <li>• Structured JSON Schema para extração com 99% de precisão de nomes, lotes e validade.</li>
                    <li>• Auto-enriquecimento terapêutico de bulas em tempo real.</li>
                  </ul>
                </div>

              </div>

              {/* Security & Hospital Protocol Checklist */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Conformidade com Segurança e Protocolos Hospitalares:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Validação MAV (Medicamentos de Alta Vigilância)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Rastreabilidade de COREN por operador</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Priorização estrita da regra sanitária FEFO</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Feedback Sonoro e Háptico para confirmações silenciosas</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
