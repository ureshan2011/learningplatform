import React from 'react';

export function Input({label,hint,error,onDark,icon,style,...rest}){
  return (
    <label style={{display:'flex',flexDirection:'column',gap:6,...style}}>
      {label&&<span style={{font:'var(--type-label)',fontSize:'var(--text-2xs)',color:onDark?'var(--text-on-dark-muted)':'var(--text-muted)'}}>{label}</span>}
      <span style={{display:'flex',alignItems:'center',gap:9,height:44,padding:'0 16px',borderRadius:'var(--radius-sm)',background:onDark?'var(--ink-800)':'var(--paper-0)',border:`var(--border-hairline) solid ${error?'var(--status-danger)':onDark?'var(--border-dark)':'var(--border-subtle)'}`}}>
        {icon&&<span style={{color:onDark?'var(--ink-300)':'var(--text-muted)',display:'flex'}}>{icon}</span>}
        <input {...rest} style={{flex:1,border:'none',outline:'none',background:'transparent',font:'var(--type-body-sm)',color:onDark?'var(--text-on-dark)':'var(--text-strong)'}}/>
      </span>
      {(error||hint)&&<span style={{font:'var(--type-body-sm)',fontSize:'var(--text-2xs)',color:error?'var(--status-danger)':'var(--text-muted)'}}>{error||hint}</span>}
    </label>
  );
}
