import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Venta,
  Compra,
  Cliente,
  Proveedor,
  Empresa,
  Moneda,
  ComprobanteTipo,
  User,
} from '../types';

/**
 * Format currency number cleanly
 */
const fmt = (num: number) => {
  return (num || 0).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Helper to add header banner with company details
 */
function addCompanyHeader(
  doc: jsPDF,
  empresa: Empresa,
  title: string,
  subtitle?: string
): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top color bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Decorative accent line
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 24, pageWidth, 2, 'F');

  // Header Title in white
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(empresa.nombre.toUpperCase(), 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(
    `RUC: ${empresa.ruc} | Telf: ${empresa.telefono} | ${empresa.correo}`,
    14,
    18
  );

  // System tag on top right
  doc.setFontSize(8);
  doc.text('IMPERIO LUX ERP - SISTEMA DE GESTIÓN', pageWidth - 14, 15, {
    align: 'right',
  });

  // Report Title below header banner
  let y = 35;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(title, 14, y);

  if (subtitle) {
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(subtitle, 14, y);
  }

  // Generation timestamp
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Fecha y hora de emisión: ${dateStr}`, pageWidth - 14, y, {
    align: 'right',
  });

  return y + 8;
}

/**
 * Helper to add footer with page numbers
 */
function addPageFooters(doc: jsPDF, empresa: Empresa) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `${empresa.nombre} - ${empresa.direccion} - RUC ${empresa.ruc}`,
      14,
      pageHeight - 7
    );
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 7, {
      align: 'right',
    });
  }
}

// ==========================================
// 1. EXPORT LISTADO DE VENTAS A PDF
// ==========================================
export interface ExportVentasOptions {
  ventas: Venta[];
  clientes: Cliente[];
  currentMoneda: Moneda;
  empresa: Empresa;
  filterEstado?: string;
  search?: string;
}

export function exportVentasListPdf({
  ventas,
  clientes,
  currentMoneda,
  empresa,
  filterEstado = 'Todos',
  search = '',
}: ExportVentasOptions) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const subtitle = `Filtros: Estado [${filterEstado}]${
    search ? ` | Búsqueda: "${search}"` : ''
  } | Total Registros: ${ventas.length}`;

  const startY = addCompanyHeader(
    doc,
    empresa,
    'REPORTE OFICIAL DEL HISTORIAL DE VENTAS',
    subtitle
  );

  // Statistics metric badges
  const totalRecaudado = ventas
    .filter((v) => v.estado === 'Completada')
    .reduce((acc, v) => acc + v.total, 0);
  const totalAnuladas = ventas.filter((v) => v.estado === 'Anulada').length;
  const totalCompletadas = ventas.filter((v) => v.estado === 'Completada').length;

  // Render quick metric box
  const boxY = startY;
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, boxY, pageWidth - 28, 14, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Ventas Completadas: ${totalCompletadas}`, 20, boxY + 9);
  doc.text(`Ventas Anuladas: ${totalAnuladas}`, 85, boxY + 9);

  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text(
    `Ingreso Total Recaudado: ${currentMoneda.simbolo} ${fmt(totalRecaudado)}`,
    155,
    boxY + 9
  );

  // Prepare table data
  const headers = [
    'N° Comprobante',
    'Fecha / Hora',
    'Cliente',
    'Doc. Identidad',
    'Método Pago',
    'Estado',
    `Total (${currentMoneda.simbolo})`,
  ];

  const rows = ventas.map((v) => {
    const cli = clientes.find((c) => c.id === v.cliente_id);
    return [
      v.numero_comprobante,
      v.fecha_hora,
      cli?.razon_social || 'Cliente Varios',
      cli?.numero_documento || '00000000',
      v.metodo_pago,
      v.estado,
      fmt(v.total),
    ];
  });

  autoTable(doc, {
    startY: boxY + 18,
    head: [headers],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 32 },
      1: { cellWidth: 35 },
      2: { cellWidth: 55 },
      3: { cellWidth: 30 },
      4: { cellWidth: 35 },
      5: { cellWidth: 28, halign: 'center' },
      6: { halign: 'right', fontStyle: 'bold', cellWidth: 35 },
    },
    didParseCell: (data) => {
      // Style estado column with colors
      if (data.section === 'body' && data.column.index === 5) {
        if (data.cell.raw === 'Completada') {
          data.cell.styles.textColor = [5, 150, 105]; // emerald
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.raw === 'Anulada') {
          data.cell.styles.textColor = [220, 38, 38]; // red
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 14, right: 14, bottom: 20 },
  });

  addPageFooters(doc, empresa);

  const dateSlug = new Date().toISOString().slice(0, 10);
  doc.save(`Reporte_Ventas_${dateSlug}.pdf`);
}

