import * as React from 'react';
export interface CardProps { variant?: 'light'|'hairline'|'soft'|'dark'|'framed'|'feature'; padding?: number|string; radius?: string; hoverable?: boolean; children?: React.ReactNode; style?: React.CSSProperties }
/**
 * Container surface. `light`/`hairline` for the cream world, `dark` for app panels, `framed` for portfolio-style near-black cards, `feature` for the one cocoa hero banner.
 * @startingPoint section="Core" subtitle="Card surfaces, light and dark" viewport="700x260"
 */
export declare function Card(props: CardProps): JSX.Element;
