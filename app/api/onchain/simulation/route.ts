import { NextResponse } from "next/server";

const RPC = process.env.BNB_RPC_URL || "https://bsc-dataseed.bnbchain.org";
const ROUTER = "0x10ed43c718714eb63d5aa57b78b54704e256024e";
const WBNB = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c";
const USDT = "0x55d398326f99059ff775485246999027b3197955";
const EVM=/^0x[a-fA-F0-9]{40}$/;
async function rpc(method:string,params:unknown[]){const r=await fetch(RPC,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params}),cache:"no-store"});if(!r.ok)throw new Error(`RPC HTTP ${r.status}`);const j=await r.json();if(j.error)throw new Error(j.error.message||"RPC error");return j.result;}
function word(x:string,n:number){return "0x"+x.replace(/^0x/,"").slice(n*64,(n+1)*64);}
function addr(a:string){return a.slice(2).toLowerCase().padStart(64,"0");}
function u(x:string){return BigInt(x||"0x0");}
function encodePath(path:string[]){return path.map(addr).join("");}
async function quote(token:string,base:string,amount:string){
  const data="0xd06ca61f"+addr(amount.startsWith("0x")?amount:"0x"+BigInt(amount).toString(16));
  return data;
}
export async function GET(req:Request){
  const token=new URL(req.url).searchParams.get("address")||"";
  if(!EVM.test(token)) return NextResponse.json({valid:false,error:"BSC token address required"},{status:400});
  try{
    const amountIn=10n**16n;
    const path=token.toLowerCase()===WBNB?[]:[WBNB,token];
    const reverse=token.toLowerCase()===WBNB?[]:[token,WBNB];
    const checks:any[]=[];
    for(const p of [path,reverse]){
      if(!p.length) continue;
      const encodedPath=p.map(addr).join("");
      const data="0xd06ca61f"+amountIn.toString(16).padStart(64,"0")+encodedPath.length.toString(16).padStart(64,"0")+encodedPath;
      try{
        const result=await rpc("eth_call",[{to:ROUTER,data},"latest"]);
        checks.push({direction:p[0]===WBNB?"BUY_QUOTE":"SELL_QUOTE",ok:true,raw:result});
      }catch(e){checks.push({direction:p[0]===WBNB?"BUY_QUOTE":"SELL_QUOTE",ok:false,error:e instanceof Error?e.message:"quote failed"});}
    }
    const buy=checks.find(x=>x.direction==="BUY_QUOTE"), sell=checks.find(x=>x.direction==="SELL_QUOTE");
    return NextResponse.json({valid:true,chain:"bsc",mode:"QUOTE_SIMULATION",buyQuoteAvailable:!!buy?.ok,sellQuoteAvailable:!!sell?.ok,checks,note:"Quote availability is not proof of a successful sell. A true honeypot test requires a stateful transaction simulation with balance/allowance context.",timestamp:Date.now()});
  }catch(e){return NextResponse.json({valid:false,error:e instanceof Error?e.message:"Simulation unavailable"},{status:502});}
}