# 🏥 PharmaGuard - Gestão Inteligente de Estoque e Validade para Enfermagem

![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![React](https://img.shields.io/badge/React-19.0-cyan)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-3.8_Flash-8e44ad)
![Vercel](https://img.shields.io/badge/Deployment-Vercel_Serverless-black)

**PharmaGuard** é um PWA (Progressive Web App) hospitalar robusto projetado para técnicas e enfermeiros em ambientes de alta pressão (UTIs, Unidades de Internação e Pronto-Socorro). O sistema combina **Visão Computacional por IA (Google Gemini)** para leitura OCR automática de rótulos de medicamentos, **algoritmo FEFO (*First Expire, First Out*)** para redução do desperdício de lotes vencidos e **dispensação por código de barras/QR Code** direcionada para a caixa do paciente com protocolo de **Dupla Checagem para Medicamentos de Alta Vigilância (MAV)**.

---

## 🌟 Principais Funcionalidades

### 1. 📷 Cadastro de Medicamentos por Câmera + IA (OCR)
- **Captura e Compressão Client-Side**: Fotos tiradas pela câmera do smartphone são redimensionadas em tempo real via **Canvas 2D** para no máximo 1024px e compactadas em JPEG (qualidade 0.7), reduzindo payloads de até 15MB para menos de 300KB antes do envio.
- **Extração Automática com Visão Computacional**: A API do Gemini analisa a embalagem e extrai automaticamente:
  - Nome comercial e princípio ativo (DCB)
  - Dosagem e forma farmacêutica
  - Lote e data de validade (com cálculo exato de expiração)
  - Código de barras (EAN-13/Datamatrix)
  - Indicações ("Para que serve") e cuidados especiais de enfermagem
  - Classificação MAV (Medicamentos de Alta Vigilância)
- **Validação Humana**: Tela rápida de verificação para o enfermeiro confirmar ou ajustar os dados extraídos antes do salvamento definitivo.

### 2. ⏳ Painel Nropograma de Validade (Regra FEFO)
- **Semáforo Visual de Alertas**:
  - 🔴 **Vencido**: Medicamentos vencidos destacados para recolhimento imediato à Quarentena.
  - 🟠 **Crítico (até 15 dias)**: Lotes prioritários para uso imediato (regra FEFO).
  - 🟡 **Atenção (16 a 30 dias)**: Lotes sob monitoramento.
  - 🟢 **Seguro (> 30 dias)**: Lotes dentro do prazo normal de validade.
- **Ações Rápidas**: Dispensação direta do lote prioritário ou descarte/recolhimento para quarentena com rastro de auditoria.

### 3. 📦 Dispensação Rápida & Caixa do Paciente (`html5-qrcode`)
- **Leitor Integrado de Código de Barras / QR Code**: Utiliza a biblioteca `html5-qrcode` para escaneamento instantâneo via câmera de:
  - Etiquetas de identificação do paciente (prontuário/leito)
  - Códigos de barras (EAN-13, Code-128, DataMatrix, etc.) de medicamentos ou lotes
- **Segurança MAV (Dupla Checagem)**: Medicamentos de Alta Vigilância exigem marcação obrigatória de dupla checagem por dois profissionais antes do registro.
- **Alertas de Alergia**: Exibe avisos em destaque se o paciente possuir alergias cadastradas.

### 4. 📶 Arquitetura Offline-First & Sincronização (`SyncQueue`)
- Funciona perfeitamente sem conexão de rede.
- Operações realizadas offline (cadastros, baixas e alocações) são mantidas localmente na **Fila de Sincronização (`SyncQueue`)** e automaticamente enviadas ao servidor assim que a conexão de rede é restabelecida.

### 5. 📄 Relatório Executivo PDF
- Geração instantânea de relatórios PDF oficiais com histórico de movimentações, balanço de estoque e inventário de validade utilizando `jspdf` e `jspdf-autotable`.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React, Motion, Canvas API.
- **Leitor de Código de Barras**: `html5-qrcode`.
- **Backend / API**: Express (desenvolvimento/node) e **Vercel Serverless Functions** (`/api/*`).
- **Processamento de IA**: `@google/genai` (Modelos Gemini 2.5 Flash / 3.8 Flash).
- **Geração de PDF**: `jspdf`, `jspdf-autotable`.

---

## 📁 Estrutura do Projeto

```
pharma-guard/
├── api/                       # Vercel Serverless Functions (Produção)
│   ├── scan-medicine.ts       # Endpoint de OCR / Visão Computacional com Gemini
│   ├── store.ts               # Persistência de banco de dados
│   └── health.ts              # Endpoint de verificação de status da API
├── src/
│   ├── components/            # Componentes React da Interface
│   │   ├── BarcodeDispenseModal.tsx # Modal de baixa com html5-qrcode
│   │   ├── CameraOcrModal.tsx       # Modal de captura de foto e envio IA
│   │   ├── DispensationHistory.tsx  # Histórico e auditoria
│   │   ├── HeaderNavbar.tsx         # Barra superior e indicadores
│   │   ├── NurseProfileModal.tsx    # Perfil da enfermeira e configurações
│   │   ├── PatientBoxesView.tsx     # Caixas dos pacientes por leito
│   │   ├── StockManagement.tsx      # Gestão de saldo e lotes
│   │   ├── TechnicalProposalModal.tsx# Proposta técnica e documentação
│   │   └── ValidityDashboard.tsx    # Painel FEFO de validade
│   ├── data/                  # Estruturas de dados iniciais
│   ├── types/                 # Definições de tipos TypeScript
│   └── utils/                 # Funções utilitárias
│       ├── imageUtils.ts      # Redimensionamento e compressão via Canvas API
│       ├── pdfExporter.ts     # Gerador de relatórios PDF
│       └── pharmacyUtils.ts   # Cálculos FEFO, sons e vibração hálpica
├── server.ts                  # Servidor Express local (Desenvolvimento)
├── vercel.json                # Configuração de rotas para deploy na Vercel
├── package.json
└── README.md
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- **Node.js** v18 ou superior.
- Uma chave da API **Google Gemini** ([Google AI Studio](https://aistudio.google.com/)).

### Passo a Passo

1. **Clonar o Repositório e Instalar Dependências**:
   ```bash
   git clone https://github.com/seu-usuario/pharma-guard.git
   cd pharma-guard
   npm install
   ```

2. **Configurar Variáveis de Ambiente**:
   Crie um arquivo `.env` na raiz do projeto com a sua chave da API do Gemini:
   ```env
   GEMINI_API_KEY=sua_chave_gemini_aqui
   ```

3. **Iniciar o Servidor de Desenvolvimento**:
   ```bash
   npm run dev
   ```
   Acesse a aplicação em `http://localhost:3000`.

4. **Verificar a Compilação e Linter**:
   ```bash
   npm run lint
   npm run build
   ```

---

## ☁️ Deploy na Vercel (Produção)

O projeto está otimizado para deploy em um clique na **Vercel** através da estrutura `/api` com Serverless Functions.

### Passo 1: Importar no Painel da Vercel
1. Conecte seu repositório GitHub ao painel da Vercel.
2. Mantenha as configurações de build padrão:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Passo 2: Configurar Variáveis de Ambiente na Vercel
No painel do projeto na Vercel (**Settings -> Environment Variables**), adicione a seguinte variável:

| Variável | Valor | Descrição |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | `AIzaSy...` | Sua chave oficial da API do Google Gemini |

> **Nota**: O sistema também aceita os nomes `GOOGLE_API_KEY` ou `VITE_GEMINI_API_KEY` como redundância.

### Passo 3: Rotamento Serverless (`vercel.json`)
O arquivo `vercel.json` garante o roteamento correto das APIs serverless:
```json
{
  "version": 2,
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ]
}
```

---

## 🔧 Resolução de Problemas / FAQ

### 1. A câmera não abre no celular ou navegador
- **Ssl / HTTPS**: A API de câmera do navegador (`getUserMedia`) exige que o site esteja rodando sob **HTTPS** (padrão na Vercel).
- **Permissão Negada**: Verifique se o navegador possui permissão de acesso à câmera. O modal inclui o botão **"Carregar Arquivo de Foto"** com o atributo `capture="environment"`, permitindo tirar a foto diretamente pelo app nativo de câmera do smartphone.

### 2. Erro `MISSING_GEMINI_API_KEY` ou falha ao ler medicamento
- Certifique-se de que a variável `GEMINI_API_KEY` foi salva nas configurações de ambiente da Vercel e que o projeto passou por uma nova implantação (Redeploy).

### 3. Erros de limite de requisição (`Payload Too Large` / 413)
- Todas as imagens capturadas passam obrigatoriamente pela função utilitária `compressImage` (`src/utils/imageUtils.ts`), que limita a largura máxima em **1024px** e aplica compressão JPEG a **70%**. O endpoint serverless aceita requisições até **10MB**.

---

## 📄 Licença

Este projeto é disponibilizado sob a licença [MIT](LICENSE).
