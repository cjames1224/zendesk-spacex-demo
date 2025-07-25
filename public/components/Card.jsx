import * as React from 'react';

export function Card({ className = '', style = {}, children, ...props }) {
  return (
    <div
      style={{
        borderRadius: 16,
        background: '#fff',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        padding: 32,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
