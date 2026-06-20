import * as React from 'react';

export interface SwitchProps {
  /** On/off state. @default false */
  checked?: boolean;
  /** Fires with the next value when toggled. */
  onCheckedChange?: (checked: boolean) => void;
  /** @default 'default' */
  size?: 'sm' | 'default';
  disabled?: boolean;
}

/**
 * Pill toggle; checked fills with ink. Used for the generator's option list.
 */
export function Switch(props: SwitchProps): JSX.Element;
