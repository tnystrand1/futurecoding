import React from 'react';
import styles from './SkillNode.module.css';

const SkillNode = ({ skill, status, available, onHover, onClick }) => {
  const getNodeClass = () => {
    if (status === 'unlocked') return styles.unlocked;
    if (status === 'pending') return styles.pending;
    if (status === 'rejected') return styles.rejected;
    if (available) return styles.available;
    return styles.locked;
  };

  const getStatusLabel = () => {
    if (status === 'unlocked') return 'Completed';
    if (status === 'pending') return 'Under Review';
    if (status === 'rejected') return 'Needs Revision';
    if (available) return 'Available';
    return 'Locked';
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

      <div className={styles.name}>{skill.name}</div>
      <div className={styles.tier}>Tier {skill.tier}</div>
      <div className={styles.status}>{getStatusLabel()}</div>
    </div>
  );
};

export default SkillNode;
