import * as React from 'react';
export interface CheckboxProps { label?: string; checked?: boolean; onChange?: (next: boolean) => void; onDark?: boolean; style?: React.CSSProperties }
/** 20px checkbox, orange fill when checked. */
export declare function Checkbox(props: CheckboxProps): JSX.Element;
