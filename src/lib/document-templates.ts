// =============================================================================
// CFP Ops System - HTML Document Templates for Print/PDF
// All documents use printable HTML with @media print styling
// =============================================================================

const COMPANY = {
  name: "株式会社CFP",
  zip: "〒593-8312",
  address: "大阪府堺市西区草部1578番地",
  tel: "072-274-6255",
  fax: "072-274-6256",
};

// ---------------------------------------------------------------------------
// Shared CSS for all documents
// ---------------------------------------------------------------------------
function baseStyles(): string {
  return `
    @page { size: A4; margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Hiragino Kaku Gothic Pro", "Yu Gothic", "Meiryo", "Noto Sans JP", sans-serif;
      font-size: 11px;
      color: #1a1a1a;
      background: #fff;
      line-height: 1.6;
    }
    .page {
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm 15mm;
    }
    @media print {
      body { background: #fff; }
      .page { padding: 0; max-width: 100%; }
      .no-print { display: none !important; }
    }
    .print-btn {
      position: fixed; top: 16px; right: 16px; z-index: 100;
      padding: 8px 20px; background: #2563eb; color: #fff;
      border: none; border-radius: 6px; font-size: 14px; cursor: pointer;
    }
    .print-btn:hover { background: #1d4ed8; }
    h1 { font-size: 22px; font-weight: bold; text-align: center; margin-bottom: 16px; letter-spacing: 4px; }
    .header-row { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .header-left { flex: 1; }
    .header-right { text-align: right; }
    .doc-number { font-size: 12px; color: #555; margin-bottom: 4px; }
    .doc-date { font-size: 12px; color: #555; }
    .customer-name { font-size: 16px; font-weight: bold; margin-bottom: 4px; border-bottom: 2px solid #1a1a1a; display: inline-block; padding-bottom: 2px; }
    .honorific { font-size: 14px; font-weight: normal; margin-left: 8px; }
    .company-block { text-align: right; font-size: 11px; line-height: 1.8; }
    .company-name { font-size: 14px; font-weight: bold; }
    .seal-box {
      display: inline-block; width: 48px; height: 48px;
      border: 1.5px solid #c00; border-radius: 50%;
      text-align: center; line-height: 48px;
      color: #c00; font-size: 11px; font-weight: bold;
      margin-left: 12px; vertical-align: top;
    }
    table.items {
      width: 100%; border-collapse: collapse; margin: 12px 0;
    }
    table.items th, table.items td {
      border: 1px solid #ccc; padding: 6px 8px; font-size: 11px;
    }
    table.items th {
      background: #f5f5f5; font-weight: 600; text-align: center;
    }
    table.items td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .summary-table { width: 280px; margin-left: auto; margin-top: 12px; }
    .summary-table td { padding: 4px 8px; font-size: 12px; }
    .summary-table .label { text-align: left; color: #555; }
    .summary-table .value { text-align: right; font-weight: bold; }
    .summary-table .total { font-size: 14px; border-top: 2px solid #1a1a1a; }
    .note-section { margin-top: 20px; padding: 12px; border: 1px solid #ddd; border-radius: 4px; }
    .note-section h3 { font-size: 12px; font-weight: bold; margin-bottom: 4px; }
    .footer { margin-top: 24px; font-size: 10px; color: #888; text-align: center; }
  `;
}

