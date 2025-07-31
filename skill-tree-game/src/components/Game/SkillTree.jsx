import React, { useState } from 'react';
import { SKILL_TREE } from '../../data/skillTreeData';
import SkillNode from './SkillNode';
import SkillConnections from './SkillConnections';
import styles from './SkillTree.module.css';

const SkillTree = ({ studentId, studentProgress, onSkillClick }) => {
  const [hoveredSkill, setHoveredSkill] = useState(null);
  
  const isSkillUnlocked = (skillId) => {
    return studentProgress.skills?.[skillId]?.unlocked || false;
  };
  
  const isSkillAvailable = (skill) => {
    if (skill.tier === 1) return true;
    
    const prereqsMet = skill.prerequisites.every(prereq => 
      isSkillUnlocked(prereq)
    );
    
    const altPathMet = skill.alternativePaths?.some(path =>
      path.every(skillId => isSkillUnlocked(skillId))
    ) || false;
    
    return prereqsMet || altPathMet;
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Web Development Skill Tree</h2>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span>Level:</span>
            <strong>{studentProgress.currentLevel || 1}</strong>
          </div>
          <div className={styles.stat}>
            <span>XP:</span>
            <strong>{studentProgress.totalXP || 0}</strong>
          </div>
          <div className={styles.stat}>
            <span>Website Power:</span>
            <strong>{studentProgress.websitePower || 0}</strong>
          </div>
        </div>
      </div>
      
      <div className={styles.treeArea}>
        <svg className={styles.connections}>
          <SkillConnections 
            skills={SKILL_TREE}
            unlockedSkills={studentProgress.skills || {}}
            hoveredSkill={hoveredSkill}
          />
        </svg>
        
        {Object.values(SKILL_TREE).map(skill => (
          <SkillNode
            key={skill.id}
            skill={skill}
            unlocked={isSkillUnlocked(skill.id)}
            available={isSkillAvailable(skill)}
            onHover={setHoveredSkill}
            onClick={() => onSkillClick(skill)}
          />
        ))}
      </div>
    </div>
  );
};

export default SkillTree;
