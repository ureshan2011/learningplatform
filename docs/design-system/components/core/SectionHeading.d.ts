import * as React from 'react';
export interface SectionHeadingProps { size?: number; /** the signature orange full stop */ period?: boolean; onDark?: boolean; /** trailing word rendered in orange */ accent?: string; children?: React.ReactNode; style?: React.CSSProperties }
/** Big display headline with the orange period. Max one per screen. */
export declare function SectionHeading(props: SectionHeadingProps): JSX.Element;
