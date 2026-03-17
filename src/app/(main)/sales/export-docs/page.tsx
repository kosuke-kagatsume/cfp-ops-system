"use client";

import { Header } from "@/components/header";
import { Pagination } from "@/components/pagination";
import { usePaginated } from "@/lib/use-paginated";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { FileText, Eye, Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";


type Document = {
  id: string;
  documentType: string;
  title: string;
  filePath: string;
  fileSize: number | null;
  mimeType: string | null;
  sourceType: string | null;
  sourceId: string | null;
  note: string | null;
  createdAt: string;
  createdBy: string | null;
};

const docTypes = [
  { id: "1", name: "Invoice（客先用）", nameEn: "Commercial Invoice", description: "客先向け請求書（英文）", color: "bg-blue-50 border-blue-200 text-blue-800", dbType: "EXPORT_INVOICE" },
  { id: "2", name: "Invoice（通関用）", nameEn: "Customs Invoice", description: "税関提出用請求書", color: "bg-indigo-50 border-indigo-200 text-indigo-800", dbType: "EXPORT_INVOICE" },
  { id: "3", name: "Packing List（客先用）", nameEn: "Packing List", description: "客先向け梱包明細", color: "bg-emerald-50 border-emerald-200 text-emerald-800", dbType: "PACKING_LIST" },
  { id: "4", name: "Packing List（通関用）", nameEn: "Customs Packing List", description: "税関提出用梱包明細", color: "bg-teal-50 border-teal-200 text-teal-800", dbType: "PACKING_LIST" },
  { id: "5", name: "B/L (Bill of Lading)", nameEn: "Bill of Lading", description: "船荷証券", color: "bg-amber-50 border-amber-200 text-amber-800", dbType: null },
  { id: "6", name: "Certificate of Origin", nameEn: "Certificate of Origin", description: "原産地証明書", color: "bg-purple-50 border-purple-200 text-purple-800", dbType: null },
  { id: "7", name: "Shipping Instructions", nameEn: "Shipping Instructions", description: "船積指図書", color: "bg-orange-50 border-orange-200 text-orange-800", dbType: null },
  { id: "8", name: "ISCC Sustainability Declaration", nameEn: "ISCC SD", description: "ISCC持続可能性宣言書", color: "bg-green-50 border-green-200 text-green-800", dbType: null },
];

export default function ExportDocsPage() {
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const { showToast } = useToast();
  const selectedDoc = docTypes.find((d) => d.id === showPreview);

  // Fetch actual export documents from DB
  const { items: documents, total, page, limit, isLoading, onPageChange } = usePaginated<Document>(
    "/api/sales/export-docs"
  );

  const docCount = (dbType: string | null) => {
    if (!dbType || !documents) return 0;
    return documents.filter((d) => d.documentType === dbType).length;
  };

  return (
    <>
      <Header title="海外帳票" />
      <div className="p-6 space-y-4">
        <div className="p-3 bg-surface-tertiary rounded-xl border border-border">
          <p className="text-sm text-text-secondary">海外取引で必要な帳票テンプレートの管理・発行を行います。各帳票をクリックしてプレビューを確認できます。</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            <span className="ml-2 text-sm text-text-secondary">読み込み中...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {docTypes.map((doc) => (
              <button key={doc.id} onClick={() => setShowPreview(doc.id)}
                className={`p-5 rounded-xl border text-left transition-all hover:shadow-md ${doc.color}`}>
                <div className="flex items-start gap-3">
                  <FileText className="w-6 h-6 mt-0.5 opacity-60" />
                  <div>
                    <h3 className="text-sm font-bold">{doc.name}</h3>
                    <p className="text-xs opacity-70 mt-0.5">{doc.nameEn}</p>
                    <p className="text-xs opacity-60 mt-1">{doc.description}</p>
                    {doc.dbType && (
                      <p className="text-xs opacity-50 mt-1">{docCount(doc.dbType)}件のドキュメント</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={!!showPreview} onClose={() => setShowPreview(null)} title={selectedDoc ? `プレビュー: ${selectedDoc.name}` : ""}
        footer={<>
          <button onClick={() => { showToast("PDFを生成しました（モック）", "success"); }} className="px-4 py-2 text-sm bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700">PDF生成</button>
          <button onClick={() => setShowPreview(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-surface-tertiary">閉じる</button>
        </>}>
        {selectedDoc && (
          <div className="space-y-4">
            <div className="p-4 bg-white border border-gray-300 rounded-lg font-mono text-xs leading-relaxed">
              <div className="text-center mb-4">
                <p className="text-base font-bold">{selectedDoc.nameEn}</p>
                <p className="text-gray-500">CFP Co., Ltd.</p>
              </div>
              <div className="border-t border-gray-200 pt-3 space-y-2">
                <div className="flex justify-between"><span className="text-gray-500">Date:</span><span>March 11, 2026</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Doc No.:</span><span>CFP-EXP-2026-0045</span></div>
                <div className="flex justify-between"><span className="text-gray-500">To:</span><span>HINDUSTAN POLYMERS PVT. LTD.</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Country:</span><span>India</span></div>
              </div>
              <div className="border-t border-gray-200 mt-3 pt-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-1">Description</th>
                      <th className="text-right py-1">Qty (kg)</th>
                      <th className="text-right py-1">Unit Price</th>
                      <th className="text-right py-1">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-1">PP Pellet Natural Grade A</td>
                      <td className="text-right py-1">20,000</td>
                      <td className="text-right py-1">USD 0.85</td>
                      <td className="text-right py-1">USD 17,000.00</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-200 font-bold">
                      <td className="py-1" colSpan={3}>Total</td>
                      <td className="text-right py-1">USD 17,000.00</td>
                    </tr>
                  </tfoot>
                </table>
              
              <div className="px-4 py-3 border-t border-border">
                <Pagination page={page} limit={limit} total={total} onPageChange={onPageChange} />
              </div>
</div>
              <div className="border-t border-gray-200 mt-3 pt-3 text-gray-500">
                <p>Terms: FOB Takamatsu Port</p>
                <p>Payment: T/T 30 days after B/L date</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-text-tertiary" />
              <p className="text-xs text-text-tertiary">上記はプレビューモックです。実際のデータは受注情報から自動生成されます。</p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
