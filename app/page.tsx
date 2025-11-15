"use client";

import PixelTitle from "@/components/PixelTitle";

export default function Home() {
  const title = "CHROMACITY";
  const colors = [
    "#FF6B6B", // Red
    "#4ECDC4", // Teal
    "#45B7D1", // Blue
    "#FFA07A", // Light Salmon
    "#98D8C8", // Mint
    "#F7DC6F", // Yellow
    "#BB8FCE", // Purple
    "#85C1E2", // Sky Blue
    "#F8B739", // Orange
    "#52BE80", // Green
  ];

  return (
    <main className="min-h-screen bg-grey-world relative overflow-hidden">
      {/* Grey pixel background */}
      <div className="absolute inset-0">
        <div className="pixel-grid-grey"></div>
        <div className="grey-overlay"></div>
      </div>

      {/* Color particles - representing colors being restored */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => {
          const colorIndex = i % colors.length;
          return (
            <div
              key={i}
              className="color-particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${12 + Math.random() * 8}s`,
                backgroundColor: colors[colorIndex],
                boxShadow: `0 0 10px ${colors[colorIndex]}, 0 0 20px ${colors[colorIndex]}`,
              }}
            />
          );
        })}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center min-h-screen">
        {/* Title at the top with colorful pixels - representing the colors to restore */}
        <div className="mt-24 mb-8">
          <div className="flex justify-center">
            <div className="pixel-title-responsive">
              <PixelTitle
                text={title}
                colors={colors}
                pixelSize={10}
                letterSpacing={6}
              />
            </div>
          </div>
          {/* Story subtitle */}
          <p className="text-grey-text text-center mt-12 text-xs md:text-sm px-4 max-w-2xl mx-auto leading-relaxed">
            THE VILLAIN STOLE ALL COLORS FROM THE WORLD
            <br />
            RESTORE THE COLORS AND BRING LIFE BACK
          </p>
        </div>

        {/* Three buttons - simple text style */}
        <div className="flex flex-col gap-8 items-center mt-12">
          <button className="pixel-button-simple">
            SOLO
          </button>
          <button className="pixel-button-simple">
            MULTIPLAYER
          </button>
          <button className="pixel-button-simple">
            ANALYTICS
          </button>
        </div>

        {/* Gear icon in bottom left */}
        <div className="absolute bottom-8 left-8">
          <button className="pixel-button-icon-modern group">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pixel-stroke gear-icon"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
            </svg>
          </button>
        </div>
      </div>
    </main>
  );
}

