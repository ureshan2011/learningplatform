import React from 'react';

export function StatTile({value,label,icon,style}){
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,padding:'20px 16px',...style}}>
      {icon&&<span style={{color:'var(--orange-500)',marginBottom:2}}>{icon}</span>}
      <div style={{font:'var(--type-h2)',fontSize:'var(--text-xl)',color:'var(--text-strong)'}}>{value}</div>
      <div style={{font:'var(--type-label)',fontSize:'var(--text-2xs)',color:'var(--text-muted)'}}>{label}</div>
    </div>
  );
}
