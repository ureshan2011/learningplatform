import * as React from 'react';
export interface ProgressBarProps { value?: number; onDark?: boolean; showLabel?: boolean; height?: number; style?: React.CSSProperties }
/** 6px pill progress track with orange fill and a 14px % label. */
export declare function ProgressBar(props: ProgressBarProps): JSX.Element;
