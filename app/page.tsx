"use client";

import { useEffect, useMemo, useState } from "react";

type Risk = "LOW" | "HIGH" | "CRITICAL";
type Mode = "PAPER" | "ASSISTED" | "AUTO";
type ChainState = { balance?: number|null; block?: number; slot?: number; error?: string; timestamp?: number };

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
  const [bnbAddress, setBnbAddress] = useState("");
  const [solAddress, setSolAddress] = useState("");
  const [bnb, setBnb] = useState<ChainState>({});
  const [sol, setSol] = useState<ChainState>({});
  const [scanData, setScanData] = useState<any>(null);
  const [scanLoading, setScanLoading] = useState(false);

  const status = useMemo(
    () => mode === "AUTO" ? "AUTO • POLICY ACTIVE" : mode === "ASSISTED" ? "ASSISTED • CONFIRM" : "PAPER • NO FUNDS",
    [mode]
  );

  async function refresh() {
    const [b, s] = await Promise.all([
      fetch(`/api/onchain/bnb?address=${encodeURIComponent(bnbAddress)}`, { cache: "no-store" }).then(r=>r.json()).catch(()=>({error:"BNB RPC unavailable"})),
      fetch(`/api/onchain/solana?address=${encodeURIComponent(solAddress)}`, { cache: "no-store" }).then(r=>r.json()).catch(()=>({error:"Solana RPC unavailable"})),
    ]);
    setBnb({ balance: b.nativeBalanceBNB, block: b.blockNumber, error: b.error, timestamp: b.timestamp });
    setSol({ balance: s.nativeBalanceSOL, slot: s.slot, error: s.error, timestamp: s.timestamp });
  }

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => window.clearInterval(timer);
  }, [bnbAddress, solAddress]);

  async function scan() {
    if (!token.trim()) { setRisk(null); setScanData(null); return; }
    setScanLoading(true);
    try {
      const r = await fetch(`/api/onchain/token?address=${encodeURIComponent(token.trim())}`, { cache:"no-store" });
      const data = await r.json();
      setScanData(data);
      if (!data.valid) setRisk("CRITICAL");
      else if (data.chain === "solana" && (data.freezeAuthority || data.mintAuthority)) setRisk("HIGH");
      else if (data.chain === "bsc" && data.owner) setRisk("HIGH");
      else setRisk("LOW");
    } catch { setRisk("CRITICAL"); setScanData({valid:false,error:"Scanner unavailable"}); }
    finally { setScanLoading(false); }
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
        <p className="sub">Live onchain portfolio reads with configurable risk policy. Tarsius reads blockchain state directly; signing stays outside the AI model.</p>
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
        <div className="card-head"><h2>Live Portfolio</h2><span>ONCHAIN · 5s</span></div>
        <div className="wallet-inputs">
          <label>BNB address<input value={bnbAddress} onChange={e=>setBnbAddress(e.target.value)} placeholder="0x…" /></label>
          <label>Solana address<input value={solAddress} onChange={e=>setSolAddress(e.target.value)} placeholder="Base58…" /></label>
        </div>
        <div className="chain-grid">
          <div className="chain-live"><b>BNB Smart Chain</b><strong>{bnb.balance == null ? "—" : bnb.balance.toFixed(6)} BNB</strong><small>{bnb.block ? `Block ${bnb.block.toLocaleString()}` : bnb.error || "Reading RPC…"}</small></div>
          <div className="chain-live"><b>Solana</b><strong>{sol.balance == null ? "—" : sol.balance.toFixed(6)} SOL</strong><small>{sol.slot ? `Slot ${sol.slot.toLocaleString()}` : sol.error || "Reading RPC…"}</small></div>
        </div>
        <p className="muted">Read-only for now. Values come from mainnet RPC; no transaction is signed or broadcast by this dashboard.</p>
      </div>

      <div className="card">
        <div className="card-head"><h2>Meme Scanner</h2><span>RISK INTELLIGENCE</span></div>
        <div className="scan">
          <input value={token} onChange={e=>setToken(e.target.value)} placeholder="Paste token address…" />
          <button onClick={scan}>{scanLoading ? "Reading…" : "Analyze"}</button>
        </div>
        {risk && <div className="result"><div><b>RISK: {risk}</b><p>{scanData?.error || (scanData?.chain === "solana" ? `SPL mint • ${scanData.supply ?? "unknown"} supply • top-10 concentration ${scanData.top10ConcentrationPct == null ? "—" : scanData.top10ConcentrationPct.toFixed(2)+"%"}` : `BSC token • ${scanData?.totalSupplyUi == null ? "supply read" : scanData.totalSupplyUi} total supply • owner ${scanData?.owner ? "present" : "not detected"}`)}</p></div><span className="risk">{risk}</span></div>}
        <div className="checks">{checks.map(([a,b])=><div key={a}><span>{a}</span><small>{b}</small></div>)}{scanData?.chain === "solana" && <><div><span>Mint authority</span><small>{scanData.mintAuthority || "Disabled"}</small></div><div><span>Freeze authority</span><small>{scanData.freezeAuthority || "Disabled"}</small></div></>}{scanData?.chain === "bsc" && <div><span>Contract bytecode</span><small>{scanData.bytecode ? "Present" : "Missing"}</small></div>}</div>
      </div>

      <div className="card">
        <div className="card-head"><h2>Sniper</h2><span>{mode}</span></div>
        <div className="seg">{(["PAPER","ASSISTED","AUTO"] as Mode[]).map(m=><button key={m} className={mode===m?"active":""} onClick={()=>setMode(m)}>{m}</button>)}</div>
        <p className="muted">{mode==="PAPER" ? "Detect → analyze → simulate → alert. No funds move." : mode==="ASSISTED" ? "Detect → risk report → quote → simulate → you confirm." : "Detect → policy check → quote → simulate → execute when policy permits."}</p>
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
        <div className="conn"><b>BNB Chain</b><span>RPC read-only</span></div>
        <div className="conn"><b>Solana</b><span>RPC read-only</span></div>
        <div className="conn"><b>Robinhood</b><span>API connector</span></div>
        <p className="muted">Keys stay in the wallet, broker connector or secure signer — never in the AI prompt.</p>
      </div>
    </section>

    <footer>v0.3 · Live onchain reads · 5-second refresh · No transaction broadcast</footer>
  </main>;
}