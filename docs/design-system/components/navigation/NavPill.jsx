import React from 'react';

export function NavPill({items=[],active,onSelect,style}){
  return (
    <nav style={{display:'flex',alignItems:'center',gap:4,...style}}>
      {items.map(it=>(
        <button key={it} type="button" onClick={()=>onSelect&&onSelect(it)} style={{height:32,padding:'0 15px',border:'none',borderRadius:'var(--radius-pill)',cursor:'pointer',font:'var(--type-label)',fontSize:'var(--text-xs)',background:active===it?'var(--surface-brand)':'transparent',color:active===it?'var(--text-on-brand)':'var(--ink-200)',transition:'background var(--dur-fast) var(--ease-standard),color var(--dur-fast) var(--ease-standard)'}}>{it}</button>
      ))}
    </nav>
  );
}
