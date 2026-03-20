// ─── Role → Permission Mappings ──────────────────────────
// Each role gets a pre-defined set of permissions.
// Org admins can customize per-user via overrides.

import { PERMISSIONS as P } from "./permissions";

const ALL_VIEW = [
  P.dashboard.view,
  P.grace.use,
  P.alerts.view,
  P.members.view,
  P.groups.view,
  P.visitors.view,
  P.worship.view,
  P.giving.view,
  P.volunteers.view,
  P.events.view,
  P.campuses.view,
  P.communications.view,
  P.analytics.view,
  P.staff.view,
  P.integrations.view,
  P.compliance.view,
  P.settings.view,
  P.growthTrack.view,
  P.thresholds.view,
  P.insights.view,
  P.pathways.view,
];

const ALL_EDIT = [
  P.alerts.review,
  P.alerts.dismiss,
  P.members.edit,
  P.members.delete,
  P.members.export,
  P.groups.edit,
  P.groups.delete,
  P.visitors.edit,
  P.worship.edit,
  P.giving.export,
  P.volunteers.edit,
  P.events.edit,
  P.campuses.manage,
  P.communications.send,
  P.analytics.export,
  P.staff.manage,
  P.integrations.manage,
  P.compliance.manage,
  P.settings.manage,
  P.growthTrack.edit,
  P.thresholds.manage,
  P.insights.share,
  P.pathways.manage,
];

// Full church access (everything except platform-level)
const FULL_CHURCH = [...ALL_VIEW, ...ALL_EDIT];

/**
 * Default permission sets per role.
 * SUPER_ADMIN uses '*' wildcard and bypasses all checks.
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  // ─── Platform ───────────────────────────────────
  SUPER_ADMIN: ["*"],

  // ─── Church-wide leadership (org admins) ────────
  SENIOR_PASTOR: FULL_CHURCH,
  EXECUTIVE_PASTOR: FULL_CHURCH,

  // ─── Campus-scoped leadership ───────────────────
  // Same permissions as org admins, but queries filter by campusId
  CAMPUS_PASTOR: [
    ...ALL_VIEW,
    P.alerts.review,
    P.alerts.dismiss,
    P.members.edit,
    P.members.export,
    P.groups.edit,
    P.visitors.edit,
    P.worship.edit,
    P.giving.export,
    P.volunteers.edit,
    P.events.edit,
    P.communications.send,
    P.analytics.export,
    P.compliance.view,
    P.growthTrack.edit,
    // No: staff:manage, settings:manage, integrations:manage, campuses:manage
  ],

  // ─── Department roles ───────────────────────────
  YOUTH_PASTOR: [
    P.dashboard.view,
    P.grace.use,
    P.alerts.view,
    P.members.view,
    P.groups.view,
    P.groups.edit,
    P.visitors.view,
    P.visitors.edit,
    P.events.view,
    P.events.edit,
    P.volunteers.view,
    P.analytics.view,
    P.growthTrack.view,
    P.thresholds.view,
    P.thresholds.manage,
    P.insights.view,
    P.insights.share,
  ],

  KIDS_PASTOR: [
    P.dashboard.view,
    P.grace.use,
    P.alerts.view,
    P.members.view,
    P.groups.view,
    P.groups.edit,
    P.volunteers.view,
    P.volunteers.edit,
    P.events.view,
    P.events.edit,
    P.compliance.view, // background checks for kids workers
    P.thresholds.view,
    P.thresholds.manage,
    P.insights.view,
    P.insights.share,
  ],

  WORSHIP_LEADER: [
    P.dashboard.view,
    P.grace.use,
    P.alerts.view,
    P.worship.view,
    P.worship.edit,
    P.volunteers.view,
    P.volunteers.edit,
    P.events.view,
    P.events.edit,
    P.members.view,
    P.thresholds.view,
    P.thresholds.manage,
    P.insights.view,
    P.insights.share,
  ],

  GROUPS_DIRECTOR: [
    P.dashboard.view,
    P.grace.use,
    P.alerts.view,
    P.members.view,
    P.members.edit,
    P.groups.view,
    P.groups.edit,
    P.groups.delete,
    P.visitors.view,
    P.analytics.view,
    P.growthTrack.view,
    P.growthTrack.edit,
    P.thresholds.view,
    P.thresholds.manage,
    P.insights.view,
    P.insights.share,
  ],

  OUTREACH_DIRECTOR: [
    P.dashboard.view,
    P.grace.use,
    P.alerts.view,
    P.members.view,
    P.visitors.view,
    P.visitors.edit,
    P.communications.view,
    P.communications.send,
    P.events.view,
    P.events.edit,
    P.analytics.view,
    P.growthTrack.view,
    P.growthTrack.edit,
    P.thresholds.view,
    P.thresholds.manage,
    P.insights.view,
    P.insights.share,
  ],

  ACCOUNTING: [
    P.dashboard.view,
    P.grace.use,
    P.giving.view,
    P.giving.export,
    P.analytics.view,
    P.analytics.export,
    P.compliance.view,
    P.members.view, // need member names for giving records
    P.thresholds.view,
    P.thresholds.manage,
    P.insights.view,
    P.insights.share,
  ],

  FACILITIES: [
    P.dashboard.view,
    P.grace.use,
    P.campuses.view,
    P.campuses.manage,
    P.volunteers.view,
    P.events.view,
    P.thresholds.view,
    P.thresholds.manage,
    P.insights.view,
    P.insights.share,
  ],

  COMMUNICATIONS_DIRECTOR: [
    P.dashboard.view,
    P.grace.use,
    P.members.view,
    P.members.export,
    P.communications.view,
    P.communications.send,
    P.analytics.view,
    P.analytics.export,
    P.groups.view,
    P.thresholds.view,
    P.thresholds.manage,
    P.insights.view,
    P.insights.share,
  ],

  // ─── General ────────────────────────────────────
  STAFF: [
    ...ALL_VIEW,
    P.members.edit,
    P.groups.edit,
    P.visitors.edit,
    P.events.edit,
  ],

  VOLUNTEER_LEADER: [
    P.dashboard.view,
    P.grace.use,
    P.volunteers.view,
    P.volunteers.edit,
    P.members.view,
    P.groups.view,
    P.events.view,
    P.thresholds.view,
    P.insights.view,
  ],

  READ_ONLY: [
    ...ALL_VIEW,
    // No edit/manage/delete/export permissions
  ],
};
