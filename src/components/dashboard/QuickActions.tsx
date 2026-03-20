"use client";

import { UserPlus, ClipboardCheck, Heart, Sparkles } from "lucide-react";
import { useToastStore } from "@/stores/toast";

const actions = [
  {
    label: "Add Member",
    icon: UserPlus,
    action: "add_member",
  },
  {
    label: "Record Attendance",
    icon: ClipboardCheck,
    action: "record_attendance",
  },
  {
    label: "Log Contribution",
    icon: Heart,
    action: "log_contribution",
  },
  {
    label: "Add Life Event",
    icon: Sparkles,
    action: "add_life_event",
  },
];

export function QuickActions() {
  const addToast = useToastStore((s) => s.add);

  function handleAction(action: string, label: string) {
    addToast("info", `${label} form coming soon`);
  }

  return (
    <div className="flex gap-2 sm:grid sm:grid-cols-4">
      {actions.map(({ label, icon: Icon, action }) => (
        <button
          key={action}
          onClick={() => handleAction(action, label)}
          title={label}
          className="btn btn-outline min-h-[44px] gap-2 border-violet-200 text-violet-700 hover:bg-violet-50 active:scale-95 dark:border-violet-500/30 dark:text-violet-400 dark:hover:bg-violet-500/10"
        >
          <Icon className="h-4 w-4" />
          <span className="hidden text-xs font-medium sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
