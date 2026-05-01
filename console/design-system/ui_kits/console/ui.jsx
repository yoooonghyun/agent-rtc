/* global React */
const { useState, useMemo } = React;

// ---------- Primitives ----------
const Button = ({ variant = "primary", size = "md", pill, children, ...rest }) => {
  const base = {
    fontFamily: "inherit", fontWeight: 600, border: "none", cursor: "pointer",
    transition: "background 120ms cubic-bezier(0.4,0,0.2,1)",
    padding: size === "lg" ? "14px 22px" : size === "sm" ? "6px 12px" : "10px 16px",
    fontSize: size === "lg" ? 16 : size === "sm" ? 13 : 14,
    borderRadius: pill ? 999 : (size === "lg" ? 12 : 10),
    display: "inline-flex", alignItems: "center", gap: 6,
  };
  const variants = {
    primary: { background: "var(--brand)", color: "#fff" },
    secondary: { background: "var(--grey-100)", color: "var(--grey-900)" },
    ghost: { background: "transparent", color: "var(--brand)" },
    up: { background: "var(--up-500)", color: "#fff" },
    down: { background: "var(--down-500)", color: "#fff" },
  };
  return <button style={{ ...base, ...variants[variant] }} {...rest}>{children}</button>;
};

const Card = ({ children, padding = 20, style, ...rest }) => (
  <div style={{
    background: "#fff", border: "1px solid var(--grey-100)",
    borderRadius: 16, padding, ...style,
  }} {...rest}>{children}</div>
);

const Pill = ({ active, children, onClick }) => (
  <button onClick={onClick} style={{
    padding: "6px 12px", borderRadius: 999, border: "none", cursor: "pointer",
    background: active ? "var(--toss-blue-50)" : "var(--grey-100)",
    color: active ? "var(--brand)" : "var(--fg-secondary)",
    fontFamily: "inherit", fontSize: 12.5, fontWeight: 500,
  }}>{children}</button>
);

// ---------- Stock visuals ----------
const Logo = ({ name, bg = "#1428A0", color = "#fff", size = 32 }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%", background: bg, color,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: size * 0.42, flexShrink: 0,
  }}>{name[0]}</div>
);

const Delta = ({ value, pct }) => {
  const cls = value > 0 ? "up" : value < 0 ? "down" : "flat";
  const sign = value > 0 ? "▲" : value < 0 ? "▼" : "—";
  return <span className={cls} style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
    {sign} {Math.abs(value).toLocaleString()} ({pct > 0 ? "+" : ""}{pct.toFixed(2)}%)
  </span>;
};

const MiniChart = ({ data, color = "var(--up-500)", w = 80, h = 28 }) => {
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * h}`).join(" ");
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const StockRow = ({ stock, onClick }) => (
  <div onClick={onClick} style={{
    display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
    borderRadius: 12, cursor: "pointer",
  }}
    onMouseEnter={e => e.currentTarget.style.background = "var(--grey-50)"}
    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
  >
    <Logo name={stock.name} bg={stock.bg} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{stock.name}</div>
      <div style={{ fontSize: 11.5, color: "var(--fg-tertiary)" }}>{stock.ticker}</div>
    </div>
    <MiniChart data={stock.chart} color={stock.delta > 0 ? "var(--up-500)" : "var(--down-500)"} />
    <div style={{ textAlign: "right", minWidth: 100 }}>
      <div className="num" style={{ fontSize: 14, fontWeight: 600 }}>{stock.priceFmt}</div>
      <div style={{ fontSize: 11.5, fontWeight: 600 }} className={stock.delta > 0 ? "up" : "down"}>
        {stock.delta > 0 ? "+" : ""}{stock.deltaPct.toFixed(2)}%
      </div>
    </div>
  </div>
);

// ---------- Sample data ----------
const STOCKS = [
  { name: "삼성전자", ticker: "005930 · KOSPI", bg: "#1428A0", price: 84200, priceFmt: "84,200", delta: 1200, deltaPct: 1.45, chart: [70, 72, 71, 74, 76, 75, 78, 80, 82, 84] },
  { name: "SK하이닉스", ticker: "000660 · KOSPI", bg: "#FF5800", price: 198400, priceFmt: "198,400", delta: 4800, deltaPct: 2.48, chart: [180, 184, 182, 188, 192, 190, 194, 196, 197, 198] },
  { name: "Apple", ticker: "AAPL · NASDAQ", bg: "#000", price: 184.32, priceFmt: "$184.32", delta: -1.61, deltaPct: -0.87, chart: [190, 188, 187, 189, 188, 186, 187, 185, 184, 184] },
  { name: "Tesla", ticker: "TSLA · NASDAQ", bg: "#E31937", price: 251.04, priceFmt: "$251.04", delta: 6.21, deltaPct: 2.54, chart: [240, 242, 245, 244, 247, 246, 249, 250, 252, 251] },
  { name: "NVIDIA", ticker: "NVDA · NASDAQ", bg: "#76B900", price: 916.35, priceFmt: "$916.35", delta: 18.12, deltaPct: 2.02, chart: [880, 885, 890, 888, 895, 900, 905, 908, 912, 916] },
  { name: "카카오", ticker: "035720 · KOSPI", bg: "#FFE812", color: "#000", price: 41200, priceFmt: "41,200", delta: -350, deltaPct: -0.84, chart: [44, 43, 43, 42, 42, 42, 41, 41, 41, 41] },
  { name: "네이버", ticker: "035420 · KOSPI", bg: "#03C75A", price: 178500, priceFmt: "178,500", delta: 2500, deltaPct: 1.42, chart: [170, 172, 171, 174, 175, 176, 177, 178, 178, 179] },
];

Object.assign(window, { Button, Card, Pill, Logo, Delta, MiniChart, StockRow, STOCKS });
