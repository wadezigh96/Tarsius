"use client";

import { useMemo, useState } from "react";

type Risk = "LOW" | "HIGH" | "BLOCKED";

const checks = [
  ["Liquidity", "Healthy pool depth"],
  ["Holder concentration", "Top holders below policy"],
  ["Mint authority", "Must be disabled"],
  ["Freeze authority", "Must be disabled"],
  ["Honeypot simulation", "Buy and sell paths"],
  ["Deployer history", "Wallet reputation"],
] as const;

export default function Home() {
  const [mode, setMode] = useState<"PAPER"|"LIVE">("PAPER");
  const [approval, setApproval] = useState(false);
  const [token, setToken] = useState("");
  const [risk, setRisk] = useState<Risk | null>(null);

  const status = useMemo(() => risk === "BLOCKED" ? "BLOCKED" : mode === "LIVE" ? "LIVE • APPROVAL REQUIRED" : "PAPER • NO FUNDS", [mode, risk]);

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
        <h1>One agent.<br/><em>Safer crypto actions.</em></h1>
        <p className="sub">Track your portfolio, inspect meme tokens and prepare transactions without handing private keys to an AI model.</p>
      </div>
      <div className="panel">
        <div className="panel-title">Agent policy</div>
        <div className="row"><span>Max / trade</span><b>$10</b></div>
        <div className="row"><span>Max / day</span><b>$50</b></div>
        <div className="row"><span>Max slippage</span><b>2%</b></div>
        <div className="row"><span>Approval</span><b>Required</b></div>
      </div>
    </section>

    <section className="grid">
      <div className="card wide">
        <div className="card-head"><h2>Meme Scanner</h2><span>ANTI-RUG GATE</span></div>
        <div className="scan">
          <input value={token} onChange={e=>setToken(e.target.value)} placeholder="Paste token address…" />
          <button onClick={scan}>Analyze</button>
        </div>
        {risk && <div className="result"><div><b>RISK: {risk}</b><p>Address received. Live chain data is not connected yet; this MVP refuses to approve an unknown token.</p></div><span className="risk">{risk}</span></div>}
        <div className="checks">{checks.map(([a,b])=><div key={a}><span>{a}</span><small>{b}</small></div>)}</div>
      </div>

      <div className="card">
        <div className="card-head"><h2>Sniper</h2><span>{mode}</span></div>
        <div className="seg"><button className={mode==="PAPER"?"active":""} onClick={()=>setMode("PAPER")}>Paper</button><button className={mode==="LIVE"?"active":""} onClick={()=>setMode("LIVE")}>Live</button></div>
        <p className="muted">{mode==="PAPER" ? "Detect → analyze → simulate → alert. No funds move." : "Detect → risk gate → quote → simulate → approval → execute."}</p>
        <button className="primary" onClick={()=>setApproval(true)}>Request action</button>
        {approval && <div className="approval"><b>Human approval required</b><p>Tarsius will never sign a transaction using the model. Connect a wallet/signer before execution.</p><button onClick={()=>setApproval(false)}>Close</button></div>}
      </div>

      <div className="card">
        <div className="card-head"><h2>Connections</h2><span>SAFE BY DEFAULT</span></div>
        <div className="conn"><b>BNB Chain</b><span>Not connected</span></div>
        <div className="conn"><b>Solana</b><span>Not connected</span></div>
        <div className="conn"><b>Robinhood</b><span>API connector</span></div>
        <p className="muted">Credentials belong in the connector/signer layer, never in prompts.</p>
      </div>
    </section>

    <footer>v0.1 · Paper-first · No profit guarantees · Risk checks are indicators, not a rug-pull guarantee.</footer>
  </main>;
}