import { db } from "../firebase.js";
import { doc, updateDoc, getDoc, increment } from "firebase/firestore";

export const XP_REWARDS = {
  REPORT_SUBMITTED: 25,
  REPORT_VERIFIED: 15,
  REPORT_RESOLVED: 50,
  VERIFICATION_GIVEN: 10,
  FIRST_REPORT_IN_AREA: 100,
  HIGH_SEVERITY_BONUS: 25,
  CATEGORY_EXPERT_BONUS: 15,
  TRENDING_REPORT_BONUS: 20,
};

export const LEVELS = [
  { level: 1, title: "Watchful Citizen", minXp: 0, maxXp: 100, icon: "👀" },
  { level: 2, title: "Street Guardian", minXp: 100, maxXp: 300, icon: "🛡️" },
  { level: 3, title: "Ward Champion", minXp: 300, maxXp: 700, icon: "⚔️" },
  { level: 4, title: "Civic Hero", minXp: 700, maxXp: 1500, icon: "🦸" },
  { level: 5, title: "Community Legend", minXp: 1500, maxXp: 3000, icon: "🌟" },
  { level: 6, title: "City Protector", minXp: 3000, maxXp: 6000, icon: "🏰" },
  { level: 7, title: "Urban Legend", minXp: 6000, maxXp: Infinity, icon: "👑" },
];

export const BADGES = [
  // Reporter Badges
  { id: "first_report", title: "First Spotter", description: "Submitted your first report", icon: "🔭", category: "reporter", rarity: "common" },
  { id: "street_hawk", title: "Street Hawk", description: "Submitted 5 reports", icon: "🦅", category: "reporter", rarity: "common" },
  { id: "city_wolf", title: "City Wolf", description: "Submitted 25 reports", icon: "🐺", category: "reporter", rarity: "rare" },
  { id: "urban_lion", title: "Urban Lion", description: "Submitted 50 reports", icon: "🦁", category: "reporter", rarity: "epic" },

  // Impact Badges
  { id: "catalyst", title: "Catalyst", description: "Your report got resolved within 24hrs", icon: "⚡", category: "impact", rarity: "rare" },
  { id: "bull_eye", title: "Bull's Eye", description: "Reported a severity 9+ issue", icon: "🎯", category: "impact", rarity: "rare" },
  { id: "trending", title: "Trending", description: "Your report got 10+ upvotes", icon: "🔥", category: "impact", rarity: "epic" },
  { id: "ward_king", title: "Ward King", description: "Most reports in your district", icon: "👑", category: "impact", rarity: "legendary" },

  // Verifier Badges
  { id: "truth_seeker", title: "Truth Seeker", description: "Submitted your first verification", icon: "👁️", category: "verifier", rarity: "common" },
  { id: "community_shield", title: "Community Shield", description: "Verified 25 issues", icon: "🛡️", category: "verifier", rarity: "rare" },
  { id: "justice_keeper", title: "Justice Keeper", description: "Verified 100 issues", icon: "⚖️", category: "verifier", rarity: "epic" },

  // Category Expert Badges
  { id: "flood_fighter", title: "Flood Fighter", description: "Reported 5 drainage/water issues", icon: "🌊", category: "expert", rarity: "rare" },
  { id: "road_ranger", title: "Road Ranger", description: "Reported 5 road damage issues", icon: "🛣️", category: "expert", rarity: "rare" },
  { id: "power_protector", title: "Power Protector", description: "Reported 5 electrical issues", icon: "⚡", category: "expert", rarity: "rare" },
  { id: "eco_warrior", title: "Eco Warrior", description: "Reported 5 green space issues", icon: "🌿", category: "expert", rarity: "rare" },
  { id: "clean_crusader", title: "Clean Crusader", description: "Reported 5 sanitation issues", icon: "♻️", category: "expert", rarity: "rare" },
  { id: "safety_hero", title: "Safety Hero", description: "Reported a critical safety threat", icon: "🦺", category: "expert", rarity: "rare" },

  // Special Badges
  { id: "problem_solver", title: "Problem Solver", description: "10 of your reports got resolved", icon: "✅", category: "special", rarity: "epic" },
  { id: "district_champion", title: "District Champion", description: "Reported issues in 3+ categories", icon: "🏆", category: "special", rarity: "epic" },
  { id: "civic_legend", title: "Civic Legend", description: "Reached Urban Legend level", icon: "🌟", category: "special", rarity: "legendary" },
];

export const RARITY_COLORS = {
  common: { bg: "#f1f5f9", border: "#cbd5e1", text: "#475569" },
  rare: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
  epic: { bg: "#f5f3ff", border: "#ddd6fe", text: "#7c3aed" },
  legendary: { bg: "#fefce8", border: "#fde68a", text: "#b45309" },
};

export const CIVIC_DNA_CATEGORIES = [
  { id: "ROAD_DAMAGE", label: "Road Warrior", icon: "🕳️", color: "#ef4444" },
  { id: "WATER_INFRASTRUCTURE", label: "Water Guardian", icon: "💧", color: "#3b82f6" },
  { id: "ELECTRICAL", label: "Power Keeper", icon: "⚡", color: "#f59e0b" },
  { id: "SANITATION", label: "Clean City", icon: "🗑️", color: "#8b5cf6" },
  { id: "DRAINAGE", label: "Flood Fighter", icon: "🌊", color: "#06b6d4" },
  { id: "PUBLIC_SAFETY", label: "Safety First", icon: "🚨", color: "#dc2626" },
  { id: "GREEN_SPACES", label: "Green Keeper", icon: "🌳", color: "#16a34a" },
  { id: "POLLUTION", label: "Eco Guard", icon: "🏭", color: "#64748b" },
];

