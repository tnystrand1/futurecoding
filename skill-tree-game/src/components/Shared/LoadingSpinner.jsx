import React from 'react';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = () => {
  return (
    <div className={styles.container}>
      <div className={styles.spinner}>
        <div className={styles.pixel}></div>
      </div>
      <p className={styles.text}>Loading your adventure...</p>
    </div>
  );
};

export default LoadingSpinner;
