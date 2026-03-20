import { create } from "zustand";
import { persist } from "zustand/middleware";

export const ALL_KPI_CARDS = [
  "Weekend Attendance",
  "Weekly Giving",
  "First-Time Visitors",
  "Salvations & Baptisms",
  "Active Volunteers",
  "Small Groups",
  "Growth Track",
] as const;

export type KpiCardId = (typeof ALL_KPI_CARDS)[number];

interface KpiCardsState {
  visible: KpiCardId[];
  toggle: (id: KpiCardId) => void;
  isVisible: (id: KpiCardId) => boolean;
}

export const useKpiCardsStore = create<KpiCardsState>()(
  persist(
    (set, get) => ({
      visible: [...ALL_KPI_CARDS],
      toggle: (id) =>
        set((state) => ({
          visible: state.visible.includes(id)
            ? state.visible.filter((v) => v !== id)
            : [...state.visible, id],
        })),
      isVisible: (id) => get().visible.includes(id),
    }),
    { name: "modern-church-kpi-cards" }
  )
);
