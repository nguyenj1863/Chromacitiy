"use client";

interface ColorOrbProps {
  color: string;
  size?: number;
}

export default function ColorOrb({ color, size = 80 }: ColorOrbProps) {
  const pixelSize = 4; // Size of each pixel block
  const radius = 20; // Radius in pixels
  const centerX = 30;
  const centerY = 30;

  // Generate pixel blocks for a blocky circle - retro pixelated style
  const pixels: Array<{ x: number; y: number }> = [];
  for (let y = centerY - radius; y <= centerY + radius; y += pixelSize) {
    for (let x = centerX - radius; x <= centerX + radius; x += pixelSize) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      // Create a blocky circle outline
      if (distance <= radius && distance > radius - pixelSize * 2) {
        pixels.push({ x, y });
      }
    }
  }

  // Add inner pixels for depth - darker shade
  const innerPixels: Array<{ x: number; y: number }> = [];
  for (let y = centerY - radius + pixelSize * 2; y <= centerY + radius - pixelSize * 2; y += pixelSize) {
    for (let x = centerX - radius + pixelSize * 2; x <= centerX + radius - pixelSize * 2; x += pixelSize) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= radius - pixelSize * 2) {
        innerPixels.push({ x, y });
      }
    }
  }

  // Highlight pixels (top-left area) - lighter shade
  const highlightPixels: Array<{ x: number; y: number }> = [];
  for (let y = centerY - radius + pixelSize; y <= centerY - pixelSize * 3; y += pixelSize) {
    for (let x = centerX - radius + pixelSize; x <= centerX - pixelSize * 3; x += pixelSize) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= radius - pixelSize * 2) {
        highlightPixels.push({ x, y });
      }
    }
  }

  return (
    <div
      className="relative"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        imageRendering: "pixelated",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 60 60"
        style={{ imageRendering: "pixelated", shapeRendering: "crispEdges" }}
      >
        {/* Outer pixel blocks - border */}
        {pixels.map((pixel, index) => (
          <rect
            key={`outer-${index}`}
            x={pixel.x - pixelSize / 2}
            y={pixel.y - pixelSize / 2}
            width={pixelSize}
            height={pixelSize}
            fill={color}
            stroke="#000"
            strokeWidth="0.5"
          />
        ))}
        
        {/* Inner pixel blocks (main body) */}
        {innerPixels.map((pixel, index) => (
          <rect
            key={`inner-${index}`}
            x={pixel.x - pixelSize / 2}
            y={pixel.y - pixelSize / 2}
            width={pixelSize}
            height={pixelSize}
            fill={color}
            opacity="0.9"
            stroke="#000"
            strokeWidth="0.3"
          />
        ))}
        
        {/* Highlight pixels (lighter) */}
        {highlightPixels.map((pixel, index) => (
          <rect
            key={`highlight-${index}`}
            x={pixel.x - pixelSize / 2}
            y={pixel.y - pixelSize / 2}
            width={pixelSize}
            height={pixelSize}
            fill="rgba(255, 255, 255, 0.5)"
            stroke="#000"
            strokeWidth="0.2"
          />
        ))}
      </svg>
    </div>
  );
}

