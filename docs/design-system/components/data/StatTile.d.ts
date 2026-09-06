import * as React from 'react';
export interface StatTileProps { value?: React.ReactNode; label?: string; icon?: React.ReactNode; style?: React.CSSProperties }
/** One cell of the marketing stats strip: icon, big number, caps label. */
export declare function StatTile(props: StatTileProps): JSX.Element;
