import React from 'react';

export function SearchField({placeholder='Search for a course, lesson, etc.',onDark,value,onChange,style}){
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:10,height:40,padding:'0 18px',borderRadius:'var(--radius-pill)',background:onDark?'var(--ink-850)':'var(--paper-0)',border:`var(--border-hairline) solid ${onDark?'var(--border-dark)':'var(--border-subtle)'}`,...style}}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={onDark?'var(--ink-300)':'var(--ink-400)'} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input value={value} onChange={onChange} placeholder={placeholder} style={{flex:1,border:'none',outline:'none',background:'transparent',font:'var(--type-body-sm)',color:onDark?'var(--text-on-dark)':'var(--text-strong)'}}/>
    </span>
  );
}
