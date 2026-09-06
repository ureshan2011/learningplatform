import React from 'react';

export function Checkbox({label,checked,onChange,onDark,style}){
  return (
    <label style={{display:'inline-flex',alignItems:'center',gap:10,cursor:'pointer',font:'var(--type-body-sm)',color:onDark?'var(--text-on-dark)':'var(--text-body)',...style}}>
      <span onClick={()=>onChange&&onChange(!checked)} style={{display:'grid',placeItems:'center',width:20,height:20,borderRadius:'var(--radius-xs)',flex:'0 0 auto',background:checked?'var(--surface-brand)':'transparent',border:checked?'none':`var(--border-medium) solid ${onDark?'var(--ink-500)':'var(--border-subtle)'}`,transition:'background var(--dur-fast) var(--ease-standard)'}}>
        {checked&&<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>}
      </span>
      {label}
    </label>
  );
}
