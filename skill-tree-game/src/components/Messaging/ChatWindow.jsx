import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';
import messagingService from '../../services/messagingService';

const ChatWindow = ({ conversation, currentStudentId, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otherParticipant, setOtherParticipant] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!conversation) return;

    // Get other participant info
    const otherParticipantId = conversation.participants.find(id => id !== currentStudentId);
    setOtherParticipant({
      id: otherParticipantId,
      name: otherParticipantId ? otherParticipantId.replace(/_/g, ' ') : 'Unknown',
      avatar: { emoji: '👤', color1: '#FF8C42' } // Default avatar
    });

    // Set up real-time message listener
    const unsubscribe = messagingService.listenToConversationMessages(
      conversation.id,
      (updatedMessages) => {
        setMessages(updatedMessages);
        setLoading(false);
        scrollToBottom();
      }
    );

    return () => {
      unsubscribe();
    };
  }, [conversation, currentStudentId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (text, images = []) => {
    if ((!text.trim() && images.length === 0) || !otherParticipant) return;

    try {
      await messagingService.sendMessage(
        conversation.id,
        currentStudentId,
        otherParticipant.id,
        text,
        images
      );
      
      // Message will be added via real-time listener
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        background: '#F4E4BC',
        color: '#8B4513',
        fontSize: '16px'
      }}>
        Loading conversation...
      </div>
    );
  }

  // Extract avatar properties safely to avoid React serialization issues
  // Handle both simple string avatars and complex avatar objects
  const avatarColor1 = (typeof otherParticipant?.avatar === 'object' ? otherParticipant?.avatar?.color1 : null) || '#FF8C42';
  const avatarEmoji = (typeof otherParticipant?.avatar === 'object' ? otherParticipant?.avatar?.emoji : otherParticipant?.avatar) || '👤';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#F4E4BC'
    }}>
      {/* Chat Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '15px 20px',
        borderBottom: '1px solid #8B4513',
        background: 'rgba(139, 69, 19, 0.05)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${avatarColor1} 0%, #FF6B1A 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          marginRight: '12px',
          border: '2px solid #8B4513'
        }}>
          {avatarEmoji}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{
            fontWeight: 'bold',
            fontSize: '16px',
            color: '#8B4513',
            marginBottom: '2px'
          }}>
            {otherParticipant?.name}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#8B4513',
            opacity: 0.6
          }}>
            {messages.length} messages
          </div>
        </div>

        {/* Chat Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            style={{
              background: 'rgba(139, 69, 19, 0.1)',
              color: '#8B4513',
              border: '1px solid #8B4513',
              borderRadius: '4px',
              padding: '6px 10px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
            title="Quick Help Request"
            onClick={() => {
              // Pre-fill composer with help request
              const composer = document.querySelector('[data-message-composer]');
              if (composer) {
                composer.value = "Hey! I could use some help with ";
                composer.focus();
              }
            }}
          >
            🙋 Ask for Help
          </button>
          
          <button
            style={{
              background: 'rgba(139, 69, 19, 0.1)',
              color: '#8B4513',
              border: '1px solid #8B4513',
              borderRadius: '4px',
              padding: '6px 10px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
            title="Offer Collaboration"
            onClick={() => {
              const composer = document.querySelector('[data-message-composer]');
              if (composer) {
                composer.value = "Want to work together on ";
                composer.focus();
              }
            }}
          >
            🤝 Collaborate
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#8B4513',
            fontSize: '16px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>👋</div>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              Start your conversation with {otherParticipant?.name}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>
              Say hello, ask a question, or share what you're working on!
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.senderId === currentStudentId;
            const showTimestamp = index === 0 || 
              (messages[index - 1] && 
               new Date(message.timestamp?.toDate?.() || message.timestamp) - 
               new Date(messages[index - 1].timestamp?.toDate?.() || messages[index - 1].timestamp) > 300000); // 5 minutes

            return (
              <div key={message.id}>
                {showTimestamp && (
                  <div style={{
                    textAlign: 'center',
                    fontSize: '12px',
                    color: '#8B4513',
                    opacity: 0.6,
                    margin: '10px 0'
                  }}>
                    {formatTimestamp(message.timestamp)}
                  </div>
                )}
                
                <MessageBubble
                  message={message}
                  isOwnMessage={isOwnMessage}
                  senderInfo={isOwnMessage ? null : otherParticipant}
                />
              </div>
            );
          })
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      <MessageComposer onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatWindow;
