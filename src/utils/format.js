export const fmt = (n) => new Intl.NumberFormat("ka-GE", { style: "currency", currency: "GEL" }).format(n || 0);
export const fmtNum = (n) => new Intl.NumberFormat("ka-GE").format(n || 0);
