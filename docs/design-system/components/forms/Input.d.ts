import * as React from 'react';
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; hint?: string; error?: string; onDark?: boolean; icon?: React.ReactNode }
/** 44px labelled text field, 10px radius. */
export declare function Input(props: InputProps): JSX.Element;
