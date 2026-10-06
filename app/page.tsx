"use client";

import { useMemo, useState } from "react";

type Risk = "LOW" | "HIGH" | "CRITICAL";
type Mode = "PAPER" | "ASSISTED" | "AUTO";

const checks = [
  ["Liquidity", "Pool depth and exit capacity"],
  ["Holder concentration", "Top-holder exposure"],
  ["Mint authority", "Can supply still change?"],
  ["Freeze authority", "Can transfers be restricted?"],
  ["Honeypot simulation", "Buy and sell paths"],
  ["Deployer history", "Wallet and contract history"],
] as const;

export default function Home() {
  const [mode, setMode] = useState<Mode>("PAPER");
  const [approval, setApproval] = useState(false);
  const [token, setToken] = useState("");
  const [risk, setRisk] = useState<Risk | null>(null);
  const [allowCritical, setAllowCritical] = useState(false);
  const [maxTrade, setMaxTrade] = useState(100);
  const [maxDaily, setMaxDaily] = useState(500);
  const [slippage, setSlippage] = useState(5);

  const status = useMemo(
    () => risk === "CRITICAL" && !allowCritical
      ? "RISK GATE"
      : mode === "AUTO" ? "AUTO • POLICY ACTIVE"
      : mode === "ASSISTED" ? "ASSISTED • CONFIRM"
      : "PAPER • NO FUNDS",
    [mode, risk, allowCritical]
  );

  function scan() {
    setRisk(token.trim() ? "HIGH" : null);
  }

  return <main>
    <header>
      <div><strong>TARSIUS</strong><span>Personal Crypto Agent</span></div>
      <div className="pill">{status}</div>
    </header>

    <section className="hero">
      <div>
        <p className="eyebrow">BNB CHAIN · SOLANA · ROBINHOOD</p>
        <h1>One agent.<br/><em>Crypto, your way.</em></h1>
        <p className="sub">Portfolio intelligence, token discovery and transaction preparation in one agent. Safety explains the risk; you decide how much risk to take.</p>
      </div>
      <div className="panel">
        <div className="panel-title">Your policy</div>
        <div className="row"><span>Max / trade</span><b>$ {maxTrade}</b></div>
        <div className="row"><span>Max / day</span><b>$ {maxDaily}</b></div>
        <div className="row"><span>Max slippage</span><b>{slippage}%</b></div>
        <div className="row"><span>Critical risk</span><b>{allowCritical ? "Allowed" : "Confirm"}</b></div>
      </div>
    </section>

    <section className="grid">
      <div className="card wide">
        <div className="card-head"><h2>Meme Scanner</h2><span>RISK INTELLIGENCE</span></div>
        <div className="scan">
          <input value={token} onChange={e=>setToken(e.target.value)} placeholder="Paste token address…" />
          <button onClick={scan}>Analyze</button>
        </div>
        {risk && <div className="result"><div><b>RISK: {risk}</b><p>Risk indicators are informational. Tarsius does not promise protection from rugs or losses.</p></div><span className="risk">{risk}</span></div>}
        <div className="checks">{checks.map(([a,b])=><div key={a}><span>{a}</span><small>{b}</small></div>)}</div>
      </div>

      <div className="card">
        <div className="card-head"><h2>Sniper</h2><span>{mode}</span></div>
        <div className="seg">{(["PAPER","ASSISTED","AUTO"] as Mode[]).map(m=><button key={m} className={mode===m?"active":""} onClick={()=>setMode(m)}>{m}</button>)}</div>
        <p className="muted">
          {mode==="PAPER" ? "Detect → analyze → simulate → alert. No funds move." :
           mode==="ASSISTED" ? "Detect → risk report → quote → simulate → you confirm." :
           "Detect → policy check → quote → simulate → execute when policy permits."}
        </p>
        <button className="primary" onClick={()=>setApproval(true)}>Request action</button>
        {approval && <div className="approval"><b>Action review</b><p>{mode==="AUTO" ? "Auto mode uses your configured limits. The model still never receives private keys." : "Review the transaction before signing. The model proposes; your signer signs."}</p><button onClick={()=>setApproval(false)}>Close</button></div>}
      </div>

      <div className="card">
        <div className="card-head"><h2>Risk Policy</h2><span>FLEXIBLE</span></div>
        <label className="setting">Max / trade <input type="number" value={maxTrade} min="1" onChange={e=>setMaxTrade(Number(e.target.value)||1)} /></label>
        <label className="setting">Max / day <input type="number" value={maxDaily} min="1" onChange={e=>setMaxDaily(Number(e.target.value)||1)} /></label>
        <label className="setting">Max slippage % <input type="number" value={slippage} min="0.1" step="0.1" onChange={e=>setSlippage(Number(e.target.value)||0.1)} /></label>
        <label className="toggle"><input type="checkbox" checked={allowCritical} onChange={e=>setAllowCritical(e.target.checked)} /> Allow critical-risk actions</label>
      </div>

      <div className="card">
        <div className="card-head"><h2>Connections</h2><span>NON-CUSTODIAL</span></div>
        <div className="conn"><b>BNB Chain</b><span>Not connected</span></div>
        <div className="conn"><b>Solana</b><span>Not connected</span></div>
        <div className="conn"><b>Robinhood</b><span>API connector</span></div>
        <p className="muted">Keys stay in the wallet, broker connector or secure signer — never in the AI prompt.</p>
      </div>
    </section>

    <footer>v0.2 · Flexible safety · Paper-first · Risk indicators are not guarantees.</footer>
  </main>;
}