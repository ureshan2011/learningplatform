import * as React from 'react';
export interface AvatarProps { src?: string; name?: string; size?: number; onDark?: boolean; style?: React.CSSProperties }
/** Round avatar, falls back to initials. */
export declare function Avatar(props: AvatarProps): JSX.Element;
export declare function AvatarGroup(props: { people?: Array<{ src?: string; name?: string }>; size?: number; onDark?: boolean; style?: React.CSSProperties }): JSX.Element;
