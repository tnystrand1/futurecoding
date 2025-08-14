import React, { useState, useEffect } from 'react';
import messagingService from '../../services/messagingService';

const MessageNotifications = ({ studentId, onOpenMessage }) => {
  const [notifications, setNotifications] = useState([]);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState(null);

  useEffect(() => {
    if (!studentId) return;

    // Listen for new conversations and messages
    const unsubscribe = messagingService.listenToStudentConversations(
      studentId,
      (conversations) => {
        conversations.forEach(conversation => {
          const lastMessage = conversation.lastMessage;
          
          // Check if this is a new message from someone else
          if (lastMessage && 
              lastMessage.senderId !== studentId && 
              (!lastMessageTimestamp || lastMessage.timestamp > lastMessageTimestamp)) {
            
            showNotification(conversation);
            setLastMessageTimestamp(lastMessage.timestamp);
          }
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [studentId, lastMessageTimestamp]);

  const showNotification = (conversation) => {
    const otherParticipantId = conversation.participants.find(id => id !== studentId);
    const otherParticipantName = otherParticipantId ? otherParticipantId.replace(/_/g, ' ') : 'Someone';
    
    const notification = {
      id: Date.now(),
      title: `New message from ${otherParticipantName}`,
      message: conversation.lastMessage?.text || 'New message',
      timestamp: Date.now(),
      conversationId: conversation.id,
      senderName: otherParticipantName
    };

    setNotifications(prev => {
      // Only add if not already showing a notification from this conversation
      const existing = prev.find(n => n.conversationId === notification.conversationId);
      if (existing) {
        return prev.map(n => n.conversationId === notification.conversationId ? notification : n);
      }
      return [...prev, notification];
    });

    // Auto-remove notification after 6 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 6000);

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(`💬 ${notification.title}`, {
        body: notification.message,
        icon: '/favicon.png',
        badge: '/favicon.png',
        tag: `message-${notification.conversationId}` // Replace existing notifications from same conversation
      });

      // Close browser notification after 4 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 4000);
    } else if (Notification.permission !== 'denied') {
      // Request permission for future notifications
      Notification.requestPermission();
    }
  };

  const dismissNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleNotificationClick = (notification) => {
    onOpenMessage(notification.conversationId);
    dismissNotification(notification.id);
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <>
      {/* Notification Toasts */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
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
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
              maxWidth: '320px',
              cursor: 'pointer',
              transform: 'translateX(0)',
              transition: 'all 0.3s ease',
              border: '2px solid #1D4ED8',
              animation: 'slideInRight 0.4s ease-out'
            }}
            onClick={() => handleNotificationClick(notification)}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 12px 32px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.3)';
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '10px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  fontSize: '18px'
                }}>
                  💬
                </div>
                <div style={{
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}>
                  {notification.senderName}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismissNotification(notification.id);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '4px',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: '10px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                ×
              </button>
            </div>
            <div style={{
              fontSize: '13px',
              opacity: 0.95,
              lineHeight: '1.4',
              marginBottom: '8px'
            }}>
              {notification.message.length > 80 
                ? notification.message.substring(0, 80) + '...'
                : notification.message
              }
            </div>
            <div style={{
              fontSize: '11px',
              opacity: 0.8,
              fontStyle: 'italic'
            }}>
              Click to open conversation
            </div>
          </div>
        ))}
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default MessageNotifications;
