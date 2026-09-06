import * as React from 'react';
export interface IconButtonProps { size?: number; variant?: 'soft'|'brand'|'dark'|'onDark'|'outline'; label?: string; children?: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }
/** Circular icon-only button. Always pass `label` for a11y. */
export declare function IconButton(props: IconButtonProps): JSX.Element;
