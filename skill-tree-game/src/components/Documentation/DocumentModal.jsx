import React, { useState } from 'react';
import EvidenceUploader from './EvidenceUploader';
import styles from './DocumentModal.module.css';

const DocumentModal = ({ skill, onSubmit, onClose }) => {
  const [evidence, setEvidence] = useState({
    type: '',
    reflection: '',
    code: '',
    screenshot: '',
    aiChat: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validate evidence based on skill requirements
    if (!validateEvidence()) {
      alert('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    await onSubmit(skill.id, evidence);
    setIsSubmitting(false);
  };

  const validateEvidence = () => {
    const criteria = skill.unlockCriteria;
    
    if (criteria.evidence.includes('reflection')) {
      const wordCount = evidence.reflection.trim().split(/\s+/).length;
      if (wordCount < (criteria.minWords || 100)) {
        return false;
      }
    }
    
    if (criteria.evidence.includes('code') && !evidence.code.trim()) {
      return false;
    }
    
    if (criteria.evidence.includes('screenshot') && !evidence.screenshot) {
      return false;
    }
    
    if (criteria.evidence.includes('ai-chat') && !evidence.aiChat.trim()) {
      return false;
    }
    
    return true;
  };

  const getWordCount = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Unlock: {skill.name}</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.body}>
          <div className={styles.requirements}>
            <h3>Requirements:</h3>
            <p>{skill.unlockCriteria.prompt}</p>
            <ul>
              {skill.unlockCriteria.evidence.map(type => (
                <li key={type}>Submit {type}</li>
              ))}
            </ul>
          </div>
          
          <div className={styles.evidenceForm}>
            <h3>Your Evidence:</h3>
            
            {skill.unlockCriteria.evidence.includes('reflection') && (
              <div className={styles.field}>
                <label>
                  Reflection (min {skill.unlockCriteria.minWords || 100} words)
                </label>
                <textarea
                  value={evidence.reflection}
                  onChange={(e) => setEvidence({...evidence, reflection: e.target.value})}
                  rows={6}
                  placeholder="Share your thoughts and learning..."
                  className={styles.textarea}
                />
                <div className={styles.wordCount}>
                  {getWordCount(evidence.reflection)} / {skill.unlockCriteria.minWords || 100} words
                </div>
              </div>
            )}
            
            {skill.unlockCriteria.evidence.includes('code') && (
              <div className={styles.field}>
                <label>Code Example</label>
                <textarea
                  value={evidence.code}
                  onChange={(e) => setEvidence({...evidence, code: e.target.value})}
                  rows={8}
                  placeholder="Paste your code here..."
                  className={styles.codeInput}
                  spellCheck={false}
                />
              </div>
            )}
            
            {skill.unlockCriteria.evidence.includes('screenshot') && (
              <div className={styles.field}>
                <label>Screenshot</label>
                <EvidenceUploader
                  evidenceType="screenshot"
                  currentValue={evidence.screenshot}
                  onUpload={(url) => setEvidence({...evidence, screenshot: url})}
                />
                {evidence.screenshot && (
                  <div className={styles.screenshotPreview}>
                    <img 
                      src={evidence.screenshot} 
                      alt="Evidence screenshot" 
                      style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                    />
                  </div>
                )}
              </div>
            )}
            
            {skill.unlockCriteria.evidence.includes('ai-chat') && (
              <div className={styles.field}>
                <label>AI Chat Log</label>
                <textarea
                  value={evidence.aiChat}
                  onChange={(e) => setEvidence({...evidence, aiChat: e.target.value})}
                  rows={6}
                  placeholder="Paste your conversation with the AI..."
                  className={styles.textarea}
                />
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.footer}>
          <button 
            className="pixel-button"
            onClick={handleSubmit}
            disabled={isSubmitting || !validateEvidence()}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Evidence'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentModal;
