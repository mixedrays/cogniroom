import React from "react";

export const Cards = ({ className }: { className?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M3 4.51693C3 4.07358 3.29192 3.68315 3.71717 3.55776L7.71717 2.37827C8.3578 2.18937 9 2.66954 9 3.33744V12.6626C9 13.3305 8.35779 13.8106 7.71717 13.6217L3.71717 12.4422C3.29192 12.3168 3 11.9264 3 11.4831V4.51693Z"
      stroke="currentColor"
    />
    <path
      d="M9 4.3986L11.6699 3.46505C12.3201 3.23774 13 3.7203 13 4.40902V11.591C13 12.2797 12.3201 12.7623 11.6699 12.5349L9 11.6014"
      stroke="currentColor"
    />
  </svg>
);