// ==========================================
// 2. EXPORT COMPROBANTE DE VENTA A PDF
// ==========================================
export interface ExportVentaComprobanteOptions {
  venta: Venta;
  cliente?: Cliente;
  comprobante?: ComprobanteTipo;
  vendedor?: User;
  empresa: Empresa;
  currentMoneda: Moneda;
}

export function exportVentaComprobantePdf({
  venta,
  cliente,
  comprobante,
  vendedor,
  empresa,
  currentMoneda,
}: ExportVentaComprobanteOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const leftX = 14;
  const rightX = pageWidth - 14;

  // Header Box (Left: Company, Right: Voucher Official Box)
  // Left: Company Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(empresa.nombre.toUpperCase(), leftX, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Propietario: ${empresa.propietario}`, leftX, 26);
  doc.text(`Dirección: ${empresa.direccion} - ${empresa.ubicacion}`, leftX, 31);
  doc.text(`Teléfono: ${empresa.telefono} | Email: ${empresa.correo}`, leftX, 36);

  // Right Box: Official Fiscal Box
  const boxWidth = 72;
  const boxHeight = 28;
  const boxX = rightX - boxWidth;
  const boxY = 14;

  doc.setDrawColor(37, 99, 235); // blue-600
  doc.setLineWidth(0.8);
  doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`R.U.C. Nº ${empresa.ruc}`, boxX + boxWidth / 2, boxY + 7, {
    align: 'center',
  });

  doc.setFillColor(37, 99, 235);
  doc.rect(boxX, boxY + 10, boxWidth, 8, 'F');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `${(comprobante?.nombre || 'BOLETA DE VENTA').toUpperCase()} ELECTRÓNICA`,
    boxX + boxWidth / 2,
    boxY + 15.5,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138); // blue-900
  doc.text(venta.numero_comprobante, boxX + boxWidth / 2, boxY + 24, {
    align: 'center',
  });

  // Anulada watermark if annulled
  if (venta.estado === 'Anulada') {
    doc.setTextColor(239, 68, 68);
    doc.setFontSize(10);
    doc.text('*** VENTA ANULADA ***', boxX + boxWidth / 2, boxY + 33, {
      align: 'center',
    });
  }

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(leftX, 47, rightX, 47);

  // Client and Transaction Details Box
  const infoY = 52;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(leftX, infoY, rightX - leftX, 28, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(leftX, infoY, rightX - leftX, 28, 2, 2, 'D');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('CLIENTE:', leftX + 4, infoY + 6);
  doc.text('DOC. IDENTIDAD:', leftX + 4, infoY + 12);
  doc.text('DIRECCIÓN:', leftX + 4, infoY + 18);
  doc.text('CONDICIÓN PAGO:', leftX + 4, infoY + 24);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(cliente?.razon_social || 'Cliente Varios', leftX + 32, infoY + 6);
  doc.text(cliente?.numero_documento || '00000000', leftX + 32, infoY + 12);
  doc.text(cliente?.direccion || 'Ciudad', leftX + 32, infoY + 18);
  doc.text(venta.metodo_pago.toUpperCase(), leftX + 32, infoY + 24);

  // Right column of info
  const col2X = leftX + 105;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('FECHA EMISIÓN:', col2X, infoY + 6);
  doc.text('ATENDIDO POR:', col2X, infoY + 12);
  doc.text('MONEDA:', col2X, infoY + 18);
  doc.text('ESTADO:', col2X, infoY + 24);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(venta.fecha_hora, col2X + 28, infoY + 6);
  doc.text(vendedor?.name || 'Administrador', col2X + 28, infoY + 12);
  doc.text(
    `${currentMoneda.nombre_completo} (${currentMoneda.simbolo})`,
    col2X + 28,
    infoY + 18
  );

  doc.setFont('helvetica', 'bold');
  if (venta.estado === 'Completada') {
    doc.setTextColor(5, 150, 105);
  } else {
    doc.setTextColor(220, 38, 38);
  }
  doc.text(venta.estado.toUpperCase(), col2X + 28, infoY + 24);

  // Items Table
  const headers = ['Ítem', 'Cant.', 'Descripción del Producto', 'Unidad', 'P. Unitario', 'Subtotal'];
  const rows = venta.items.map((it, idx) => [
    idx + 1,
    it.cantidad,
    it.nombre_producto,
    it.presentacion_sigla || 'UND',
    fmt(it.precio_venta),
    fmt(it.subtotal),
  ]);

  autoTable(doc, {
    startY: infoY + 32,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 84 },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: leftX, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 4;

  // Bottom Area: Totals on Right, Payment Notes & Security on Left
  const totalsWidth = 72;
  const totalsX = rightX - totalsWidth;

  // Left side note
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('INFORMACIÓN DE PAGO Y DETALLES:', leftX, finalY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Medio de Pago: ${venta.metodo_pago}`, leftX, finalY + 10);
  if (venta.monto_recibido) {
    doc.text(
      `Importe Recibido: ${currentMoneda.simbolo} ${fmt(venta.monto_recibido)}`,
      leftX,
      finalY + 15
    );
  }
  if (venta.vuelto_entregado !== undefined) {
    doc.text(
      `Cambio / Vuelto: ${currentMoneda.simbolo} ${fmt(venta.vuelto_entregado)}`,
      leftX,
      finalY + 20
    );
  }

  // Security Hash code representation
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(leftX, finalY + 24, 95, 12, 1, 1, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('CÓDIGO DE HASH DIGITAL Y VERIFICACIÓN FISCAL:', leftX + 3, finalY + 28);
  doc.setFont('courier', 'bold');
  doc.text('H4S8-99K2-00P1-SKVNT-782F-B039-44A1-E720', leftX + 3, finalY + 33);

  // Right side: Totals Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(totalsX, finalY, totalsWidth, 36, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('OP. GRAVADA (Subtotal):', totalsX + 4, finalY + 7);
  doc.text(
    `${empresa.abreviatura_impuesto} (${empresa.porcentaje_impuesto}%):`,
    totalsX + 4,
    finalY + 14
  );

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(
    `${currentMoneda.simbolo} ${fmt(venta.subtotal)}`,
    rightX - 4,
    finalY + 7,
    { align: 'right' }
  );
  doc.text(
    `${currentMoneda.simbolo} ${fmt(venta.impuesto)}`,
    rightX - 4,
    finalY + 14,
    { align: 'right' }
  );

  // Big Total Bar
  doc.setFillColor(30, 41, 59);
  doc.rect(totalsX, finalY + 20, totalsWidth, 16, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL A PAGAR:', totalsX + 4, finalY + 30);
  doc.setFontSize(12);
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text(
    `${currentMoneda.simbolo} ${fmt(venta.total)}`,
    rightX - 4,
    finalY + 30,
    { align: 'right' }
  );

  // Bottom Notice
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(leftX, pageHeight - 16, rightX, pageHeight - 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Representación impresa autorizada del Comprobante de Pago Electrónico. ¡Gracias por su preferencia!',
    leftX,
    pageHeight - 11
  );
  doc.text(
    `${empresa.nombre} - RUC: ${empresa.ruc}`,
    rightX,
    pageHeight - 11,
    { align: 'right' }
  );

  doc.save(`Comprobante_Venta_${venta.numero_comprobante}.pdf`);
}

// ==========================================
// 3. EXPORT LISTADO DE COMPRAS A PDF
// ==========================================
export interface ExportComprasOptions {
  compras: Compra[];
  proveedores: Proveedor[];
  currentMoneda: Moneda;
  empresa: Empresa;
  search?: string;
}

export function exportComprasListPdf({
  compras,
  proveedores,
  currentMoneda,
  empresa,
  search = '',
}: ExportComprasOptions) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const subtitle = `Filtros: ${
    search ? `Búsqueda: "${search}" | ` : ''
  }Total de Órdenes: ${compras.length}`;

  const startY = addCompanyHeader(
    doc,
    empresa,
    'REPORTE OFICIAL DEL HISTORIAL DE COMPRAS DE MERCADERÍA',
    subtitle
  );

  // Statistics box
  const totalInvertido = compras.reduce((acc, c) => acc + c.total, 0);
  const totalArticulos = compras.reduce(
    (acc, c) => acc + c.items.reduce((sum, it) => sum + it.cantidad, 0),
    0
  );

  const boxY = startY;
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, boxY, pageWidth - 28, 14, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Total Órdenes Registradas: ${compras.length}`, 20, boxY + 9);
  doc.text(`Unidades Compradas en Almacén: ${totalArticulos} unid.`, 90, boxY + 9);

  doc.setTextColor(109, 40, 217); // violet-700
  doc.text(
    `Inversión Total en Mercadería: ${currentMoneda.simbolo} ${fmt(totalInvertido)}`,
    175,
    boxY + 9
  );

  const headers = [
    'N° Comprobante',
    'Fecha / Hora',
    'Proveedor',
    'RUC / Identificación',
    'Unidades (Productos)',
    `Subtotal (${currentMoneda.simbolo})`,
    `Total (${currentMoneda.simbolo})`,
  ];

  const rows = compras.map((c) => {
    const prov = proveedores.find((p) => p.id === c.proveedor_id);
    const totalUnits = c.items.reduce((sum, it) => sum + it.cantidad, 0);
    return [
      c.numero_comprobante,
      c.fecha_hora,
      prov?.razon_social || 'Proveedor Varios',
      prov?.numero_documento || 'Sin Documento',
      `${totalUnits} unid. (${c.items.length} ítems)`,
      fmt(c.subtotal),
      fmt(c.total),
    ];
  });

  autoTable(doc, {
    startY: boxY + 18,
    head: [headers],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: [109, 40, 217], // violet-700
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 32 },
      1: { cellWidth: 35 },
      2: { cellWidth: 60 },
      3: { cellWidth: 35 },
      4: { cellWidth: 35, halign: 'center' },
      5: { cellWidth: 32, halign: 'right' },
      6: { halign: 'right', fontStyle: 'bold', cellWidth: 35 },
    },
    margin: { left: 14, right: 14, bottom: 20 },
  });

  addPageFooters(doc, empresa);

  const dateSlug = new Date().toISOString().slice(0, 10);
  doc.save(`Reporte_Compras_${dateSlug}.pdf`);
}

