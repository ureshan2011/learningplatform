import * as React from 'react';
export interface NavPillProps { items?: string[]; active?: string; onSelect?: (item: string) => void; style?: React.CSSProperties }
/** Nav items inside the floating near-black pill bar; active item is an orange pill. */
export declare function NavPill(props: NavPillProps): JSX.Element;
