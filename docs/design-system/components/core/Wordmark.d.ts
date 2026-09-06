import * as React from 'react';
export interface WordmarkProps { size?: number; onDark?: boolean; /** single-colour lockup */ mono?: boolean; period?: boolean; style?: React.CSSProperties }
/** Typographic ICTCAMPUS lockup — stands in until real logo files are supplied. */
export declare function Wordmark(props: WordmarkProps): JSX.Element;
