// =============================================================================
// ファイルストレージ
// Vercel Blob Storage連携（@vercel/blob）
// 未インストール時はローカルファイルシステムにフォールバック
// =============================================================================

let blobModule: typeof import("@vercel/blob") | null = null;

async function getBlobModule() {
  if (blobModule) return blobModule;
  try {
    blobModule = await import("@vercel/blob");
    return blobModule;
  } catch {
    return null;
  }
}

export type UploadResult = {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
};

/**
 * ファイルアップロード
 * Vercel Blob が利用可能ならそちらを使用、なければbase64 data URLで保持
 */
export async function uploadFile(
  file: File | Blob,
  filename: string
): Promise<UploadResult> {
  const blob = await getBlobModule();

  if (blob && process.env.BLOB_READ_WRITE_TOKEN) {
    const result = await blob.put(filename, file, {
      access: "public",
    });
    return {
      url: result.url,
      pathname: result.pathname,
      contentType: result.contentType,
      size: file.size,
    };
  }

  // フォールバック: base64 data URL
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const mimeType =
    file instanceof File ? file.type : "application/octet-stream";
  const dataUrl = `data:${mimeType};base64,${base64}`;

  return {
    url: dataUrl,
    pathname: filename,
    contentType: mimeType,
    size: file.size,
  };
}

/**
 * ファイル削除
 */
export async function deleteFile(url: string): Promise<void> {
  const blob = await getBlobModule();

  if (blob && process.env.BLOB_READ_WRITE_TOKEN && url.startsWith("http")) {
    await blob.del(url);
  }
  // data URL の場合はDBから消すだけでOK
}
