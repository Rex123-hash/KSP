/**
 * Mock data for the Settings page.
 * TEMPORARY / illustrative. Account and preference values would come from the
 * signed-in Employee record and per-user settings once auth is wired.
 *
 * The comp includes a Light/Dark theme control, but dark mode was removed from
 * this product (see tokens.css). The Theme row is rendered Light-only, with the
 * Dark option present-but-disabled, rather than reintroducing a second theme.
 */

import type { IconName } from "../components/Icon";

export const settingsTabs = [
  "Profile",
  "Preferences",
  "Notifications",
  "Access & Roles",
  "System",
];

export const profile = {
  name: "R. Sharath Kumar, IPS",
  designation: "Assistant Superintendent of Police",
  division: "Bengaluru South Division",
  employeeId: "KSP/ASP/BS/2018/0456",
  email: "sharath.kumar@ksp.gov.in",
  phone: "+91 98765 43210",
};

export const preferences: { icon: IconName; label: string; value: string }[] = [
  { icon: "globe", label: "Language", value: "English" },
  { icon: "calendar", label: "Date Format", value: "DD MMM YYYY" },
  { icon: "clock", label: "Time Format", value: "12 Hour (AM/PM)" },
  { icon: "command", label: "Default Dashboard", value: "Command View" },
  { icon: "file-text", label: "Items Per Page", value: "20" },
];

export type NotificationPref = { icon: IconName; label: string; on: boolean };

export const notifications: NotificationPref[] = [
  { icon: "bell", label: "New Case Alerts", on: true },
  { icon: "map-pin", label: "Crime Hotspot Alerts", on: true },
  { icon: "shield-check", label: "Low Clearance Rate Alerts", on: true },
  { icon: "tag", label: "Court Updates", on: true },
  { icon: "alert", label: "System Announcements", on: true },
  { icon: "file-text", label: "Weekly Reports", on: false },
];

export const accessRole = {
  role: "Assistant Superintendent of Police",
  accessLevel: "Division Level",
  scope: "Bengaluru South Division",
};

export const permissions = [
  "View Dashboard",
  "View Cases",
  "Add Notes",
  "Generate Reports",
  "Manage Alerts",
  "Export Data",
  "User Management",
  "System Settings",
];

export const systemInfo: { icon: IconName; label: string; value: string; badge?: "good" | "info" }[] = [
  { icon: "settings", label: "System Version", value: "v2.4.1" },
  { icon: "clock", label: "Last Updated", value: "22 Jul 2026, 09:32 AM" },
  { icon: "file-text", label: "Database Status", value: "Operational", badge: "good" },
  { icon: "chart-up", label: "Uptime", value: "15d 6h 24m" },
  { icon: "arrow-down", label: "Last Backup", value: "22 Jul 2026, 02:30 AM" },
  { icon: "shield-check", label: "Environment", value: "Production", badge: "info" },
];
