import React from "react";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import {
  baseStyles as s,
  COMPANY,
  formatDate,
  formatNumber,
  packagingLabels,
} from "./styles";
import type { ShippingData } from "../document-templates";

export function ShippingLabelPDF({ data }: { data: ShippingData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>送 り 状</Text>

        <View style={s.headerRow}>
          <View style={s.headerLeft}>
            <View
              style={{
                borderWidth: 2,
                borderColor: "#1a1a1a",
                padding: 12,
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 9, color: "#555" }}>お届け先</Text>
              <Text
                style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}
              >
                {data.customerName} 様
              </Text>
              {data.customerAddress && (
                <Text style={{ fontSize: 10, marginTop: 4 }}>
                  {data.customerAddress}
                </Text>
              )}
            </View>
          </View>
          <View style={s.headerRight}>
            <Text style={s.docNumber}>
              出荷番号: {data.shipmentNumber}
            </Text>
            <Text style={s.docDate}>
              出荷日: {formatDate(data.shipmentDate)}
            </Text>
            <View style={s.companyBlock}>
              <Text style={{ fontSize: 9, color: "#555" }}>ご依頼主</Text>
              <Text style={s.companyName}>{COMPANY.name}</Text>
              <Text>{COMPANY.zip}</Text>
              <Text>{COMPANY.address}</Text>
              <Text>TEL: {COMPANY.tel}</Text>
            </View>
          </View>
        </View>

        {/* Items table */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableCell, s.tableCellFirst, s.tableHeaderText, { width: 80 }]}>
              品目コード
            </Text>
            <Text style={[s.tableCell, s.tableHeaderText, { flex: 1 }]}>
              品名
            </Text>
            <Text style={[s.tableCell, s.tableHeaderText, { width: 80 }]}>
              数量(kg)
            </Text>
            <Text style={[s.tableCell, s.tableHeaderText, { width: 80 }]}>
              荷姿
            </Text>
          </View>
          <View style={s.tableRow}>
            <Text style={[s.tableCell, s.tableCellFirst, { width: 80 }]}>
              {data.productCode}
            </Text>
            <Text style={[s.tableCell, { flex: 1 }]}>
              {data.productName ?? "-"}
            </Text>
            <Text style={[s.tableCell, s.tableCellNum, { width: 80 }]}>
              {formatNumber(data.quantity)}
            </Text>
            <Text style={[s.tableCell, { width: 80 }]}>
              {data.packagingType
                ? (packagingLabels[data.packagingType] ?? data.packagingType)
                : "-"}
            </Text>
          </View>
        </View>

        {data.carrierName && (
          <Text style={{ marginTop: 8, fontSize: 10 }}>
            運送会社: {data.carrierName}
          </Text>
        )}

        {data.note && (
          <View style={s.noteSection}>
            <Text style={s.noteTitle}>備考</Text>
            <Text style={s.noteText}>{data.note}</Text>
          </View>
        )}
        <Text style={s.footer}>
          この送り状は{COMPANY.name}が発行しました。
        </Text>
      </Page>
    </Document>
  );
}
