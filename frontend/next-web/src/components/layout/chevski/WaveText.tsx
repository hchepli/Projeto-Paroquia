"use client";

import { useEffect, useState } from "react";

export default function WaveText() {
  const [offset, setOffset] = useState(50);

  useEffect(() => {
    const onScroll = () => {
      const value = (window.scrollY * 0.05) % 100;
      setOffset(value);
    };

    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <svg
      viewBox="0 0 1440 220"
      preserveAspectRatio="none"
      className="w-full h-40 sm:h-65 md:h-75 lg:h-90 xl:h-100"
    >
      <defs>
        <path
          id="wavePath"
          d="
            M0,150
            C260,80 560,100 760,130
            C980,160 1220,170 1440,110
          "
        />
      </defs>

      <path
        d="
          M0,150
          C260,80 560,100 760,130
          C980,160 1220,170 1440,110
        "
        fill="none"
        stroke="#7B1111"
        strokeWidth="120"
        strokeLinecap="round"
      />

      <text
        fill="white"
        fontSize="32"
        letterSpacing="8"
        fontWeight="600"
      >
        <textPath href="#wavePath" startOffset={`${offset}%`}>
          MISSAS - EVENTOS - AVISOS -
          MISSAS - EVENTOS - AVISOS -
        </textPath>
      </text>
    </svg>
  );
}