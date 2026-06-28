
import { INDIA_STATES_AND_DISTRICTS } from "./indiaGeo.js";

// Super Admin
export const AUTHORITY_EMAILS = {
  "rachitmnit123@gmail.com": {
    role: "SUPER_ADMIN",
    department: "ALL",
    state: null,
    district: null,
    displayName: "Super Admin",
    jurisdiction: "All India",
  },
};

// Auto-generate authority entries for all districts and departments
const DEPARTMENTS = [
  "WATER_INFRASTRUCTURE",
  "ROAD_DAMAGE",
  "ELECTRICAL",
  "SANITATION",
  "DRAINAGE",
  "PUBLIC_SAFETY",
  "ENCROACHMENT",
  "GREEN_SPACES",
  "POLLUTION",
  "HEALTHCARE",
  "EDUCATION",
  "TRANSPORT",
];

const DEPARTMENT_NAMES = {
  WATER_INFRASTRUCTURE: "Jal Board",
  ROAD_DAMAGE: "PWD",
  ELECTRICAL: "Electricity Board",
  SANITATION: "Sanitation Dept",
  DRAINAGE: "Drainage Dept",
  PUBLIC_SAFETY: "Safety Dept",
  ENCROACHMENT: "Anti-Encroachment",
  GREEN_SPACES: "Horticulture",
  POLLUTION: "Pollution Control",
  HEALTHCARE: "Health Dept",
  EDUCATION: "Education Dept",
  TRANSPORT: "Transport Authority",
};

// Generate email-based authority config for each state+district+department
export function getAuthorityConfig(email) {
  // Check static entries first
  if (AUTHORITY_EMAILS[email]) return AUTHORITY_EMAILS[email];

  // Parse dynamic authority emails
  // Format: department.district.state@civicpulse.com
  // Example: water_infrastructure.noida.uttar_pradesh@civicpulse.com
  const match = email.match(/^([a-z_]+)\.([a-z_]+)\.([a-z_]+)@civicpulse\.com$/);
  if (!match) return null;

  const dept = match[1].toUpperCase();
  const district = match[2].replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const state = match[3].replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  if (!DEPARTMENTS.includes(dept)) return null;

  const stateDistricts = INDIA_STATES_AND_DISTRICTS[state];
  if (!stateDistricts) return null;

  const matchedDistrict = stateDistricts.find(d => d.toLowerCase() === district.toLowerCase());
  if (!matchedDistrict) return null;

  return {
    role: "AUTHORITY",
    department: dept,
    state: state,
    district: matchedDistrict,
    displayName: `${DEPARTMENT_NAMES[dept]} - ${matchedDistrict}`,
    jurisdiction: `${matchedDistrict}, ${state}`,
  };
}

export function isAuthorityEmail(email) {
  return !!getAuthorityConfig(email);
}

export function generateAuthorityEmail(department, district, state) {
  const dept = department.toLowerCase();
  const dist = district.toLowerCase().replace(/\s+/g, "_");
  const st = state.toLowerCase().replace(/\s+/g, "_");
  return `${dept}.${dist}.${st}@civicpulse.com`;
}

export const CITIZEN_NAV = [
  { id: "home", icon: "🏠", label: "Home" },
  { id: "report", icon: "📷", label: "Report Issue" },
  { id: "myreports", icon: "📋", label: "My Reports" },
  { id: "rewards", icon: "🏆", label: "Rewards" },
  { id: "predictive", icon: "🔮", label: "Predictions" },
];

export const AUTHORITY_NAV = [
  { id: "authority", icon: "🏛️", label: "Issue Queue" },
  { id: "home", icon: "🗺️", label: "Live Map" },
  { id: "predictive", icon: "🔮", label: "Analytics" },
];