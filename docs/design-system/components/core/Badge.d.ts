import * as React from 'react';
export interface BadgeProps { tone?: 'success'|'warning'|'danger'|'info'|'event'|'brand'; children?: React.ReactNode; style?: React.CSSProperties }
/** Tiny caps status badge on a tinted background. */
export declare function Badge(props: BadgeProps): JSX.Element;
