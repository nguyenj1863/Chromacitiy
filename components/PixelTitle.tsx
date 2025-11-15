"use client";

import React from "react";

// Pixel patterns for each letter (5x7 grid, 1 = filled pixel, 0 = empty)
const letterPatterns: { [key: string]: number[][] } = {
  C: [
    [0, 1, 1, 1, 0],
    [1, 1, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 0, 0, 0],
    [0, 1, 1, 1, 0],
  ],
  H: [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
  ],
  R: [
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
    [1, 0, 1, 0, 0],
    [1, 0, 0, 1, 0],
    [1, 0, 0, 0, 1],
  ],
  O: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  M: [
    [1, 0, 0, 0, 1],
    [1, 1, 0, 1, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
  ],
  A: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
  ],
  I: [
    [1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [1, 1, 1, 1, 1],
  ],
  T: [
    [1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
  ],
  Y: [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
  ],
};

interface PixelLetterProps {
  letter: string;
  color: string;
  pixelSize?: number;
  spacing?: number;
}

function PixelLetter({ letter, color, pixelSize = 8, spacing = 2 }: PixelLetterProps) {
  const pattern = letterPatterns[letter.toUpperCase()];
  if (!pattern) return null;

  const width = pattern[0].length;
  const height = pattern.length;
  const svgWidth = width * (pixelSize + spacing) - spacing;
  const svgHeight = height * (pixelSize + spacing) - spacing;

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="pixel-letter-svg"
      style={{
        filter: `drop-shadow(0 0 10px ${color}) drop-shadow(0 0 20px ${color})`,
      }}
    >
      {pattern.map((row, y) =>
        row.map((pixel, x) => {
          if (pixel === 1) {
            return (
              <rect
                key={`${x}-${y}`}
                x={x * (pixelSize + spacing)}
                y={y * (pixelSize + spacing)}
                width={pixelSize}
                height={pixelSize}
                fill={color}
                stroke="none"
              />
            );
          }
          return null;
        })
      )}
    </svg>
  );
}

interface PixelTitleProps {
  text: string;
  colors: string[];
  pixelSize?: number;
  letterSpacing?: number;
}

export default function PixelTitle({
  text,
  colors,
  pixelSize = 12,
  letterSpacing = 8,
}: PixelTitleProps) {
  return (
    <div
      className="pixel-title-container"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: `${letterSpacing}px`,
        flexWrap: "wrap",
      }}
    >
      {text.split("").map((char, index) => {
        if (char === " ") {
          return <span key={index} style={{ width: `${pixelSize * 2}px` }} />;
        }
        const color = colors[index % colors.length];
        return (
          <div
            key={index}
            className="pixel-letter-wrapper"
            style={{
              animationDelay: `${index * 0.1}s`,
              '--letter-color': color,
            } as React.CSSProperties}
          >
            <PixelLetter
              letter={char}
              color={color}
              pixelSize={pixelSize}
            />
          </div>
        );
      })}
    </div>
  );
}

