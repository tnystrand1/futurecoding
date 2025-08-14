import React, { useState, useEffect } from 'react';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import StudentDirectory from './StudentDirectory';
import messagingService from '../../services/messagingService';

const MessageCenter = ({ studentId, onClose }) => {
  const [activeView, setActiveView] = useState('conversations'); // 'conversations', 'chat', 'directory'
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!studentId) return;

    // Load initial conversations
    loadConversations();

    // Set up real-time listeners
    const unsubscribeConversations = messagingService.listenToStudentConversations(
      studentId,
      (updatedConversations) => {
        // Check for new messages and show notifications
        if (conversations.length > 0) {
          updatedConversations.forEach(newConv => {
            const oldConv = conversations.find(c => c.id === newConv.id);
            if (oldConv && newConv.lastMessage && oldConv.lastMessage?.timestamp !== newConv.lastMessage?.timestamp) {
              // New message in this conversation
              if (newConv.lastMessage.senderId !== studentId) {
                showNotification(newConv);
              }
            }
          });
        }
        setConversations(updatedConversations);
      }
    );

    // Load unread count
    loadUnreadCount();

    setLoading(false);

    return () => {
      unsubscribeConversations();
    };
  }, [studentId]);

  const loadConversations = async () => {
    try {
      const studentConversations = await messagingService.getStudentConversations(studentId);
      setConversations(studentConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await messagingService.getUnreadCount(studentId);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const showNotification = (conversation) => {
    const otherParticipantId = conversation.participants.find(id => id !== studentId);
    const otherParticipantName = otherParticipantId ? otherParticipantId.replace(/_/g, ' ') : 'Someone';
    
    const notification = {
      id: Date.now(),
      title: `New message from ${otherParticipantName}`,
      message: conversation.lastMessage?.text || 'New message',
      timestamp: Date.now(),
      conversationId: conversation.id
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(`💬 ${notification.title}`, {
        body: notification.message,
        icon: '/favicon.png',
        badge: '/favicon.png'
      });
    } else if (Notification.permission !== 'denied') {
      // Request permission for future notifications
      Notification.requestPermission();
    }
  };

  const dismissNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleStartConversation = async (targetStudentId) => {
    try {
      const conversation = await messagingService.createConversation(studentId, targetStudentId);
      setSelectedConversation(conversation);
      setActiveView('chat');
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setActiveView('chat');
    
    // Mark messages as read
    messagingService.markMessagesAsRead(conversation.id, studentId);
    loadUnreadCount(); // Refresh unread count
  };

  const handleBackToConversations = () => {
    setSelectedConversation(null);
    setActiveView('conversations');
  };

  const handleNewMessage = () => {
    setActiveView('directory');
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #F4E4BC 0%, #E6D5A8 100%)',
          border: '3px solid #8B4513',
          borderRadius: '12px',
          padding: '30px',
          color: '#8B4513',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Loading Messages...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: 'linear-gradient(135deg, #F4E4BC 0%, #E6D5A8 100%)',
        border: '3px solid #8B4513',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '800px',
        height: '600px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px',
          borderBottom: '2px solid #8B4513',
          background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
          color: '#F4E4BC'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
              💬 Messages
            </h2>
            {unreadCount > 0 && (
              <div style={{
                background: '#dc2626',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {activeView === 'chat' && (
              <button
                onClick={handleBackToConversations}
                style={{
                  background: 'rgba(244, 228, 188, 0.2)',
                  color: '#F4E4BC',
                  border: '1px solid #F4E4BC',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ← Back
              </button>
            )}
            
            <button 
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#F4E4BC',
                padding: '5px',
                borderRadius: '4px',
                lineHeight: 1
              }}
              onClick={onClose}
              onMouseEnter={(e) => e.target.style.background = 'rgba(244, 228, 188, 0.2)'}
              onMouseLeave={(e) => e.target.style.background = 'none'}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {activeView === 'conversations' && (
            <ConversationList
              conversations={conversations}
              currentStudentId={studentId}
              onSelectConversation={handleSelectConversation}
              onNewMessage={handleNewMessage}
            />
          )}
          
          {activeView === 'chat' && selectedConversation && (
            <ChatWindow
              conversation={selectedConversation}
              currentStudentId={studentId}
              onBack={handleBackToConversations}
            />
          )}
          
          {activeView === 'directory' && (
            <StudentDirectory
              currentStudentId={studentId}
              onStartConversation={handleStartConversation}
              onBack={handleBackToConversations}
            />
          )}
        </div>
      </div>

      {/* Notification Toasts */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10001,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {notifications.map(notification => (
          <div
            key={notification.id}
            style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              color: 'white',
              borderRadius: '8px',
              padding: '15px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              maxWidth: '300px',
              cursor: 'pointer',
              animation: 'slideIn 0.3s ease-out',
              border: '2px solid #1D4ED8'
            }}
            onClick={() => {
              // Navigate to the conversation
              const conversation = conversations.find(c => c.id === notification.conversationId);
              if (conversation) {
                handleSelectConversation(conversation);
              }
              dismissNotification(notification.id);
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '8px'
            }}>
              <div style={{
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                {notification.title}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismissNotification(notification.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '0',
                  marginLeft: '10px'
                }}
              >
                ×
              </button>
            </div>
            <div style={{
              fontSize: '12px',
              opacity: 0.9,
              lineHeight: '1.3'
            }}>
              {notification.message.length > 60 
                ? notification.message.substring(0, 60) + '...'
                : notification.message
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessageCenter;
