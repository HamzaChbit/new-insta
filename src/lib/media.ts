import {load} from 'cheerio';
import {z} from 'zod';
export type Kind='reel'|'story'|'post';
export type Media={url:string;type:'video'|'image';quality:string};
export class MediaError extends Error {constructor(public code:string,public status=422){super(code)}}
export function parseInstagram(input:string){
 const parsed=z.string().trim().max(2048).url().safeParse(input);if(!parsed.success)throw new MediaError('INVALID_URL',400);
 const u=new URL(parsed.data);if(u.protocol!=='https:'||!['instagram.com','www.instagram.com'].includes(u.hostname)||u.port||u.username||u.password)throw new MediaError('INVALID_URL',400);
 const m=u.pathname.match(/^\/(reel|reels|p|tv)\/([A-Za-z0-9_-]{3,80})\/?$/);const story=u.pathname.match(/^\/stories\/([A-Za-z0-9_.]{1,30})\/(\d{5,30})\/?$/);
 if(!m&&!story)throw new MediaError('INVALID_URL',400);
 return {url:`https://www.instagram.com${u.pathname.replace(/\/$/,'')}/`,kind:(story?'story':m![1].startsWith('reel')?'reel':'post') as Kind};
}
export function allowedMedia(value:string){try{const u=new URL(value);return u.protocol==='https:'&&!u.port&&!u.username&&!u.password&&['cdninstagram.com','fbcdn.net'].some(d=>u.hostname.endsWith('.'+d))}catch{return false}}
export function extractMedia(html:string,expectedCode?:string){
 const $=load(html);const items:Media[]=[];
 const add=(url:unknown,type:Media['type'])=>{if(typeof url==='string'&&allowedMedia(url)&&!items.some(i=>i.url===url))items.push({url,type,quality:'Source quality'})};
 // Parse public document data only. Never execute scripts or call private endpoints.
 $('meta[property="og:video"],meta[property="og:video:url"],meta[property="og:video:secure_url"]').each((_,el)=>{add($(el).attr('content'),'video')});
 $('video[src],video source[src]').each((_,el)=>{add($(el).attr('src'),'video')});
 let visited=0;
 const walk=(value:unknown,depth=0):void=>{
  if(depth>60||++visited>60000)return;
  if(typeof value==='string'){
   // Relay sometimes embeds a serialized JSON result inside another JSON document.
   if(value.length<2_000_000&&/^\s*[\[{]/.test(value)&&/video_versions|video_url|contentUrl/.test(value)){try{walk(JSON.parse(value),depth+1)}catch{}}
   return;
  }
  if(!value||typeof value!=='object')return;
  if(Array.isArray(value)){for(const item of value)walk(item,depth+1);return}
  const node=value as Record<string,unknown>;
  // Never pick up recommended posts or another creator's video from the page.
  if(expectedCode&&(node.code===expectedCode||node.shortcode===expectedCode)){
   add(node.video_url,'video');
   if(Array.isArray(node.video_versions)){
    const versions=node.video_versions.filter((v):v is Record<string,unknown>=>!!v&&typeof v==='object').sort((a,b)=>Number(b.width||0)*Number(b.height||0)-Number(a.width||0)*Number(a.height||0));
    const best=versions.find(v=>typeof v.url==='string'&&allowedMedia(v.url));if(best)add(best.url,'video');
   }
  }
  if(node['@type']==='VideoObject'&&(!expectedCode||[node.url,node['@id'],node.embedUrl].some(v=>typeof v==='string'&&v.includes('/'+expectedCode+'/'))))add(node.contentUrl,'video');
  for(const child of Object.values(node))walk(child,depth+1);
 };
 $('script[type="application/json"],script[type="application/ld+json"]').each((_,el)=>{try{walk(JSON.parse($(el).text()))}catch{}});
 if(!items.length)$('meta[property="og:image"]').each((_,el)=>{add($(el).attr('content'),'image')});
 const title=$('meta[property="og:title"]').attr('content')||'Instagram media';
 // Generic login/profile images are not downloadable post content.
 if(!items.length||(!items.some(item=>item.type==='video')&&/^(Instagram|Login • Instagram|Login • Instagram.*)$/i.test(title.trim())))throw new MediaError('PUBLIC_MEDIA_MISSING');
 return {title:title.slice(0,500),items:items.slice(0,20)};
}
