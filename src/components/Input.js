import React from 'react';
import './Input.css';

function Input({ placeholder, value, onChange }) {
  return (
    <input
      className="input"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export default Input;