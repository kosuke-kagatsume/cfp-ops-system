import React from "react";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import { baseStyles as s, COMPANY, formatDate } from "./styles";
import type { CertificateData } from "../document-templates";

export function AnalysisCertificatePDF({ data }: { data: CertificateData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={{ fontSize: 8, color: "#888", textAlign: "center", marginBottom: 4 }}>
          Certificate of Analysis
        </Text>
        <Text style={s.title}>分析成績書</Text>

        <View style={s.headerRow}>
          <View style={s.headerLeft}>
            <View style={s.infoTable}>
              {[
                ["成績書番号", data.certificateNumber],
                ["サンプルID", data.sampleNumber],
                ["サンプル名", data.sampleName],
                ["製品名", data.productName],
                ...(data.source ? [["サンプル由来", data.source]] : []),
                ["受付日", formatDate(data.receivedDate)],
              ].map(([label, value], i) => (
                <View
                  style={[
                    {
                      flexDirection: "row",
                      paddingVertical: 3,
                    },
                  ]}
                  key={i}
                >
                  <Text style={{ width: 80, fontSize: 9, color: "#555" }}>
                    {label}
                  </Text>
                  <Text style={{ flex: 1, fontSize: 9, fontWeight: label === "成績書番号" ? 700 : 400 }}>
                    {value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          <View style={s.headerRight}>
            <Text style={s.docDate}>
              発行日: {formatDate(data.issueDate)}
            </Text>
            <View style={s.companyBlock}>
              <Text style={s.companyName}>{COMPANY.name} 研究室</Text>
              <Text>{COMPANY.zip}</Text>
              <Text>{COMPANY.address}</Text>
              <Text>TEL: {COMPANY.tel}</Text>
              <View style={s.sealBox}>
                <Text>印</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
          分析結果
        </Text>

        {/* Results table */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableCell, s.tableCellFirst, s.tableHeaderText, { flex: 1 }]}>
              分析項目
            </Text>
            <Text style={[s.tableCell, s.tableHeaderText, { flex: 1 }]}>
              規格値
            </Text>
            <Text style={[s.tableCell, s.tableHeaderText, { flex: 1 }]}>
              測定値
            </Text>
            <Text style={[s.tableCell, s.tableHeaderText, { width: 45 }]}>
              判定
            </Text>
          </View>
          {data.analysisResults.length > 0 ? (
            data.analysisResults.map((r, i) => (
              <View style={s.tableRow} key={i}>
                <Text style={[s.tableCell, s.tableCellFirst, { flex: 1 }]}>
                  {r.testItem}
                </Text>
                <Text style={[s.tableCell, { flex: 1 }]}>
                  {r.standard ?? "-"}
                </Text>
                <Text style={[s.tableCell, { flex: 1, fontWeight: 700 }]}>
                  {r.result}
                  {r.unit ? ` ${r.unit}` : ""}
                </Text>
                <Text
                  style={[
                    s.tableCell,
                    { width: 45, textAlign: "center", fontSize: 12 },
                  ]}
                >
                  {r.isPassed === true
                    ? "○"
                    : r.isPassed === false
                      ? "×"
                      : "-"}
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
                分析結果なし
              </Text>
            </View>
          )}
        </View>

        {/* Overall judgment badge */}
        {data.overallJudgment && (
          <View style={{ alignItems: "center", marginTop: 12 }}>
            <View
              style={{
                paddingHorizontal: 20,
                paddingVertical: 6,
                borderRadius: 4,
                borderWidth: 2,
                borderColor:
                  data.overallJudgment === "合格" ? "#065f46" : "#991b1b",
                backgroundColor:
                  data.overallJudgment === "合格" ? "#d1fae5" : "#fee2e2",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color:
                    data.overallJudgment === "合格" ? "#065f46" : "#991b1b",
                }}
              >
                総合判定: {data.overallJudgment}
              </Text>
            </View>
          </View>
        )}

        {data.note && (
          <View style={s.noteSection}>
            <Text style={s.noteTitle}>備考</Text>
            <Text style={s.noteText}>{data.note}</Text>
          </View>
        )}
        <Text style={s.footer}>
          この成績書は{COMPANY.name} 研究室が発行しました。
        </Text>
      </Page>
    </Document>
  );
}
