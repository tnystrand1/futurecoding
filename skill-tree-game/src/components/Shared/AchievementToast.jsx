import React from 'react';
import styles from './AchievementToast.module.css';

const AchievementToast = ({ achievement }) => {
  return (
    <div className={styles.toast}>
      <div className={styles.icon}>🏆</div>
      <div className={styles.content}>
        <h3>{achievement.name}</h3>
        <p>{achievement.description}</p>
        <span className={styles.xp}>+{achievement.xpReward} XP</span>
      </div>
    </div>
  );
};

export default AchievementToast;
