import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Palette + shape. 'mono' renders a square monospace tag. @default 'clay' */
  tone?: 'clay' | 'neutral' | 'success' | 'warning' | 'danger' | 'mono' | 'outline';
  children?: React.ReactNode;
}

/**
 * Small status/label pill. Use `mono` for crypto tags (AES-256, PBKDF2).
 */
export function Badge(props: BadgeProps): JSX.Element;
