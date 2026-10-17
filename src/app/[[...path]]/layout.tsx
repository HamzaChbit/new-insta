import type {Metadata} from 'next';
import '../globals.css';
import '../red-theme.css';
export const metadata:Metadata={metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000'),applicationName:'InstaVault',icons:{icon:[{url:'/icon.svg',type:'image/svg+xml',sizes:'any'}],apple:[{url:'/apple-icon',sizes:'180x180',type:'image/png'}]},manifest:'/manifest.webmanifest',robots:{index:true,follow:true},verification:{google:process.env.GOOGLE_SITE_VERIFICATION}};
export default async function RootLayout({children,params}:{children:React.ReactNode;params:Promise<{path?:string[]}>}){const {path}=await params;const locale=path?.[0]==='ar'?'ar':path?.[0]==='fr'?'fr':'en';return <html data-theme="light" lang={locale} dir={locale==='ar'?'rtl':'ltr'} suppressHydrationWarning><body><a href="#main" className="skip-link">{locale==='ar'?'تجاوز إلى المحتوى':locale==='fr'?'Aller au contenu':'Skip to content'}</a>{children}</body></html>}


