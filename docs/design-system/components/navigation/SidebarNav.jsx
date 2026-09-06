import React from 'react';

export function SidebarNav({items=[],active,onSelect,style}){
  return (
    <nav style={{display:'flex',flexDirection:'column',gap:2,...style}}>
      {items.map(it=>{
        const on=active===it.label;
        return (
          <button key={it.label} type="button" onClick={()=>onSelect&&onSelect(it.label)} style={{display:'flex',alignItems:'center',gap:12,height:40,padding:'0 14px',border:'none',borderRadius:'var(--radius-pill)',cursor:'pointer',textAlign:'left',font:'var(--type-label)',fontSize:'var(--text-xs)',background:on?'var(--surface-app-hover)':'transparent',color:on?'var(--text-on-dark)':'var(--text-on-dark-muted)',transition:'background var(--dur-fast) var(--ease-standard),color var(--dur-fast) var(--ease-standard)'}}>
            <span style={{display:'flex',color:on?'var(--text-on-dark)':'var(--ink-300)'}}>{it.icon}</span>
            <span style={{flex:1}}>{it.label}</span>
            {it.count!=null&&<span style={{font:'var(--type-eyebrow)',fontSize:'var(--text-3xs)',color:'var(--orange-400)'}}>{it.count}</span>}
          </button>
        );
      })}
    </nav>
  );
}
