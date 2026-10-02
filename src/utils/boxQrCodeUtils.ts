import QRCode from 'qrcode';
import { ResidentMedicationBox } from '../types';

/**
 * Standard QR Code Payload generator for Resident Medication Boxes.
 * Formats as a direct universal web link that works both in external phone camera
 * scanners (redirecting to the app with query params) and within the in-app scanner.
 */
export function getBoxQrPayload(box: ResidentMedicationBox): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    const pathname = window.location.pathname || '/';
    return `${origin}${pathname}?tab=RESIDENTS&boxId=${encodeURIComponent(box.id)}`;
  }
  return `pharmaguard:box:${box.id}`;
}

/**
 * Generates a high-quality Data URL (Base64 PNG) for a resident medication box.
 */
export async function generateBoxQrDataUrl(
  box: ResidentMedicationBox,
  options?: { width?: number; margin?: number; darkColor?: string; lightColor?: string }
): Promise<string> {
  const payload = getBoxQrPayload(box);
  const qrOptions: QRCode.QRCodeToDataURLOptions = {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    margin: options?.margin ?? 2,
    width: options?.width ?? 320,
    color: {
      dark: options?.darkColor ?? '#0f172a', // slate-900
      light: options?.lightColor ?? '#ffffff'
    }
  };

  try {
    return await QRCode.toDataURL(payload, qrOptions);
  } catch (error) {
    console.error('Erro ao gerar QR code da caixa:', error);
    throw error;
  }
}

/**
 * Generates an SVG string representation of the QR Code.
 */
export async function generateBoxQrSvg(
  box: ResidentMedicationBox,
  options?: { margin?: number }
): Promise<string> {
  const payload = getBoxQrPayload(box);
  try {
    return await QRCode.toString(payload, {
      type: 'svg',
      margin: options?.margin ?? 1,
      errorCorrectionLevel: 'H'
    });
  } catch (error) {
    console.error('Erro ao gerar SVG do QR code:', error);
    throw error;
  }
}

/**
 * Flexible QR Code parser: resolves scanned text into a matching ResidentMedicationBox.
 * Supports:
 * - Direct Web URL with ?boxId=... or &boxId=...
 * - Custom protocol: pharmaguard:box:<id> or pharmaguard://box/<id>
 * - Structured JSON: {"boxId": "...", ...}
 * - Direct Box ID matching: e.g. "box-1", "box-2"
 * - Room matching fallback: e.g. "Quarto 07"
 */
