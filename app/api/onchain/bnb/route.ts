import { NextResponse } from "next/server";

const RPC = process.env.BNB_RPC_URL || "https://bsc-dataseed.bnbchain.org";
const ADDRESS = /^0x[a-fA-F0-9]{40}$/;

async function rpc(method: string, params: unknown[]) {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`BNB RPC HTTP ${res.status}`);
  const body = await res.json();
  if (body.error) throw new Error(body.error.message || "BNB RPC error");
  return body.result;
}

export async function GET(request: Request) {
  try {
    const address = new URL(request.url).searchParams.get("address") || "";
    const block = await rpc("eth_blockNumber", []);
    const gas = await rpc("eth_gasPrice", []);
    const balance = ADDRESS.test(address) ? await rpc("eth_getBalance", [address, "latest"]) : null;
    return NextResponse.json({
      chain: "BNB Smart Chain",
      chainId: 56,
      rpc: RPC.replace(/\?.*$/, ""),
      blockNumber: Number.parseInt(block, 16),
      gasPriceWei: gas,
      address: ADDRESS.test(address) ? address : null,
      balanceWei: balance,
      nativeBalanceBNB: balance ? Number(BigInt(balance)) / 1e18 : null,
      timestamp: Date.now(),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "BNB RPC unavailable" }, { status: 502 });
  }
}
