import { create } from "zustand";
import { persist } from "zustand/middleware";

export const ALL_BRIEFING_CARDS = [
  "Attendance",
  "Visitor Pipeline",
  "Volunteer Coverage",
  "Active Alerts",
  "Pathways",
] as const;

export type BriefingCardId = (typeof ALL_BRIEFING_CARDS)[number];

interface GraceBriefingCardsState {
  visible: BriefingCardId[];
  toggle: (id: BriefingCardId) => void;
}

export const useGraceBriefingCardsStore = create<GraceBriefingCardsState>()(
  persist(
    (set) => ({
      visible: [...ALL_BRIEFING_CARDS],
      toggle: (id) =>
        set((state) => ({
          visible: state.visible.includes(id)
            ? state.visible.filter((v) => v !== id)
            : [...state.visible, id],
        })),
    }),
    { name: "modern-church-grace-briefing-cards" }
  )
);
