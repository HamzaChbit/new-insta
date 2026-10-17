import {lookup} from 'node:dns/promises';
import ipaddr from 'ipaddr.js';
import {createHmac,timingSafeEqual,randomBytes} from 'node:crypto';
import {allowedMedia,MediaError} from './media';
// Share the development key across route bundles and hot reloads in this process.
const runtimeState=globalThis as typeof globalThis&{__instavaultDevelopmentSecret?:string};
const ephemeral=runtimeState.__instavaultDevelopmentSecret??=randomBytes(32).toString('hex');
function secret(){if(process.env.NODE_ENV==='production'&&(!process.env.DOWNLOAD_SECRET||process.env.DOWNLOAD_SECRET.length<32))throw new MediaError('CONFIGURATION',503);return process.env.DOWNLOAD_SECRET||ephemeral}
export async function safeFetch(url:string,mode:'page'|'media'){
 const u=new URL(url);if(mode==='page'?u.hostname!=='www.instagram.com':!allowedMedia(url))throw new MediaError('UNAVAILABLE');
 const addresses=await lookup(u.hostname,{all:true});if(!addresses.length||addresses.some(a=>ipaddr.process(a.address).range()!=='unicast'))throw new MediaError('UNAVAILABLE');
 const response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(12000),cache:'no-store',headers:{'User-Agent':'InstaVault/1.0 (public metadata reader)','Accept':mode==='page'?'text/html':'image/*,video/*'}});
 if(!response.ok)throw new MediaError(response.status===429?'UPSTREAM_LIMIT':'UNAVAILABLE',422);
 return response;
}
export async function readLimited(response:Response,limit:number){if(Number(response.headers.get('content-length'))>limit)throw new MediaError('TOO_LARGE',413);const reader=response.body?.getReader();if(!reader)throw new MediaError('UNAVAILABLE');const chunks:Uint8Array[]=[];let size=0;try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit)throw new MediaError('TOO_LARGE',413);chunks.push(value)}}finally{await reader.cancel()}return Buffer.concat(chunks)}
export function signDownload(url:string,type:string){const payload=Buffer.from(JSON.stringify({url,type,exp:Date.now()+600000})).toString('base64url');return payload+'.'+createHmac('sha256',secret()).update(payload).digest('base64url')}
export function verifyDownload(token:string){if(token.length>12000)throw new MediaError('EXPIRED',403);const [p,s,...rest]=token.split('.');if(!p||!s||rest.length)throw new MediaError('EXPIRED',403);const expected=createHmac('sha256',secret()).update(p).digest();const actual=Buffer.from(s,'base64url');if(actual.length!==expected.length||!timingSafeEqual(actual,expected))throw new MediaError('EXPIRED',403);let data;try{data=JSON.parse(Buffer.from(p,'base64url').toString())}catch{throw new MediaError('EXPIRED',403)}if(!data.exp||data.exp<Date.now()||!allowedMedia(data.url)||!['video','image'].includes(data.type))throw new MediaError('EXPIRED',403);return data as {url:string;type:string;exp:number}}
// Conservative per-instance limiter. Use an edge/WAF rule for deployment-wide limits.
const buckets=new Map<string,{count:number;reset:number}>();
export function limit(request:Request){const now=Date.now();for(const [k,v]of buckets)if(v.reset<now)buckets.delete(k);const ip=process.env.VERCEL?request.headers.get('x-vercel-forwarded-for')||'shared':'local';const key=createHmac('sha256',ephemeral).update(ip).digest('hex');const b=buckets.get(key)||{count:0,reset:now+60000};if(++b.count>12||buckets.size>10000)throw new MediaError('RATE_LIMIT',429);buckets.set(key,b)}
export function apiError(error:unknown){const e=error instanceof MediaError?error:new MediaError('UNAVAILABLE',502);return Response.json({error:e.code},{status:e.status,headers:{'Cache-Control':'no-store',...(e.status===429?{'Retry-After':'60'}:{})}})}
