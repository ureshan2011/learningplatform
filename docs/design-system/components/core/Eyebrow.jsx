import React from 'react';

export function Eyebrow({children,onDark,style}){
  return <div style={{font:'var(--type-eyebrow)',letterSpacing:'var(--tracking-eyebrow)',textTransform:'uppercase',color:onDark?'var(--orange-400)':'var(--text-brand)',...style}}>{children}</div>;
}

