import React from 'react';

export function Switch({checked,onChange,label,onDark,style}){
  return (
    <label style={{display:'inline-flex',alignItems:'center',gap:10,cursor:'pointer',font:'var(--type-body-sm)',color:onDark?'var(--text-on-dark)':'var(--text-body)',...style}}>
      <span onClick={()=>onChange&&onChange(!checked)} style={{position:'relative',width:42,height:24,borderRadius:'var(--radius-pill)',flex:'0 0 auto',background:checked?'var(--surface-brand)':(onDark?'var(--ink-600)':'var(--paper-300)'),transition:'background var(--dur-base) var(--ease-standard)'}}>
        <span style={{position:'absolute',top:3,left:checked?21:3,width:18,height:18,borderRadius:'var(--radius-pill)',background:'var(--paper-0)',boxShadow:'var(--shadow-xs)',transition:'left var(--dur-base) var(--ease-standard)'}}/>
      </span>
      {label}
    </label>
  );
}
