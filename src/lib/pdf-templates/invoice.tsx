import React from "react";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import {
  baseStyles as s,
  COMPANY,
  formatDate,
  formatCurrency,
} from "./styles";
import type { InvoiceData } from "../document-templates";

export function InvoicePDF({ data }: { data: InvoiceData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>請 求 書</Text>

        <View style={s.headerRow}>
          <View style={s.headerLeft}>
            <Text style={s.customerName}>
              {data.customerName}
              <Text style={s.honorific}> 御中</Text>
            </Text>
            {data.customerAddress && (
              <Text style={{ fontSize: 9, color: "#555", marginTop: 4 }}>
                {data.customerAddress}
              </Text>
            )}
            <Text style={{ marginTop: 8, fontSize: 10 }}>
              下記の通りご請求申し上げます。
            </Text>
            <View style={s.amountBox}>
              <Text style={s.amountLabel}>ご請求金額（税込）</Text>
              <Text style={s.amountValue}>
                {formatCurrency(data.total, data.currency)}
              </Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <Text style={s.docNumber}>
              請求書番号: {data.invoiceNumber}
            </Text>
            <Text style={s.docDate}>
              請求日: {formatDate(data.billingDate)}
            </Text>
            {data.dueDate && (
              <Text style={s.docDate}>
                お支払期限: {formatDate(data.dueDate)}
              </Text>
            )}
            <View style={s.companyBlock}>
              <Text style={s.companyName}>{COMPANY.name}</Text>
              <Text>{COMPANY.zip}</Text>
              <Text>{COMPANY.address}</Text>
              <Text>TEL: {COMPANY.tel}</Text>
              <Text>FAX: {COMPANY.fax}</Text>
              <View style={s.sealBox}>
                <Text>印</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Balance table */}
        <View style={s.infoTable}>
          <View style={[s.infoRow, { borderTopWidth: 1, borderTopColor: "#ccc" }]}>
            <Text style={s.infoLabel}>前回請求残高</Text>
            <Text style={[s.infoValue, { textAlign: "right" }]}>
              {formatCurrency(data.prevBalance, data.currency)}
            </Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>ご入金額</Text>
            <Text style={[s.infoValue, { textAlign: "right" }]}>
              {formatCurrency(data.paymentReceived, data.currency)}
            </Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>繰越残高</Text>
            <Text
              style={[s.infoValue, { textAlign: "right", fontWeight: 700 }]}
            >
              {formatCurrency(data.carryover, data.currency)}
            </Text>
          </View>
        </View>

        <Text style={{ fontSize: 11, fontWeight: 700, marginTop: 12, marginBottom: 6 }}>
          今回売上明細
        </Text>

        {/* Items table */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableCell, s.tableCellFirst, s.tableHeaderText, { width: 30 }]}>
              No.
            </Text>
            <Text style={[s.tableCell, s.tableHeaderText, { flex: 1 }]}>
              売上番号
            </Text>
            <Text style={[s.tableCell, s.tableHeaderText, { flex: 1 }]}>
              品名
            </Text>
            <Text style={[s.tableCell, s.tableHeaderText, { width: 90 }]}>
              金額
            </Text>
          </View>
          {data.revenues.length > 0 ? (
            data.revenues.map((r, i) => (
              <View style={s.tableRow} key={i}>
                <Text style={[s.tableCell, s.tableCellFirst, s.tableCellNum, { width: 30 }]}>
                  {i + 1}
                </Text>
                <Text style={[s.tableCell, { flex: 1 }]}>
                  {r.revenueNumber}
                </Text>
                <Text style={[s.tableCell, { flex: 1 }]}>
                  {r.productName ?? "-"}
                </Text>
                <Text style={[s.tableCell, s.tableCellNum, { width: 90 }]}>
                  {formatCurrency(r.amount, data.currency)}
                </Text>
              </View>
            ))
          ) : (
            <View style={s.tableRow}>
              <Text style={[s.tableCell, s.tableCellFirst, { flex: 1, textAlign: "center", color: "#999" }]}>
                明細なし
              </Text>
            </View>
          )}
        </View>

        {/* Summary */}
        <View style={s.summaryTable}>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>小計（税抜）</Text>
            <Text style={s.summaryValue}>
              {formatCurrency(data.subtotal, data.currency)}
            </Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>消費税</Text>
            <Text style={s.summaryValue}>
              {formatCurrency(data.taxAmount, data.currency)}
            </Text>
          </View>
          <View style={[s.summaryRow, s.summaryTotal]}>
            <Text style={[s.summaryLabel, { fontWeight: 700 }]}>
              今回請求額
            </Text>
            <Text style={s.summaryValue}>
              {formatCurrency(data.total, data.currency)}
            </Text>
          </View>
        </View>

        {data.note && (
          <View style={s.noteSection}>
            <Text style={s.noteTitle}>備考</Text>
            <Text style={s.noteText}>{data.note}</Text>
          </View>
        )}
        <Text style={s.footer}>
          この請求書は{COMPANY.name}が発行しました。
        </Text>
      </Page>
    </Document>
  );
}
