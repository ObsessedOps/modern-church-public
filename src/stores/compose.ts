import { create } from "zustand";

interface ComposeState {
  isOpen: boolean;
  channel: "email" | "sms";
  recipientName: string;
  recipientEmail: string | null;
  recipientPhone: string | null;
  suggestedSubject: string;
  suggestedBody: string;
  context: string;
  openEmail: (opts: {
    name: string;
    email?: string | null;
    subject?: string;
    body?: string;
    context?: string;
  }) => void;
  openSms: (opts: {
    name: string;
    phone?: string | null;
    body?: string;
    context?: string;
  }) => void;
  close: () => void;
}

export const useComposeStore = create<ComposeState>()((set) => ({
  isOpen: false,
  channel: "email",
  recipientName: "",
  recipientEmail: null,
  recipientPhone: null,
  suggestedSubject: "",
  suggestedBody: "",
  context: "",
  openEmail: ({ name, email, subject, body, context }) =>
    set({
      isOpen: true,
      channel: "email",
      recipientName: name,
      recipientEmail: email ?? null,
      suggestedSubject: subject ?? "",
      suggestedBody: body ?? "",
      context: context ?? "",
    }),
  openSms: ({ name, phone, body, context }) =>
    set({
      isOpen: true,
      channel: "sms",
      recipientName: name,
      recipientPhone: phone ?? null,
      suggestedBody: body ?? "",
      context: context ?? "",
    }),
  close: () => set({ isOpen: false }),
}));
