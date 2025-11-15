"use client";

import { useRouter } from "next/navigation";

interface MenuButtonProps {
  label: string;
  onClick?: () => void;
  description?: string;
}

function MenuButton({ label, onClick, description }: MenuButtonProps) {
  return (
    <button
      className="pixel-button-simple"
      onClick={onClick}
      title={description}
    >
      {label}
    </button>
  );
}

export default function MenuButtons() {
  const router = useRouter();

  const buttons = [
    {
      label: "SOLO",
      onClick: () => router.push("/solo"),
      description: "Start solo game",
    },
    {
      label: "MULTIPLAYER",
      onClick: () => router.push("/multiplayer"),
      description: "Start multiplayer game (up to 2 players)",
    },
    {
      label: "ANALYTICS",
      onClick: () => router.push("/analytics"),
      description: "View game analytics",
    },
  ];

  return (
    <div className="flex flex-col gap-8 items-center mt-12">
      {buttons.map((button) => (
        <MenuButton
          key={button.label}
          label={button.label}
          onClick={button.onClick}
          description={button.description}
        />
      ))}
    </div>
  );
}