export function parseBoxQrCode(
  scannedText: string,
  boxes: ResidentMedicationBox[]
): ResidentMedicationBox | null {
  if (!scannedText || !boxes || boxes.length === 0) return null;

  const raw = scannedText.trim();

  // 1. Check for URL parameter ?boxId=... or &boxId=...
  try {
    if (raw.includes('boxId=')) {
      const url = new URL(raw.startsWith('http') ? raw : `https://dummy.local/${raw.replace(/^\?/, '')}`);
      const boxId = url.searchParams.get('boxId');
      if (boxId) {
        const found = boxes.find(b => b.id.toLowerCase() === boxId.toLowerCase());
        if (found) return found;
      }
    }
  } catch {
    // regex fallback for partial URL query string
    const match = raw.match(/[?&]boxId=([^&#\s]+)/i);
    if (match && match[1]) {
      const boxId = decodeURIComponent(match[1]);
      const found = boxes.find(b => b.id.toLowerCase() === boxId.toLowerCase());
      if (found) return found;
    }
  }

  // 2. Check for custom protocol string e.g. pharmaguard:box:box-1 or pharmaguard://box/box-1
  const protocolMatch = raw.match(/pharmaguard(?::\/\/|\/:|:)(?:box\/|box:)?([^/\s]+)/i);
  if (protocolMatch && protocolMatch[1]) {
    const boxId = protocolMatch[1].trim();
    const found = boxes.find(b => b.id.toLowerCase() === boxId.toLowerCase());
    if (found) return found;
  }

  // 3. Check for JSON payload
  if (raw.startsWith('{') && raw.endsWith('}')) {
    try {
      const parsed = JSON.parse(raw);
      const targetId = parsed.boxId || parsed.id;
      if (targetId) {
        const found = boxes.find(b => b.id.toLowerCase() === String(targetId).toLowerCase());
        if (found) return found;
      }
    } catch {
      // not valid json, proceed to other checks
    }
  }

  // 4. Direct exact match with box.id
  const directId = boxes.find(b => b.id.toLowerCase() === raw.toLowerCase());
  if (directId) return directId;

  // 5. Fallback match by room number (e.g., if label only had room identifier)
  const roomClean = raw.toLowerCase().replace(/^(quarto|leito|apto|quarto\s*nº?)\s*/i, '').trim();
  const roomMatch = boxes.find(b => {
    const bRoomClean = b.roomNumber.toLowerCase().replace(/^(quarto|leito|apto|quarto\s*nº?)\s*/i, '').trim();
    return bRoomClean === roomClean || b.roomNumber.toLowerCase() === raw.toLowerCase();
  });
  if (roomMatch) return roomMatch;

  return null;
}

/**
 * Downloads a high-resolution PNG image of the box QR code with metadata for physical printing.
 */
export function downloadBoxQrImage(box: ResidentMedicationBox, qrDataUrl: string): void {
  const link = document.createElement('a');
  const safeResident = box.residentName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const safeRoom = box.roomNumber.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  link.download = `qrcode_caixa_${safeRoom}_${safeResident}.png`;
  link.href = qrDataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates and opens a printable sticker label tailored for physical acrylic/plastic medication boxes.
 */
export function printSingleBoxLabel(box: ResidentMedicationBox, qrDataUrl: string): void {
  const printWindow = window.open('', '_blank', 'width=750,height=800');
  if (!printWindow) {
    alert('Por favor, permita pop-ups no seu navegador para imprimir a etiqueta.');
    return;
  }

  const medsListHtml = box.medications.map(m => `
    <tr>
      <td style="padding: 4px 6px; border-bottom: 1px solid #e2e8f0; font-weight: bold; font-size: 11px;">
        ${m.name} ${m.presentation}
      </td>
      <td style="padding: 4px 6px; border-bottom: 1px solid #e2e8f0; font-size: 10px; color: #475569;">
        ${m.schedules.join(', ')}
      </td>
      <td style="padding: 4px 6px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 10px; font-weight: bold;">
        ${m.dailyUsage} un/dia
      </td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Etiqueta Caixa - ${box.residentName} (${box.roomNumber})</title>
      <style>
        @page {
          size: 100mm 150mm;
          margin: 4mm;
        }
        * {
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        body {
          margin: 0;
          padding: 8px;
          background: #ffffff;
          color: #0f172a;
        }
        .label-card {
          border: 2px solid #0f172a;
          border-radius: 8px;
          padding: 12px;
          max-width: 95mm;
          margin: 0 auto;
          background: #fff;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 6px;
          margin-bottom: 8px;
        }
        .brand {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.5px;
          color: #1e3a8a;
          text-transform: uppercase;
        }
        .sub-brand {
          font-size: 9px;
          color: #64748b;
        }
        .room-badge {
          background: #0f172a;
          color: #ffffff;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }
        .resident-name {
          font-size: 16px;
          font-weight: 900;
          margin: 0 0 2px 0;
          line-height: 1.2;
        }
        .cycle-info {
          font-size: 9.5px;
          color: #334155;
          margin-bottom: 8px;
        }
        .qr-section {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          border-radius: 6px;
          padding: 8px;
          margin-bottom: 8px;
        }
        .qr-image {
          width: 80px;
          height: 80px;
          border-radius: 4px;
          background: #fff;
        }
        .qr-text {
          flex: 1;
        }
        .qr-title {
          font-size: 11px;
          font-weight: bold;
          color: #0f172a;
          margin-bottom: 2px;
        }
        .qr-desc {
          font-size: 8.5px;
          color: #475569;
          line-height: 1.3;
        }
        .qr-box-id {
          font-family: monospace;
          font-size: 8px;
          background: #e2e8f0;
          padding: 1px 4px;
          border-radius: 3px;
          display: inline-block;
          margin-top: 4px;
        }
        .meds-title {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
          color: #334155;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 8px;
        }
        .footer {
          font-size: 8px;
          color: #94a3b8;
          text-align: center;
          border-top: 1px solid #e2e8f0;
          padding-top: 4px;
          margin-top: 6px;
        }
        @media print {
          .no-print { display: none !important; }
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="text-align: center; margin-bottom: 12px; padding: 10px; background: #e0e7ff; border-radius: 6px;">
        <button onclick="window.print()" style="background: #2563eb; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; font-size: 13px; cursor: pointer;">
          🖨️ Imprimir Etiqueta da Caixa
        </button>
      </div>

      <div class="label-card">
        <div class="header">
          <div>
            <div class="brand">PharmaGuard · ILPI</div>
            <div class="sub-brand">Caixa Individual de Medicamentos</div>
          </div>
          <div class="room-badge">${box.roomNumber}</div>
        </div>

        <h1 class="resident-name">${box.residentName}</h1>
        <div class="cycle-info">
          Ciclo: ${box.startDate ? box.startDate.split('-').reverse().join('/') : 'Início'} a ${box.endDate ? box.endDate.split('-').reverse().join('/') : 'Fim'} (${box.periodDays} dias)
          ${box.lastRestockDate ? ` · Abast.: ${box.lastRestockDate.split('-').reverse().join('/')}` : ''}
        </div>

        <div class="qr-section">
          <img class="qr-image" src="${qrDataUrl}" alt="QR Code da Caixa" />
          <div class="qr-text">
            <div class="qr-title">📷 Escanear para Administrar</div>
            <div class="qr-desc">
              Aponte o leitor do PharmaGuard para abrir instantaneamente esta caixa e debitar as doses.
            </div>
            <div class="qr-box-id">ID: ${box.id}</div>
          </div>
        </div>

        <div class="meds-title">Medicamentos Prescritos (${box.medications.length})</div>
        <table>
          <thead>
            <tr style="background: #f1f5f9; text-align: left; font-size: 9px; color: #475569;">
              <th style="padding: 3px 6px;">Medicamento</th>
              <th style="padding: 3px 6px;">Horários</th>
              <th style="padding: 3px 6px; text-align: center;">Dose</th>
            </tr>
          </thead>
          <tbody>
            ${medsListHtml}
          </tbody>
        </table>

        ${box.notes ? `
          <div style="font-size: 8.5px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 4px; padding: 4px 6px; margin-bottom: 6px; color: #92400e;">
            <strong>Obs.:</strong> ${box.notes}
          </div>
        ` : ''}

        <div class="footer">
          Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · Sistema PharmaGuard
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/**
 * Generates and prints a complete sheet containing labels for all resident boxes in the ILPI.
 */
export async function printAllBoxesQrSheet(boxes: ResidentMedicationBox[]): Promise<void> {
  const printWindow = window.open('', '_blank', 'width=900,height=900');
  if (!printWindow) {
    alert('Por favor, permita pop-ups no seu navegador para imprimir a folha de etiquetas.');
    return;
  }

  // Pre-generate all QR codes
  const boxesWithQrs = await Promise.all(
    boxes.map(async box => {
      const qrDataUrl = await generateBoxQrDataUrl(box, { width: 240, margin: 1 });
      return { box, qrDataUrl };
    })
  );

  const cardsHtml = boxesWithQrs.map(({ box, qrDataUrl }) => {
    const medsSummary = box.medications
      .slice(0, 4)
      .map(m => `<span style="display: inline-block; background: #f1f5f9; padding: 2px 5px; border-radius: 3px; font-size: 9px; margin: 1px 2px;">${m.name} (${m.schedules.join('/')})</span>`)
      .join('');

    return `
      <div class="grid-card">
        <div class="card-header">
          <div>
            <span class="room-pill">${box.roomNumber}</span>
            <h3 class="card-name">${box.residentName}</h3>
          </div>
        </div>
        <div class="card-body">
          <img class="card-qr" src="${qrDataUrl}" alt="QR ${box.residentName}" />
          <div class="card-details">
            <div class="card-cycle">Ciclo: ${box.periodDays} dias</div>
            <div class="card-id">ID: ${box.id}</div>
            <div class="card-scan-hint">Escanear para abrir caixa</div>
          </div>
        </div>
        <div class="card-meds">
          ${medsSummary}
          ${box.medications.length > 4 ? `<span style="font-size: 8px; color: #64748b;">+${box.medications.length - 4} outros</span>` : ''}
        </div>
      </div>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Folha Geral de Etiquetas QR - Caixas ILPI</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
        * {
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        body {
          margin: 0;
          padding: 12px;
          background: #ffffff;
          color: #0f172a;
        }
        .sheet-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 8px;
          margin-bottom: 16px;
        }
        .sheet-title {
          font-size: 18px;
          font-weight: 800;
          margin: 0;
        }
        .sheet-subtitle {
          font-size: 11px;
          color: #64748b;
        }
        .labels-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .grid-card {
          border: 1.5px solid #0f172a;
          border-radius: 8px;
          padding: 10px;
          background: #ffffff;
          page-break-inside: avoid;
        }
        .card-header {
          margin-bottom: 6px;
        }
        .room-pill {
          background: #0f172a;
          color: #ffffff;
          font-size: 9px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .card-name {
          font-size: 13px;
          font-weight: 800;
          margin: 4px 0 0 0;
        }
        .card-body {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
        }
        .card-qr {
          width: 70px;
          height: 70px;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
        }
        .card-details {
          flex: 1;
        }
        .card-cycle {
          font-size: 10px;
          font-weight: 600;
          color: #334155;
        }
        .card-id {
          font-size: 9px;
          font-family: monospace;
          color: #64748b;
          margin: 2px 0;
        }
        .card-scan-hint {
          font-size: 9px;
          color: #2563eb;
          font-weight: 600;
        }
        .card-meds {
          border-top: 1px dashed #cbd5e1;
          padding-top: 4px;
        }
        @media print {
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="text-align: center; margin-bottom: 16px; padding: 12px; background: #e0e7ff; border-radius: 8px;">
        <button onclick="window.print()" style="background: #2563eb; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; font-size: 14px; cursor: pointer;">
          🖨️ Imprimir Todas as Etiquetas da ILPI (${boxes.length} Residentes)
        </button>
      </div>

      <div class="sheet-header">
        <div>
          <h1 class="sheet-title">Etiquetas QR · Caixas de Medicamentos ILPI</h1>
          <div class="sheet-subtitle">Controle de Uso e Saldo · Total de ${boxes.length} caixas cadastradas</div>
        </div>
        <div style="font-size: 10px; text-align: right; color: #64748b;">
          ${new Date().toLocaleDateString('pt-BR')}
        </div>
      </div>

      <div class="labels-grid">
        ${cardsHtml}
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
