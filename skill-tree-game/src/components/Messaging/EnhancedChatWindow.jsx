import React, { useState, useEffect, useRef } from 'react';
import EnhancedMessageBubble from './EnhancedMessageBubble';
import EnhancedMessageComposer from './EnhancedMessageComposer';
import enhancedMessagingService from '../../services/enhancedMessagingService';
import { formatMessageTimestamp } from '../../utils/dateUtils';
import { ConversationReadStatus } from './ReadReceipts';

const EnhancedChatWindow = ({ conversation, currentStudentId, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readStatus, setReadStatus] = useState(null);
  const messagesEndRef = useRef(null);

  // Safety checks for conversation object
  if (!conversation || !conversation.participants || !currentStudentId) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        background: 'rgba(231, 76, 60, 0.1)',
        color: '#e74c3c'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>❌</div>
          <div>Invalid conversation data</div>
          <button
            onClick={onBack}
            style={{
              marginTop: '12px',
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer'
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const otherParticipant = conversation.participants?.find(p => p !== currentStudentId);
  const otherParticipantInfo = conversation.participantInfo?.find(p => p?.id === otherParticipant);

  useEffect(() => {
    loadMessages();
    loadReadStatus();
    
    // Set up real-time listener
    const unsubscribe = enhancedMessagingService.listenToConversationMessages(
      conversation.id,
      (newMessages) => {
        setMessages(newMessages);
        scrollToBottom();
        
        // Mark messages as read
        enhancedMessagingService.markMessagesAsRead(conversation.id, currentStudentId);
        
        // Update read status
        loadReadStatus();
      }
    );

    return () => unsubscribe();
  }, [conversation.id, currentStudentId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const conversationMessages = await enhancedMessagingService.getConversationMessages(conversation.id);
      setMessages(conversationMessages);
      
      // Mark messages as read
      await enhancedMessagingService.markMessagesAsRead(conversation.id, currentStudentId);
      
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const loadReadStatus = async () => {
    try {
      const status = await enhancedMessagingService.getConversationReadStatus(conversation.id, currentStudentId);
      setReadStatus(status);
    } catch (error) {
      console.error('Error loading read status:', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (text, attachments = []) => {
    if ((!text.trim() && attachments.length === 0) || !otherParticipant) return;

    try {
      await enhancedMessagingService.sendMessage(
        conversation.id,
        currentStudentId,
        otherParticipant,
        text,
        attachments
      );
      
      // Message will be added via real-time listener
      scrollToBottom();
      
      // Update read status after sending
      setTimeout(() => loadReadStatus(), 500);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  // Using centralized date utility to fix "Invalid Date" issues

  const getMessageStats = () => {
    const totalMessages = messages.length;
    const userMessages = messages.filter(m => m.senderId === currentStudentId).length;
    const otherMessages = totalMessages - userMessages;
    const codeMessages = messages.filter(m => 
      m.messageType === 'code' || 
      m.messageType === 'code_mixed' || 
      m.attachments?.some(att => att.type === 'code')
    ).length;
    const imageMessages = messages.filter(m => 
      m.messageType === 'image' || 
      m.messageType === 'mixed' || 
      m.attachments?.some(att => att.type === 'image') ||
      m.images?.length > 0
    ).length;

    return { totalMessages, userMessages, otherMessages, codeMessages, imageMessages };
  };

  const stats = getMessageStats();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        background: 'rgba(139, 69, 19, 0.02)',
        color: '#8B4513'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
          <div>Loading conversation...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        background: 'rgba(231, 76, 60, 0.1)',
        color: '#e74c3c'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>❌</div>
          <div>{error}</div>
          <button
            onClick={loadMessages}
            style={{
              marginTop: '12px',
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '600px',
      background: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Chat Header */}
      <div style={{
        padding: '16px 20px',
        background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <button
          onClick={onBack}
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
            fontSize: '14px'
          }}
        >
          ←
        </button>
        
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          {typeof otherParticipantInfo?.avatar === 'object' ? otherParticipantInfo.avatar?.emoji || '👤' : otherParticipantInfo?.avatar || otherParticipantInfo?.name?.charAt(0) || '👤'}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
            {otherParticipantInfo?.name || `Student ${otherParticipant}`}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            {stats.totalMessages} messages • {stats.codeMessages} code • {stats.imageMessages} images
          </div>
          {readStatus && readStatus.totalSent > 0 && (
            <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>
              <ConversationReadStatus readStatus={readStatus} compact={true} />
            </div>
          )}
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '4px 8px',
          fontSize: '11px'
        }}>
          {formatMessageTimestamp(conversation.lastMessage?.timestamp)}
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 0',
        background: 'linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%)'
      }}>
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#8B4513',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                Start the conversation!
              </div>
              <div style={{ fontSize: '14px', opacity: 0.7 }}>
                Share code, ask questions, or collaborate on projects
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <EnhancedMessageBubble
                key={message.id || index}
                message={message}
                isOwnMessage={message.senderId === currentStudentId}
                senderInfo={message.senderId === otherParticipant ? otherParticipantInfo : null}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Composer */}
      <EnhancedMessageComposer onSendMessage={handleSendMessage} />
    </div>
  );
};

export default EnhancedChatWindow;
