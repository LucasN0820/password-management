import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Render value in JetBrains Mono — use for passwords & secrets. @default false */
  mono?: boolean;
  disabled?: boolean;
}

/**
 * Single-line text field on a warm surface; focus shows a clay ring.
 */
export function Input(props: InputProps): JSX.Element;
