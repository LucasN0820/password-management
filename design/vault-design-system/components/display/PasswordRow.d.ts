/**
 * One row of the password list — icon, title/username, favorite, timestamp.
 * @startingPoint section="Display" subtitle="Password list row with icon, favorite & time" viewport="700x80"
 */
export interface PasswordRowProps {
  /** Entry name, e.g. "Google". */
  title?: string;
  /** Account/username line. */
  username?: string;
  /** Override the icon-tile initial (defaults to first letter of title). */
  letter?: string;
  /** Icon-tile tint. @default 'var(--paper-5)' */
  tone?: string;
  /** Favicon/logo image; replaces the letter tile. */
  iconSrc?: string;
  /** Show filled favorite star. @default false */
  favorite?: boolean;
  /** Trailing relative time, e.g. "2h". */
  timeAgo?: string;
  /** Warm active fill. @default false */
  selected?: boolean;
  onClick?: () => void;
  onToggleFavorite?: () => void;
}

export function PasswordRow(props: PasswordRowProps): JSX.Element;
