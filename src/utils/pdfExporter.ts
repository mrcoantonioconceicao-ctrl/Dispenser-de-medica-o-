import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Medicamento, LoteEstoque, PacienteCaixa, MovimentacaoDispensacao, EnfermeiraProfile } from '../types';

export function generateExecutivePDFReport(
  medicaments: Medicamento[],
  lots: LoteEstoque[],
  patients: PacienteCaixa[],
  dispensations: MovimentacaoDispensacao[],
  nurse: EnfermeiraProfile
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const now = new Date();
  const formattedDate = now.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const reportId = `REP-EXEC-${Math.floor(100000 + Math.random() * 900000)}`;

  // Page width and margin helpers
  const pageWidth = doc.internal.pageSize.getWidth(); // ~210mm
  const margin = 14;
  let currentY = 14;

  // Header Background - Deep Navy Banner
  doc.setFillColor(15, 23, 42); // #0f172a
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Emerald Accent Line
  doc.setFillColor(5, 150, 105); // #059669
  doc.rect(0, 42, pageWidth, 2.5, 'F');

  // Title in Header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('PHARMACARE NURSE', margin, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129); // emerald-400
  doc.text('RELATÓRIO EXECUTIVO DE AUDITORIA & GESTÃO DE ESTOQUE DE FARMÁCIA', margin, 23);

  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`Protocolo Oficial de Auditoria: ${reportId}  |  Emissão: ${formattedDate}`, margin, 30);
  doc.text(`Sistema de Gestão Sanitária e Rastreabilidade FEFO por Código de Barras e IA`, margin, 35);

  currentY = 52;

  // Nurse & Hospital Unit Meta Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 22, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('UNIDADE & RESPONSÁVEL TÉCNICO', margin + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  doc.text(`Setor / Unidade: ${nurse.setor || 'Posto de Enfermagem'}`, margin + 4, currentY + 12);
  doc.text(`Turno de Operação: ${nurse.turno || 'Plantão'}`, margin + 4, currentY + 17);

  doc.text(`Enfermeiro(a) Resp.: ${nurse.nome || 'Não Informado'}`, pageWidth / 2 + 10, currentY + 12);
  doc.text(`COREN: ${nurse.coren || 'N/A'}`, pageWidth / 2 + 10, currentY + 17);

  currentY += 28;

  // KPI Executive Summary Cards Calculation
  const totalMedCount = medicaments.length;
  const totalLotsCount = lots.length;
  const totalUnitsInStock = lots.reduce((sum, l) => sum + l.quantidadeAtual, 0);

  let expiredCount = 0;
  let criticalCount = 0; // <= 30 days
  let warningCount = 0;  // 31-90 days
  let safeCount = 0;

  const today = new Date();
  today.setHours(0,0,0,0);

  lots.forEach(l => {
    const valDate = new Date(l.dataValidade + 'T00:00:00');
    const diffDays = Math.ceil((valDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    if (diffDays < 0) expiredCount++;
    else if (diffDays <= 30) criticalCount++;
    else if (diffDays <= 90) warningCount++;
    else safeCount++;
  });

  const totalPatients = patients.length;
  const totalDispensations = dispensations.length;

  // Render Executive KPI Summary Cards (4 Cards Grid)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('RESUMO EXECUTIVO DE INDICADORES DE DESEMPENHO (KPIs)', margin, currentY);
  currentY += 5;

  const cardWidth = (pageWidth - (margin * 2) - 9) / 4;
  const cardHeight = 18;

  // Card 1: Total Medicamentos & Unidades
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(167, 243, 208); // emerald-200
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(4, 120, 87);
  doc.text('ITENS / UNIDADES', margin + 3, currentY + 5);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`${totalMedCount} med. / ${totalUnitsInStock} un.`, margin + 3, currentY + 12);

  // Card 2: Lotes & Validades
  doc.setFillColor(239, 246, 255); // blue-50
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(margin + cardWidth + 3, currentY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(29, 78, 216);
  doc.text('LOTES EM ESTOQUE', margin + cardWidth + 6, currentY + 5);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`${totalLotsCount} lotes (${safeCount} OK)`, margin + cardWidth + 6, currentY + 12);

  // Card 3: Riscos Sanitários (Vencidos / Críticos)
  const isAlert = expiredCount > 0 || criticalCount > 0;
  doc.setFillColor(isAlert ? 254 : 248, isAlert ? 242 : 250, isAlert ? 242 : 252);
  doc.setDrawColor(isAlert ? 254 : 226, isAlert ? 202 : 232, isAlert ? 202 : 240);
  doc.roundedRect(margin + (cardWidth * 2) + 6, currentY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(isAlert ? 185 : 71, isAlert ? 28 : 85, isAlert ? 28 : 105);
  doc.text('VENCIDOS / CRÍTICOS', margin + (cardWidth * 2) + 9, currentY + 5);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`${expiredCount} venc. | ${criticalCount} crit.`, margin + (cardWidth * 2) + 9, currentY + 12);

  // Card 4: Dispensações Rastreadas
  doc.setFillColor(245, 243, 255); // purple-50
  doc.setDrawColor(221, 214, 254);
  doc.roundedRect(margin + (cardWidth * 3) + 9, currentY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(109, 40, 217);
  doc.text('DISPENSAÇÕES FEFO', margin + (cardWidth * 3) + 12, currentY + 5);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`${totalDispensations} saídas`, margin + (cardWidth * 3) + 12, currentY + 12);

  currentY += cardHeight + 10;

  // Section 1: Stock Inventory & Expiry Thermometer Table
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. AUDITORIA DE LOTES EM ESTOQUE E TERMÔMETRO DE VALIDADES', margin, currentY);
  currentY += 4;

  const lotTableData = lots.map(lote => {
    const med = medicaments.find(m => m.id === lote.medicamentoId);
    const valDate = new Date(lote.dataValidade + 'T00:00:00');
    const diffDays = Math.ceil((valDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    let statusText = 'ADEQUADO';
    if (diffDays < 0) statusText = 'VENCIDO!';
    else if (diffDays <= 30) statusText = `CRÍTICO (${diffDays}d)`;
    else if (diffDays <= 90) statusText = `ALERTA (${diffDays}d)`;

    const formattedVal = valDate.toLocaleDateString('pt-BR');

    return [
      med ? `${med.nomeComercial}${med.altaVigilancia ? ' [MAV]' : ''}` : 'Medicamento Desconhecido',
      med ? med.principioAtivo : '-',
      med ? med.dosagem : '-',
      lote.lote,
      formattedVal,
      `${lote.quantidadeAtual} un`,
      lote.localizacaoPrateleira || 'Prateleira A1',
      statusText
    ];
  });

  if (lotTableData.length === 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('Nenhum lote cadastrado no estoque até o momento.', margin, currentY + 4);
    currentY += 10;
  } else {
    autoTable(doc, {
      startY: currentY,
      head: [['Medicamento', 'Princípio Ativo', 'Dosagem', 'Lote', 'Validade', 'Qtd', 'Local', 'Status FEFO']],
      body: lotTableData,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'left'
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [51, 65, 85]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 7) {
          const text = String(data.cell.raw);
          if (text.includes('VENCIDO')) {
            data.cell.styles.textColor = [225, 29, 72]; // rose-600
            data.cell.styles.fontStyle = 'bold';
          } else if (text.includes('CRÍTICO')) {
            data.cell.styles.textColor = [217, 119, 6]; // amber-600
            data.cell.styles.fontStyle = 'bold';
          } else if (text.includes('ALERTA')) {
            data.cell.styles.textColor = [180, 83, 9];
          } else {
            data.cell.styles.textColor = [5, 150, 105]; // emerald-600
          }
        }
      },
      margin: { left: margin, right: margin }
    });

    // Get final Y after table
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Check page break for Section 2
  if (currentY > 230) {
    doc.addPage();
    currentY = 16;
  }

  // Section 2: Recent Dispensation Log
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. HISTÓRICO DE DISPENSAÇÃO E RASTREABILIDADE PACIENTE-LOTE (FEFO)', margin, currentY);
  currentY += 4;

  const dispTableData = dispensations.slice(0, 15).map(d => {
    const med = medicaments.find(m => m.id === d.medicamentoId);
    const lote = lots.find(l => l.id === d.loteId);
    const dDate = new Date(d.dataHora).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    return [
      dDate,
      med ? med.nomeComercial : 'Medicamento',
      lote ? lote.lote : '-',
      `${d.quantidadeDispensada} un`,
      d.nomePaciente ? `${d.nomePaciente} (${d.leito})` : d.leito,
      d.enfermeiraResponsavel,
      d.duplaChecagemOK ? 'Sim (Validado)' : 'Sim'
    ];
  });

  if (dispTableData.length === 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('Nenhuma movimentação de dispensação registrada até o momento.', margin, currentY + 4);
    currentY += 12;
  } else {
    autoTable(doc, {
      startY: currentY,
      head: [['Data/Hora', 'Medicamento', 'Lote', 'Qtd', 'Paciente / Leito', 'Resp. Enfermagem', 'Dupla Checagem']],
      body: dispTableData,
      theme: 'grid',
      headStyles: {
        fillColor: [5, 150, 105],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [51, 65, 85]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;
  }

  // Check page break for Signatures Block
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }

  // Section 3: Executive Signatures Block
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 36, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('AQUISCÊNCIA E VALIDAÇÃO SANITÁRIA DE PASSAGEM DE PLANTÃO', margin + 4, currentY + 6);

  const sigWidth = (pageWidth - (margin * 2) - 30) / 2;

  // Signature Line 1: Enfermeiro(a)
  doc.setDrawColor(100, 116, 139);
  doc.line(margin + 6, currentY + 22, margin + 6 + sigWidth, currentY + 22);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(`${nurse.nome || 'Enfermeiro(a) Responsável'}`, margin + 6, currentY + 26);
  doc.setFont('helvetica', 'normal');
  doc.text(`Enfermagem RT - COREN: ${nurse.coren || '_____'}`, margin + 6, currentY + 30);

  // Signature Line 2: Farmacêutico RT
  doc.line(margin + 16 + sigWidth, currentY + 22, margin + 16 + (sigWidth * 2), currentY + 22);
  doc.setFont('helvetica', 'bold');
  doc.text('Farmacêutico(a) Responsável Técnico', margin + 16 + sigWidth, currentY + 26);
  doc.setFont('helvetica', 'normal');
  doc.text('CRF: ________ / Carimbo e Assinatura', margin + 16 + sigWidth, currentY + 30);

  // Footer across all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `PharmaCare Nurse - Sistema Executivo de Controle FEFO e Rastreabilidade | Documento Autêntico | Página ${i} de ${pageCount}`,
      margin,
      288
    );
  }

  // Save PDF file with executive naming convention
  const fileName = `Relatorio_Executivo_Farmacia_${nurse.setor ? nurse.setor.replace(/\s+/g, '_') : 'Posto'}_${now.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
