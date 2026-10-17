'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="article"><h1>Something went wrong.</h1><p>Please try again.</p><button className="button gradient" onClick={reset}>Try again</button></main>}
