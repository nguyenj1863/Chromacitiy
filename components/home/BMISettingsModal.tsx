"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/app/store/useStore";

interface BMISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BMISettingsModal({ isOpen, onClose }: BMISettingsModalProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<1 | 2>(1);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  const player1 = useStore((state) => state.player1);
  const player2 = useStore((state) => state.player2);
  const setPlayer1Data = useStore((state) => state.setPlayer1Data);
  const setPlayer2Data = useStore((state) => state.setPlayer2Data);

  // Load player data when player selection changes
  useEffect(() => {
    const playerData = selectedPlayer === 1 ? player1 : player2;
    setHeight(playerData.height?.toString() || "");
    setWeight(playerData.weight?.toString() || "");
    setAge(playerData.age?.toString() || "");
    setGender(playerData.gender || "");
  }, [selectedPlayer, player1, player2]);

  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => {
        document.removeEventListener("keydown", handleEsc);
      };
    }
  }, [isOpen, onClose]);

  // Handle click outside modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
      age: age ? parseInt(age) : null,
      gender: gender,
    };

    if (selectedPlayer === 1) {
      setPlayer1Data(data);
    } else {
      setPlayer2Data(data);
    }
    onClose();
  };

  const currentPlayerData = selectedPlayer === 1 ? player1 : player2;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-grey-world border-4 border-black p-8 max-w-md w-full mx-4 relative pixel-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl pixel-close-button"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          ×
        </button>

        {/* Title */}
        <h2
          className="text-white text-lg mb-2 text-center"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          BMI SETTINGS
        </h2>
        <p
          className="text-gray-400 text-xs mb-4 text-center"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          (OPTIONAL - FOR CALORIE TRACKING)
        </p>

        {/* Player Selection */}
        <div className="mb-6">
          <label
            className="block text-white text-xs mb-3 text-center"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            SELECT PLAYER
          </label>
          <div className="flex gap-4 justify-center">
            <button
              type="button"
              onClick={() => setSelectedPlayer(1)}
              className={`px-6 py-3 border-2 border-black transition-all ${
                selectedPlayer === 1
                  ? "bg-[#b0b0b0] text-white"
                  : "bg-gray-700 text-gray-400"
              }`}
              style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "10px" }}
            >
              PLAYER 1
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlayer(2)}
              className={`px-6 py-3 border-2 border-black transition-all ${
                selectedPlayer === 2
                  ? "bg-[#b0b0b0] text-white"
                  : "bg-gray-700 text-gray-400"
              }`}
              style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "10px" }}
            >
              PLAYER 2
            </button>
          </div>
        </div>

        {/* BMI Display */}
        {currentPlayerData.bmi && (
          <div className="mb-4 p-3 bg-gray-800 border-2 border-black text-center">
            <span
              className="text-white text-xs"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              BMI: {currentPlayerData.bmi}
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Height */}
          <div>
            <label
              className="block text-white text-xs mb-2"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              HEIGHT (CM)
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 text-white border-2 border-black focus:outline-none focus:border-gray-500 pixel-input"
              style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "12px" }}
              placeholder="170"
              required
            />
          </div>

          {/* Weight */}
          <div>
            <label
              className="block text-white text-xs mb-2"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              WEIGHT (KG)
            </label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 text-white border-2 border-black focus:outline-none focus:border-gray-500 pixel-input"
              style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "12px" }}
              placeholder="70"
              required
            />
          </div>

          {/* Age */}
          <div>
            <label
              className="block text-white text-xs mb-2"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              AGE
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 text-white border-2 border-black focus:outline-none focus:border-gray-500 pixel-input"
              style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "12px" }}
              placeholder="25"
              required
            />
          </div>

          {/* Gender */}
          <div>
            <label
              className="block text-white text-xs mb-2"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              GENDER
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-2 py-3 bg-gray-700 text-white border-2 border-black focus:outline-none focus:border-gray-500 pixel-input"
              style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "12px" }}
              required
            >
              <option value="">SELECT</option>
              <option value="male">MALE</option>
              <option value="female">FEMALE</option>
              <option value="non-binary">NON-BINARY</option>
              <option value="genderqueer">GENDERQUEER</option>
              <option value="agender">AGENDER</option>
              <option value="bigender">BIGENDER</option>
              <option value="genderfluid">GENDERFLUID</option>
              <option value="two-spirit">TWO-SPIRIT</option>
              <option value="other">OTHER</option>
              <option value="prefer-not-to-say">PREFER NOT TO SAY</option>
            </select>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="w-full pixel-button-simple mt-6"
          >
            SAVE
          </button>
        </form>
      </div>
    </div>
  );
}