// ==========================================
// 4. EXPORT COMPROBANTE / ORDEN DE COMPRA A PDF
// ==========================================
export interface ExportCompraComprobanteOptions {
  compra: Compra;
  proveedor?: Proveedor;
  comprobante?: ComprobanteTipo;
  empresa: Empresa;
  currentMoneda: Moneda;
}

export function exportCompraComprobantePdf({
  compra,
  proveedor,
  comprobante,
  empresa,
  currentMoneda,
}: ExportCompraComprobanteOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const leftX = 14;
  const rightX = pageWidth - 14;

  // Header Box (Left: Company, Right: Voucher Official Box)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(empresa.nombre.toUpperCase(), leftX, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Comprador / Empresa: ${empresa.propietario}`, leftX, 26);
  doc.text(`Dirección: ${empresa.direccion} - ${empresa.ubicacion}`, leftX, 31);
  doc.text(`Teléfono: ${empresa.telefono} | Email: ${empresa.correo}`, leftX, 36);

  // Right Box: Official Order Box
  const boxWidth = 74;
  const boxHeight = 28;
  const boxX = rightX - boxWidth;
  const boxY = 14;

  doc.setDrawColor(109, 40, 217); // violet-700
  doc.setLineWidth(0.8);
  doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`R.U.C. EMPRESA Nº ${empresa.ruc}`, boxX + boxWidth / 2, boxY + 7, {
    align: 'center',
  });

  doc.setFillColor(109, 40, 217); // violet-700
  doc.rect(boxX, boxY + 10, boxWidth, 8, 'F');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(
    'ORDEN DE COMPRA / RECEPCIÓN',
    boxX + boxWidth / 2,
    boxY + 15.5,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(91, 33, 182); // violet-900
  doc.text(compra.numero_comprobante, boxX + boxWidth / 2, boxY + 24, {
    align: 'center',
  });

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(leftX, 47, rightX, 47);

  // Supplier Box
  const infoY = 52;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(leftX, infoY, rightX - leftX, 28, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(leftX, infoY, rightX - leftX, 28, 2, 2, 'D');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('PROVEEDOR:', leftX + 4, infoY + 6);
  doc.text('RUC / DOCUMENTO:', leftX + 4, infoY + 12);
  doc.text('DIRECCIÓN:', leftX + 4, infoY + 18);
  doc.text('CONTACTO / TELÉFONO:', leftX + 4, infoY + 24);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(proveedor?.razon_social || 'Proveedor Varios', leftX + 36, infoY + 6);
  doc.text(proveedor?.numero_documento || 'Sin Documento', leftX + 36, infoY + 12);
  doc.text(proveedor?.direccion || 'Sede Principal', leftX + 36, infoY + 18);
  doc.text(
    `${proveedor?.telefono || 'N/A'} | ${proveedor?.email || 'N/A'}`,
    leftX + 36,
    infoY + 24
  );

  // Right column of info
  const col2X = leftX + 110;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('FECHA REGISTRO:', col2X, infoY + 6);
  doc.text('TIPO DOCUMENTO:', col2X, infoY + 12);
  doc.text('MONEDA:', col2X, infoY + 18);
  doc.text('ESTADO ORDEN:', col2X, infoY + 24);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(compra.fecha_hora, col2X + 28, infoY + 6);
  doc.text(comprobante?.nombre || 'Factura Compra', col2X + 28, infoY + 12);
  doc.text(
    `${currentMoneda.nombre_completo} (${currentMoneda.simbolo})`,
    col2X + 28,
    infoY + 18
  );

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text(compra.estado.toUpperCase(), col2X + 28, infoY + 24);

  // Items Table
  const headers = ['Ítem', 'Cant. Unid.', 'Producto / Mercadería Adquirida', 'Costo Unit.', 'Subtotal'];
  const rows = compra.items.map((it, idx) => [
    idx + 1,
    it.cantidad,
    it.nombre_producto,
    fmt(it.precio_compra),
    fmt(it.subtotal),
  ]);

  autoTable(doc, {
    startY: infoY + 32,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [109, 40, 217], // violet-700
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 92 },
      3: { cellWidth: 27, halign: 'right' },
      4: { cellWidth: 27, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: leftX, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 4;

  // Bottom Area: Totals on Right, Authorizations on Left
  const totalsWidth = 74;
  const totalsX = rightX - totalsWidth;

  // Left signatures block
  const sigY = finalY + 12;
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);

  // Box for signatures
  doc.setDrawColor(203, 213, 225);
  doc.line(leftX + 5, sigY + 15, leftX + 45, sigY + 15);
  doc.text('Responsable de Compras', leftX + 8, sigY + 19);

  doc.line(leftX + 55, sigY + 15, leftX + 95, sigY + 15);
  doc.text('Visto Bueno Almacén', leftX + 60, sigY + 19);

  // Right side: Totals Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(totalsX, finalY, totalsWidth, 36, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('SUBTOTAL MERCADERÍA:', totalsX + 4, finalY + 7);
  doc.text(
    `${empresa.abreviatura_impuesto} (${empresa.porcentaje_impuesto}%):`,
    totalsX + 4,
    finalY + 14
  );

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(
    `${currentMoneda.simbolo} ${fmt(compra.subtotal)}`,
    rightX - 4,
    finalY + 7,
    { align: 'right' }
  );
  doc.text(
    `${currentMoneda.simbolo} ${fmt(compra.impuesto)}`,
    rightX - 4,
    finalY + 14,
    { align: 'right' }
  );

  // Total Inversión Bar
  doc.setFillColor(109, 40, 217);
  doc.rect(totalsX, finalY + 20, totalsWidth, 16, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL INVERTIDO:', totalsX + 4, finalY + 30);
  doc.setFontSize(12);
  doc.setTextColor(233, 213, 255); // violet-200
  doc.text(
    `${currentMoneda.simbolo} ${fmt(compra.total)}`,
    rightX - 4,
    finalY + 30,
    { align: 'right' }
  );

  // Bottom Notice
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(leftX, pageHeight - 16, rightX, pageHeight - 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Comprobante interno y Orden de Recepción de Inventario - Imperio Lux ERP.',
    leftX,
    pageHeight - 11
  );
  doc.text(
    `${empresa.nombre} - RUC: ${empresa.ruc}`,
    rightX,
    pageHeight - 11,
    { align: 'right' }
  );

  doc.save(`Comprobante_Compra_${compra.numero_comprobante}.pdf`);
}
