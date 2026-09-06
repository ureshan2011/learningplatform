import React from 'react';

export function SectionHeading({children,size=38,period=true,onDark,accent,style}){
  return (
    <h2 style={{font:'var(--type-h1)',fontSize:size,lineHeight:'var(--leading-snug)',letterSpacing:'var(--tracking-display)',color:onDark?'var(--text-on-dark)':'var(--text-strong)',...style}}>
      {children}{accent&&<> <span style={{color:'var(--text-brand)'}}>{accent}</span></>}{period&&<span style={{color:'var(--text-brand)'}}>.</span>}
    </h2>
  );
}

