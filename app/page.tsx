"use client";

import BackgroundEffects from "@/components/home/BackgroundEffects";
import TitleSection from "@/components/home/TitleSection";
import MenuButtons from "@/components/home/MenuButtons";
import SettingsButton from "@/components/home/SettingsButton";

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
      <BackgroundEffects colors={colors} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center min-h-screen">
        <TitleSection title={title} colors={colors} />
        <MenuButtons />
        <SettingsButton />
      </div>
    </main>
  );
}

