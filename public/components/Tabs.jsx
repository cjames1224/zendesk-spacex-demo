import * as React from 'react';
import { Button } from './Button';

export function Tabs({ tabs, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {tabs.map((tab) => (
        <Button
          key={tab.key}
          variant={value === tab.key ? 'default' : 'outline'}
          style={
            value === tab.key
              ? { background: '#fff', color: '#222', border: '2px solid #222' }
              : { background: '#fff', color: '#888', border: '1px solid #bbb' }
          }
          onClick={() => onChange(tab.key)}
        >
          {tab.name}
        </Button>
      ))}
    </div>
  );
}
