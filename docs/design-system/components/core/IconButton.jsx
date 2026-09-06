import React from 'react';

export function IconButton({size=40,variant='soft',label,children,onClick,style,...rest}){
  const skin={
    soft:{background:'var(--surface-brand-soft)',color:'var(--orange-500)'},
    brand:{background:'var(--surface-brand)',color:'var(--text-on-brand)'},
    dark:{background:'var(--ink-900)',color:'var(--text-on-dark)'},
    onDark:{background:'var(--ink-800)',color:'var(--text-on-dark)'},
    outline:{background:'transparent',color:'var(--text-strong)',boxShadow:'inset 0 0 0 var(--border-hairline) var(--border-subtle)'}
  }[variant]||{};
  return (
    <button type="button" aria-label={label} onClick={onClick} style={{display:'grid',placeItems:'center',width:size,height:size,border:'none',borderRadius:'var(--radius-pill)',cursor:'pointer',padding:0,transition:'background var(--dur-fast) var(--ease-standard),transform var(--dur-fast) var(--ease-standard)',...skin,...style}} {...rest}>{children}</button>
  );
}
