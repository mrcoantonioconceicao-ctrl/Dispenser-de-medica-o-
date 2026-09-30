/**
 * Utilitário de Processamento e Otimização de Imagens para Câmera Mobile
 * 
 * Utiliza a API HTML5 Canvas para redimensionar fotos capturadas pela câmera
 * para uma largura máxima de 1024px e aplicar compactação JPEG (qualidade 0.7).
 * Garante que o payload em base64 permaneça bem abaixo dos limites de requisição
 * serverless (como o limite de 4.5MB do Vercel / Cloud Run), prevenindo erros 413
 * (Payload Too Large) e timeouts de rede.
 */

export interface ImageOptimizationOptions {
  maxWidth?: number; // Padrão: 1024px
  quality?: number;  // Padrão: 0.7 (70% de qualidade JPEG)
}

export interface OptimizedImageResult {
  dataUrl: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  width: number;
  height: number;
}

/**
 * Calcula o tamanho aproximado em kilobytes (KB) de uma string base64
 */
export function estimateBase64SizeKb(base64: string): number {
  if (!base64) return 0;
  // Remove o cabeçalho data:image/...;base64, se existir
  const cleanBase64 = base64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');
  const padding = (cleanBase64.endsWith('==') ? 2 : cleanBase64.endsWith('=') ? 1 : 0);
  const bytes = (cleanBase64.length * 3) / 4 - padding;
  return Math.round(bytes / 1024);
}

/**
 * Redimensiona uma foto (DataURL, File ou Blob) para largura máxima de 1024px
 * e aplica compactação JPEG com qualidade 0.7 utilizando a API Canvas.
 * 
 * @param source DataURL em string, File ou Blob da foto tirada pela câmera
 * @param options Opções personalizadas (maxWidth: 1024, quality: 0.7)
 * @returns Promise que resolve para a string DataURL (JPEG compactado)
 */
export async function resizeAndCompressImage(
  source: string | File | Blob,
  options: ImageOptimizationOptions = {}
): Promise<string> {
  const result = await processImageWithCanvas(source, options);
  return result.dataUrl;
}

/**
 * Processa a imagem via Canvas retornando o DataURL compactado e métricas de tamanho
 */
export async function processImageWithCanvas(
  source: string | File | Blob,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImageResult> {
  const maxWidth = options.maxWidth ?? 1024;
  const quality = options.quality ?? 0.7;

  return new Promise((resolve, reject) => {
    let objectUrl: string | null = null;
    let imageSrc = '';

    if (typeof source === 'string') {
      imageSrc = source;
    } else if (source && typeof source === 'object' && 'size' in source) {
      objectUrl = URL.createObjectURL(source as Blob);
      imageSrc = objectUrl;
    } else {
      return reject(new Error('Formato de imagem não suportado. Forneça uma string data URL, File ou Blob.'));
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        // Se a largura for superior ao limite de 1024px, redimensiona proporcionalmente
        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = Math.round(height * ratio);
        }

        // Cria o elemento Canvas em memória
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          return reject(new Error('Não foi possível obter o contexto 2D do Canvas.'));
        }

        // Configura renderização suave de alta qualidade
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Preenche fundo branco (evita fundo preto caso a imagem original possua transparência)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Desenha a imagem redimensionada no Canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Exporta como JPEG com compactação 0.7
        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Calcula métricas de tamanho para auditoria e feedback visual
        const originalSizeKb = typeof source === 'string' 
          ? estimateBase64SizeKb(source) 
          : Math.round(source.size / 1024);
        const compressedSizeKb = estimateBase64SizeKb(dataUrl);

        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }

        resolve({
          dataUrl,
          originalSizeKb,
          compressedSizeKb,
          width,
          height
        });
      } catch (err) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        reject(new Error(`Falha no processamento Canvas: ${err instanceof Error ? err.message : String(err)}`));
      }
    };

    img.onerror = (event) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error('Falha ao carregar a imagem na API Canvas para redimensionamento e compactação.'));
    };

    img.src = imageSrc;
  });
}

/**
 * Função utilitária compressImage para compactação direta de File, Blob ou DataURL
 */
export async function compressImage(
  source: string | File | Blob,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImageResult> {
  return processImageWithCanvas(source, options);
}

/**
 * Função utilitária com nome amigável para chamadas de captura de câmera
 */
export const compressCameraPhoto = processImageWithCanvas;

/**
 * Compatibilidade com interfaces legadas
 */
export async function compressImageBase64(
  input: string | File | Blob,
  options: { maxWidth?: number; quality?: number } = {}
): Promise<{ compressedBase64: string; originalSizeKb: number; compressedSizeKb: number }> {
  const res = await processImageWithCanvas(input, {
    maxWidth: options.maxWidth ?? 1024,
    quality: options.quality ?? 0.7
  });
  return {
    compressedBase64: res.dataUrl,
    originalSizeKb: res.originalSizeKb,
    compressedSizeKb: res.compressedSizeKb
  };
}
