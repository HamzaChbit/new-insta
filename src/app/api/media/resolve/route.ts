import {z} from 'zod';
import {parseInstagram,extractMedia,extractPublicStories,MediaError} from '@/lib/media';
import {safeFetch,readLimited,signDownload,limit,apiError} from '@/lib/server';
export const runtime='nodejs';
export async function POST(request:Request){try{
 limit(request);const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)throw new MediaError('INVALID_URL',403);
 if(Number(request.headers.get('content-length'))>4096)throw new MediaError('INVALID_URL',400);
 let input;try{input=JSON.parse((await readLimited(new Response(request.body),4096)).toString())}catch{throw new MediaError('INVALID_URL',400)}
 const body=z.object({url:z.string().max(2048)}).safeParse(input);if(!body.success)throw new MediaError('INVALID_URL',400);
 const parsed=parseInstagram(body.data.url);
 const response=await safeFetch(parsed.url,'page');if(!response.headers.get('content-type')?.includes('text/html'))throw new MediaError('UNAVAILABLE');
 const isStory=parsed.kind==='story';const parts=new URL(parsed.url).pathname.split('/');
 const html=(await readLimited(response,2_000_000)).toString();let result;
 if(isStory){try{result=extractPublicStories(html,parts[2])}catch{if(!parts[3])throw new MediaError('STORY_UNAVAILABLE');result=extractMedia(html,parts[3],true)}}else result=extractMedia(html,parts[2]);
 if(!isStory)result.items=result.items.filter(item=>item.type==='video');
 if(!result.items.length)throw new MediaError('PUBLIC_MEDIA_MISSING');
 return Response.json({title:result.title,kind:parsed.kind,source:parsed.url,notice:'PUBLIC_METADATA_ONLY',items:result.items.map(item=>({type:item.type,quality:item.quality,download:'/api/media/download?token='+signDownload(item.url,item.type),preview:item.url}))},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return apiError(e)}}

