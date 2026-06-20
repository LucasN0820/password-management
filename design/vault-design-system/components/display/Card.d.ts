import * as React from 'react';

/**
 * Warm paper container with hairline border + soft rest shadow.
 * @startingPoint section="Display" subtitle="Warm paper card with optional hover lift" viewport="700x220"
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Lift on hover (feature-grid behaviour). @default false */
  hoverable?: boolean;
  /** Surface tone. @default 'card' */
  tone?: 'card' | 'cream' | 'dark';
  children?: React.ReactNode;
}

export function Card(props: CardProps): JSX.Element;
