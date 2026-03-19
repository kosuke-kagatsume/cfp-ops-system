/**
 * API レスポンスのキャッシュ戦略
 *
 * MASTER: マスタデータ（取引先、商品、工場など） - CDNで60秒キャッシュ
 * TRANSACTION: トランザクションデータ（受注、売上、請求など） - キャッシュなし
 * REALTIME: リアルタイムデータ（通知、ダッシュボード） - キャッシュなし
 */

type CacheTier = "MASTER" | "TRANSACTION" | "REALTIME";

const CACHE_HEADERS: Record<CacheTier, Record<string, string>> = {
  MASTER: {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  },
  TRANSACTION: {
    "Cache-Control": "private, no-cache",
  },
  REALTIME: {
    "Cache-Control": "private, no-cache, no-store",
  },
};

export function cacheHeaders(tier: CacheTier): Record<string, string> {
  return CACHE_HEADERS[tier];
}
