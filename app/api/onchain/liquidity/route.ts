import { NextResponse } from "next/server";

const RPC = process.env.BNB_RPC_URL || "https://bsc-dataseed.bnbchain.org";
const FACTORY = "0xca143ce32fe78f1f7019d7d551a6402fc5350c73";
const WBNB = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c";
const USDT = "0x55d398326f99059ff775485246999027b3197955";
const EVM = /^0x[a-fA-F0-9]{40}$/;
const PAIR_ABI = {
  getPair: "0xe6a43905",
  token0: "0x0dfe1681",
  token1: "0xd21220a7",
  getReserves: "0x0902f1ac",
  totalSupply: "0x18160ddd",
};
async function rpc(method:string,params:unknown[]){const r=await fetch(RPC,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params}),cache:"no-store"});if(!r.ok)throw new Error(`RPC HTTP ${r.status}`);const j=await r.json();if(j.error)throw new Error(j.error.message||"RPC error");return j.result;}
async function call(to:string,data:string){return rpc("eth_call",[{to,data},"latest"]);}
function addrWord(a:string){return a.slice(2).toLowerCase().padStart(64,"0");}
function word(x:string,n:number){return "0x"+x.replace(/^0x/,"").slice(n*64,(n+1)*64);}
function uint(x:string){return BigInt(x||"0x0");}
async function pair(token:string,quote:string){
  const p=word(await call(FACTORY,PAIR_ABI.getPair+addrWord(token)+addrWord(quote)),0);
  const pairAddress=p.toLowerCase();
  if(pairAddress==="0x0000000000000000000000000000000000000000") return null;
  const [t0,t1,res]=await Promise.all([call(pairAddress,PAIR_ABI.token0),call(pairAddress,PAIR_ABI.token1),call(pairAddress,PAIR_ABI.getReserves)]);
  const token0="0x"+t0.slice(-40).toLowerCase();
  const token1="0x"+t1.slice(-40).toLowerCase();
  const r0=uint(word(res,0)),r1=uint(word(res,1));
  const quoteReserve=token0===quote.toLowerCase()?r0:token1===quote.toLowerCase()?r1:0n;
  const tokenReserve=token0===token.toLowerCase()?r0:token1===token.toLowerCase()?r1:0n;
  return {pair:pairAddress,token0,token1,reserve0:r0.toString(),reserve1:r1.toString(),quoteReserve:quoteReserve.toString(),tokenReserve:tokenReserve.toString()};
}
export async function GET(req:Request){
  try{
    const token=new URL(req.url).searchParams.get("address")||"";
    if(!EVM.test(token)) return NextResponse.json({valid:false,error:"Liquidity endpoint currently requires a BSC token address"},{status:400});
    const [wbnb,usdt]=await Promise.all([pair(token,WBNB),pair(token,USDT)]);
    const pools=[wbnb&&{...wbnb,quote:"WBNB"},usdt&&{...usdt,quote:"USDT"}].filter(Boolean);
    const quoteUsd=(x:any)=>x.quote==="USDT"?Number(x.quoteReserve)/1e18:Number(x.quoteReserve)/1e18;
    const liquidityUsd=pools.reduce((s:any,x:any)=>s+quoteUsd(x)*2,0);
    return NextResponse.json({valid:true,chain:"bsc",token,pools,estimatedLiquidityUsd:liquidityUsd,source:"PancakeSwap V2 factory/pairs via BSC RPC",timestamp:Date.now()},{headers:{"Cache-Control":"no-store"}});
  }catch(e){return NextResponse.json({valid:false,error:e instanceof Error?e.message:"Liquidity inspection failed"},{status:502});}
}