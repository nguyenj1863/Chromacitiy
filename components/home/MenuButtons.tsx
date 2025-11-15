"use client";

interface MenuButtonProps {
  label: string;
  onClick?: () => void;
}

function MenuButton({ label, onClick }: MenuButtonProps) {
  return (
    <button className="pixel-button-simple" onClick={onClick}>
      {label}
    </button>
  );
}

export default function MenuButtons() {
  const buttons = [
    { label: "SOLO", onClick: () => console.log("Solo clicked") },
    { label: "MULTIPLAYER", onClick: () => console.log("Multiplayer clicked") },
    { label: "ANALYTICS", onClick: () => console.log("Analytics clicked") },
  ];

  return (
    <div className="flex flex-col gap-8 items-center mt-12">
      {buttons.map((button) => (
        <MenuButton
          key={button.label}
          label={button.label}
          onClick={button.onClick}
        />
      ))}
    </div>
  );
}

