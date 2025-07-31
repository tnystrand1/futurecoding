import React from 'react';

const SkillConnections = ({ skills, unlockedSkills, hoveredSkill }) => {
  const drawConnection = (from, to, isUnlocked) => {
    const fromSkill = skills[from];
    const toSkill = skills[to];
    
    if (!fromSkill || !toSkill) return null;
    
    const x1 = fromSkill.position.x + 60; // center of node
    const y1 = fromSkill.position.y + 50;
    const x2 = toSkill.position.x + 60;
    const y2 = toSkill.position.y + 50;
    
    return (
      <line
        key={`${from}-${to}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isUnlocked ? '#27ae60' : '#bdc3c7'}
        strokeWidth="3"
        strokeDasharray={isUnlocked ? "0" : "5,5"}
      />
    );
  };
  
  return (
    <>
      {Object.values(skills).map(skill => {
        return skill.prerequisites.map(prereq => {
          const isUnlocked = unlockedSkills[prereq]?.unlocked && 
                           unlockedSkills[skill.id]?.unlocked;
          return drawConnection(prereq, skill.id, isUnlocked);
        });
      })}
    </>
  );
};

export default SkillConnections;
