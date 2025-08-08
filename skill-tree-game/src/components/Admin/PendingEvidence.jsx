import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../utils/firebase-config';
import { useGameState } from '../../hooks/useGameState';
import { SKILL_TREE } from '../../data/skillTreeData';

const PendingEvidence = () => {
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectionMessages, setRejectionMessages] = useState({});
  const { approveEvidence } = useGameState();

  useEffect(() => {
    const fetchPendingEvidence = async () => {
      try {
        const studentsRef = collection(db, 'students');
        const studentsSnapshot = await getDocs(studentsRef);
        
        const pending = [];
        
        studentsSnapshot.forEach((doc) => {
          const studentData = doc.data();
          const studentId = doc.id;
          
          if (studentData.skills) {
            Object.entries(studentData.skills).forEach(([skillId, skillData]) => {
              // Check for pending evidence (multiple formats for compatibility)
              const hasEvidence = skillData.evidence && (
                skillData.evidence.aiChat || 
                skillData.evidence.code || 
                skillData.evidence.reflection || 
                skillData.evidence.screenshot ||
                skillData.evidence['project-brief'] ||
                skillData.evidence['client-feedback'] ||
                skillData.evidence['refactored-code'] ||
                skillData.evidence['test-results']
              );
              
              const isPending = (
                (skillData.evidenceSubmitted && skillData.evidence?.status === 'pending') ||
                (hasEvidence && !skillData.unlocked && skillData.evidence?.status !== 'approved' && skillData.evidence?.status !== 'rejected')
              );
              
              if (isPending) {
                pending.push({
                  studentId,
                  studentName: studentData.name || studentId.replace(/_/g, ' '),
                  skillId,
                  skillName: skillData.evidence?.skillName || SKILL_TREE[skillId]?.name || skillId.replace(/_/g, ' '),
                  evidence: skillData.evidence,
                  submittedAt: skillData.evidence?.submittedAt || new Date().toISOString(),
                  potentialXP: skillData.evidence?.potentialXP || 50
                });
              }
            });
          }
        });
        
        // Sort by submission date (newest first)
        pending.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
        setPendingSubmissions(pending);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching pending evidence:', error);
        setLoading(false);
      }
    };

    fetchPendingEvidence();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingEvidence, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleApproval = async (studentId, skillId, approved) => {
    const rejectionMessage = approved ? '' : rejectionMessages[`${studentId}-${skillId}`] || '';
    
    if (!approved && !rejectionMessage.trim()) {
      alert('Please provide a rejection message to help the student understand what needs improvement.');
      return;
    }
    
    const result = await approveEvidence(studentId, skillId, approved, rejectionMessage);
    if (result.success) {
      // Remove from pending list
      setPendingSubmissions(prev => 
        prev.filter(item => !(item.studentId === studentId && item.skillId === skillId))
      );
      // Clear rejection message
      setRejectionMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[`${studentId}-${skillId}`];
        return newMessages;
      });
      alert(result.message);
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading pending evidence...</div>
      </div>
    );
  }

  if (pendingSubmissions.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        <div style={{ fontSize: '18px', marginBottom: '10px' }}>🎉 All caught up!</div>
        <div>No pending evidence submissions to review.</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', color: '#2c3e50' }}>
        Pending Evidence Review ({pendingSubmissions.length})
      </h2>
      
      <div style={{ display: 'grid', gap: '16px' }}>
        {pendingSubmissions.map((item, index) => (
          <div
            key={`${item.studentId}-${item.skillId}`}
            style={{
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: '#2c3e50' }}>
                  {item.studentName} - {item.skillName}
                </h3>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Submitted: {new Date(item.submittedAt).toLocaleString()}
                  <span style={{ marginLeft: '16px', color: '#27ae60', fontWeight: 'bold' }}>
                    +{item.potentialXP} XP
                  </span>
                </div>
              </div>
            </div>

            {/* Evidence Content */}
            <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '4px' }}>
              {item.evidence.type === 'file' && (
                <div>
                  <strong>File Upload:</strong> {item.evidence.fileName}
                  {item.evidence.fileUrl && (
                    <div style={{ marginTop: '8px' }}>
                      <a 
                        href={item.evidence.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#3498db', textDecoration: 'none' }}
                      >
                        📁 View File
                      </a>
                    </div>
                  )}
                </div>
              )}
              
              {item.evidence.type === 'link' && (
                <div>
                  <strong>Link:</strong>
                  <div style={{ marginTop: '4px' }}>
                    <a 
                      href={item.evidence.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#3498db', textDecoration: 'none' }}
                    >
                      🔗 {item.evidence.url}
                    </a>
                  </div>
                </div>
              )}
              
              {item.evidence.reflection && (
                <div style={{ marginTop: '12px' }}>
                  <strong>📝 Reflection:</strong>
                  <div style={{ 
                    marginTop: '4px', 
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                    padding: '8px',
                    background: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}>
                    {item.evidence.reflection}
                  </div>
                </div>
              )}

              {item.evidence.code && (
                <div style={{ marginTop: '12px' }}>
                  <strong>💻 Code:</strong>
                  <div style={{ 
                    marginTop: '4px', 
                    padding: '12px', 
                    background: '#2d3748', 
                    color: '#e2e8f0',
                    border: '1px solid #4a5568',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    whiteSpace: 'pre-wrap',
                    overflow: 'auto',
                    maxHeight: '300px'
                  }}>
                    {item.evidence.code}
                  </div>
                </div>
              )}

              {item.evidence.aiChat && (
                <div style={{ marginTop: '12px' }}>
                  <strong>🤖 AI Chat Log:</strong>
                  <div style={{ 
                    marginTop: '4px', 
                    padding: '12px', 
                    background: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '300px',
                    overflow: 'auto',
                    lineHeight: '1.5'
                  }}>
                    {item.evidence.aiChat}
                  </div>
                </div>
              )}

              {item.evidence.screenshot && (
                <div style={{ marginTop: '12px' }}>
                  <strong>📸 Screenshot:</strong>
                  <div style={{ marginTop: '8px' }}>
                    <img 
                      src={item.evidence.screenshot} 
                      alt="Evidence screenshot"
                      style={{ 
                        maxWidth: '100%', 
                        height: 'auto', 
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>
              )}

              {item.evidence['project-brief'] && (
                <div style={{ marginTop: '12px' }}>
                  <strong>📋 Project Brief:</strong>
                  <div style={{ 
                    marginTop: '4px', 
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                    padding: '8px',
                    background: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}>
                    {item.evidence['project-brief']}
                  </div>
                </div>
              )}

              {item.evidence['client-feedback'] && (
                <div style={{ marginTop: '12px' }}>
                  <strong>💬 Client Feedback:</strong>
                  <div style={{ 
                    marginTop: '4px', 
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                    padding: '8px',
                    background: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}>
                    {item.evidence['client-feedback']}
                  </div>
                </div>
              )}

              {item.evidence['refactored-code'] && (
                <div style={{ marginTop: '12px' }}>
                  <strong>🔧 Refactored Code:</strong>
                  <div style={{ 
                    marginTop: '4px', 
                    padding: '12px', 
                    background: '#2d3748', 
                    color: '#e2e8f0',
                    border: '1px solid #4a5568',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    whiteSpace: 'pre-wrap',
                    overflow: 'auto',
                    maxHeight: '300px'
                  }}>
                    {item.evidence['refactored-code']}
                  </div>
                </div>
              )}

              {item.evidence['test-results'] && (
                <div style={{ marginTop: '12px' }}>
                  <strong>🧪 Test Results:</strong>
                  <div style={{ 
                    marginTop: '4px', 
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                    padding: '8px',
                    background: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}>
                    {item.evidence['test-results']}
                  </div>
                </div>
              )}
            </div>

            {/* Rejection Message Input */}
            <div style={{ marginBottom: '16px', padding: '12px', background: '#fff3cd', borderRadius: '4px', border: '1px solid #ffeaa7' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#856404' }}>
                Rejection Message (required if rejecting):
              </label>
              <textarea
                value={rejectionMessages[`${item.studentId}-${item.skillId}`] || ''}
                onChange={(e) => setRejectionMessages(prev => ({
                  ...prev,
                  [`${item.studentId}-${item.skillId}`]: e.target.value
                }))}
                placeholder="Explain what needs improvement or what's missing..."
                style={{
                  width: '100%',
                  minHeight: '60px',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Approval Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => handleApproval(item.studentId, item.skillId, false)}
                style={{
                  background: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                onMouseOver={(e) => e.target.style.background = '#c0392b'}
                onMouseOut={(e) => e.target.style.background = '#e74c3c'}
              >
                ❌ Reject
              </button>
              <button
                onClick={() => handleApproval(item.studentId, item.skillId, true)}
                style={{
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                onMouseOver={(e) => e.target.style.background = '#229954'}
                onMouseOut={(e) => e.target.style.background = '#27ae60'}
              >
                ✅ Approve
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingEvidence;