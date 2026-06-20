import * as React from 'react';

/**
 * The primary action control.
 * @startingPoint section="Forms" subtitle="Ink-filled primary button with full variant set" viewport="700x140"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. @default 'default' */
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
  /** Control height/padding. @default 'default' */
  size?: 'sm' | 'default' | 'lg' | 'icon' | 'icon-sm';
  disabled?: boolean;
  children?: React.ReactNode;
}

/** Ink-filled by default; `outline`/`ghost` for secondary, `destructive` for delete. */
export function Button(props: ButtonProps): JSX.Element;
