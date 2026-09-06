import React from 'react';

export function Arrow({dir='right',size=14}){
  const rot=dir==='up-right'?-45:dir==='down'?90:0;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{transform:`rotate(${rot}deg)`}}>
      <path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>
    </svg>
  );
}
