import React from 'react';

export function Wordmark({size=22,onDark,mono,period=true,style}){
  return (
    <span style={{font:'var(--type-h2)',fontSize:size,letterSpacing:'-0.035em',fontWeight:'var(--weight-black)',fontFamily:'var(--font-display)',color:onDark?'var(--text-on-dark)':'var(--text-strong)',whiteSpace:'nowrap',...style}}>
      ict{mono?'campus':<span style={{color:'var(--text-brand)'}}>campus</span>}{period&&<span style={{color:mono?'inherit':'var(--text-brand)'}}>.</span>}
    </span>
  );
}
