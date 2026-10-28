import React from 'react';
import { Logo, LogoProps } from './ui/Logo';

export interface BrandLogoProps extends Omit<LogoProps, 'variant'> {
    variant?: 'icon' | 'lockup';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ variant = 'icon', ...props }) => {
    return <Logo variant={variant} {...props} />;
};

export default BrandLogo;
