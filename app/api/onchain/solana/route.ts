import { NextResponse } from "next/server";

const RPC = process.env.SOLANA_RPC_URL || "https://api.mainnet.solana.com";
const ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

async function rpc(method: string, params: unknown[]) {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Solana RPC HTTP ${res.status}`);
  const body = await res.json();
  if (body.error) throw new Error(body.error.message || "Solana RPC error");
  return body.result;
}

export async function GET(request: Request) {
  try {
    const address = new URL(request.url).searchParams.get("address") || "";
    const slot = await rpc("getSlot", [{ commitment: "confirmed" }]);
    const balance = ADDRESS.test(address)
      ? await rpc("getBalance", [address, { commitment: "confirmed" }])
      : null;
    return NextResponse.json({
      chain: "Solana",
      cluster: "mainnet-beta",
      rpc: RPC.replace(/\?.*$/, ""),
      slot,
      address: ADDRESS.test(address) ? address : null,
      balanceLamports: balance?.value ?? null,
      nativeBalanceSOL: balance ? Number(balance.value) / 1e9 : null,
      timestamp: Date.now(),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Solana RPC unavailable" }, { status: 502 });
  }
}
