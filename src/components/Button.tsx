import type { ButtonHTMLAttributes } from 'react';
import { buttonClass, type ButtonSize, type ButtonVariant } from '../utilities/classes';
import { Icon, type IconName } from './Icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
}

export const Button = ({ variant = 'secondary', size = 'md', icon, className = '', type = 'button', children, ...rest }: ButtonProps) => (
  <button type={type} className={`${buttonClass(variant, size)} ${className}`} {...rest}>
    {icon && <Icon name={icon} />}
    {children}
  </button>
);
