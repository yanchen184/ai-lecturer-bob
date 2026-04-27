/**
 * Base-aware URL helper。
 *
 * GitHub Pages project page 站會有 base path（`/ai-lecturer-bob`），
 * 綁自訂網域後 base 會變 ''。所有 app 內部連結都要經過 withBase，
 * 以免從 project page 搬到自訂網域時到處改連結。
 */

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** 把站內相對路徑加上 base；絕對 URL（http/https）不動。 */
export function withBase(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

export { base };
