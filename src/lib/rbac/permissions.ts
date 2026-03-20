// ─── Permission Registry ─────────────────────────────────
// All permissions are code-defined constants (not DB rows).
// Format: "module:action"
//
// This is the single source of truth for what capabilities
// exist in the system. Roles map to subsets of these.

export const PERMISSIONS = {
  // Intelligence
  dashboard: { view: "dashboard:view" },
  grace: { use: "grace:use" },
  alerts: {
    view: "alerts:view",
    review: "alerts:review",
    dismiss: "alerts:dismiss",
  },

  // Congregation
  members: {
    view: "members:view",
    edit: "members:edit",
    delete: "members:delete",
    export: "members:export",
  },
  groups: {
    view: "groups:view",
    edit: "groups:edit",
    delete: "groups:delete",
  },
  visitors: {
    view: "visitors:view",
    edit: "visitors:edit",
  },

  // Operations
  worship: {
    view: "worship:view",
    edit: "worship:edit",
  },
  giving: {
    view: "giving:view",
    export: "giving:export",
  },
  volunteers: {
    view: "volunteers:view",
    edit: "volunteers:edit",
  },
  events: {
    view: "events:view",
    edit: "events:edit",
  },

  // Administration
  campuses: {
    view: "campuses:view",
    manage: "campuses:manage",
  },
  communications: {
    view: "communications:view",
    send: "communications:send",
  },
  analytics: {
    view: "analytics:view",
    export: "analytics:export",
  },
  staff: {
    view: "staff:view",
    manage: "staff:manage",
  },
  integrations: {
    view: "integrations:view",
    manage: "integrations:manage",
  },
  compliance: {
    view: "compliance:view",
    manage: "compliance:manage",
  },
  settings: {
    view: "settings:view",
    manage: "settings:manage",
  },

  // Discipleship
  growthTrack: {
    view: "growth-track:view",
    edit: "growth-track:edit",
  },

  // Platform (super admin only)
  platform: {
    manage: "platform:manage",
    impersonate: "platform:impersonate",
  },
} as const;

// Flatten all permission strings into an ordered array.
// IMPORTANT: This order is used for bitfield encoding.
// Only APPEND new entries — never reorder or remove.
export const ALL_PERMISSIONS: string[] = Object.values(PERMISSIONS).flatMap(
  (module) => Object.values(module)
);

// Type-safe permission string union
export type Permission = (typeof ALL_PERMISSIONS)[number];
