import React from 'react';

export function IconBadge({size=44,tone='soft',done,children,style}){
  const skin={
    soft:{background:'var(--surface-brand-soft)',color:'var(--orange-500)'},
    dark:{background:'var(--ink-800)',color:'var(--text-on-dark)'},
    brand:{background:'var(--surface-brand)',color:'var(--text-on-brand)'},
    tile:{background:'var(--paper-0)',color:'var(--ink-900)'}
  }[tone]||{};
  return (
    <span style={{position:'relative',display:'grid',placeItems:'center',width:size,height:size,borderRadius:'var(--radius-md)',flex:'0 0 auto',...skin,...style}}>
      {children}
      {done&&<span style={{position:'absolute',right:-3,bottom:-3,width:16,height:16,borderRadius:'var(--radius-pill)',background:'var(--surface-brand)',color:'#fff',display:'grid',placeItems:'center',fontSize:9,fontWeight:700,border:'2px solid var(--surface-app-panel)'}}>✓</span>}
    </span>
  );
}
