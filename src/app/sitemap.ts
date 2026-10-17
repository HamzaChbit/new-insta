import type {MetadataRoute} from 'next';
import {locales,pathFor,activeSlugs} from '@/lib/content';
export default function sitemap():MetadataRoute.Sitemap{const base=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000';return ['',...activeSlugs].flatMap(slug=>locales.map(locale=>({url:base+pathFor(locale,slug),alternates:{languages:Object.fromEntries(locales.map(l=>[l,base+pathFor(l,slug)]))}})))}
