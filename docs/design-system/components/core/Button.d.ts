import * as React from 'react';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = solid orange pill (default CTA), secondary = near-black pill, ghost = text only, outline = 1.5px ink border */
  variant?: 'primary'|'secondary'|'ghost'|'outline';
  size?: 'sm'|'md'|'lg';
  /** circular arrow badge on the right: 'right' advances a flow, 'up-right' opens something new, false to omit */
  arrow?: 'right'|'up-right'|false;
  children?: React.ReactNode;
}
/**
 * The brand CTA: an orange pill with a circular arrow badge.
 * @startingPoint section="Core" subtitle="Pill buttons with circular arrow badges" viewport="700x180"
 */
export declare function Button(props: ButtonProps): JSX.Element;
export declare function Arrow(props: { dir?: 'right'|'up-right'|'down'; size?: number }): JSX.Element;
