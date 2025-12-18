async function api(path, opts) {
  const res = await fetch(path, Object.assign({ headers: { "Content-Type": "application/json" } }, opts || {}));
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || ("Request failed: " + res.status));
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return await res.json();
  return await res.text();
}
function fmtTime(ms) {
  if (!ms) return "";
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function minutesSince(ms) {
  if (!ms) return 0;
  const diff = Date.now() - ms;
  return Math.max(0, Math.floor(diff / 60000));
}
function el(tag, attrs, ...kids){
  const n = document.createElement(tag);
  if (attrs) for (const [k,v] of Object.entries(attrs)) {
    if (k === "class") n.className = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2).toLowerCase(), v);
    else n.setAttribute(k, v);
  }
  for (const k of kids) {
    if (k == null) continue;
    if (typeof k === "string") n.appendChild(document.createTextNode(k));
    else n.appendChild(k);
  }
  return n;
}
