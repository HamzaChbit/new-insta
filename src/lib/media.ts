import {load} from 'cheerio';
import {z} from 'zod';
export type Kind='reel'|'story'|'post';
export type Media={url:string;type:'video'|'image';quality:string};
export class MediaError extends Error {constructor(public code:string,public status=422){super(code)}}
export function parseInstagram(input:string){
 const parsed=z.string().trim().max(2048).url().safeParse(input);if(!parsed.success)throw new MediaError('INVALID_URL',400);
 const u=new URL(parsed.data);if(u.protocol!=='https:'||!['instagram.com','www.instagram.com'].includes(u.hostname)||u.port||u.username||u.password)throw new MediaError('INVALID_URL',400);
 const m=u.pathname.match(/^\/(reel|reels|p|tv)\/([A-Za-z0-9_-]{3,80})\/?$/);const story=u.pathname.match(/^\/stories\/([A-Za-z0-9_.]{1,30})(?:\/(\d{5,30}))?\/?$/);
 if(!m&&!story)throw new MediaError('INVALID_URL',400);
 return {url:`https://www.instagram.com${u.pathname.replace(/\/$/,'')}/`,kind:(story?'story':m![1].startsWith('reel')?'reel':'post') as Kind};
}
// A collection is accepted only when its owner matches the requested profile.
// It may be partial: no authenticated requests or pagination are performed.
export function extractPublicStories(html:string,username:string){
 const $=load(html);const collected=new Map<string,Media>();let visited=0;
 const walk=(value:unknown,depth=0):void=>{
  if(depth>60||++visited>60000)return;
  if(typeof value==='string'&&/^\s*[\[{]/.test(value)&&value.length<2_000_000){try{walk(JSON.parse(value),depth+1)}catch{}return}
  if(!value||typeof value!=='object')return;
  const node=value as Record<string,unknown>;
  const owner=node.user&&typeof node.user==='object'?(node.user as Record<string,unknown>).username:undefined;
  if(typeof owner==='string'&&owner.toLowerCase()===username.toLowerCase()&&Array.isArray(node.items)){
   for(const item of node.items.slice(0,50)){
    if(!item||typeof item!=='object')continue;
    const id=String(item.pk||item.id||'').split('_')[0];if(!/^\d{5,30}$/.test(id)||collected.has(id))continue;
    try{const result=extractMedia('<script type="application/json">'+JSON.stringify(item).replace(/</g,'\\u003c')+'</script>',id,true);if(result.items[0])collected.set(id,result.items[0])}catch{}
   }
  }
  for(const child of Object.values(node))walk(child,depth+1);
 };
 $('script[type="application/json"]').each((_,el)=>{try{walk(JSON.parse($(el).text()))}catch{}});
 if(!collected.size)throw new MediaError('STORY_UNAVAILABLE');
 return {title:'Stories · @'+username,items:[...collected.values()]};
}
export function allowedMedia(value:string){try{const u=new URL(value);return u.protocol==='https:'&&!u.port&&!u.username&&!u.password&&['cdninstagram.com','fbcdn.net'].some(d=>u.hostname.endsWith('.'+d))}catch{return false}}
export function extractMedia(html:string,expectedCode?:string,isStory=false){
 const $=load(html);const items:Media[]=[];
 const add=(url:unknown,type:Media['type'])=>{if(typeof url==='string'&&allowedMedia(url)&&!items.some(i=>i.url===url))items.push({url,type,quality:'Source quality'})};
 // Parse public document data only. Never execute scripts or call private endpoints.
 const matchingStoryUrl=isStory&&!!expectedCode&&($('meta[property="og:url"]').attr('content')||'').includes('/'+expectedCode+'/');
 if(!isStory||matchingStoryUrl){$('meta[property="og:video"],meta[property="og:video:url"],meta[property="og:video:secure_url"]').each((_,el)=>{add($(el).attr('content'),'video')});
 $('video[src],video source[src]').each((_,el)=>{add($(el).attr('src'),'video')});}
 let visited=0;
 const walk=(value:unknown,depth=0):void=>{
  if(depth>60||++visited>60000)return;
  if(typeof value==='string'){
   // Relay sometimes embeds a serialized JSON result inside another JSON document.
   if(value.length<2_000_000&&/^\s*[\[{]/.test(value)&&/video_versions|video_url|contentUrl|image_versions2/.test(value)){try{walk(JSON.parse(value),depth+1)}catch{}}
   return;
  }
  if(!value||typeof value!=='object')return;
  if(Array.isArray(value)){for(const item of value)walk(item,depth+1);return}
  const node=value as Record<string,unknown>;
  // Never pick up recommended posts or another creator's video from the page.
  const matches=isStory?[node.pk,node.id].some(id=>typeof id==='string'&&id.split('_')[0]===expectedCode):(node.code===expectedCode||node.shortcode===expectedCode);
  if(expectedCode&&matches){
   add(node.video_url,'video');
   if(Array.isArray(node.video_versions)){
    const versions=node.video_versions.filter((v):v is Record<string,unknown>=>!!v&&typeof v==='object').sort((a,b)=>Number(b.width||0)*Number(b.height||0)-Number(a.width||0)*Number(a.height||0));
    const best=versions.find(v=>typeof v.url==='string'&&allowedMedia(v.url));if(best)add(best.url,'video');
   }
   if(isStory&&node.media_type===1&&node.image_versions2&&typeof node.image_versions2==='object'){
    const candidates=(node.image_versions2 as {candidates?:unknown}).candidates;
    if(Array.isArray(candidates)){const images=candidates.filter((v):v is Record<string,unknown>=>!!v&&typeof v==='object').sort((a,b)=>Number(b.width||0)*Number(b.height||0)-Number(a.width||0)*Number(a.height||0));const best=images.find(v=>typeof v.url==='string'&&allowedMedia(v.url));if(best)add(best.url,'image');}
   }
  }
  if(node['@type']==='VideoObject'&&(!expectedCode||[node.url,node['@id'],node.embedUrl].some(v=>typeof v==='string'&&v.includes('/'+expectedCode+'/'))))add(node.contentUrl,'video');
  for(const child of Object.values(node))walk(child,depth+1);
 };
 $('script[type="application/json"],script[type="application/ld+json"]').each((_,el)=>{try{walk(JSON.parse($(el).text()))}catch{}});
 if(!items.length&&!isStory)$('meta[property="og:image"]').each((_,el)=>{add($(el).attr('content'),'image')});
 const title=$('meta[property="og:title"]').attr('content')||'Instagram media';
 // Generic login/profile images are not downloadable post content.
 if(!items.length||(!items.some(item=>item.type==='video')&&/^(Instagram|Login • Instagram|Login • Instagram.*)$/i.test(title.trim())))throw new MediaError(isStory?'STORY_UNAVAILABLE':'PUBLIC_MEDIA_MISSING');
 return {title:title.slice(0,500),items:items.slice(0,20)};
}

