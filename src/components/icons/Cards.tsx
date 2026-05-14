import React from "react";

export const Cards = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
  >
    <path
      d="M 1.66 5.64 C 1.66 4.83 2.26 4.12 3.14 3.89 L 11.42 1.74 C 12.74 1.39 14.07 2.27 14.07 3.49 L 14.07 20.51 C 14.07 21.73 12.74 22.61 11.42 22.26 L 3.14 20.11 C 2.26 19.88 1.66 19.17 1.66 18.36 L 1.66 5.64 Z"
      stroke="currentColor"
      stroke-width="2"
      fill="none"
    />
    <path
      d="M 14.07 5.44 L 19.59 3.73 C 20.93 3.32 22.34 4.2 22.34 5.46 L 22.34 18.57 C 22.34 19.83 20.93 20.71 19.59 20.29 L 14.07 18.59"
      stroke="currentColor"
      stroke-width="2"
      fill="none"
    />
  </svg>
);
