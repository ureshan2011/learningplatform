import * as React from 'react';
export interface ChipProps { tone?: 'neutral'|'dark'|'brand'|'soft'|'outline'; /** CSS colour for the 6px status dot */ dot?: string; icon?: React.ReactNode; active?: boolean; children?: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }
/** 30px pill for counters, filters and status. */
export declare function Chip(props: ChipProps): JSX.Element;
