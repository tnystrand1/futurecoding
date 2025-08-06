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

  // Calculate competency scores based on evidence
  calculateCompetencies: (skills) => {
    const competencies = {
      steamInterest: 0,
      communication: 0,
      continuousLearning: 0
    };

    // Define which skills contribute to which competencies
    const competencyMapping = {
      'cultural_mapping': { steamInterest: 1.5, communication: 0.5 },
      'client_discovery': { communication: 1.5, continuousLearning: 0.5 },
      'descriptive_prompting': { communication: 1.0, steamInterest: 0.5 },
      'code_implementation': { steamInterest: 1.0, continuousLearning: 1.0 },
      'css_variables': { steamInterest: 1.5, continuousLearning: 0.5 },
      'ai_assisted_debugging': { continuousLearning: 1.5, steamInterest: 0.5 },
      'user_testing': { communication: 1.0, continuousLearning: 1.0 },
      'accessibility': { communication: 1.5, continuousLearning: 0.5 },
      'iterative_refinement': { continuousLearning: 1.5, steamInterest: 0.5 },
      'deployment': { continuousLearning: 1.0, steamInterest: 1.0 },
      'design_systems': { steamInterest: 1.5, communication: 0.5 },
      'mentorship': { communication: 2.0 },
      'project_showcase': { communication: 1.5, steamInterest: 0.5 },
      'technology_research': { continuousLearning: 2.0 },
      'community_engagement': { communication: 1.5, continuousLearning: 0.5 }
    };

    // Calculate scores based on unlocked skills only (not pending)
    Object.entries(skills || {}).forEach(([skillId, skillData]) => {
      if (skillData.unlocked && skillData.evidence?.status === 'approved') {
        const mapping = competencyMapping[skillId];
        if (mapping) {
          Object.entries(mapping).forEach(([competency, points]) => {
            competencies[competency] += points;
          });
        }
      }
    });

    // Cap at 5.0 and format to 1 decimal place
    return {
      steamInterest: Math.min(5.0, competencies.steamInterest).toFixed(1),
      communication: Math.min(5.0, competencies.communication).toFixed(1),
      continuousLearning: Math.min(5.0, competencies.continuousLearning).toFixed(1)
    };
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
