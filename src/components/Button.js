import React from 'react';
import './Button.css';

function Button({ title, onClick, disabled }) {
  return (
    <button className="button" onClick={onClick} disabled={disabled}>
      {title}
    </button>
  );
}

export default Button;