"use client";

interface BackgroundEffectsProps {
  colors: string[];
}

export default function BackgroundEffects({ colors }: BackgroundEffectsProps) {
  return (
    <>
      {/* Grey pixel background */}
      <div className="absolute inset-0">
        <div className="pixel-grid-grey"></div>
        <div className="grey-overlay"></div>
      </div>

      {/* Color particles - representing colors being restored */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => {
          const colorIndex = i % colors.length;
          return (
            <div
              key={i}
              className="color-particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${20 + Math.random() * 15}s`,
                backgroundColor: colors[colorIndex],
                boxShadow: `0 0 15px ${colors[colorIndex]}, 0 0 30px ${colors[colorIndex]}, 0 0 45px ${colors[colorIndex]}`,
              }}
            />
          );
        })}
      </div>
    </>
  );
}

