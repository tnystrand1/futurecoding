import React, { useState, useEffect } from 'react';
import { aiService } from '../../services/aiService';

const ChatLogViewer = () => {
  const [studentChats, setStudentChats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [exportingStudent, setExportingStudent] = useState(null);

  useEffect(() => {
    loadAllChats();
  }, []);

  const loadAllChats = async () => {
    setIsLoading(true);
    try {
      const chats = await aiService.getAllConversationsForTeacher();
      setStudentChats(chats);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportStudent = async (studentId) => {
    setExportingStudent(studentId);
    try {
      const chatLog = await aiService.exportStudentChatLog(studentId);
      
      // Create downloadable file
      const blob = new Blob([JSON.stringify(chatLog, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${chatLog.studentName}_AI_Chat_Log_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting chat log:', error);
      alert('Error exporting chat log. Please try again.');
    } finally {
      setExportingStudent(null);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e3e3e3',
          borderTop: '4px solid #9147FF',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Loading AI chat logs...</p>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  const studentList = Object.entries(studentChats);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h2 style={{ margin: 0, color: '#333' }}>
          🤖 AI Chat Logs - CodeCritic Sessions
        </h2>
        <button
          onClick={loadAllChats}
          style={{
            background: '#9147FF',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 16px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {studentList.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px',
          color: '#666',
          background: '#f8f9fa',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
          <h3>No AI conversations yet</h3>
          <p>Students haven't started chatting with CodeCritic yet.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: '20px'
        }}>
          {studentList.map(([studentId, studentData]) => (
            <div
              key={studentId}
              style={{
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #e9ecef',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              {/* Student Header */}
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '24px' }}>
                  {typeof studentData.studentAvatar === 'string' 
                    ? studentData.studentAvatar 
                    : studentData.studentAvatar?.emoji || '👤'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                    {studentData.studentName}
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>
                    {studentData.conversations.length} conversation{studentData.conversations.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <button
                  onClick={() => handleExportStudent(studentId)}
                  disabled={exportingStudent === studentId}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: 'white',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    cursor: exportingStudent === studentId ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    opacity: exportingStudent === studentId ? 0.6 : 1
                  }}
                  title="Export all chat logs for this student"
                >
                  {exportingStudent === studentId ? '⏳' : '📥'} Export
                </button>
              </div>

              {/* Conversation List */}
              <div style={{ padding: '20px' }}>
                {studentData.conversations.slice(0, 3).map((conv) => (
                  <div
                    key={conv.id}
                    style={{
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      marginBottom: '12px',
                      border: '1px solid #e9ecef'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <div style={{ 
                        fontWeight: 'bold',
                        color: '#333',
                        fontSize: '14px'
                      }}>
                        {conv.personaName || conv.persona}
                      </div>
                      <div style={{
                        background: conv.isActive ? '#28a745' : '#6c757d',
                        color: 'white',
                        borderRadius: '12px',
                        padding: '2px 8px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        {conv.isActive ? 'ACTIVE' : 'ENDED'}
                      </div>
                    </div>
                    <div style={{ 
                      color: '#666', 
                      fontSize: '12px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span>💬 {conv.messageCount || 0} messages</span>
                      <span>⏰ {formatDate(conv.lastActivity)}</span>
                    </div>
                  </div>
                ))}
                
                {studentData.conversations.length > 3 && (
                  <div style={{ 
                    textAlign: 'center', 
                    color: '#666',
                    fontSize: '12px',
                    marginTop: '8px'
                  }}>
                    +{studentData.conversations.length - 3} more conversations
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {studentList.length > 0 && (
        <div style={{ 
          marginTop: '30px',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '12px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>
            📊 Class Summary
          </h3>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9147FF' }}>
                {studentList.length}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Students with AI chats
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9147FF' }}>
                {studentList.reduce((sum, [_, data]) => sum + data.conversations.length, 0)}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Total conversations
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9147FF' }}>
                {studentList.reduce((sum, [_, data]) => 
                  sum + data.conversations.reduce((convSum, conv) => convSum + (conv.messageCount || 0), 0), 0
                )}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Total messages
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9147FF' }}>
                {studentList.reduce((sum, [_, data]) => 
                  sum + data.conversations.filter(conv => conv.isActive).length, 0
                )}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Active conversations
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatLogViewer;