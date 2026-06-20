export interface SliderProps {
  /** Current value. @default 16 */
  value?: number;
  /** @default 4 */
  min?: number;
  /** @default 64 */
  max?: number;
  /** @default 1 */
  step?: number;
  /** Fires with the new value on drag/click. */
  onValueChange?: (value: number) => void;
}

/**
 * Single-thumb range slider; ink-filled track. Used for password length.
 */
export function Slider(props: SliderProps): JSX.Element;
