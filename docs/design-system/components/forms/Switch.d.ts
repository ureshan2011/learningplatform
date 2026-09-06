import * as React from 'react';
export interface SwitchProps { checked?: boolean; onChange?: (next: boolean) => void; label?: string; onDark?: boolean; style?: React.CSSProperties }
/** 42×24 toggle. */
export declare function Switch(props: SwitchProps): JSX.Element;
