import * as React from 'react';
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { label?: string; options?: string[]; onDark?: boolean }
/** Native select with brand chevron. */
export declare function Select(props: SelectProps): JSX.Element;
