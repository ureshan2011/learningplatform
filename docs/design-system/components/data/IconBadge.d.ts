import * as React from 'react';
export interface IconBadgeProps { size?: number; tone?: 'soft'|'dark'|'brand'|'tile'; /** shows the orange check dot */ done?: boolean; children?: React.ReactNode; style?: React.CSSProperties }
/** The brand's circular/soft-square icon container, with optional completed dot. */
export declare function IconBadge(props: IconBadgeProps): JSX.Element;
