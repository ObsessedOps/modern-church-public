import {
  LayoutDashboard,
  Sparkles,
  Bell,
  Users,
  UsersRound,
  UserPlus,
  Music,
  Heart,
  HandHeart,
  Calendar,
  Building2,
  MessageSquare,
  BarChart3,
  UserCog,
  ShieldCheck,
  Settings,
  Plug,
  Footprints,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
  color?: string;
  isStub?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

// Flat list for legacy compatibility (mobileNav, badge lookups, etc.)
export const navigation: NavItem[] = [
  { id: "dashboard", label: "Command Center", path: "/", icon: LayoutDashboard },
  { id: "grace", label: "Grace AI", path: "/grace", icon: Sparkles, color: "grace" },
  { id: "alerts", label: "Alerts", path: "/alerts", icon: Bell, color: "alert" },
  { id: "members", label: "Members", path: "/members", icon: Users },
  { id: "groups", label: "Groups", path: "/groups", icon: UsersRound },
  { id: "visitors", label: "Visitors", path: "/visitors", icon: UserPlus },
  { id: "worship", label: "Worship", path: "/worship", icon: Music },
  { id: "giving", label: "Giving", path: "/giving", icon: Heart },
  { id: "volunteers", label: "Volunteers", path: "/volunteers", icon: HandHeart },
  { id: "events", label: "Events", path: "/events", icon: Calendar },
  { id: "campuses", label: "Campuses", path: "/campuses", icon: Building2 },
  { id: "communications", label: "Communications", path: "/communications", icon: MessageSquare },
  { id: "analytics", label: "Analytics", path: "/analytics", icon: BarChart3 },
  { id: "staff", label: "Staff", path: "/staff", icon: UserCog },
  { id: "integrations", label: "Integrations", path: "/integrations", icon: Plug },
  { id: "compliance", label: "Compliance", path: "/compliance", icon: ShieldCheck },
  { id: "settings", label: "Settings", path: "/settings", icon: Settings },
  { id: "growth-track", label: "Growth Track", path: "/growth-track", icon: Footprints },
];

// Grouped navigation for the sidebar
export const navGroups: NavGroup[] = [
  {
    label: "INTELLIGENCE",
    items: [
      { id: "dashboard", label: "Command Center", path: "/", icon: LayoutDashboard },
      { id: "grace", label: "Grace AI", path: "/grace", icon: Sparkles, color: "grace" },
      { id: "alerts", label: "Alerts", path: "/alerts", icon: Bell, color: "alert" },
    ],
  },
  {
    label: "CONGREGATION",
    items: [
      { id: "members", label: "Members", path: "/members", icon: Users },
      { id: "groups", label: "Groups", path: "/groups", icon: UsersRound },
      { id: "visitors", label: "Visitors", path: "/visitors", icon: UserPlus },
      { id: "growth-track", label: "Growth Track", path: "/growth-track", icon: Footprints },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { id: "worship", label: "Worship", path: "/worship", icon: Music },
      { id: "giving", label: "Giving", path: "/giving", icon: Heart },
      { id: "volunteers", label: "Volunteers", path: "/volunteers", icon: HandHeart },
      { id: "events", label: "Events", path: "/events", icon: Calendar },
    ],
  },
  {
    label: "ADMINISTRATION",
    items: [
      { id: "campuses", label: "Campuses", path: "/campuses", icon: Building2 },
      { id: "communications", label: "Communications", path: "/communications", icon: MessageSquare },
      { id: "analytics", label: "Analytics", path: "/analytics", icon: BarChart3 },
      { id: "staff", label: "Staff", path: "/staff", icon: UserCog },
      { id: "integrations", label: "Integrations", path: "/integrations", icon: Plug },
      { id: "compliance", label: "Compliance", path: "/compliance", icon: ShieldCheck },
      { id: "settings", label: "Settings", path: "/settings", icon: Settings },
    ],
  },
];

// Bottom tab bar for mobile
export const mobileNav: NavItem[] = [
  navigation[0],  // Command Center
  navigation[3],  // Members
  navigation[1],  // Grace AI
  navigation[7],  // Giving
];
