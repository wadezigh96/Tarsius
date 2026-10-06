import { NextResponse } from "next/server";

const BSC_RPC = process.env.BNB_RPC_URL || "https://bsc-dataseed.bnbchain.org";
const SOL_RPC = process.env.SOLANA_RPC_URL || "https://api.mainnet.solana.com";
const EVM = /^0x[a-fA-F0-9]{40}$/;
const SOL = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

async function rpc(url: string, method: string, params: unknown[]) {
  const r = await fetch(url, { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({jsonrpc:"2.0",id:1,method,params}), cache:"no-store" });
  if (!r.ok) throw new Error(`RPC HTTP ${r.status}`);
  const j = await r.json();
  if (j.error) throw new Error(j.error.message || "RPC error");
  return j.result;
}

function hexCall(to:string, data:string){ return rpc(BSC_RPC,"eth_call",[{to,data},"latest"]); }
function word(x:string){ return x.replace(/^0x/,"").slice(-64); }
function uint(x:string){ return BigInt(x || "0x0"); }
function text32(x:string){ try { return Buffer.from(x.slice(2).replace(/00+$/,""),"hex").toString("utf8").replace(/\0/g,"").trim(); } catch { return ""; } }

async function bsc(address:string) {
  const [code,dec,supply,symbol,owner] = await Promise.all([
    rpc(BSC_RPC,"eth_getCode",[address,"latest"]),
    hexCall(address,"0x313ce567"),
    hexCall(address,"0x18160ddd"),
    hexCall(address,"0x95d89b41"),
    hexCall(address,"0x8da5cb5b").catch(()=> "0x"),
  ]);
  const decimals=Number(uint(dec)); const total=uint(supply);
  return { chain:"bsc", valid:true, contract:true, bytecode:code !== "0x", decimals, symbol:text32(symbol), totalSupply:total.toString(), totalSupplyUi:decimals<=36?Number(total)/10**decimals:null, owner: owner && owner !== "0x" ? "0x"+word(owner) : null };
}

async function solana(address:string) {
  const info=await rpc(SOL_RPC,"getAccountInfo",[address,{encoding:"jsonParsed",commitment:"confirmed"}]);
  if (!info?.value) throw new Error("Mint account not found");
  const parsed=info.value.data?.parsed;
  const mint=parsed?.info;
  if (parsed?.type !== "mint" || !mint) throw new Error("Address is not an SPL Token mint");
  const [supply,largest] = await Promise.all([
    rpc(SOL_RPC,"getTokenSupply",[address,{commitment:"confirmed"}]),
    rpc(SOL_RPC,"getTokenLargestAccounts",[address,{commitment:"confirmed"}]),
  ]);
  const amounts=(largest.value||[]).map((x:any)=>BigInt(x.amount));
  const total=BigInt(supply.value.amount);
  const top10=amounts.slice(0,10).reduce((a:number,x:bigint)=>a+Number(x),0);
  return { chain:"solana", valid:true, mint:true, decimals:mint.decimals, supply:supply.value.uiAmountString, mintAuthority:mint.mintAuthority, freezeAuthority:mint.freezeAuthority, topLargestAccounts:largest.value?.length||0, top10ConcentrationPct:total>0n ? (top10/Number(total))*100 : null, slot:largest.context?.slot };
}

export async function GET(request:Request){
  try {
    const address=new URL(request.url).searchParams.get("address")||"";
    if(EVM.test(address)) return NextResponse.json(await bsc(address),{headers:{"Cache-Control":"no-store"}});
    if(SOL.test(address)) return NextResponse.json(await solana(address),{headers:{"Cache-Control":"no-store"}});
    return NextResponse.json({valid:false,error:"Enter a valid BSC 0x address or Solana base58 mint address"},{status:400});
  } catch(e) {
    return NextResponse.json({valid:false,error:e instanceof Error?e.message:"Token inspection failed"},{status:502});
  }
}
