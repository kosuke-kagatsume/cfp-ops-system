import React from "react";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import { baseStyles as s, COMPANY, formatDate } from "./styles";
import type { DeliveryNoteData } from "../document-templates";

export function DeliveryNotePDF({ data }: { data: DeliveryNoteData }) {
  const typeLabel =
    data.documentType === "DELIVERY_NOTE_TEMP" ? "仮納品書" : "本納品書";

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>納 品 書</Text>

        <View style={s.headerRow}>
          <View style={s.headerLeft}>
            <Text style={{ fontSize: 10, color: "#555" }}>
              種別: {typeLabel}
            </Text>
            <Text style={{ fontSize: 9, marginTop: 4 }}>
              文書タイトル: {data.title}
            </Text>
            {data.sourceType && (
              <Text style={{ fontSize: 9, marginTop: 4 }}>
                関連元: {data.sourceType} {data.sourceId ?? ""}
              </Text>
            )}
          </View>
          <View style={s.headerRight}>
            <Text style={s.docNumber}>文書ID: {data.documentId}</Text>
            <Text style={s.docDate}>
              作成日: {formatDate(data.createdAt)}
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

        <Text style={{ marginTop: 12, fontSize: 10 }}>
          下記の通り納品いたします。
        </Text>

        <View style={[s.table, { marginTop: 8 }]}>
          <View style={s.tableHeader}>
            <Text style={[s.tableCell, s.tableCellFirst, s.tableHeaderText, { flex: 1 }]}>
              品名
            </Text>
            <Text style={[s.tableCell, s.tableHeaderText, { width: 60 }]}>
              数量
            </Text>
            <Text style={[s.tableCell, s.tableHeaderText, { width: 60 }]}>
              単位
            </Text>
            <Text style={[s.tableCell, s.tableHeaderText, { flex: 1 }]}>
              備考
            </Text>
          </View>
          <View style={s.tableRow}>
            <Text
              style={[
                s.tableCell,
                s.tableCellFirst,
                {
                  flex: 1,
                  textAlign: "center",
                  color: "#888",
                  paddingVertical: 16,
                },
              ]}
            >
              ※ 出荷伝票と紐付後、明細が表示されます
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
          この納品書は{COMPANY.name}が発行しました。
        </Text>
      </Page>
    </Document>
  );
}
