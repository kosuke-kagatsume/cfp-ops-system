import React from "react";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import {
  baseStyles as s,
  COMPANY,
  formatDate,
  formatNumber,
  packagingLabels,
} from "./styles";
import type { PurchaseOrderData } from "../document-templates";

export function PurchaseOrderPDF({ data }: { data: PurchaseOrderData }) {
  const totalWithFreight = data.amount + (data.freightCost ?? 0);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>買 受 書</Text>

        <View style={s.headerRow}>
          <View style={s.headerLeft}>
            <Text style={s.customerName}>
              {data.supplierName}
              <Text style={s.honorific}> 御中</Text>
            </Text>
            {data.supplierAddress && (
              <Text style={{ fontSize: 9, color: "#555", marginTop: 4 }}>
                {data.supplierAddress}
              </Text>
            )}
            <Text style={{ marginTop: 8, fontSize: 10 }}>
              下記の通り買い受けいたします。
            </Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.docNumber}>
              仕入番号: {data.purchaseNumber}
            </Text>
            <Text style={s.docDate}>
              日付: {formatDate(data.purchaseDate)}
            </Text>
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
            <Text style={[s.tableCell, s.tableHeaderText, { width: 55 }]}>
              荷姿
            </Text>
            <Text style={[s.tableCell, s.tableHeaderText, { width: 65 }]}>
              数量(kg)
            </Text>
            <Text style={[s.tableCell, s.tableHeaderText, { width: 70 }]}>
              単価(円/kg)
            </Text>
            <Text style={[s.tableCell, s.tableHeaderText, { width: 80 }]}>
              金額
            </Text>
          </View>
          <View style={s.tableRow}>
            <Text style={[s.tableCell, s.tableCellFirst, s.tableCellNum, { width: 30 }]}>
              1
            </Text>
            <Text style={[s.tableCell, { width: 70 }]}>
              {data.productCode}
            </Text>
            <Text style={[s.tableCell, { flex: 1 }]}>
              {data.productName ?? "-"}
            </Text>
            <Text style={[s.tableCell, { width: 55 }]}>
              {data.packagingType
                ? (packagingLabels[data.packagingType] ?? data.packagingType)
                : "-"}
            </Text>
            <Text style={[s.tableCell, s.tableCellNum, { width: 65 }]}>
              {formatNumber(data.quantity)}
            </Text>
            <Text style={[s.tableCell, s.tableCellNum, { width: 70 }]}>
              ¥{formatNumber(data.unitPrice)}
            </Text>
            <Text style={[s.tableCell, s.tableCellNum, { width: 80 }]}>
              ¥{formatNumber(data.amount)}
            </Text>
          </View>
        </View>

        {/* Summary */}
        <View style={s.summaryTable}>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>小計</Text>
            <Text style={s.summaryValue}>¥{formatNumber(data.amount)}</Text>
          </View>
          {data.freightCost != null && (
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>運賃</Text>
              <Text style={s.summaryValue}>
                ¥{formatNumber(data.freightCost)}
              </Text>
            </View>
          )}
          <View style={[s.summaryRow, s.summaryTotal]}>
            <Text style={[s.summaryLabel, { fontWeight: 700 }]}>合計</Text>
            <Text style={s.summaryValue}>
              ¥{formatNumber(totalWithFreight)}
            </Text>
          </View>
        </View>

        {/* Additional info */}
        {(data.pickupPartnerName || data.warehouseName) && (
          <View style={[s.infoTable, { marginTop: 12 }]}>
            {data.pickupPartnerName && (
              <View style={[s.infoRow, { borderTopWidth: 1, borderTopColor: "#ccc" }]}>
                <Text style={s.infoLabel}>引取先</Text>
                <Text style={s.infoValue}>{data.pickupPartnerName}</Text>
              </View>
            )}
            {data.warehouseName && (
              <View style={[s.infoRow, !data.pickupPartnerName ? { borderTopWidth: 1, borderTopColor: "#ccc" } : {}]}>
                <Text style={s.infoLabel}>入庫先倉庫</Text>
                <Text style={s.infoValue}>{data.warehouseName}</Text>
              </View>
            )}
          </View>
        )}

        {data.note && (
          <View style={s.noteSection}>
            <Text style={s.noteTitle}>備考</Text>
            <Text style={s.noteText}>{data.note}</Text>
          </View>
        )}
        <Text style={s.footer}>
          この買受書は{COMPANY.name}が発行しました。
        </Text>
      </Page>
    </Document>
  );
}
