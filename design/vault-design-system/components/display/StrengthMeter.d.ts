/**
 * Password-strength bar; hue shifts weak→medium→strong.
 * @startingPoint section="Display" subtitle="Password strength bar with hue + label" viewport="700x120"
 */
export interface StrengthMeterProps {
  /** Strength score 0–100. @default 0 */
  value?: number;
  /** Hide the text label. @default false */
  compact?: boolean;
}

export function StrengthMeter(props: StrengthMeterProps): JSX.Element;
