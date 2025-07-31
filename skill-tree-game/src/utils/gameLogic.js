import { SKILL_TREE, DEVELOPER_PROFILES } from '../data/skillTreeData';

export const GameLogic = {
  // Calculate XP needed for next level
  calculateLevelProgress: (totalXP) => {
    const level = Math.floor(totalXP / 200) + 1;
    const xpInCurrentLevel = totalXP % 200;
    const xpNeededForNext = 200;
    
    return {
      level,
      xpInCurrentLevel,
      xpNeededForNext,
      progress: (xpInCurrentLevel / xpNeededForNext) * 100
    };
  },

  // Calculate website power based on unlocked skills
  calculateWebsitePower: (skills) => {
    const unlockedCount = Object.values(skills || {})
      .filter(skill => skill.unlocked).length;
    return unlockedCount * 10;
  },

  // Check if student can unlock a developer profile
  checkProfileUnlock: (profile, unlockedSkills) => {
    const unlockedSkillIds = Object.entries(unlockedSkills || {})
      .filter(([_, skill]) => skill.unlocked)
      .map(([id, _]) => id);
    
    return profile.requiredSkills.every(skillId => 
      unlockedSkillIds.includes(skillId)
    );
  },

  // Get available profiles
  getAvailableProfiles: (unlockedSkills) => {
    return Object.values(DEVELOPER_PROFILES).filter(profile =>
      GameLogic.checkProfileUnlock(profile, unlockedSkills)
    );
  },

  // Check achievements
  checkAchievements: (studentProgress, previousProgress = {}) => {
    const achievements = [];
    const unlockedSkillCount = Object.values(studentProgress.skills || {})
      .filter(s => s.unlocked).length;
    const previousUnlockedCount = Object.values(previousProgress.skills || {})
      .filter(s => s.unlocked).length;
    
    // First skill unlocked
    if (unlockedSkillCount === 1 && previousUnlockedCount === 0) {
      achievements.push({
        id: 'first_skill',
        name: 'First Steps',
        description: 'Unlock your first skill',
        xpReward: 25
      });
    }
    
    // Complete a tier
    const tier1Skills = Object.values(SKILL_TREE)
      .filter(s => s.tier === 1)
      .map(s => s.id);
    const unlockedTier1 = tier1Skills.filter(id => 
      studentProgress.skills?.[id]?.unlocked
    );
    
    if (unlockedTier1.length === tier1Skills.length && 
        !previousProgress.achievements?.includes('tier1_complete')) {
      achievements.push({
        id: 'tier1_complete',
        name: 'Foundation Master',
        description: 'Unlock all Tier 1 skills',
        xpReward: 100
      });
    }
    
    return achievements;
  }
};
