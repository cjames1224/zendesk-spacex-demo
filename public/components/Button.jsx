import * as React from 'react';

const buttonVariants = {
  default: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    background: '#222',
    color: '#fff',
    padding: '8px 16px',
    fontSize: 15,
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    transition: 'background 0.2s',
  },
  outline: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    background: '#fff',
    color: '#222',
    padding: '8px 16px',
    fontSize: 15,
    fontWeight: 500,
    border: '1px solid #bbb',
    cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    transition: 'background 0.2s',
  },
};

export const Button = React.forwardRef(
  ({ className = '', variant = 'default', style = {}, ...props }, ref) => {
    return (
      <button
        style={{
          ...(buttonVariants[variant] || buttonVariants.default),
          ...style,
        }}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
