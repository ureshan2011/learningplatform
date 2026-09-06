import React from 'react';

export function ProgressBar({value=0,onDark,showLabel=true,height=6,style}){
  return (
    <div style={{display:'flex',alignItems:'center',gap:12,...style}}>
      <div style={{flex:1,height,borderRadius:'var(--radius-pill)',background:onDark?'var(--ink-700)':'var(--surface-sunken)',overflow:'hidden'}}>
        <div style={{width:`${Math.max(0,Math.min(100,value))}%`,height:'100%',borderRadius:'var(--radius-pill)',background:'var(--surface-brand)',transition:'width var(--dur-slow) var(--ease-out)'}}/>
      </div>
      {showLabel&&<span style={{font:'var(--type-label)',fontSize:'var(--text-sm)',color:onDark?'var(--text-on-dark)':'var(--text-strong)'}}>{value}%</span>}
    </div>
  );
}
