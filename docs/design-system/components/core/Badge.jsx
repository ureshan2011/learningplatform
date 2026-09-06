import React from 'react';

export function Badge({tone='info',children,style}){
  const c={
    success:['var(--status-success-bg)','var(--status-success)'],
    warning:['var(--status-warning-bg)','var(--status-warning)'],
    danger:['var(--status-danger-bg)','var(--status-danger)'],
    info:['var(--status-info-bg)','var(--status-info)'],
    event:['var(--status-event-bg)','var(--status-event)'],
    brand:['var(--surface-brand-soft)','var(--orange-600)']
  }[tone]||[];
  return <span style={{display:'inline-flex',alignItems:'center',height:22,padding:'0 9px',borderRadius:'var(--radius-pill)',background:c[0],color:c[1],font:'var(--type-eyebrow)',fontSize:'var(--text-3xs)',letterSpacing:'.02em',...style}}>{children}</span>;
}
