import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const timestamp = new Date().toISOString();
  console.log(`[Vercel Serverless Test] Iniciando verificação do ambiente em ${timestamp}...`);

  const primaryKey = process.env.GEMINI_API_KEY;
  const redundantKey = process.env.VITE_GEMINI_API_KEY;
  const activeKey = primaryKey || redundantKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_KEY;

  const keyConfigured = Boolean(activeKey && activeKey !== "MY_GEMINI_API_KEY");

  // Log de auditoria para os Logs de Função da Vercel
  console.log(`[Vercel Serverless Test] GEMINI_API_KEY presente: ${Boolean(primaryKey)}`);
  console.log(`[Vercel Serverless Test] VITE_GEMINI_API_KEY presente: ${Boolean(redundantKey)}`);
  console.log(`[Vercel Serverless Test] Status geral da chave: ${keyConfigured ? "CONFIGURADA" : "AUSENTE OU INVALIDA"}`);

  if (!keyConfigured) {
    console.error("[Vercel Serverless Test] ❌ FALHA 500: process.env.GEMINI_API_KEY não foi encontrada no ambiente Serverless.");
    return res.status(500).json({
      status: "error",
      code: 500,
      message: "❌ FALHA: Chave 'GEMINI_API_KEY' não encontrada ou ausente no ambiente Serverless da Vercel.",
      details: {
        GEMINI_API_KEY_present: Boolean(primaryKey),
        VITE_GEMINI_API_KEY_present: Boolean(redundantKey),
        environment: process.env.VERCEL ? "Vercel Serverless Environment" : "Local Development Server",
        timestamp
      },
      instructions: "Acesse o Vercel Dashboard -> Settings -> Environment Variables, adicione GEMINI_API_KEY para Production, Preview e Development, e execute o Redeploy."
    });
  }

  // Mascaramento de segurança da chave
  const maskedKey = activeKey!.substring(0, 6) + "..." + activeKey!.substring(activeKey!.length - 4);
  console.log(`[Vercel Serverless Test] Chave carregada com sucesso (${maskedKey}). Efetuando chamada de ping ao Google Gemini...`);

  try {
    const ai = new GoogleGenAI({
      apiKey: activeKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Responda apenas com a palavra OK.",
    });

    console.log(`[Vercel Serverless Test] ✅ SUCESSO 200: Conexão efetuada com sucesso! Resposta Gemini: ${response?.text?.trim()}`);

    return res.status(200).json({
      status: "success",
      code: 200,
      message: "✅ SUCESSO: process.env.GEMINI_API_KEY carregada corretamente e comunicação com a IA validada!",
      keyInfo: {
        maskedKey,
        sourceVariable: primaryKey ? "GEMINI_API_KEY" : (redundantKey ? "VITE_GEMINI_API_KEY" : "OTHER_KEY"),
      },
      geminiResponse: response?.text?.trim() || "OK",
      environment: process.env.VERCEL ? "Vercel Serverless Environment" : "Local Development Server",
      timestamp
    });

  } catch (err: any) {
    console.error(`[Vercel Serverless Test] ❌ ERRO 500 ao chamar Google Gemini SDK:`, err?.message || err);
    return res.status(500).json({
      status: "error",
      code: 500,
      message: "❌ ERRO: A chave está presente no ambiente, mas a chamada à API do Gemini retornou erro.",
      errorDetails: err?.message || String(err),
      timestamp
    });
  }
}
