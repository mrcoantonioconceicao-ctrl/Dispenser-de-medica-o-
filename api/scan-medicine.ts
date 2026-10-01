import { GoogleGenAI, Type } from "@google/genai";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  try {
    const { imageBase64, mimeType } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ error: "Imagem não fornecida no payload da requisição." });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_KEY;

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      console.error("[Vercel API scan-medicine] ❌ Chave GEMINI_API_KEY ausente ou não configurada nas variáveis de ambiente.");
      return res.status(400).json({
        error: "Chave da API do Gemini não configurada na Vercel (GEMINI_API_KEY / VITE_GEMINI_API_KEY). Por favor, configure a chave nas variáveis de ambiente no painel de deploy.",
        code: "MISSING_GEMINI_API_KEY"
      });
    }

    const maskedKey = apiKey.substring(0, 6) + "..." + apiKey.substring(apiKey.length - 4);
    console.log(`[Vercel API scan-medicine] 🚀 Requisição de OCR recebida. Chave de API ativada: (${maskedKey})`);

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/jpeg",
        data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
      },
    };

    const promptText = `Você é um sistema especializado em visão computacional e farmacologia para enfermagem hospitalar.
Examine com atenção o rótulo da embalagem do medicamento (caixa, frasco, cartela ou ampola) fornecido na imagem.
Extraia com máxima precisão os seguintes campos em JSON:
1. nomeComercial: Nome da marca ou nome comercial em destaque.
2. principioAtivo: Princípio ativo ou denominação genérica (DCB).
3. dosagem: Concentração/dosagem (ex: 500mg, 10mg/mL, 1g, 100 UI/mL).
4. formaFarmaceutica: Ex: Comprimido, Frasco-Ampola, Solução Injetável, Xarope, Pomada, Cartucho.
5. dataValidade: Data de validade formatada rigorosamente como YYYY-MM-DD (se só houver Mês/Ano, assuma o último dia daquele mês, ex: 11/2026 -> 2026-11-30).
6. lote: Número do lote identificado no rótulo.
7. codigoBarras: Código EAN-13 ou código de barras alfanumérico visível.
8. paraQueServe: Descrição sucinta (1 a 2 frases) da indicação terapêutica principal e classe farmacológica.
9. cuidadosEspeciais: Cuidados de enfermagem essenciais (ex: "Refrigerar 2°C - 8°C", "Medicamento de Alta Vigilância (MAV) - Requer dupla checagem", "Proteger da luz", "Monitorar pressão arterial").
10. altaVigilancia: boolean true se for medicamento de alta vigilância / alerta (anticoagulantes, insulinas, opioides, sedativos, cloreto de potássio concentrado, quimioterápicos, etc.).
11. confiancaLeitura: número inteiro de 0 a 100 indicando o nível de confiança do OCR da imagem.`;

    const modelsToTry = ["gemini-2.5-flash", "gemini-3.8-flash", "gemini-3.1-flash-lite"];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: {
              parts: [imagePart, { text: promptText }],
            },
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  nomeComercial: { type: Type.STRING },
                  principioAtivo: { type: Type.STRING },
                  dosagem: { type: Type.STRING },
                  formaFarmaceutica: { type: Type.STRING },
                  dataValidade: { type: Type.STRING },
                  lote: { type: Type.STRING },
                  codigoBarras: { type: Type.STRING },
                  paraQueServe: { type: Type.STRING },
                  cuidadosEspeciais: { type: Type.STRING },
                  confiancaLeitura: { type: Type.NUMBER },
                  altaVigilancia: { type: Type.BOOLEAN },
                },
                required: [
                  "nomeComercial",
                  "principioAtivo",
                  "dosagem",
                  "formaFarmaceutica",
                  "dataValidade",
                  "lote",
                  "codigoBarras",
                  "paraQueServe",
                  "cuidadosEspeciais",
                  "altaVigilancia",
                  "confiancaLeitura",
                ],
              },
            },
          });

          if (response && response.text) {
            const parsed = JSON.parse(response.text);
            
            // Mapeamento normalizado garantindo compatibilidade com chaves em Inglês e Português
            const normalizedData = {
              // Chaves em Português
              nomeComercial: parsed.nomeComercial || parsed.name || '',
              principioAtivo: parsed.principioAtivo || '',
              dosagem: parsed.dosagem || parsed.dosage || '',
              formaFarmaceutica: parsed.formaFarmaceutica || '',
              dataValidade: parsed.dataValidade || parsed.expirationDate || '',
              lote: parsed.lote || parsed.batchNumber || '',
              codigoBarras: parsed.codigoBarras || parsed.barcode || '',
              paraQueServe: parsed.paraQueServe || parsed.indications || '',
              cuidadosEspeciais: parsed.cuidadosEspeciais || parsed.nursingCare || '',
              altaVigilancia: Boolean(parsed.altaVigilancia ?? parsed.isMAV ?? false),
              confiancaLeitura: parsed.confiancaLeitura ?? 95,

              // Chaves em Inglês (Atende à especificação da Vercel Serverless Function)
              name: parsed.nomeComercial || parsed.name || '',
              dosage: parsed.dosagem || parsed.dosage || '',
              batchNumber: parsed.lote || parsed.batchNumber || '',
              expirationDate: parsed.dataValidade || parsed.expirationDate || '',
              barcode: parsed.codigoBarras || parsed.barcode || '',
              isMAV: Boolean(parsed.altaVigilancia ?? parsed.isMAV ?? false),
              nursingCare: parsed.cuidadosEspeciais || parsed.nursingCare || '',
              indications: parsed.paraQueServe || parsed.indications || ''
            };

            console.log(`[Vercel API scan-medicine] ✅ Sucesso no OCR via ${modelName}:`, normalizedData.nomeComercial);

            return res.status(200).json({ 
              success: true, 
              data: normalizedData, 
              // Também disponibiliza o objeto nos níveis raíz para integrações diretas
              ...normalizedData,
              source: modelName 
            });
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`[Gemini OCR] Tentativa ${attempt} modelo ${modelName} falhou:`, err?.message || err);
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 600));
          }
        }
      }
    }

    return res.status(500).json({
      error: `Falha na API da IA do Gemini: ${lastError?.message || 'Não foi possível extrair os dados da embalagem.'}`
    });

  } catch (err: any) {
    console.error("Erro na Vercel API scan-medicine:", err);
    return res.status(500).json({
      error: "Falha de execução no servidor ao processar a imagem do medicamento.",
      details: err?.message || String(err)
    });
  }
}
