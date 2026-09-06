import * as React from 'react';
export interface TabsProps { items?: string[]; active?: string; onSelect?: (item: string) => void; onDark?: boolean; style?: React.CSSProperties }
/** Segmented pill tabs. */
export declare function Tabs(props: TabsProps): JSX.Element;
