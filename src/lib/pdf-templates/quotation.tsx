import React from "react";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import {
  baseStyles as s,
  COMPANY,
  formatDate,
  formatNumber,
  formatCurrency,
} from "./styles";
import type { QuotationData } from "../document-templates";

export function QuotationPDF({ data }: { data: QuotationData }) {
  const curr = data.currency;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>見 積 書</Text>

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
            {data.subject && (
              <Text style={{ marginTop: 8, fontSize: 10 }}>
                件名: {data.subject}
              </Text>
            )}
            <Text style={{ marginTop: 8, fontSize: 10 }}>
              下記の通りお見積り申し上げます。
            </Text>
            <View style={s.amountBox}>
              <Text style={s.amountLabel}>お見積金額（税込）</Text>
              <Text style={s.amountValue}>
                {formatCurrency(data.total, curr)}
              </Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <Text style={s.docNumber}>
              見積番号: {data.quotationNumber}
            </Text>
            <Text style={s.docDate}>
              見積日: {formatDate(data.quotationDate)}
            </Text>
            {data.validUntil && (
              <Text style={s.docDate}>
                有効期限: {formatDate(data.validUntil)}
              </Text>
            )}
            <View style={s.companyBlock}>
              <Text style={s.companyName}>{COMPANY.name}</Text>
              <Text>{COMPANY.zip}</Text>
              <Text>{COMPANY.address}</Text>
              <Text>
                TEL: {COMPANY.tel} / FAX: {COMPANY.fax}
              </Text>
              <View style={s.sealBox}>
                <Text>印</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Items table */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableCell, s.tableCellFirst, s.tableHeaderText, { width: 30 }]}>
              No.
            </Text>
            <Text style={[s.tableCell, s.tableHeaderText, { width: 70 }]}>
              品目コード
            </Text>
            <Text style={[s.tableCell, s.tableHeaderText, { flex: 1 }]}>
              品名
            </Text>
            <Text style={[s.tableCell, s.tableHeaderText, { width: 70 }]}>
              数量
            </Text>
            <Text style={[s.tableCell, s.tableHeaderText, { width: 70 }]}>
              単価
            </Text>
            <Text style={[s.tableCell, s.tableHeaderText, { width: 90 }]}>
              金額
            </Text>
          </View>
          {data.items.length > 0 ? (
            data.items.map((item, i) => (
              <View style={s.tableRow} key={i}>
                <Text style={[s.tableCell, s.tableCellFirst, s.tableCellNum, { width: 30 }]}>
                  {i + 1}
                </Text>
                <Text style={[s.tableCell, { width: 70 }]}>
                  {item.product}
                </Text>
                <Text style={[s.tableCell, { flex: 1 }]}>{item.name}</Text>
                <Text style={[s.tableCell, s.tableCellNum, { width: 70 }]}>
                  {formatNumber(item.qty)} kg
                </Text>
                <Text style={[s.tableCell, s.tableCellNum, { width: 70 }]}>
                  {formatCurrency(item.price, curr)}
                </Text>
                <Text style={[s.tableCell, s.tableCellNum, { width: 90 }]}>
                  {formatCurrency(item.qty * item.price, curr)}
                </Text>
              </View>
            ))
          ) : (
            <View style={s.tableRow}>
              <Text
                style={[
                  s.tableCell,
                  s.tableCellFirst,
                  { flex: 1, textAlign: "center", color: "#999" },
                ]}
              >
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
              {formatCurrency(data.subtotal, curr)}
            </Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>消費税</Text>
            <Text style={s.summaryValue}>
              {formatCurrency(data.taxAmount, curr)}
            </Text>
          </View>
          <View style={[s.summaryRow, s.summaryTotal]}>
            <Text style={[s.summaryLabel, { fontWeight: 700 }]}>
              合計（税込）
            </Text>
            <Text style={s.summaryValue}>
              {formatCurrency(data.total, curr)}
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
          この見積書は{COMPANY.name}
          が発行しました。有効期限内にご発注ください。
        </Text>
      </Page>
    </Document>
  );
}