export function getLevelFromXp(xp) {
  return LEVELS.slice().reverse().find((l) => xp >= l.minXp) || LEVELS[0];
}

export function getCivicDnaScore(categoryCount) {
  const maxVal = Math.max(...Object.values(categoryCount || {}), 1);
  return CIVIC_DNA_CATEGORIES.map(cat => ({
    ...cat,
    count: categoryCount?.[cat.id] || 0,
    score: Math.min(((categoryCount?.[cat.id] || 0) / maxVal) * 100, 100),
  }));
}

function checkAndAwardBadges(userData, action, bonusConditions, newStats) {
  const badges = [...(userData.gamification?.badges || [])];
  const addBadge = (id) => { if (!badges.includes(id)) badges.push(id); };

  const reports = newStats.reportsSubmitted;
  const verifications = newStats.verificationsGiven;
  const categoryCount = newStats.categoryCount || {};
  const resolvedCount = newStats.resolvedCount || 0;

  // Reporter badges
  if (reports >= 1) addBadge("first_report");
  if (reports >= 5) addBadge("street_hawk");
  if (reports >= 25) addBadge("city_wolf");
  if (reports >= 50) addBadge("urban_lion");

  // Verifier badges
  if (verifications >= 1) addBadge("truth_seeker");
  if (verifications >= 25) addBadge("community_shield");
  if (verifications >= 100) addBadge("justice_keeper");

  // Category expert badges
  if ((categoryCount.DRAINAGE || 0) + (categoryCount.WATER_INFRASTRUCTURE || 0) >= 5) addBadge("flood_fighter");
  if ((categoryCount.ROAD_DAMAGE || 0) >= 5) addBadge("road_ranger");
  if ((categoryCount.ELECTRICAL || 0) >= 5) addBadge("power_protector");
  if ((categoryCount.GREEN_SPACES || 0) >= 5) addBadge("eco_warrior");
  if ((categoryCount.SANITATION || 0) >= 5) addBadge("clean_crusader");

  // Impact badges
  if (bonusConditions.safetyThreat) addBadge("safety_hero");
  if (bonusConditions.highSeverity) addBadge("bull_eye");
  if (bonusConditions.trending) addBadge("trending");

  // Special badges
  if (resolvedCount >= 10) addBadge("problem_solver");

  // District champion - reported in 3+ categories
  const categoriesUsed = Object.values(categoryCount).filter(v => v > 0).length;
  if (categoriesUsed >= 3) addBadge("district_champion");

  // Civic legend
  if (newStats.xp >= 6000) addBadge("civic_legend");

  return badges;
}

export async function awardXp(userId, action, bonusConditions = {}) {
  if (!userId) return;

  let xpToAward = XP_REWARDS[action] || 0;
  if (bonusConditions.highSeverity) xpToAward += XP_REWARDS.HIGH_SEVERITY_BONUS;

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const userData = userSnap.data();
  const currentXp = userData.gamification?.xp || 0;
  const newXp = currentXp + xpToAward;
  const newLevel = getLevelFromXp(newXp);

  const updates = {
    "gamification.xp": increment(xpToAward),
    "gamification.level": newLevel.level,
  };

  const newStats = {
    reportsSubmitted: userData.gamification?.reportsSubmitted || 0,
    verificationsGiven: userData.gamification?.verificationsGiven || 0,
    resolvedCount: userData.gamification?.resolvedCount || 0,
    categoryCount: userData.gamification?.categoryCount || {},
    xp: newXp,
  };

  if (action === "REPORT_SUBMITTED") {
    newStats.reportsSubmitted += 1;
    updates["gamification.reportsSubmitted"] = increment(1);

    if (bonusConditions.category) {
      const catKey = `gamification.categoryCount.${bonusConditions.category}`;
      updates[catKey] = increment(1);
      newStats.categoryCount[bonusConditions.category] = (newStats.categoryCount[bonusConditions.category] || 0) + 1;
    }

    updates["gamification.impactScore"] = increment(bonusConditions.highSeverity ? 50 : 10);
  }

  if (action === "VERIFICATION_GIVEN") {
    newStats.verificationsGiven += 1;
    updates["gamification.verificationsGiven"] = increment(1);
  }

  if (action === "REPORT_RESOLVED") {
    newStats.resolvedCount += 1;
    updates["gamification.resolvedCount"] = increment(1);
    updates["gamification.impactScore"] = increment(100);
  }

  const newBadges = checkAndAwardBadges(userData, action, bonusConditions, newStats);
  updates["gamification.badges"] = newBadges;

  await updateDoc(userRef, updates);
  const newlyEarned = newBadges.filter(b => !(userData.gamification?.badges || []).includes(b));
  return { xpAwarded: xpToAward, newLevel, newXp, newBadges: newlyEarned };
}
