import React from 'react';
import styles from './SkillNode.module.css';

const SkillNode = ({ skill, unlocked, available, onHover, onClick }) => {
  const getNodeClass = () => {
    if (unlocked) return styles.unlocked;
    if (available) return styles.available;
    return styles.locked;
  };

  return (
    <div
      className={`${styles.node} ${getNodeClass()}`}
      style={{
        left: `${skill.position.x}px`,
        top: `${skill.position.y}px`,
        position: 'absolute',
      }}
      onMouseEnter={() => onHover(skill)}
      onMouseLeave={() => onHover(null)}
      onClick={onClick}
    >
      <div className={styles.icon}>
        {unlocked && '✓'}
        {!unlocked && !available && '🔒'}
      </div>
      <div className={styles.name}>{skill.name}</div>
      <div className={styles.tier}>Tier {skill.tier}</div>
    </div>
  );
};

export default SkillNode;
