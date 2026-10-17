import {ImageResponse} from 'next/og';
export const size={width:180,height:180};
export const contentType='image/png';
export default function AppleIcon(){return new ImageResponse(<div style={{width:'100%',height:'100%',background:'#cf233c',display:'flex',alignItems:'center',justifyContent:'center'}}><svg width="140" height="140" viewBox="0 0 64 64"><path d="M32 13v27m-11-11 11 11 11-11M17 44v7h30v-7" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>,size)}

