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
      {/* Dark overlay background - same as modal */}
      <div className="fixed inset-0 bg-black bg-opacity-70 z-0"></div>
      
      {/* Background effects - particles need to be above the overlay */}
      <div className="fixed inset-0 z-10 pointer-events-none">
        <BackgroundEffects colors={colors} />
      </div>

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center min-h-screen">
        <TitleSection title={title} colors={colors} />
        <MenuButtons />
        <SettingsButton />
      </div>
    </main>
  );
}

