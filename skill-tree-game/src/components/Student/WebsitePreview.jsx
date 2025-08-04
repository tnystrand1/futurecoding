import React from 'react';
import styles from './WebsitePreview.module.css';

const WebsitePreview = ({ studentProgress }) => {
  // Safety check for undefined studentProgress
  if (!studentProgress) {
    return (
      <div className={styles.container}>
        <h3>Website Preview</h3>
        <div className={styles.browser}>
          <div className={styles.browserBar}>
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </div>
          <div className={styles.content}>
            <p>Loading student data...</p>
          </div>
        </div>
      </div>
    );
  }

  const studentName = studentProgress.name || 'Student';
  const websitePower = studentProgress.websitePower || 0;
  const skillCount = Object.keys(studentProgress.skills || {}).length;

  return (
    <div className={styles.container}>
      <h3>Website Preview</h3>
      <div className={styles.browser}>
        <div className={styles.browserBar}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
        <div className={styles.content}>
          <h1>{studentName}'s Website</h1>
          <p>Website Power: {websitePower}</p>
          <p>Unlocked Skills: {skillCount}</p>
        </div>
      </div>
    </div>
  );
};

export default WebsitePreview;
