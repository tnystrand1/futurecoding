import React from 'react';
import styles from './WebsitePreview.module.css';

const WebsitePreview = ({ studentProgress }) => {
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
          <h1>{studentProgress.name}'s Website</h1>
          <p>Website Power: {studentProgress.websitePower}</p>
          <p>Unlocked Skills: {Object.keys(studentProgress.skills || {}).length}</p>
        </div>
      </div>
    </div>
  );
};

export default WebsitePreview;
