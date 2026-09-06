import React from 'react';

export function Tabs({items=[],active,onSelect,onDark,style}){
  return (
    <div style={{display:'inline-flex',alignItems:'center',gap:2,padding:4,borderRadius:'var(--radius-pill)',background:onDark?'var(--ink-850)':'var(--surface-sunken)',...style}}>
      {items.map(it=>{
        const on=active===it;
        return <button key={it} type="button" onClick={()=>onSelect&&onSelect(it)} style={{height:32,padding:'0 16px',border:'none',borderRadius:'var(--radius-pill)',cursor:'pointer',font:'var(--type-label)',fontSize:'var(--text-xs)',background:on?(onDark?'var(--surface-brand)':'var(--paper-0)'):'transparent',color:on?(onDark?'var(--text-on-brand)':'var(--text-strong)'):(onDark?'var(--text-on-dark-muted)':'var(--text-muted)'),boxShadow:on&&!onDark?'var(--shadow-xs)':'none',transition:'all var(--dur-fast) var(--ease-standard)'}}>{it}</button>;
      })}
    </div>
  );
}
