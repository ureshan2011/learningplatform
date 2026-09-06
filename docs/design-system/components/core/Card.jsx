import React from 'react';

export function Card({variant='light',padding=24,radius='var(--radius-card)',hoverable,children,style,...rest}){
  const skin={
    light:{background:'var(--surface-card)',boxShadow:'var(--shadow-sm)',border:'none'},
    hairline:{background:'var(--surface-card)',boxShadow:'none',border:'var(--border-hairline) solid var(--border-subtle)'},
    soft:{background:'var(--surface-brand-soft)',boxShadow:'none',border:'none'},
    dark:{background:'var(--surface-app-panel)',boxShadow:'var(--shadow-inset-dark)',border:'var(--border-hairline) solid var(--border-dark)',color:'var(--text-on-dark)'},
    framed:{background:'var(--ink-900)',border:'var(--border-heavy) solid var(--ink-900)',boxShadow:'none',color:'var(--text-on-dark)'},
    feature:{background:'var(--surface-app-feature)',border:'none',boxShadow:'none',color:'var(--text-on-dark)'}
  }[variant]||{};
  return <div style={{borderRadius:radius,padding,transition:'transform var(--dur-base) var(--ease-standard),box-shadow var(--dur-base) var(--ease-standard)',...skin,...style}} {...rest}>{children}</div>;
}
