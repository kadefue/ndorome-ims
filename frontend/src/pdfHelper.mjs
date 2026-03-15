export function stampFilename(baseFilename, now = new Date()) {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const ts = `${yyyy}${mm}${dd}_${hh}${mi}${ss}`;
  if (/\.pdf$/i.test(baseFilename)) {
    return baseFilename.replace(/\.pdf$/i, `_${ts}.pdf`);
  }
  return `${baseFilename}_${ts}.pdf`;
}

export default { stampFilename };
