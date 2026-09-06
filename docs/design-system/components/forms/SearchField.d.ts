import * as React from 'react';
export interface SearchFieldProps { placeholder?: string; onDark?: boolean; value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; style?: React.CSSProperties }
/** Pill search input used in the app top bar. */
export declare function SearchField(props: SearchFieldProps): JSX.Element;
