import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PlayerData {
  height: number | null;
  weight: number | null;
  age: number | null;
  gender: string;
  bmi: number | null;
}

interface AppState {
  player1: PlayerData;
  player2: PlayerData;
  setPlayer1Data: (data: Partial<PlayerData>) => void;
  setPlayer2Data: (data: Partial<PlayerData>) => void;
  calculateBMI: (player: 1 | 2) => number | null;
}

const calculateBMI = (height: number | null, weight: number | null): number | null => {
  if (!height || !weight || height <= 0 || weight <= 0) return null;
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  return Math.round(bmi * 10) / 10; // Round to 1 decimal place
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      player1: {
        height: null,
        weight: null,
        age: null,
        gender: '',
        bmi: null,
      },
      player2: {
        height: null,
        weight: null,
        age: null,
        gender: '',
        bmi: null,
      },
      setPlayer1Data: (data) => {
        const player1 = { ...get().player1, ...data };
        const bmi = calculateBMI(player1.height, player1.weight);
        set({ player1: { ...player1, bmi } });
      },
      setPlayer2Data: (data) => {
        const player2 = { ...get().player2, ...data };
        const bmi = calculateBMI(player2.height, player2.weight);
        set({ player2: { ...player2, bmi } });
      },
      calculateBMI: (player) => {
        const playerData = player === 1 ? get().player1 : get().player2;
        return calculateBMI(playerData.height, playerData.weight);
      },
    }),
    {
      name: 'chromacity-storage',
    }
  )
);

