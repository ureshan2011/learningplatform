import React from 'react';

const sizes={sm:{h:32,px:14,fs:'var(--text-xs)',badge:20,ico:12},md:{h:40,px:20,fs:'var(--text-sm)',badge:26,ico:14},lg:{h:48,px:26,fs:'var(--text-base)',badge:32,ico:16}};

export function Button({variant='primary',size='md',arrow='right',children,disabled,onClick,style,...rest}){
  const s=sizes[size]||sizes.md;
  const skin={
    primary:{background:'var(--surface-brand)',color:'var(--text-on-brand)',border:'none',boxShadow:'var(--shadow-brand)'},
    secondary:{background:'var(--ink-900)',color:'var(--text-on-dark)',border:'none',boxShadow:'var(--shadow-sm)'},
    ghost:{background:'transparent',color:'var(--text-strong)',border:'none',boxShadow:'none'},
    outline:{background:'transparent',color:'var(--text-strong)',border:'var(--border-medium) solid var(--border-strong)',boxShadow:'none'}
  }[variant]||{};
  const badgeSkin=variant==='primary'?{background:'var(--paper-0)',color:'var(--orange-500)'}
    :variant==='secondary'?{background:'var(--surface-brand)',color:'var(--text-on-brand)'}
    :{background:'transparent',color:'currentColor',border:'var(--border-hairline) solid currentColor'};
  return (
    <button type="button" disabled={disabled} onClick={onClick} style={{display:'inline-flex',alignItems:'center',gap:size==='sm'?8:10,height:s.h,padding:`0 ${arrow?6:s.px}px 0 ${s.px}px`,borderRadius:'var(--radius-pill)',font:'var(--type-label)',fontSize:s.fs,letterSpacing:'-0.005em',cursor:disabled?'not-allowed':'pointer',opacity:disabled?.45:1,transition:'background var(--dur-fast) var(--ease-standard),transform var(--dur-fast) var(--ease-standard),box-shadow var(--dur-base) var(--ease-standard)',...skin,...style}} {...rest}>
      <span>{children}</span>
      {arrow&&<span style={{display:'grid',placeItems:'center',width:s.badge,height:s.badge,borderRadius:'var(--radius-pill)',flex:'0 0 auto',...badgeSkin}}>
        <Arrow dir={arrow} size={s.ico}/>
      </span>}
    </button>
  );
}

export { Arrow } from './Arrow.jsx';
