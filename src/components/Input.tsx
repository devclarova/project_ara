import React from 'react';
import styles from './Input.module.css';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
  variant?: 'default' | 'search';
};

const Input = ({ className = '', variant = 'default', ...props }: InputProps) => {
  const classNames = `${styles.input} ${styles[variant]} ${className}`;
  return <input className={classNames} {...props} />;
};

export default Input;
