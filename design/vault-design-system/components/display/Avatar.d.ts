export interface AvatarProps {
  /** Initial shown when no image. */
  letter?: string;
  /** Background tint (services use brand-tinted pastels). @default '#E8F0FE' */
  tone?: string;
  /** 'square' for services, 'round' for people. @default 'square' */
  shape?: 'square' | 'round';
  /** Pixel size. @default 34 */
  size?: number;
  /** Optional image source. */
  src?: string;
}

/**
 * Letter/image tile for a vault entry or person.
 */
export function Avatar(props: AvatarProps): JSX.Element;
