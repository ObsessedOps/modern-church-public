"use client";

import { useComposeStore } from "@/stores/compose";
import { ComposeModal } from "./ComposeModal";

export function GlobalCompose() {
  const store = useComposeStore();

  return (
    <ComposeModal
      isOpen={store.isOpen}
      onClose={store.close}
      channel={store.channel}
      recipientName={store.recipientName}
      recipientEmail={store.recipientEmail}
      recipientPhone={store.recipientPhone}
      suggestedSubject={store.suggestedSubject}
      suggestedBody={store.suggestedBody}
      context={store.context}
    />
  );
}
