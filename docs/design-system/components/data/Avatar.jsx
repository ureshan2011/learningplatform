import React from 'react';

export function Avatar({src,name='',size=32,onDark,style}){
  const initials=name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
  return (
    <span style={{display:'grid',placeItems:'center',width:size,height:size,borderRadius:'var(--radius-pill)',overflow:'hidden',flex:'0 0 auto',background:onDark?'var(--ink-700)':'var(--paper-300)',color:onDark?'var(--text-on-dark)':'var(--ink-600)',font:'var(--type-label)',fontSize:Math.round(size*.38),...style}}>
      {src?<img src={src} alt={name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:initials}
    </span>
  );
}

export function AvatarGroup({people=[],size=26,onDark,style}){
  return (
    <span style={{display:'inline-flex',...style}}>
      {people.map((p,i)=>(
        <span key={i} style={{marginLeft:i?-9:0,borderRadius:'var(--radius-pill)',boxShadow:`0 0 0 2px ${onDark?'var(--surface-app-panel)':'var(--paper-0)'}`,display:'inline-flex'}}>
          <Avatar src={p.src} name={p.name} size={size} onDark={onDark}/>
        </span>
      ))}
    </span>
  );
}
