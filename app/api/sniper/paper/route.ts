import { NextResponse } from "next/server";

const RPC = process.env.BNB_RPC_URL || "https://bsc-dataseed.bnbchain.org";
const FACTORY = "0xca143ce32fe78f1f7019d7d551a6402fc5350c73";
const WBNB = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c";
const USDT = "0x55d398326f99059ff775485246999027b3197955";
const PAIR_CREATED = "0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9";
async function rpc(method:string,params:unknown[]){const r=await fetch(RPC,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params}),cache:"no-store"});if(!r.ok)throw new Error(`RPC HTTP ${r.status}`);const j=await r.json();if(j.error)throw new Error(j.error.message||"RPC error");return j.result;}
function addressTopic(x:string){return "0x"+"0".repeat(24)+x.slice(2).toLowerCase();}
function addressFromTopic(x:string){return "0x"+x.slice(-40).toLowerCase();}
export async function GET(){
  try{
    const latestHex=await rpc("eth_blockNumber",[]);
    const latest=Number(BigInt(latestHex));
    const from=Math.max(0,latest-120);
    const logs=await rpc("eth_getLogs",[{address:FACTORY,fromBlock:"0x"+from.toString(16),toBlock:"0x"+latest.toString(16),topics:[PAIR_CREATED]}]);
    const candidates=(logs||[]).map((log:any)=>{
      const token0=addressFromTopic(log.topics[1]), token1=addressFromTopic(log.topics[2]);
      const pair=addressFromTopic(log.data.slice(0,66));
      const base=token0===WBNB||token0===USDT?token0:token1===WBNB||token1===USDT?token1:null;
      const token=base===token0?token1:base===token1?token0:null;
      return {token,pair,token0,token1,blockNumber:Number(BigInt(log.blockNumber)),transactionHash:log.transactionHash};
    }).filter((x:any)=>x.token);
    const unique=Array.from(new Map(candidates.map((x:any)=>[x.token,x])).values()).slice(-20).reverse();
    const enriched=await Promise.all(unique.map(async (x:any)=>{
      try{
        const [code,dec,supply]=await Promise.all([
          rpc("eth_getCode",[x.token,"latest"]),
          rpc("eth_call",[{to:x.token,data:"0x313ce567"},"latest"]),
          rpc("eth_call",[{to:x.token,data:"0x18160ddd"},"latest"])
        ]);
        const decimals=Number(BigInt(dec));
        const totalSupply=BigInt(supply);
        return {...x,contract:code!=="0x",decimals,totalSupply:totalSupply.toString(),supplyUi:Number(totalSupply)/10**Math.min(decimals,18),status:code!=="0x"?"ANALYZED":"INVALID"};
      }catch{return {...x,status:"ANALYSIS_ERROR"};}
    }));
    return NextResponse.json({valid:true,chain:"bsc",latestBlock:latest,blocksScanned:latest-from+1,candidates:enriched,source:"PancakeSwap V2 PairCreated via BSC RPC",timestamp:Date.now()},{headers:{"Cache-Control":"no-store"}});
  }catch(e){return NextResponse.json({valid:false,error:e instanceof Error?e.message:"Paper scanner unavailable"},{status:502});}
}