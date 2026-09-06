import * as React from 'react';
export interface SidebarNavItem { label: string; icon?: React.ReactNode; count?: number }
export interface SidebarNavProps { items?: SidebarNavItem[]; active?: string; onSelect?: (label: string) => void; style?: React.CSSProperties }
/** Dark app sidebar nav; active row is a lifted pill. */
export declare function SidebarNav(props: SidebarNavProps): JSX.Element;
