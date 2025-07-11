export function shortId(id) {
  if (!id) return "";
  if (id.length <= 12) return id;
  return id.slice(0, 6) + "..." + id.slice(-4);
}
export function shortName(name, maxLen = 18) {
  if (!name) return "";
  return name.length > maxLen ? name.slice(0, maxLen - 3) + "..." : name;
}
