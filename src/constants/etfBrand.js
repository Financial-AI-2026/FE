export const BRAND_BY_CODE = {
  102110: "tiger",
  133690: "tiger",
  418660: "tiger",
  435420: "tiger",
  441680: "tiger",
  448290: "tiger",
  QYLD: "globalx",
  TQQQ: "proshares",
};

const BRAND_BY_MANAGER_KEYWORD = [
  ["미래에셋", "tiger"],
  ["삼성", "kodex"],
  ["Global X", "globalx"],
  ["ProShares", "proshares"],
];

export function brandForEtf(item) {
  if (!item) return "default";

  const code = String(item.code ?? "").toUpperCase();
  if (BRAND_BY_CODE[code]) return BRAND_BY_CODE[code];

  const brandSource = `${item.manager ?? ""} ${item.name ?? ""}`;
  const hit = BRAND_BY_MANAGER_KEYWORD.find(([keyword]) =>
    brandSource.includes(keyword),
  );

  return hit ? hit[1] : "default";
}
