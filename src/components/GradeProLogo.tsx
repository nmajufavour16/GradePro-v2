import React from 'react';

export function GradeProLogo({ className = "h-8" }: { className?: string }) {
  return (
    <img 
      src="/logo.svg" 
      alt="GradePro Logo" 
      className={`object-contain ${className}`}
      referrerPolicy="no-referrer"
    />
  );
}
