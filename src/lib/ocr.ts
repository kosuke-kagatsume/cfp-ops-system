// =============================================================================
// 領収書OCR - Claude Vision API
// 領収書・請求書画像からメタデータを抽出する
// =============================================================================
import * as Sentry from "@sentry/nextjs";

type OCRResult = {
  transactionDate: string | null;  // 日付 (YYYY-MM-DD)
  amount: number | null;           // 金額
  partnerName: string | null;      // 支払先/取引先
  description: string | null;      // 摘要/品目
  taxAmount: number | null;        // 消費税額
  documentType: string | null;     // 領収書/請求書/見積書 等
};

/**
 * Claude Vision API で画像を解析し、領収書/請求書情報を抽出する
 */
export async function extractReceiptData(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<OCRResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // APIキーがない場合はダミーデータを返す
    return {
      transactionDate: null,
      amount: null,
      partnerName: null,
      description: null,
      taxAmount: null,
      documentType: null,
    };
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType,
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: `この画像は日本の領収書または請求書です。以下の情報をJSON形式で抽出してください。
値が読み取れない場合はnullとしてください。

{
  "transactionDate": "YYYY-MM-DD形式の日付",
  "amount": 合計金額（数値、税込）,
  "partnerName": "発行元の会社名または店名",
  "description": "但し書き・品目の概要",
  "taxAmount": 消費税額（数値）,
  "documentType": "領収書" or "請求書" or "見積書" or "納品書" or "その他"
}

JSONのみを返してください。`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    Sentry.captureException(new Error(`OCR API error: ${response.status}`));
    return {
      transactionDate: null,
      amount: null,
      partnerName: null,
      description: null,
      taxAmount: null,
      documentType: null,
    };
  }

  const result = await response.json();
  const text = result.content?.[0]?.text ?? "";

  try {
    // JSONを抽出（前後にテキストがある場合も考慮）
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        transactionDate: null,
        amount: null,
        partnerName: null,
        description: null,
        taxAmount: null,
        documentType: null,
      };
    }
    return JSON.parse(jsonMatch[0]) as OCRResult;
  } catch {
    return {
      transactionDate: null,
      amount: null,
      partnerName: null,
      description: null,
      taxAmount: null,
      documentType: null,
    };
  }
}
