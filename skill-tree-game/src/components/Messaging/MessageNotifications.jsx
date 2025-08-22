import React, { useState, useEffect } from 'react';
import messagingService from '../../services/messagingService';
import enhancedMessagingService from '../../services/enhancedMessagingService';

const MessageNotifications = ({ studentId, onOpenMessage }) => {
  const [notifications, setNotifications] = useState([]);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState(null);
  const [activeNotifications, setActiveNotifications] = useState(new Map()); // Track browser notifications

  useEffect(() => {
    if (!studentId) return;

    // Listen for new conversations and messages  
    const unsubscribe = enhancedMessagingService.listenToStudentConversations(
      studentId,
      async (conversations) => {
        for (const conversation of conversations) {
          const lastMessage = conversation.lastMessage;
          
          // Check if this is a new unread message from someone else
          if (lastMessage && 
              lastMessage.senderId !== studentId && 
              (!lastMessageTimestamp || lastMessage.timestamp > lastMessageTimestamp)) {
            
            // Check if there are actually unread messages in this conversation
            try {
              const unreadCount = await enhancedMessagingService.getUnreadCount(studentId);
              if (unreadCount > 0) {
                // Get unread messages to verify this conversation has unread messages
                const messages = await enhancedMessagingService.getConversationMessages(conversation.id, 10);
                const hasUnreadFromOthers = messages.some(msg => 
                  msg.receiverId === studentId && 
                  !msg.isRead && 
                  msg.senderId !== studentId
                );
                
                if (hasUnreadFromOthers) {
                  showNotification(conversation);
                  setLastMessageTimestamp(lastMessage.timestamp);
                }
              }
            } catch (error) {
              console.error('Error checking unread status:', error);
              // Fallback to showing notification without read check
              showNotification(conversation);
              setLastMessageTimestamp(lastMessage.timestamp);
            }
          }
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [studentId, lastMessageTimestamp]);

  // Listen for messages being marked as read to dismiss notifications
  useEffect(() => {
    if (!studentId) return;

    const checkAndDismissReadNotifications = async () => {
      try {
        const unreadCount = await enhancedMessagingService.getUnreadCount(studentId);
        
        // If no unread messages, dismiss all notifications
        if (unreadCount === 0) {
          setNotifications([]);
          // Close all browser notifications
          activeNotifications.forEach(notification => {
            notification.close();
          });
          setActiveNotifications(new Map());
        } else {
          // Check each notification to see if its conversation still has unread messages
          const updatedNotifications = [];
          for (const notification of notifications) {
            try {
              const messages = await enhancedMessagingService.getConversationMessages(notification.conversationId, 10);
              const hasUnreadFromOthers = messages.some(msg => 
                msg.receiverId === studentId && 
                !msg.isRead && 
                msg.senderId !== studentId
              );
              
              if (hasUnreadFromOthers) {
                updatedNotifications.push(notification);
              } else {
                // Close browser notification for this conversation
                const browserNotif = activeNotifications.get(notification.conversationId);
                if (browserNotif) {
                  browserNotif.close();
                  activeNotifications.delete(notification.conversationId);
                }
              }
            } catch (error) {
              console.error('Error checking conversation read status:', error);
              // Keep notification on error
              updatedNotifications.push(notification);
            }
          }
          
          if (updatedNotifications.length !== notifications.length) {
            setNotifications(updatedNotifications);
          }
        }
      } catch (error) {
        console.error('Error checking read notifications:', error);
      }
    };

    // Check every 5 seconds for read status changes (less frequent to reduce load)
    const interval = setInterval(checkAndDismissReadNotifications, 5000);

    return () => clearInterval(interval);
  }, [studentId, notifications, activeNotifications]);

  // Cleanup browser notifications on unmount
  useEffect(() => {
    return () => {
      // Close all browser notifications when component unmounts
      activeNotifications.forEach(notification => {
        notification.close();
      });
    };
  }, [activeNotifications]);

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

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      // Close any existing browser notification for this conversation first
      const existingBrowserNotif = activeNotifications.get(notification.conversationId);
      if (existingBrowserNotif) {
        existingBrowserNotif.close();
      }

      const browserNotification = new Notification(`💬 ${notification.title}`, {
        body: notification.message,
        icon: '/favicon.png',
        badge: '/favicon.png',
        tag: `message-${notification.conversationId}`, // Replace existing notifications from same conversation
        requireInteraction: false // Allow auto-close
      });

      // Track this browser notification
      setActiveNotifications(prev => {
        const newMap = new Map(prev);
        newMap.set(notification.conversationId, browserNotification);
        return newMap;
      });

      // Handle browser notification click
      browserNotification.onclick = () => {
        onOpenMessage(notification.conversationId);
        dismissNotification(notification.id);
        browserNotification.close();
      };
    } else if (Notification.permission !== 'denied') {
      // Request permission for future notifications
      Notification.requestPermission();
    }
  };

  const dismissNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark messages as read when notification is clicked
      await enhancedMessagingService.markMessagesAsRead(notification.conversationId, studentId);
      
      // Close and remove browser notification
      const browserNotif = activeNotifications.get(notification.conversationId);
      if (browserNotif) {
        browserNotif.close();
        setActiveNotifications(prev => {
          const newMap = new Map(prev);
          newMap.delete(notification.conversationId);
          return newMap;
        });
      }

      // Open the conversation
      onOpenMessage(notification.conversationId);
      
      // Dismiss the toast notification
      dismissNotification(notification.id);
    } catch (error) {
      console.error('Error handling notification click:', error);
      // Still open the conversation even if marking as read fails
      onOpenMessage(notification.conversationId);
      dismissNotification(notification.id);
    }
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
