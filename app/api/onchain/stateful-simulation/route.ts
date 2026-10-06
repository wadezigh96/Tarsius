import { NextResponse } from "next/server";

const RPC = process.env.BNB_RPC_URL || "https://bsc-dataseed.bnbchain.org";
const ROUTER = "0x10ed43c718714eb63d5aa57b78b54704e256024e";
const WBNB = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c";
const EVM=/^0x[a-fA-F0-9]{40}$/;

async function rpc(method:string,params:unknown[]){
  const r=await fetch(RPC,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params}),cache:"no-store"});
  if(!r.ok) throw new Error(`RPC HTTP ${r.status}`);
  const j=await r.json();
  if(j.error) throw new Error(j.error.message||"RPC error");
  return j.result;
}
const word=(v:bigint)=>v.toString(16).padStart(64,"0");
const addr=(a:string)=>a.slice(2).toLowerCase().padStart(64,"0");
const call=(selector:string,...words:string[])=>"0x"+selector+words.join("");
function balanceOf(a:string){return call("70a08231",addr(a));}
function allowance(owner:string,spender:string){return call("dd62ed3e",addr(owner),addr(spender));}
function sellCalldata(amount:bigint,token:string,to:string,deadline:bigint){
  return call("38ed1739",word(amount),word(0n),word(160n),addr(to),word(deadline),word(2n),addr(token),addr(WBNB));
}
function buyCalldata(token:string,to:string,deadline:bigint){
  return call("7ff36ab5",word(0n),word(0n),word(96n),addr(to),word(deadline),word(2n),addr(WBNB),addr(token));
}
export async function GET(req:Request){
  const q=new URL(req.url).searchParams;
  const token=q.get("address")||"";
  const wallet=q.get("wallet")||"";
  if(!EVM.test(token)) return NextResponse.json({valid:false,error:"BSC token address required"},{status:400});
  if(wallet && !EVM.test(wallet)) return NextResponse.json({valid:false,error:"wallet must be a valid EVM address"},{status:400});
  try{
    const block=await rpc("eth_getBlockByNumber",["latest",false]) as {timestamp:string};
    const deadline=BigInt(block.timestamp)+300n;
    const base={valid:true,chain:"bsc",mode:wallet?"STATEFUL_WALLET_CONTEXT":"QUOTE_ONLY",broadcast:false,warning:"Read-only simulation only. No approval, signing, or broadcast is performed."};
    if(!wallet) return NextResponse.json({...base,status:"WALLET_REQUIRED_FOR_SELL_SIMULATION",buy:{status:"NOT_TESTED"},sell:{status:"NOT_TESTED"}},{headers:{"Cache-Control":"no-store"}});
    const [balanceHex,allowanceHex]=await Promise.all([
      rpc("eth_call",[{to:token,data:balanceOf(wallet)},"latest"]),
      rpc("eth_call",[{to:token,data:allowance(wallet,ROUTER)},"latest"])
    ]);
    const balance=BigInt(balanceHex||"0x0"), approved=BigInt(allowanceHex||"0x0");
    const amount=balance/100n;
    const sell= amount>0n && approved>=amount;
    if(!sell) return NextResponse.json({...base,status:amount===0n?"MISSING_TOKEN_BALANCE":"MISSING_ALLOWANCE",wallet,balance:balance.toString(),allowance:approved.toString(),sell:{status:amount===0n?"MISSING_TOKEN_BALANCE":"MISSING_ALLOWANCE",testAmount:amount.toString()}},{headers:{"Cache-Control":"no-store"}});
    try{
      const data=sellCalldata(amount,token,wallet,deadline);
      const gas=await rpc("eth_estimateGas",[{from:wallet,to:ROUTER,data},"latest"]);
      return NextResponse.json({...base,status:"SELL_CALL_OK",wallet,balance:balance.toString(),allowance:approved.toString(),sell:{status:"PASS",testAmount:amount.toString(),gas}},{headers:{"Cache-Control":"no-store"}});
    }catch(e){
      return NextResponse.json({...base,status:"SELL_CALL_REVERT",wallet,balance:balance.toString(),allowance:approved.toString(),sell:{status:"REVERT",testAmount:amount.toString(),error:e instanceof Error?e.message:"simulation reverted"}},{headers:{"Cache-Control":"no-store"}});
    }
  }catch(e){return NextResponse.json({valid:false,error:e instanceof Error?e.message:"Simulation unavailable"},{status:502});}
}