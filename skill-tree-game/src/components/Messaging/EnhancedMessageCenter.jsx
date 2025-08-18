import React, { useState, useEffect } from 'react';
import EnhancedChatWindow from './EnhancedChatWindow';
import ConversationList from './ConversationList';
import StudentDirectory from './StudentDirectory';
import enhancedMessagingService from '../../services/enhancedMessagingService';

const EnhancedMessageCenter = ({ studentId, onClose }) => {
  const [activeView, setActiveView] = useState('conversations'); // 'conversations', 'chat', 'directory'
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadConversations();
    loadUnreadCount();
    
    // Set up real-time listeners
    const conversationsUnsubscribe = enhancedMessagingService.listenToStudentConversations(
      studentId,
      (newConversations) => {
        // Enrich conversations with participant info
        enrichConversationsWithParticipantInfo(newConversations);
      }
    );

    return () => {
      conversationsUnsubscribe();
    };
  }, [studentId]);

  const enrichConversationsWithParticipantInfo = async (conversations) => {
    try {
      const studentDirectory = await enhancedMessagingService.getStudentDirectory(studentId);
      const enrichedConversations = conversations.map(conv => {
        if (conv.isGroup) {
          // For group conversations, get info for all participants
          const participantInfos = conv.participants
            .filter(p => p !== studentId)
            .map(p => studentDirectory.find(s => s.id === p))
            .filter(Boolean);
          
          return {
            ...conv,
            participantInfo: participantInfos
          };
        } else {
          // For direct conversations, get the other participant
          const otherParticipantId = conv.participants.find(p => p !== studentId);
          const participantInfo = studentDirectory.find(s => s.id === otherParticipantId);
          
          return {
            ...conv,
            participantInfo: participantInfo ? [participantInfo] : []
          };
        }
      });
      
      setConversations(enrichedConversations);
    } catch (error) {
      console.error('Error enriching conversations:', error);
      setConversations(conversations);
    }
  };

  const loadConversations = async () => {
    try {
      const studentConversations = await enhancedMessagingService.getStudentConversations(studentId);
      await enrichConversationsWithParticipantInfo(studentConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      showNotification('Failed to load conversations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await enhancedMessagingService.getUnreadCount(studentId);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const showNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      dismissNotification(notification.id);
    }, 5000);
  };

  const dismissNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleStartConversation = async (otherStudentId, otherStudentInfo) => {
    try {
      setLoading(true);
      
      // Create or get existing conversation
      const conversation = await enhancedMessagingService.createConversation(studentId, otherStudentId);
      
      // Validate conversation object
      if (!conversation || !conversation.participants) {
        throw new Error('Invalid conversation object returned from service');
      }
      
      // Ensure conversation has required structure
      const safeConversation = {
        id: conversation.id,
        participants: conversation.participants || [studentId, otherStudentId],
        participantInfo: otherStudentInfo ? [{
          id: otherStudentInfo.id || otherStudentId,
          name: otherStudentInfo.name || otherStudentId.replace(/_/g, ' '),
          avatar: otherStudentInfo.avatar || { emoji: '👤', color1: '#FF8C42' }
        }] : [{
          id: otherStudentId,
          name: otherStudentId.replace(/_/g, ' '),
          avatar: { emoji: '👤', color1: '#FF8C42' }
        }],
        lastMessage: conversation.lastMessage || { text: '', senderId: '', timestamp: new Date() },
        messageCount: conversation.messageCount || 0,
        createdAt: conversation.createdAt || new Date()
      };
      
      console.log('Starting conversation with safe object:', safeConversation);
      
      setSelectedConversation(safeConversation);
      setActiveView('chat');
      
      showNotification(`Started conversation with ${otherStudentInfo.name}`, 'success');
    } catch (error) {
      console.error('Error starting conversation:', error);
      showNotification(`Failed to start conversation: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    if (!conversation || !conversation.participants) {
      console.error('Invalid conversation object:', conversation);
      showNotification('Invalid conversation data', 'error');
      return;
    }
    
    console.log('Selecting conversation:', conversation);
    setSelectedConversation(conversation);
    setActiveView('chat');
  };

  const handleBackToConversations = () => {
    setSelectedConversation(null);
    setActiveView('conversations');
    loadUnreadCount(); // Refresh unread count
  };

  const getViewTitle = () => {
    switch (activeView) {
      case 'chat':
        if (selectedConversation?.isGroup) {
          return `🏆 ${selectedConversation.groupName || 'Group Chat'}`;
        } else {
          const otherParticipant = selectedConversation?.participantInfo?.[0];
          return `💬 ${otherParticipant?.name || 'Chat'}`;
        }
      case 'directory':
        return '👥 Find Classmates';
      default:
        return `💬 Messages ${unreadCount > 0 ? `(${unreadCount})` : ''}`;
    }
  };

  const getConversationStats = () => {
    const total = conversations.length;
    const withUnread = conversations.filter(conv => 
      conv.messageCount > 0 && 
      conv.lastMessage?.senderId !== studentId
    ).length;
    const codeConversations = conversations.filter(conv => 
      conv.lastMessage?.messageType?.includes('code')
    ).length;
    
    return { total, withUnread, codeConversations };
  };

  const stats = getConversationStats();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: '90vw',
          maxWidth: '800px',
          height: '80vh',
          maxHeight: '700px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
          color: 'white',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
              {getViewTitle()}
            </h2>
            
            {activeView === 'conversations' && stats.total > 0 && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '4px 8px',
                fontSize: '11px',
                display: 'flex',
                gap: '8px'
              }}>
                <span>{stats.total} chats</span>
                {stats.codeConversations > 0 && <span>• {stats.codeConversations} code</span>}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Navigation Buttons */}
            {activeView === 'chat' && (
              <button
                onClick={handleBackToConversations}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                ← Back
              </button>
            )}
            
            {activeView === 'conversations' && (
              <button
                onClick={() => setActiveView('directory')}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                👥 New Chat
              </button>
            )}
            
            {activeView === 'directory' && (
              <button
                onClick={() => setActiveView('conversations')}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                💬 Messages
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              background: 'rgba(139, 69, 19, 0.02)',
              color: '#8B4513'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
                <div>Loading...</div>
              </div>
            </div>
          ) : (
            <>
              {activeView === 'conversations' && (
                <ConversationList
                  conversations={conversations}
                  currentStudentId={studentId}
                  onSelectConversation={handleSelectConversation}
                  onNewMessage={() => setActiveView('directory')}
                  onConversationUpdate={loadConversations}
                />
              )}

              {activeView === 'chat' && selectedConversation && (
                <EnhancedChatWindow
                  conversation={selectedConversation}
                  currentStudentId={studentId}
                  onBack={handleBackToConversations}
                />
              )}

              {activeView === 'directory' && (
                <StudentDirectory
                  currentStudentId={studentId}
                  onStartConversation={handleStartConversation}
                />
              )}
            </>
          )}
        </div>

        {/* Enhanced Help Footer */}
        {activeView === 'conversations' && !loading && (
          <div style={{
            background: 'rgba(139, 69, 19, 0.05)',
            padding: '12px 20px',
            borderTop: '1px solid rgba(139, 69, 19, 0.1)',
            fontSize: '12px',
            color: '#8B4513',
            textAlign: 'center'
          }}>
            💡 <strong>Pro Tips:</strong> Share code with ```backticks``` • Upload files with 📎 • 
            Use @mentions for collaboration • All messages help improve your competency analysis!
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      {notifications.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 10001,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {notifications.map(notification => (
            <div
              key={notification.id}
              style={{
                background: notification.type === 'error' ? '#e74c3c' : 
                           notification.type === 'success' ? '#27ae60' : '#3498db',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                maxWidth: '300px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px'
              }}
            >
              <span>
                {notification.type === 'error' ? '❌' : 
                 notification.type === 'success' ? '✅' : 'ℹ️'}
              </span>
              <span style={{ flex: 1 }}>{notification.message}</span>
              <button
                onClick={() => dismissNotification(notification.id)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedMessageCenter;
