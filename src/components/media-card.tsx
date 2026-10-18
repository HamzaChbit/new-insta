'use client';
import {useState} from 'react';
import {ArrowDownToLine,LoaderCircle,Play} from 'lucide-react';
import {Button} from './ui/button';
import {copy,errors,type Locale} from '@/lib/content';
export type ResolvedItem={type:'video'|'image';quality:string;download:string;preview:string};
export function MediaCard({item,title,locale}:{item:ResolvedItem;title:string;locale:Locale}){
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [previewFailed,setPreviewFailed]=useState(false);const c=copy[locale];const inline=item.download+'&inline=1';
 async function save(){setBusy(true);setError('');try{const response=await fetch(item.download);if(!response.ok){let code='UNAVAILABLE';try{code=(await response.json()).error}catch{}throw new Error(code)}const mime=response.headers.get('content-type')||'';if(!mime.startsWith(item.type+'/'))throw new Error('UNAVAILABLE');const blob=await response.blob();if(!blob.size)throw new Error('UNAVAILABLE');const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='instavault.'+(item.type==='video'?'mp4':mime.includes('png')?'png':mime.includes('webp')?'webp':'jpg');document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}catch(e){setError(errors[locale][e instanceof Error?e.message:'UNAVAILABLE']||errors[locale].UNAVAILABLE)}finally{setBusy(false)}}
 return <article className="media-item">{previewFailed?<div className="preview-unavailable"><Play size={30}/><p>{locale==='ar'?'تعذّرت المعاينة. جرّب زر تحميل الملف.':locale==='fr'?'Aperçu indisponible. Essayez de télécharger le fichier.':'Preview unavailable. Try downloading the file.'}</p></div>:item.type==='video'?<video controls playsInline preload="metadata" src={inline} onError={()=>setPreviewFailed(true)}/>:<img src={inline} alt={title} loading="lazy" onError={()=>setPreviewFailed(true)}/>}<span>{c.quality}</span><Button className="gradient" onClick={save} disabled={busy}>{busy?<LoaderCircle className="spin" size={16}/>:<ArrowDownToLine size={16}/>}{c.save}</Button>{error&&<p role="alert" className="error">{error}</p>}</article>
}

