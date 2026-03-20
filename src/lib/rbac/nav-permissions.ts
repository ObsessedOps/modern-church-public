// ─── Nav Item → Permission Mapping ───────────────────────
// Maps each sidebar nav item id to the permission required
// to see it. Used by Sidebar and BottomTabBar to filter.

export const NAV_PERMISSIONS: Record<string, string> = {
  dashboard: "dashboard:view",
  grace: "grace:use",
  alerts: "alerts:view",
  insights: "insights:view",
  members: "members:view",
  groups: "groups:view",
  visitors: "visitors:view",
  "connect-cards": "visitors:view",
  worship: "worship:view",
  giving: "giving:view",
  volunteers: "volunteers:view",
  events: "events:view",
  campuses: "campuses:view",
  communications: "communications:view",
  analytics: "analytics:view",
  staff: "staff:view",
  integrations: "integrations:view",
  compliance: "compliance:view",
  settings: "settings:view",
  "growth-track": "growth-track:view",
  pathways: "pathways:view",
};
