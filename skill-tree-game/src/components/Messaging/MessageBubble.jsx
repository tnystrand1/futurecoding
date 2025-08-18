import React, { useState } from 'react';
import MessageFormatter from '../AI/MessageFormatter';
import { formatBubbleTimestamp } from '../../utils/dateUtils';
import ReadReceipts from './ReadReceipts';

const MessageBubble = ({ message, isOwnMessage, senderInfo }) => {
  const [expandedImage, setExpandedImage] = useState(null);
  // Using centralized date utility to fix "Invalid Date" issues

  const getMessageTypeIcon = (text) => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('help') || lowerText.includes('stuck') || lowerText.includes('how do')) {
      return '🙋';
    }
    if (lowerText.includes('thanks') || lowerText.includes('thank you')) {
      return '🙏';
    }
    if (lowerText.includes('work together') || lowerText.includes('collaborate') || lowerText.includes('partner')) {
      return '🤝';
    }
    if (lowerText.includes('finished') || lowerText.includes('completed') || lowerText.includes('done')) {
      return '✅';
    }
    if (lowerText.includes('website') || lowerText.includes('project') || lowerText.includes('code')) {
      return '💻';
    }
    if (lowerText.includes('css') || lowerText.includes('html') || lowerText.includes('javascript')) {
      return '🎨';
    }
    
    return null;
  };

  const hasCompetencyTags = message.competencyTags && message.competencyTags.length > 0;
  const messageIcon = getMessageTypeIcon(message.text);

  // Extract avatar properties safely to avoid React serialization issues
  // Handle both simple string avatars and complex avatar objects
  const avatarColor1 = (typeof senderInfo?.avatar === 'object' ? senderInfo?.avatar?.color1 : null) || '#FF8C42';
  const avatarEmoji = (typeof senderInfo?.avatar === 'object' ? senderInfo?.avatar?.emoji : senderInfo?.avatar) || '👤';

  return (
    <div style={{
      display: 'flex',
      justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
      alignItems: 'flex-end',
      gap: '8px',
      maxWidth: '100%'
    }}>
      {/* Other person's avatar */}
      {!isOwnMessage && senderInfo && (
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${avatarColor1} 0%, #FF6B1A 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          border: '2px solid #8B4513',
          flexShrink: 0
        }}>
          {avatarEmoji}
        </div>
      )}

      {/* Message Bubble */}
      <div style={{
        maxWidth: '70%',
        position: 'relative'
      }}>
        <div style={{
          background: isOwnMessage 
            ? 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)'
            : 'linear-gradient(135deg, #E6D5A8 0%, #D4C598 100%)',
          color: isOwnMessage ? '#F4E4BC' : '#8B4513',
          padding: '12px 16px',
          borderRadius: isOwnMessage ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          fontSize: '14px',
          lineHeight: '1.4',
          wordWrap: 'break-word',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          border: isOwnMessage ? 'none' : '1px solid #8B4513'
        }}>
          {/* Message Type Icon */}
          {messageIcon && (
            <div style={{
              display: 'inline-block',
              marginRight: '6px',
              fontSize: '16px'
            }}>
              {messageIcon}
            </div>
          )}
          
          {/* Message Images */}
          {message.images && message.images.length > 0 && (
            <div style={{
              marginBottom: message.text ? '8px' : '0',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px'
            }}>
              {message.images.map((image, imgIndex) => (
                <div
                  key={image.id || imgIndex}
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    maxWidth: '200px'
                  }}
                  onClick={() => setExpandedImage(image)}
                >
                  <img
                    src={image.dataUrl}
                    alt={image.name}
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '150px',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    right: '0',
                    background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.7))',
                    color: 'white',
                    fontSize: '10px',
                    padding: '8px 6px 4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {image.name}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Message Text with Formatting */}
          {message.text && (
            <div style={{ lineHeight: '1.4' }}>
              <MessageFormatter 
                content={message.text} 
                isUser={isOwnMessage}
                personaColor={isOwnMessage ? '#F4E4BC' : '#8B4513'}
              />
            </div>
          )}
          
          {/* Competency Tags */}
          {hasCompetencyTags && (
            <div style={{
              marginTop: '8px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px'
            }}>
              {message.competencyTags.map((tag, index) => (
                <div
                  key={index}
                  style={{
                    background: isOwnMessage ? 'rgba(244, 228, 188, 0.2)' : 'rgba(139, 69, 19, 0.1)',
                    color: isOwnMessage ? '#F4E4BC' : '#8B4513',
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    border: isOwnMessage ? '1px solid rgba(244, 228, 188, 0.3)' : '1px solid rgba(139, 69, 19, 0.2)'
                  }}
                >
                  {tag.replace('_', ' ')}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Info */}
        <div style={{
          display: 'flex',
          justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
          alignItems: 'center',
          gap: '6px',
          marginTop: '4px',
          fontSize: '11px',
          color: '#8B4513',
          opacity: 0.6
        }}>
          <span>{formatBubbleTimestamp(message.timestamp)}</span>
          <ReadReceipts 
            message={message} 
            isOwnMessage={isOwnMessage} 
            showTimestamp={false}
            compact={true}
          />
        </div>
      </div>

      {/* Own avatar placeholder (for alignment) */}
      {isOwnMessage && (
        <div style={{ width: '32px', flexShrink: 0 }} />
      )}

      {/* Image Modal */}
      {expandedImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
          onClick={() => setExpandedImage(null)}
        >
          <div style={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <img
              src={expandedImage.dataUrl}
              alt={expandedImage.name}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <div style={{
              marginTop: '12px',
              color: 'white',
              fontSize: '14px',
              textAlign: 'center',
              background: 'rgba(0, 0, 0, 0.7)',
              padding: '8px 16px',
              borderRadius: '20px'
            }}>
              {expandedImage.name}
            </div>
            <button
              onClick={() => setExpandedImage(null)}
              style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                background: 'rgba(255, 255, 255, 0.9)',
                color: '#333',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
