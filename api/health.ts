export default async function handler(req: any, res: any) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_KEY;
  const hasKey = Boolean(apiKey && apiKey !== "MY_GEMINI_API_KEY");

  return res.status(200).json({
    status: "ok",
    app: "PharmaCare Nurse API (Production)",
    aiServiceConfigured: hasKey,
    environment: process.env.VERCEL ? "Vercel Serverless" : "Node Express Server",
    timestamp: new Date().toISOString()
  });
}
