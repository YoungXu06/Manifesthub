import React from 'react';

/**
 * Skeleton placeholder for loading states.
 * Usage: <Skeleton className="h-4 w-24" />
 */
const Skeleton = ({ className = '' }) => (
  <div aria-hidden="true" className={`skeleton ${className}`} />
);

export default Skeleton;
