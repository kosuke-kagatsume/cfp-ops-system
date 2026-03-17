// =============================================================================
// 全銀フォーマット（全国銀行協会制定）FBデータ生成
// 総合振込（種別コード: 21）
// 固定長120バイト/行
// =============================================================================

type TransferRecord = {
  bankCode: string;       // 銀行コード（4桁）
  branchCode: string;     // 支店コード（3桁）
  accountType: string;    // 1:普通 2:当座 4:貯蓄
  accountNumber: string;  // 口座番号（7桁）
  accountHolder: string;  // 口座名義（カナ、30文字）
  amount: number;         // 振込金額
};

type ZenginOptions = {
  companyCode: string;     // 委託者コード（10桁）
  companyName: string;     // 委託者名（カナ、40文字）
  transferDate: string;    // 振込指定日（MMDD）
  bankCode: string;        // 仕向銀行コード（4桁）
  branchCode: string;      // 仕向支店コード（3桁）
  accountType: string;     // 1:普通 2:当座
  accountNumber: string;   // 口座番号（7桁）
};

// 半角スペースで右パディング
function padRight(str: string, len: number): string {
  const s = str.slice(0, len);
  return s + " ".repeat(len - s.length);
}

// ゼロ左パディング
function padLeft(str: string, len: number): string {
  const s = str.slice(0, len);
  return "0".repeat(len - s.length) + s;
}

// カタカナを半角カタカナに変換
function toHalfWidthKana(str: string): string {
  const kanaMap: Record<string, string> = {
    "ア": "ｱ", "イ": "ｲ", "ウ": "ｳ", "エ": "ｴ", "オ": "ｵ",
    "カ": "ｶ", "キ": "ｷ", "ク": "ｸ", "ケ": "ｹ", "コ": "ｺ",
    "サ": "ｻ", "シ": "ｼ", "ス": "ｽ", "セ": "ｾ", "ソ": "ｿ",
    "タ": "ﾀ", "チ": "ﾁ", "ツ": "ﾂ", "テ": "ﾃ", "ト": "ﾄ",
    "ナ": "ﾅ", "ニ": "ﾆ", "ヌ": "ﾇ", "ネ": "ﾈ", "ノ": "ﾉ",
    "ハ": "ﾊ", "ヒ": "ﾋ", "フ": "ﾌ", "ヘ": "ﾍ", "ホ": "ﾎ",
    "マ": "ﾏ", "ミ": "ﾐ", "ム": "ﾑ", "メ": "ﾒ", "モ": "ﾓ",
    "ヤ": "ﾔ", "ユ": "ﾕ", "ヨ": "ﾖ",
    "ラ": "ﾗ", "リ": "ﾘ", "ル": "ﾙ", "レ": "ﾚ", "ロ": "ﾛ",
    "ワ": "ﾜ", "ヲ": "ｦ", "ン": "ﾝ",
    "ガ": "ｶﾞ", "ギ": "ｷﾞ", "グ": "ｸﾞ", "ゲ": "ｹﾞ", "ゴ": "ｺﾞ",
    "ザ": "ｻﾞ", "ジ": "ｼﾞ", "ズ": "ｽﾞ", "ゼ": "ｾﾞ", "ゾ": "ｿﾞ",
    "ダ": "ﾀﾞ", "ヂ": "ﾁﾞ", "ヅ": "ﾂﾞ", "デ": "ﾃﾞ", "ド": "ﾄﾞ",
    "バ": "ﾊﾞ", "ビ": "ﾋﾞ", "ブ": "ﾌﾞ", "ベ": "ﾍﾞ", "ボ": "ﾎﾞ",
    "パ": "ﾊﾟ", "ピ": "ﾋﾟ", "プ": "ﾌﾟ", "ペ": "ﾍﾟ", "ポ": "ﾎﾟ",
    "ヴ": "ｳﾞ", "ー": "ｰ", "（": "(", "）": ")",
    "　": " ",
  };

  return str
    .split("")
    .map((c) => kanaMap[c] ?? c)
    .join("");
}

/**
 * 全銀FBデータ生成
 * ヘッダー + データレコード + トレーラー + エンド
 */
export function generateZenginFB(
  records: TransferRecord[],
  options: ZenginOptions
): string {
  const lines: string[] = [];

  // ===== ヘッダーレコード =====
  // データ区分(1) + 種別コード(2) + コード区分(1) + 委託者コード(10) +
  // 委託者名(40) + 振込指定日(4) + 仕向銀行番号(4) + 仕向支店番号(3) +
  // 預金種目(1) + 口座番号(7) + ダミー(17)
  const header = [
    "1",                                              // データ区分: ヘッダー
    "21",                                             // 種別コード: 総合振込
    "0",                                              // コード区分: JIS
    padLeft(options.companyCode, 10),                  // 委託者コード
    padRight(toHalfWidthKana(options.companyName), 40),// 委託者名
    padLeft(options.transferDate, 4),                  // 振込指定日(MMDD)
    padLeft(options.bankCode, 4),                      // 仕向銀行番号
    padRight("", 15),                                  // 仕向銀行名（省略可）
    padLeft(options.branchCode, 3),                    // 仕向支店番号
    padRight("", 15),                                  // 仕向支店名（省略可）
    options.accountType,                               // 預金種目
    padLeft(options.accountNumber, 7),                  // 口座番号
    padRight("", 17),                                  // ダミー
  ].join("");
  lines.push(padRight(header, 120));

  // ===== データレコード =====
  for (const rec of records) {
    const data = [
      "2",                                            // データ区分: データ
      padLeft(rec.bankCode, 4),                       // 銀行番号
      padRight("", 15),                                // 銀行名（省略可）
      padLeft(rec.branchCode, 3),                     // 支店番号
      padRight("", 15),                                // 支店名（省略可）
      "0000",                                          // 手形交換所番号（振込は0000）
      rec.accountType,                                 // 預金種目
      padLeft(rec.accountNumber, 7),                   // 口座番号
      padRight(toHalfWidthKana(rec.accountHolder), 30),// 受取人名
      padLeft(String(Math.round(rec.amount)), 10),     // 振込金額
      "0",                                             // 新規コード: 0=その他
      padRight("", 20),                                // EDI情報（ダミー）
      "0",                                             // 振込指定区分: 0=電信
      "0",                                             // 識別表示（ダミー）
      padRight("", 7),                                 // ダミー
    ].join("");
    lines.push(padRight(data, 120));
  }

  // ===== トレーラーレコード =====
  const totalAmount = records.reduce((sum, r) => sum + Math.round(r.amount), 0);
  const trailer = [
    "8",                                              // データ区分: トレーラー
    padLeft(String(records.length), 6),               // 合計件数
    padLeft(String(totalAmount), 12),                 // 合計金額
    padRight("", 101),                                // ダミー
  ].join("");
  lines.push(padRight(trailer, 120));

  // ===== エンドレコード =====
  const end = "9" + padRight("", 119);
  lines.push(end);

  return lines.join("\r\n");
}
