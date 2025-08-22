import React, { useState, useMemo } from 'react';
import EvidenceUploader from './EvidenceUploader';
import styles from './DocumentModal.module.css';

const DocumentModal = ({ skill, onSubmit, onClose }) => {
  // Check if there's existing evidence - memoized to prevent re-computation
  const existingEvidence = useMemo(() => skill.studentData?.evidence, [skill.studentData?.evidence]);
  const hasExistingEvidence = useMemo(() => existingEvidence && (
    existingEvidence.reflection || 
    existingEvidence.questionAnswers ||
    existingEvidence.code || 
    existingEvidence.screenshot || 
    existingEvidence.aiChat ||
    existingEvidence['project-brief'] ||
    existingEvidence['client-feedback'] ||
    existingEvidence['refactored-code'] ||
    existingEvidence['test-results']
  ), [existingEvidence]);
  
  // Debug logging removed to prevent console spam
  
  const [evidence, setEvidence] = useState(() => {
    const baseEvidence = {
      type: existingEvidence?.type || '',
      reflection: existingEvidence?.reflection || '',
      code: existingEvidence?.code || '',
      screenshot: existingEvidence?.screenshot || '',
      aiChat: existingEvidence?.aiChat || '',
      // Custom evidence types
      'project-brief': existingEvidence?.['project-brief'] || '',
      'client-feedback': existingEvidence?.['client-feedback'] || '',
      'refactored-code': existingEvidence?.['refactored-code'] || '',
      'test-results': existingEvidence?.['test-results'] || ''
    };

    // Handle multiple questions format
    if (skill.unlockCriteria?.questions && existingEvidence?.questionAnswers) {
      baseEvidence.questionAnswers = existingEvidence.questionAnswers;
    } else if (skill.unlockCriteria?.questions) {
      // Initialize empty answers for each question
      baseEvidence.questionAnswers = skill.unlockCriteria.questions.map(() => '');
    }

    return baseEvidence;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState(hasExistingEvidence ? 'view' : 'edit');

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
    
    // Check for multiple questions format
    if (criteria.questions && evidence.questionAnswers) {
      // All questions must have answers
      return evidence.questionAnswers.every(answer => answer.trim().length > 0);
    }
    
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

  const renderEvidenceView = (evidenceType) => {
    const fieldKey = evidenceType === 'ai-chat' ? 'aiChat' : evidenceType;
    const value = evidence[fieldKey];
    
    // Handle multiple questions format for reflections
    if (evidenceType === 'reflection' && skill.unlockCriteria?.questions && evidence.questionAnswers) {
      return (
        <div className={styles.field} key={`view-${evidenceType}`}>
          <label style={{ fontWeight: 'bold', color: '#2c3e50' }}>
            Reflection Questions
          </label>
          {skill.unlockCriteria.questions.map((question, index) => (
            <div key={index} style={{ marginBottom: '16px', marginTop: '12px' }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 'bold', 
                color: '#555',
                marginBottom: '8px'
              }}>
                Question {index + 1}: {question}
              </div>
              <div style={{
                background: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: '4px',
                padding: '12px',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.4'
              }}>
                {evidence.questionAnswers[index] || 'No answer provided'}
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (!value) return null;
    
    return (
      <div className={styles.field} key={`view-${evidenceType}`}>
        <label style={{ fontWeight: 'bold', color: '#2c3e50' }}>
          {evidenceType === 'ai-chat' ? 'AI Chat' : 
           evidenceType === 'refactored-code' ? 'Refactored Code' :
           evidenceType.charAt(0).toUpperCase() + evidenceType.slice(1)}
        </label>
        {evidenceType === 'screenshot' ? (
          <div style={{ marginTop: '8px' }}>
            <img 
              src={value} 
              alt="Evidence screenshot" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '300px', 
                border: '1px solid #ddd',
                borderRadius: '4px'
              }} 
            />
          </div>
        ) : evidenceType === 'code' || evidenceType === 'refactored-code' ? (
          <div style={{
            background: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: '4px',
            padding: '12px',
            marginTop: '8px',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: '13px',
            whiteSpace: 'pre-wrap',
            overflow: 'auto',
            maxHeight: '200px'
          }}>
            {value}
          </div>
        ) : (
          <div style={{
            background: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: '4px',
            padding: '12px',
            marginTop: '8px',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.4'
          }}>
            {value}
          </div>
        )}
      </div>
    );
  };

  const renderEvidenceField = (evidenceType) => {
    const fieldKey = evidenceType === 'ai-chat' ? 'aiChat' : evidenceType;
    
    switch (evidenceType) {
      case 'reflection':
        // Check if this skill uses multiple questions format
        if (skill.unlockCriteria?.questions) {
          return (
            <div className={styles.field} key={evidenceType}>
              <label>Reflection Questions</label>
              {skill.unlockCriteria.questions.map((question, index) => (
                <div key={index} style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    fontSize: '14px', 
                    fontWeight: 'normal', 
                    color: '#555',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    Question {index + 1}: {question}
                  </label>
                  <textarea
                    value={evidence.questionAnswers?.[index] || ''}
                    onChange={(e) => {
                      const newAnswers = [...(evidence.questionAnswers || [])];
                      newAnswers[index] = e.target.value;
                      setEvidence({...evidence, questionAnswers: newAnswers});
                    }}
                    rows={4}
                    placeholder="Type your answer here..."
                    className={styles.textarea}
                    style={{ marginBottom: '4px' }}
                  />
                  <div className={styles.wordCount}>
                    {getWordCount(evidence.questionAnswers?.[index] || '')} words
                  </div>
                </div>
              ))}
            </div>
          );
        }
        
        // Default single reflection
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
          <h2>{hasExistingEvidence ? `${skill.name} Evidence` : `Unlock: ${skill.name}`}</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        {/* Status Banner */}
        {existingEvidence && (
          <div style={{
            background: existingEvidence.status === 'approved' ? '#d4edda' :
                       existingEvidence.status === 'rejected' ? '#f8d7da' :
                       '#fff3cd',
            color: existingEvidence.status === 'approved' ? '#155724' :
                   existingEvidence.status === 'rejected' ? '#721c24' :
                   '#856404',
            padding: '12px',
            margin: '0 20px',
            borderRadius: '4px',
            border: `1px solid ${existingEvidence.status === 'approved' ? '#c3e6cb' :
                                 existingEvidence.status === 'rejected' ? '#f5c6cb' :
                                 '#ffeeba'}`,
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            Status: {existingEvidence.status === 'approved' ? '✅ Approved' :
                      existingEvidence.status === 'rejected' ? '❌ Rejected' :
                      '⏳ Pending Teacher Approval'}
            {existingEvidence.status === 'rejected' && existingEvidence.rejectionMessage && (
              <div style={{ marginTop: '8px', fontWeight: 'normal' }}>
                <strong>Teacher's Message:</strong> {existingEvidence.rejectionMessage}
              </div>
            )}
          </div>
        )}
        
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3>Your Evidence:</h3>
              {hasExistingEvidence && (
                <div>
                  <button
                    type="button"
                    onClick={() => setViewMode('view')}
                    style={{
                      background: viewMode === 'view' ? '#007bff' : '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      marginRight: '8px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    👁️ View
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('edit')}
                    style={{
                      background: viewMode === 'edit' ? '#007bff' : '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ✏️ {hasExistingEvidence ? 'Resubmit' : 'Edit'}
                  </button>
                </div>
              )}
            </div>
            
            {viewMode === 'view' && hasExistingEvidence ? (
              // View Mode - Show existing evidence
              <div>
                {skill.unlockCriteria.evidence.map(evidenceType => 
                  renderEvidenceView(evidenceType)
                )}
              </div>
            ) : (
              // Edit Mode - Show form fields
              <div>
                {skill.unlockCriteria.evidence.map(evidenceType => 
                  renderEvidenceField(evidenceType)
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.footer}>
          {viewMode === 'edit' ? (
            <button 
              className="pixel-button"
              onClick={handleSubmit}
              disabled={isSubmitting || !validateEvidence()}
            >
              {isSubmitting ? 'Submitting...' : hasExistingEvidence ? 'Resubmit Evidence' : 'Submit Evidence'}
            </button>
          ) : (
            <button 
              className="pixel-button"
              onClick={() => setViewMode('edit')}
            >
              Submit New Evidence
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentModal;
