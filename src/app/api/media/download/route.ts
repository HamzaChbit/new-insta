import {apiError,limit,safeFetch,verifyDownload} from '@/lib/server';
import {MediaError} from '@/lib/media';
export const runtime='nodejs';
export async function GET(request:Request){try{
 limit(request);const params=new URL(request.url).searchParams;const data=verifyDownload(params.get('token')||'');
 const range=request.headers.get('range');if(range&&!/^bytes=(?:\d+-\d*|-\d+)$/.test(range))throw new MediaError('UNAVAILABLE',416);
 const response=await safeFetch(data.url,'media',range||undefined);const mime=response.headers.get('content-type')?.split(';')[0]||'';
 const types:Record<string,string>={'video/mp4':'mp4','image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
 if(!types[mime]||!mime.startsWith(data.type+'/'))throw new MediaError('UNAVAILABLE');
 const size=Number(response.headers.get('content-length'));const contentRange=response.headers.get('content-range');const total=contentRange?Number(contentRange.split('/')[1]):size;
 if(size>40_000_000||total>40_000_000)throw new MediaError('TOO_LARGE',413);if(!response.body)throw new MediaError('UNAVAILABLE');
 let sent=0;const stream=response.body.pipeThrough(new TransformStream<Uint8Array,Uint8Array>({transform(chunk,controller){sent+=chunk.byteLength;if(sent>40_000_000){controller.error(new Error('TOO_LARGE'));return}controller.enqueue(chunk)}}));
 const headers=new Headers({'Content-Type':mime,'Content-Disposition':`${params.get('inline')==='1'?'inline':'attachment'}; filename="instavault.${types[mime]}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});
 if(size>0)headers.set('Content-Length',String(size));if(response.status===206&&contentRange){headers.set('Content-Range',contentRange);headers.set('Accept-Ranges','bytes')}
 return new Response(stream,{status:response.status===206?206:200,headers});
 }catch(e){return apiError(e)}}

