import React from 'react';

export function Select({label,options=[],onDark,style,...rest}){
  return (
    <label style={{display:'flex',flexDirection:'column',gap:6,...style}}>
      {label&&<span style={{font:'var(--type-label)',fontSize:'var(--text-2xs)',color:onDark?'var(--text-on-dark-muted)':'var(--text-muted)'}}>{label}</span>}
      <select {...rest} style={{appearance:'none',height:44,padding:'0 40px 0 16px',borderRadius:'var(--radius-sm)',background:`${onDark?'var(--ink-800)':'var(--paper-0)'} url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B615D' stroke-width='2' stroke-linecap='round'><path d='m6 9 6 6 6-6'/></svg>") no-repeat right 14px center`,border:`var(--border-hairline) solid ${onDark?'var(--border-dark)':'var(--border-subtle)'}`,font:'var(--type-body-sm)',color:onDark?'var(--text-on-dark)':'var(--text-strong)',outline:'none'}}>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
