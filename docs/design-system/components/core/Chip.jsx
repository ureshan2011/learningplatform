import React from 'react';

export function Chip({tone='neutral',dot,icon,children,active,onClick,style}){
  const skin={
    neutral:{background:'var(--surface-sunken)',color:'var(--text-strong)'},
    dark:{background:'var(--ink-800)',color:'var(--text-on-dark)'},
    brand:{background:'var(--surface-brand)',color:'var(--text-on-brand)'},
    soft:{background:'var(--surface-brand-soft)',color:'var(--orange-600)'},
    outline:{background:'transparent',color:'var(--text-body)',boxShadow:'inset 0 0 0 var(--border-hairline) var(--border-subtle)'}
  }[tone]||{};
  return (
    <span onClick={onClick} style={{display:'inline-flex',alignItems:'center',gap:7,height:30,padding:'0 13px',borderRadius:'var(--radius-pill)',font:'var(--type-label)',fontSize:'var(--text-2xs)',cursor:onClick?'pointer':'default',transform:active?'none':'none',...skin,...style}}>
      {dot&&<span style={{width:6,height:6,borderRadius:'var(--radius-pill)',background:dot,flex:'0 0 auto'}}/>}
      {icon}
      {children}
    </span>
  );
}

