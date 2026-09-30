import fs from "fs";
import path from "path";

const DATA_DIR = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "pharma_store.json");

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const fileContent = await fs.promises.readFile(STORE_FILE, "utf-8");
        const data = JSON.parse(fileContent);
        return res.status(200).json({ success: true, data });
      }
      return res.status(200).json({ success: true, data: null });
    } catch (err: any) {
      return res.status(500).json({ error: "Falha ao carregar banco de dados." });
    }
  }

  if (req.method === 'POST') {
    try {
      const payload = req.body;
      if (!payload || typeof payload !== "object") {
        return res.status(400).json({ error: "Dados inválidos." });
      }
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      await fs.promises.writeFile(STORE_FILE, JSON.stringify(payload, null, 2), "utf-8");
      return res.status(200).json({ success: true, message: "Dados salvos permanentemente." });
    } catch (err: any) {
      return res.status(500).json({ error: "Falha ao salvar dados." });
    }
  }

  return res.status(405).json({ error: "Método não permitido." });
}
