import React from 'react';
import { Link } from 'react-router-dom';
import logoImage from '../assets/logo.png';

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  className?: string;
  linkTo?: string | null;
}

const Logo: React.FC<LogoProps> = ({
  size = 'medium',
  className = '',
  linkTo = '/'
}) => {
  const sizeClasses = {
    small: 'h-8',
    medium: 'h-10',
    large: 'h-12',
    xlarge: 'h-16'
  };

  const logoContent = (
    <div className={`flex items-center group ${className}`}>
      <img
        src={logoImage}
        alt="HireThemNow Logo"
        className={`${sizeClasses[size]} w-auto object-contain group-hover:scale-105 transition-transform duration-300`}
      />
    </div>
  );

  if (linkTo !== null) {
    return (
      <Link to={linkTo} className="inline-flex">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
};

export default Logo;
