import React, { useState, useMemo } from 'react';
import EvidenceUploader from './EvidenceUploader';
import styles from './DocumentModal.module.css';

const DocumentModal = ({ skill, onSubmit, onClose }) => {
  const [evidence, setEvidence] = useState({
    type: '',
    reflection: '',
    code: '',
    screenshot: '',
    aiChat: '',
    // Custom evidence types
    'project-brief': '',
    'client-feedback': '',
    'refactored-code': '',
    'test-results': ''
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
    
    // Check each required evidence type
    for (const evidenceType of criteria.evidence) {
      if (evidenceType === 'ai-chat' && !evidence.aiChat.trim()) {
        return false;
      } else if (evidenceType === 'screenshot' && !evidence.screenshot) {
        return false;
      } else if (evidence[evidenceType] !== undefined && !evidence[evidenceType].trim()) {
        return false;
      }
    }
    
    return true;
  };

  const getWordCount = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const renderEvidenceField = (evidenceType) => {
    const fieldKey = evidenceType === 'ai-chat' ? 'aiChat' : evidenceType;
    
    switch (evidenceType) {
      case 'reflection':
        return (
          <div className={styles.field} key={evidenceType}>
            <label>Reflection</label>
            <textarea
              value={evidence.reflection}
              onChange={(e) => setEvidence({...evidence, reflection: e.target.value})}
              rows={6}
              placeholder="Share your thoughts and learning..."
              className={styles.textarea}
            />
            <div className={styles.wordCount}>
              {getWordCount(evidence.reflection)} words
            </div>
          </div>
        );
        
      case 'code':
      case 'refactored-code':
        return (
          <div className={styles.field} key={evidenceType}>
            <label>{evidenceType === 'refactored-code' ? 'Refactored Code' : 'Code Example'}</label>
            <textarea
              value={evidence[fieldKey]}
              onChange={(e) => setEvidence({...evidence, [fieldKey]: e.target.value})}
              rows={8}
              placeholder="Paste your code here..."
              className={styles.codeInput}
              spellCheck={false}
            />
          </div>
        );
        
      case 'screenshot':
        return (
          <div className={styles.field} key={evidenceType}>
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
        );
        
      case 'ai-chat':
        return (
          <div className={styles.field} key={evidenceType}>
            <label>AI Chat Log</label>
            <textarea
              value={evidence.aiChat}
              onChange={(e) => setEvidence({...evidence, aiChat: e.target.value})}
              rows={6}
              placeholder="Paste your conversation with the AI..."
              className={styles.textarea}
            />
          </div>
        );
        
      case 'project-brief':
        return (
          <div className={styles.field} key={evidenceType}>
            <label>Project Brief</label>
            <textarea
              value={evidence['project-brief']}
              onChange={(e) => setEvidence({...evidence, 'project-brief': e.target.value})}
              rows={6}
              placeholder="Describe your project scope, goals, and deliverables..."
              className={styles.textarea}
            />
          </div>
        );
        
      case 'client-feedback':
        return (
          <div className={styles.field} key={evidenceType}>
            <label>Client Feedback</label>
            <textarea
              value={evidence['client-feedback']}
              onChange={(e) => setEvidence({...evidence, 'client-feedback': e.target.value})}
              rows={4}
              placeholder="Share feedback received from your client..."
              className={styles.textarea}
            />
          </div>
        );
        
      case 'test-results':
        return (
          <div className={styles.field} key={evidenceType}>
            <label>Test Results</label>
            <textarea
              value={evidence['test-results']}
              onChange={(e) => setEvidence({...evidence, 'test-results': e.target.value})}
              rows={6}
              placeholder="Show your testing process and results..."
              className={styles.textarea}
            />
          </div>
        );
        
      default:
        return (
          <div className={styles.field} key={evidenceType}>
            <label>{evidenceType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
            <textarea
              value={evidence[fieldKey] || ''}
              onChange={(e) => setEvidence({...evidence, [fieldKey]: e.target.value})}
              rows={4}
              placeholder={`Enter your ${evidenceType.replace(/-/g, ' ')}...`}
              className={styles.textarea}
            />
          </div>
        );
    }
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
            
            {skill.unlockCriteria.evidence.map(evidenceType => 
              renderEvidenceField(evidenceType)
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
