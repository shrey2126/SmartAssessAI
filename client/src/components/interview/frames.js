/** Interview frame capture helpers */
export function dataUrlSizeKb(url) {
  return Math.round(((url || "").length * 3) / 4 / 1024);
}