function htmlWrap(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>${baseStyles()}</style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">印刷 / PDF保存</button>
  <div class="page">
    ${body}
  </div>
</body>
</html>`;
}

function formatDate(d: Date | string | null): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatNumber(n: number): string {
  return n.toLocaleString("ja-JP");
}

function formatCurrency(n: number, currency = "JPY"): string {
  if (currency === "JPY") return `¥${formatNumber(n)}`;
  if (currency === "USD") return `$${formatNumber(n)}`;
  return `${formatNumber(n)} ${currency}`;
}

// ---------------------------------------------------------------------------
// 1. Invoice (請求書)
// ---------------------------------------------------------------------------
export type InvoiceData = {
  invoiceNumber: string;
  billingDate: string | Date;
  dueDate: string | Date | null;
  customerName: string;
  customerAddress?: string;
  prevBalance: number;
  paymentReceived: number;
  carryover: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  note?: string | null;
  revenues: { revenueNumber: string; productName?: string; amount: number }[];
};

export function generateInvoiceHTML(data: InvoiceData): string {
  const itemRows = data.revenues
    .map(
      (r, i) => `
    <tr>
      <td class="num">${i + 1}</td>
      <td>${r.revenueNumber}</td>
      <td>${r.productName ?? "-"}</td>
      <td class="num">${formatCurrency(r.amount, data.currency)}</td>
    </tr>`
    )
    .join("");

  const body = `
    <h1>請 求 書</h1>
    <div class="header-row">
      <div class="header-left">
        <p class="customer-name">${data.customerName}<span class="honorific">御中</span></p>
        ${data.customerAddress ? `<p style="font-size:11px;color:#555;margin-top:4px;">${data.customerAddress}</p>` : ""}
        <p style="margin-top:12px;font-size:13px;">下記の通りご請求申し上げます。</p>
        <div style="margin-top:12px;padding:12px;border:2px solid #1a1a1a;display:inline-block;">
          <p style="font-size:12px;color:#555;">ご請求金額（税込）</p>
          <p style="font-size:20px;font-weight:bold;">${formatCurrency(data.total, data.currency)}</p>
        </div>
      </div>
      <div class="header-right">
        <p class="doc-number">請求書番号: ${data.invoiceNumber}</p>
        <p class="doc-date">請求日: ${formatDate(data.billingDate)}</p>
        ${data.dueDate ? `<p class="doc-date">お支払期限: ${formatDate(data.dueDate)}</p>` : ""}
        <div class="company-block" style="margin-top:12px;">
          <p class="company-name">${COMPANY.name}</p>
          <p>${COMPANY.zip}</p>
          <p>${COMPANY.address}</p>
          <p>TEL: ${COMPANY.tel}</p>
          <p>FAX: ${COMPANY.fax}</p>
          <span class="seal-box">印</span>
        </div>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;margin:12px 0;">
      <tr>
        <td style="border:1px solid #ccc;padding:6px 12px;background:#f5f5f5;width:160px;">前回請求残高</td>
        <td style="border:1px solid #ccc;padding:6px 12px;text-align:right;">${formatCurrency(data.prevBalance, data.currency)}</td>
      </tr>
      <tr>
        <td style="border:1px solid #ccc;padding:6px 12px;background:#f5f5f5;">ご入金額</td>
        <td style="border:1px solid #ccc;padding:6px 12px;text-align:right;">${formatCurrency(data.paymentReceived, data.currency)}</td>
      </tr>
      <tr>
        <td style="border:1px solid #ccc;padding:6px 12px;background:#f5f5f5;">繰越残高</td>
        <td style="border:1px solid #ccc;padding:6px 12px;text-align:right;font-weight:bold;">${formatCurrency(data.carryover, data.currency)}</td>
      </tr>
    </table>

    <h3 style="font-size:13px;margin-top:16px;margin-bottom:8px;">今回売上明細</h3>
    <table class="items">
      <thead>
        <tr>
          <th style="width:40px;">No.</th>
          <th>売上番号</th>
          <th>品名</th>
          <th style="width:120px;">金額</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows || '<tr><td colspan="4" style="text-align:center;color:#999;">明細なし</td></tr>'}
      </tbody>
    </table>

    <table class="summary-table">
      <tr><td class="label">小計（税抜）</td><td class="value">${formatCurrency(data.subtotal, data.currency)}</td></tr>
      <tr><td class="label">消費税</td><td class="value">${formatCurrency(data.taxAmount, data.currency)}</td></tr>
      <tr class="total"><td class="label" style="font-weight:bold;">今回請求額</td><td class="value">${formatCurrency(data.total, data.currency)}</td></tr>
    </table>

    ${data.note ? `<div class="note-section"><h3>備考</h3><p>${data.note}</p></div>` : ""}
    <div class="footer">この請求書は${COMPANY.name}が発行しました。</div>
  `;
  return htmlWrap(`請求書 - ${data.invoiceNumber}`, body);
}

// ---------------------------------------------------------------------------
// 2. Delivery Note (納品書)
// ---------------------------------------------------------------------------
export type DeliveryNoteData = {
  documentId: string;
  title: string;
  documentType: string;
  createdAt: string | Date;
  note?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
};

export function generateDeliveryNoteHTML(data: DeliveryNoteData): string {
  const typeLabel = data.documentType === "DELIVERY_NOTE_TEMP" ? "仮納品書" : "本納品書";

  const body = `
    <h1>納 品 書</h1>
    <div class="header-row">
      <div class="header-left">
        <p style="font-size:12px;color:#555;">種別: ${typeLabel}</p>
        <p style="font-size:11px;margin-top:4px;">文書タイトル: <strong>${data.title}</strong></p>
        ${data.sourceType ? `<p style="font-size:11px;margin-top:4px;">関連元: ${data.sourceType} ${data.sourceId ?? ""}</p>` : ""}
      </div>
      <div class="header-right">
        <p class="doc-number">文書ID: ${data.documentId}</p>
        <p class="doc-date">作成日: ${formatDate(data.createdAt)}</p>
        <div class="company-block" style="margin-top:12px;">
          <p class="company-name">${COMPANY.name}</p>
          <p>${COMPANY.zip}</p>
          <p>${COMPANY.address}</p>
          <p>TEL: ${COMPANY.tel} / FAX: ${COMPANY.fax}</p>
          <span class="seal-box">印</span>
        </div>
      </div>
    </div>

    <p style="margin-top:16px;">下記の通り納品いたします。</p>

    <table class="items" style="margin-top:12px;">
      <thead>
        <tr>
          <th>品名</th>
          <th>数量</th>
          <th>単位</th>
          <th>備考</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colspan="4" style="text-align:center;color:#888;padding:20px;">
            ※ 出荷伝票と紐付後、明細が表示されます
          </td>
        </tr>
      </tbody>
    </table>

    ${data.note ? `<div class="note-section"><h3>備考</h3><p>${data.note}</p></div>` : ""}
    <div class="footer">この納品書は${COMPANY.name}が発行しました。</div>
  `;
  return htmlWrap(`納品書 - ${data.title}`, body);
}

// ---------------------------------------------------------------------------
// 3. Purchase Order / Confirmation (買受書/注文書)
// ---------------------------------------------------------------------------
export type PurchaseOrderData = {
  purchaseNumber: string;
  purchaseDate: string | Date;
  supplierName: string;
  supplierAddress?: string;
  pickupPartnerName?: string | null;
  productCode: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  freightCost?: number | null;
  packagingType?: string | null;
  warehouseName?: string | null;
  status: string;
  note?: string | null;
};

const packagingLabels: Record<string, string> = {
  FLECON: "フレコン",
  PALLET: "パレット",
  STEEL_BOX: "スチール箱",
  PAPER_BAG: "紙袋",
  POST_PALLET: "ポストパレット",
};

export function generatePurchaseOrderHTML(data: PurchaseOrderData): string {
  const totalWithFreight = data.amount + (data.freightCost ?? 0);

  const body = `
    <h1>買 受 書</h1>
    <div class="header-row">
      <div class="header-left">
        <p class="customer-name">${data.supplierName}<span class="honorific">御中</span></p>
        ${data.supplierAddress ? `<p style="font-size:11px;color:#555;margin-top:4px;">${data.supplierAddress}</p>` : ""}
        <p style="margin-top:12px;font-size:13px;">下記の通り買い受けいたします。</p>
      </div>
      <div class="header-right">
        <p class="doc-number">仕入番号: ${data.purchaseNumber}</p>
        <p class="doc-date">日付: ${formatDate(data.purchaseDate)}</p>
        <div class="company-block" style="margin-top:12px;">
          <p class="company-name">${COMPANY.name}</p>
          <p>${COMPANY.zip}</p>
          <p>${COMPANY.address}</p>
          <p>TEL: ${COMPANY.tel} / FAX: ${COMPANY.fax}</p>
          <span class="seal-box">印</span>
        </div>
      </div>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th style="width:40px;">No.</th>
          <th>品目コード</th>
          <th>品名</th>
          <th>荷姿</th>
          <th style="width:100px;">数量(kg)</th>
          <th style="width:100px;">単価(円/kg)</th>
          <th style="width:120px;">金額</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="num">1</td>
          <td style="font-family:monospace;">${data.productCode}</td>
          <td>${data.productName ?? "-"}</td>
          <td>${data.packagingType ? packagingLabels[data.packagingType] ?? data.packagingType : "-"}</td>
          <td class="num">${formatNumber(data.quantity)}</td>
          <td class="num">¥${formatNumber(data.unitPrice)}</td>
          <td class="num">¥${formatNumber(data.amount)}</td>
        </tr>
      </tbody>
    </table>

    <table class="summary-table">
      <tr><td class="label">小計</td><td class="value">¥${formatNumber(data.amount)}</td></tr>
      ${data.freightCost != null ? `<tr><td class="label">運賃</td><td class="value">¥${formatNumber(data.freightCost)}</td></tr>` : ""}
      <tr class="total"><td class="label" style="font-weight:bold;">合計</td><td class="value">¥${formatNumber(totalWithFreight)}</td></tr>
    </table>

    <table style="width:100%;border-collapse:collapse;margin-top:16px;">
      ${data.pickupPartnerName ? `<tr><td style="border:1px solid #ccc;padding:6px 12px;background:#f5f5f5;width:120px;">引取先</td><td style="border:1px solid #ccc;padding:6px 12px;">${data.pickupPartnerName}</td></tr>` : ""}
      ${data.warehouseName ? `<tr><td style="border:1px solid #ccc;padding:6px 12px;background:#f5f5f5;width:120px;">入庫先倉庫</td><td style="border:1px solid #ccc;padding:6px 12px;">${data.warehouseName}</td></tr>` : ""}
    </table>

    ${data.note ? `<div class="note-section"><h3>備考</h3><p>${data.note}</p></div>` : ""}
    <div class="footer">この買受書は${COMPANY.name}が発行しました。</div>
  `;
  return htmlWrap(`買受書 - ${data.purchaseNumber}`, body);
}

// ---------------------------------------------------------------------------
// 4. Quotation (見積書)
// ---------------------------------------------------------------------------
export type QuotationData = {
  quotationNumber: string;
  quotationDate: string | Date;
  validUntil?: string | Date | null;
  customerName: string;
  customerAddress?: string;
  subject?: string | null;
  items: { product: string; name: string; qty: number; price: number }[];
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  note?: string | null;
};

export function generateQuotationHTML(data: QuotationData): string {
  const curr = data.currency;
  const itemRows = data.items
    .map(
      (item, i) => `
    <tr>
      <td class="num">${i + 1}</td>
      <td style="font-family:monospace;">${item.product}</td>
      <td>${item.name}</td>
      <td class="num">${formatNumber(item.qty)} kg</td>
      <td class="num">${formatCurrency(item.price, curr)}</td>
      <td class="num">${formatCurrency(item.qty * item.price, curr)}</td>
    </tr>`
    )
    .join("");

  const body = `
    <h1>見 積 書</h1>
    <div class="header-row">
      <div class="header-left">
        <p class="customer-name">${data.customerName}<span class="honorific">御中</span></p>
        ${data.customerAddress ? `<p style="font-size:11px;color:#555;margin-top:4px;">${data.customerAddress}</p>` : ""}
        ${data.subject ? `<p style="margin-top:12px;font-size:12px;">件名: <strong>${data.subject}</strong></p>` : ""}
        <p style="margin-top:12px;font-size:13px;">下記の通りお見積り申し上げます。</p>
        <div style="margin-top:12px;padding:12px;border:2px solid #1a1a1a;display:inline-block;">
          <p style="font-size:12px;color:#555;">お見積金額（税込）</p>
          <p style="font-size:20px;font-weight:bold;">${formatCurrency(data.total, curr)}</p>
        </div>
      </div>
      <div class="header-right">
        <p class="doc-number">見積番号: ${data.quotationNumber}</p>
        <p class="doc-date">見積日: ${formatDate(data.quotationDate)}</p>
        ${data.validUntil ? `<p class="doc-date">有効期限: ${formatDate(data.validUntil)}</p>` : ""}
        <div class="company-block" style="margin-top:12px;">
          <p class="company-name">${COMPANY.name}</p>
          <p>${COMPANY.zip}</p>
          <p>${COMPANY.address}</p>
          <p>TEL: ${COMPANY.tel} / FAX: ${COMPANY.fax}</p>
          <span class="seal-box">印</span>
        </div>
      </div>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th style="width:40px;">No.</th>
          <th>品目コード</th>
          <th>品名</th>
          <th style="width:100px;">数量</th>
          <th style="width:100px;">単価</th>
          <th style="width:120px;">金額</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows || '<tr><td colspan="6" style="text-align:center;color:#999;">明細なし</td></tr>'}
      </tbody>
    </table>

    <table class="summary-table">
      <tr><td class="label">小計（税抜）</td><td class="value">${formatCurrency(data.subtotal, curr)}</td></tr>
      <tr><td class="label">消費税</td><td class="value">${formatCurrency(data.taxAmount, curr)}</td></tr>
      <tr class="total"><td class="label" style="font-weight:bold;">合計（税込）</td><td class="value">${formatCurrency(data.total, curr)}</td></tr>
    </table>

    ${data.note ? `<div class="note-section"><h3>備考</h3><p>${data.note}</p></div>` : ""}
    <div class="footer">この見積書は${COMPANY.name}が発行しました。有効期限内にご発注ください。</div>
  `;
  return htmlWrap(`見積書 - ${data.quotationNumber}`, body);
}

// ---------------------------------------------------------------------------
// 5. Analysis Certificate (検査成績書)
// ---------------------------------------------------------------------------
export type CertificateData = {
  certificateNumber: string;
  issueDate: string | Date;
  sampleNumber: string;
  sampleName: string;
  productName: string;
  source?: string | null;
  receivedDate: string | Date;
  analysisResults: {
    testItem: string;
    standard: string | null;
    result: string;
    unit: string | null;
    isPassed: boolean | null;
  }[];
  overallJudgment: string | null;
  note?: string | null;
};

export function generateAnalysisCertificateHTML(data: CertificateData): string {
  const resultRows = data.analysisResults
    .map(
      (r) => `
    <tr>
      <td>${r.testItem}</td>
      <td>${r.standard ?? "-"}</td>
      <td style="font-family:monospace;font-weight:600;">${r.result}${r.unit ? ` ${r.unit}` : ""}</td>
      <td style="text-align:center;font-size:14px;">${r.isPassed === true ? "○" : r.isPassed === false ? "×" : "-"}</td>
    </tr>`
    )
    .join("");

  const body = `
    <div style="text-align:center;margin-bottom:8px;">
      <p style="font-size:10px;color:#888;">Certificate of Analysis</p>
    </div>
    <h1>分析成績書</h1>
    <div class="header-row">
      <div class="header-left">
        <table style="border-collapse:collapse;">
          <tr><td style="padding:4px 12px 4px 0;color:#555;font-size:11px;">成績書番号</td><td style="padding:4px 0;font-family:monospace;font-weight:bold;">${data.certificateNumber}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#555;font-size:11px;">サンプルID</td><td style="padding:4px 0;font-family:monospace;">${data.sampleNumber}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#555;font-size:11px;">サンプル名</td><td style="padding:4px 0;">${data.sampleName}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#555;font-size:11px;">製品名</td><td style="padding:4px 0;">${data.productName}</td></tr>
          ${data.source ? `<tr><td style="padding:4px 12px 4px 0;color:#555;font-size:11px;">サンプル由来</td><td style="padding:4px 0;">${data.source}</td></tr>` : ""}
          <tr><td style="padding:4px 12px 4px 0;color:#555;font-size:11px;">受付日</td><td style="padding:4px 0;">${formatDate(data.receivedDate)}</td></tr>
        </table>
      </div>
      <div class="header-right">
        <p class="doc-date">発行日: ${formatDate(data.issueDate)}</p>
        <div class="company-block" style="margin-top:12px;">
          <p class="company-name">${COMPANY.name} 研究室</p>
          <p>${COMPANY.zip}</p>
          <p>${COMPANY.address}</p>
          <p>TEL: ${COMPANY.tel}</p>
          <span class="seal-box">印</span>
        </div>
      </div>
    </div>

    <h3 style="font-size:13px;margin-bottom:8px;">分析結果</h3>
    <table class="items">
      <thead>
        <tr>
          <th>分析項目</th>
          <th>規格値</th>
          <th>測定値</th>
          <th style="width:60px;">判定</th>
        </tr>
      </thead>
      <tbody>
        ${resultRows || '<tr><td colspan="4" style="text-align:center;color:#999;">分析結果なし</td></tr>'}
      </tbody>
    </table>

    ${
      data.overallJudgment
        ? `<div style="text-align:center;margin-top:16px;">
        <span style="display:inline-block;padding:8px 24px;font-size:16px;font-weight:bold;border-radius:4px;${
          data.overallJudgment === "合格"
            ? "background:#d1fae5;color:#065f46;border:2px solid #065f46;"
            : "background:#fee2e2;color:#991b1b;border:2px solid #991b1b;"
        }">総合判定: ${data.overallJudgment}</span>
      </div>`
        : ""
    }

    ${data.note ? `<div class="note-section"><h3>備考</h3><p>${data.note}</p></div>` : ""}
    <div class="footer">この成績書は${COMPANY.name} 研究室が発行しました。</div>
  `;
  return htmlWrap(`分析成績書 - ${data.certificateNumber}`, body);
}

// ---------------------------------------------------------------------------
// 6. Shipping Label (送り状)
// ---------------------------------------------------------------------------
export type ShippingData = {
  shipmentNumber: string;
  shipmentDate: string | Date;
  customerName: string;
  customerAddress?: string;
  productCode: string;
  productName?: string;
  quantity: number;
  packagingType?: string | null;
  carrierName?: string | null;
  note?: string | null;
};

export function generateShippingLabelHTML(data: ShippingData): string {
  const body = `
    <h1>送 り 状</h1>
    <div class="header-row">
      <div class="header-left">
        <div style="border:2px solid #1a1a1a;padding:16px;margin-bottom:12px;">
          <p style="font-size:11px;color:#555;">お届け先</p>
          <p style="font-size:16px;font-weight:bold;margin-top:4px;">${data.customerName} 様</p>
          ${data.customerAddress ? `<p style="font-size:12px;margin-top:4px;">${data.customerAddress}</p>` : ""}
        </div>
      </div>
      <div class="header-right">
        <p class="doc-number">出荷番号: ${data.shipmentNumber}</p>
        <p class="doc-date">出荷日: ${formatDate(data.shipmentDate)}</p>
        <div class="company-block" style="margin-top:12px;">
          <p style="font-size:11px;color:#555;">ご依頼主</p>
          <p class="company-name">${COMPANY.name}</p>
          <p>${COMPANY.zip}</p>
          <p>${COMPANY.address}</p>
          <p>TEL: ${COMPANY.tel}</p>
        </div>
      </div>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th>品目コード</th>
          <th>品名</th>
          <th>数量(kg)</th>
          <th>荷姿</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="font-family:monospace;">${data.productCode}</td>
          <td>${data.productName ?? "-"}</td>
          <td class="num">${formatNumber(data.quantity)}</td>
          <td>${data.packagingType ? packagingLabels[data.packagingType] ?? data.packagingType : "-"}</td>
        </tr>
      </tbody>
    </table>

    ${data.carrierName ? `<p style="margin-top:12px;font-size:12px;">運送会社: <strong>${data.carrierName}</strong></p>` : ""}
    ${data.note ? `<div class="note-section"><h3>備考</h3><p>${data.note}</p></div>` : ""}
    <div class="footer">この送り状は${COMPANY.name}が発行しました。</div>
  `;
  return htmlWrap(`送り状 - ${data.shipmentNumber}`, body);
}
