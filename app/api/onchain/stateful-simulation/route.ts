import { NextResponse } from "next/server";

const RPC = process.env.BNB_RPC_URL || "https://bsc-dataseed.bnbchain.org";
const ROUTER = "0x10ed43c718714eb63d5aa57b78b54704e256024e";
const WBNB = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c";
const EVM=/^0x[a-fA-F0-9]{40}$/;

async function rpc(method:string,params:unknown[]){const r=await fetch(RPC,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params}),cache:"no-store"});if(!r.ok)throw new Error(`RPC HTTP ${r.status}`);const j=await r.json();if(j.error)throw new Error(j.error.message||"RPC error");return j.result;}
function word(x:string,n:number){return x.replace(/^0x/,"").slice(n*64,(n+1)*64);}
function addr(a:string){return a.slice(2).toLowerCase().padStart(64,"0");}
function encAddressArray(xs:string[]){return xs.map(addr).join("");}
function encodeSwap(path:string[]){const pathOffset=(2+2)*32;const data="38ed1739"+
  "0".repeat(64)+"0".repeat(64)+"0".repeat(64)+"0".repeat(64)+
  "0".repeat(64)+
  (pathOffset/1).toString(16).padStart(64,"0")+
  "0".repeat(64)+
  path.length.toString(16).padStart(64,"0")+encAddressArray(path)+
  "0".repeat(64);
 return "0x"+data;}
export async function GET(req:Request){
 const token=new URL(req.url).searchParams.get("address")||"";
 if(!EVM.test(token)) return NextResponse.json({valid:false,error:"BSC token address required"},{status:400});
 try{
   const buyPath=[WBNB,token], sellPath=[token,WBNB];
   const buyData=encodeSwap(buyPath), sellData=encodeSwap(sellPath);
   const probeFrom="0x0000000000000000000000000000000000000001";
   const amount=1000000000000000n;
   const tx=(data:string)=>({from:probeFrom,to:ROUTER,data,value:"0x"+amount.toString(16)});
   const results=await Promise.all([buyData,sellData].map(async data=>{
     try{const gas=await rpc("eth_estimateGas",[tx(data),"latest"]);return {ok:true,gas};}
     catch(e){return {ok:false,error:e instanceof Error?e.message:"simulation reverted"};}
   }));
   return NextResponse.json({valid:true,chain:"bsc",mode:"STATEFUL_ESTIMATE_GAS_PROBE",buy:results[0],sell:results[1],probe:"synthetic address; no signing/broadcast",warning:"This is a heuristic. It does not provide token balance/allowance, so a successful estimate is not proof of sellability.",timestamp:Date.now()},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return NextResponse.json({valid:false,error:e instanceof Error?e.message:"Simulation unavailable"},{status:502});}
}