// =============================================================================
// Shared styles and utilities for @react-pdf/renderer PDF templates
// =============================================================================
import { StyleSheet, Font } from "@react-pdf/renderer";

// Register Noto Sans JP for Japanese text rendering
Font.register({
  family: "NotoSansJP",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.1/files/noto-sans-jp-japanese-400-normal.woff",
      fontWeight: 400,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.1/files/noto-sans-jp-japanese-700-normal.woff",
      fontWeight: 700,
    },
  ],
});

// Disable hyphenation for Japanese text
Font.registerHyphenationCallback((word) => [word]);

export const COMPANY = {
  name: "株式会社CFP",
  zip: "〒593-8312",
  address: "大阪府堺市西区草部1578番地",
  tel: "072-274-6255",
  fax: "072-274-6256",
};

export const packagingLabels: Record<string, string> = {
  FLECON: "フレコン",
  PALLET: "パレット",
  STEEL_BOX: "スチール箱",
  PAPER_BAG: "紙袋",
  POST_PALLET: "ポストパレット",
};

export function formatDate(d: Date | string | null): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString("ja-JP");
}

export function formatCurrency(n: number, currency = "JPY"): string {
  if (currency === "JPY") return `¥${formatNumber(n)}`;
  if (currency === "USD") return `$${formatNumber(n)}`;
  return `${formatNumber(n)} ${currency}`;
}

// Common styles used across all PDF templates
export const baseStyles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansJP",
    fontSize: 9,
    color: "#1a1a1a",
    padding: "15mm",
    lineHeight: 1.6,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    textAlign: "right",
    width: 200,
  },
  customerName: {
    fontSize: 13,
    fontWeight: 700,
    borderBottomWidth: 2,
    borderBottomColor: "#1a1a1a",
    paddingBottom: 2,
    marginBottom: 4,
  },
  honorific: {
    fontSize: 11,
    fontWeight: 400,
  },
  docNumber: {
    fontSize: 10,
    color: "#555",
    marginBottom: 2,
  },
  docDate: {
    fontSize: 10,
    color: "#555",
    marginBottom: 2,
  },
  companyBlock: {
    textAlign: "right",
    fontSize: 9,
    lineHeight: 1.8,
    marginTop: 8,
  },
  companyName: {
    fontSize: 11,
    fontWeight: 700,
  },
  sealBox: {
    width: 36,
    height: 36,
    borderWidth: 1.5,
    borderColor: "#c00",
    borderRadius: 18,
    textAlign: "center",
    color: "#c00",
    fontSize: 9,
    fontWeight: 700,
    marginLeft: "auto",
    marginTop: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  // Table styles
  table: {
    width: "100%",
    marginVertical: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  tableCell: {
    padding: "4 6",
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: "#ccc",
  },
  tableCellFirst: {
    borderLeftWidth: 1,
    borderLeftColor: "#ccc",
  },
  tableCellNum: {
    textAlign: "right",
  },
  tableHeaderText: {
    fontWeight: 700,
    textAlign: "center",
    fontSize: 9,
  },
  // Summary table
  summaryTable: {
    width: 200,
    marginLeft: "auto",
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: "row",
    paddingVertical: 2,
  },
  summaryLabel: {
    flex: 1,
    fontSize: 10,
    color: "#555",
  },
  summaryValue: {
    width: 100,
    textAlign: "right",
    fontSize: 10,
    fontWeight: 700,
  },
  summaryTotal: {
    borderTopWidth: 2,
    borderTopColor: "#1a1a1a",
    paddingTop: 4,
    marginTop: 2,
  },
  // Note section
  noteSection: {
    marginTop: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
  },
  noteTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 9,
  },
  // Footer
  footer: {
    marginTop: 20,
    fontSize: 8,
    color: "#888",
    textAlign: "center",
  },
  // Info table (key-value pairs)
  infoTable: {
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  infoLabel: {
    width: 120,
    padding: "4 8",
    backgroundColor: "#f5f5f5",
    fontSize: 9,
    borderLeftWidth: 1,
    borderLeftColor: "#ccc",
    borderRightWidth: 1,
    borderRightColor: "#ccc",
  },
  infoValue: {
    flex: 1,
    padding: "4 8",
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: "#ccc",
  },
  // Amount box
  amountBox: {
    marginTop: 8,
    padding: 8,
    borderWidth: 2,
    borderColor: "#1a1a1a",
  },
  amountLabel: {
    fontSize: 10,
    color: "#555",
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 700,
    marginTop: 2,
  },
});
