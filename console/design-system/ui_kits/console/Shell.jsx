/* global React, Button */
const { useState: useStateShell } = React;

const NAV = [
  { id: "home", label: "홈", icon: "home" },
  { id: "news", label: "뉴스", icon: "newspaper" },
  { id: "discover", label: "발견", icon: "compass" },
  { id: "account", label: "내 계좌", icon: "user" },
];

function Icon({ name, size = 20, stroke = 1.75 }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current && window.lucide) {
      ref.current.innerHTML = "";
      const i = document.createElement("i");
      i.setAttribute("data-lucide", name);
      ref.current.appendChild(i);
      window.lucide.createIcons({ attrs: { "stroke-width": stroke, width: size, height: size } });
    }
  }, [name, size, stroke]);
  return <span ref={ref} style={{ display: "inline-flex" }} />;
}

function TopBar({ active, onNav }) {
  return (
    <header style={{
      height: 64, borderBottom: "1px solid var(--grey-100)", background: "#fff",
      display: "flex", alignItems: "center", padding: "0 24px", gap: 32,
      position: "sticky", top: 0, zIndex: 10,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: "var(--brand)", letterSpacing: "-0.04em" }}>toss</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-primary)" }}>증권</span>
      </div>
      <nav style={{ display: "flex", gap: 4, flex: 1 }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => onNav(n.id)} style={{
            padding: "8px 14px", borderRadius: 8, border: "none",
            background: active === n.id ? "var(--toss-blue-50)" : "transparent",
            color: active === n.id ? "var(--brand)" : "var(--fg-secondary)",
            fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>{n.label}</button>
        ))}
      </nav>
      <div style={{ position: "relative", width: 360 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--fg-tertiary)", display: "inline-flex" }}>
          <Icon name="search" size={16} />
        </span>
        <input placeholder="종목명 또는 티커 검색" style={{
          width: "100%", padding: "9px 12px 9px 36px", borderRadius: 10,
          border: "1px solid transparent", background: "var(--grey-50)",
          fontFamily: "inherit", fontSize: 13.5, outline: "none", boxSizing: "border-box",
        }} />
      </div>
      <button style={{ background: "transparent", border: "none", padding: 8, cursor: "pointer", color: "var(--fg-secondary)" }}><Icon name="bell" /></button>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--toss-blue-500)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>K</div>
    </header>
  );
}

function RightRail({ onPickStock }) {
  return (
    <aside style={{ width: "var(--right-rail-w)", padding: "20px 20px 20px 0", flexShrink: 0 }}>
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid var(--grey-100)", padding: 20, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-secondary)", marginBottom: 4 }}>내 자산</div>
        <div className="num" style={{ fontSize: 28, fontWeight: 700 }}>12,438,200원</div>
        <div className="up" style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>▲ 184,300원 (+1.50%)</div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <Button variant="primary" size="sm">입금</Button>
          <Button variant="secondary" size="sm">출금</Button>
        </div>
      </div>
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid var(--grey-100)", padding: "18px 8px" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-secondary)", padding: "0 12px 8px" }}>내가 보던 종목</div>
        {STOCKS.slice(0, 5).map(s => (
          <StockRow key={s.ticker} stock={s} onClick={() => onPickStock(s)} />
        ))}
      </div>
    </aside>
  );
}

function Shell({ active, onNav, onPickStock, children }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)" }}>
      <TopBar active={active} onNav={onNav} />
      <div style={{ display: "flex", maxWidth: 1440, margin: "0 auto", alignItems: "flex-start" }}>
        <main style={{ flex: 1, padding: "20px 28px", minWidth: 0 }}>{children}</main>
        <RightRail onPickStock={onPickStock} />
      </div>
    </div>
  );
}

Object.assign(window, { Shell, Icon });
