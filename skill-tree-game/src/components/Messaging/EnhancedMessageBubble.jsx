import React, { useState } from 'react';
import MessageFormatter from '../AI/MessageFormatter';
import { formatBubbleTimestamp } from '../../utils/dateUtils';
import ReadReceipts from './ReadReceipts';

const EnhancedMessageBubble = ({ message, isOwnMessage, senderInfo }) => {
  const [expandedImage, setExpandedImage] = useState(null);
  const [expandedCodeFile, setExpandedCodeFile] = useState(null);
  
  // Using centralized date utility to fix "Invalid Date" issues

  // Get attachments by type
  const imageAttachments = message.attachments?.filter(att => att.type === 'image') || [];
  const codeAttachments = message.attachments?.filter(att => att.type === 'code') || [];
  
  // Legacy support for old message format
  const legacyImages = message.images || [];
  
  const allImages = [...imageAttachments, ...legacyImages];

  // Determine message type icon
  const getMessageTypeIcon = (messageType) => {
    switch (messageType) {
      case 'image': return '📷';
      case 'code': return '💻';
      case 'code_mixed': return '💬💻';
      case 'mixed': return '📷💬';
      case 'mixed_media': return '📷💻';
      default: return '💬';
    }
  };

  const messageIcon = getMessageTypeIcon(message.messageType);

  // Check for competency tags
  const hasCompetencyTags = message.competencyTags && message.competencyTags.length > 0;

  const copyCodeToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  const getLanguageIcon = (language) => {
    const icons = {
      'html': '🌐',
      'css': '🎨',
      'javascript': '⚡',
      'js': '⚡',
      'jsx': '⚛️',
      'json': '📋',
      'text': '📄'
    };
    return icons[language] || '📄';
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
      alignItems: 'flex-end',
      gap: '8px',
      marginBottom: '12px',
      padding: '0 16px'
    }}>
      {/* Other person's avatar */}
      {!isOwnMessage && (
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          color: 'white',
          fontWeight: 'bold',
          flexShrink: 0
        }}>
          {typeof senderInfo?.avatar === 'object' ? senderInfo.avatar?.emoji || '👤' : senderInfo?.avatar || senderInfo?.name?.charAt(0) || '👤'}
        </div>
      )}

      {/* Message Bubble */}
      <div style={{
        maxWidth: '70%',
        background: isOwnMessage 
          ? 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)'
          : 'linear-gradient(135deg, #F4E4BC 0%, #E8D7B0 100%)',
        color: isOwnMessage ? 'white' : '#8B4513',
        borderRadius: '18px',
        padding: '12px 16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        wordBreak: 'break-word'
      }}>
        {/* Sender name for others' messages */}
        {!isOwnMessage && senderInfo?.name && (
          <div style={{
            fontSize: '11px',
            fontWeight: 'bold',
            marginBottom: '4px',
            opacity: 0.8
          }}>
            {senderInfo.name}
          </div>
        )}
        
        {/* Message type indicator */}
        {messageIcon !== '💬' && (
          <div style={{
            position: 'absolute',
            top: '-6px',
            right: '12px',
            background: isOwnMessage ? '#F4E4BC' : '#8B4513',
            color: isOwnMessage ? '#8B4513' : 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold'
          }}>
            {messageIcon}
          </div>
        )}
        
        {/* Image Attachments */}
        {allImages.length > 0 && (
          <div style={{
            marginBottom: message.text || codeAttachments.length > 0 ? '12px' : '0',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px'
          }}>
            {allImages.map((image, imgIndex) => (
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
                  fontSize: '9px',
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

        {/* Code File Attachments */}
        {codeAttachments.length > 0 && (
          <div style={{
            marginBottom: message.text ? '12px' : '0',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {codeAttachments.map((codeFile, index) => (
              <div
                key={codeFile.id || index}
                style={{
                  border: `2px solid ${isOwnMessage ? 'rgba(255, 255, 255, 0.3)' : 'rgba(139, 69, 19, 0.3)'}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: isOwnMessage ? 'rgba(255, 255, 255, 0.1)' : 'rgba(139, 69, 19, 0.05)'
                }}
              >
                {/* Code file header */}
                <div style={{
                  background: isOwnMessage ? 'rgba(255, 255, 255, 0.2)' : 'rgba(139, 69, 19, 0.1)',
                  padding: '8px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: `1px solid ${isOwnMessage ? 'rgba(255, 255, 255, 0.2)' : 'rgba(139, 69, 19, 0.2)'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px' }}>
                      {getLanguageIcon(codeFile.language)}
                    </span>
                    <span style={{ 
                      fontSize: '12px', 
                      fontWeight: 'bold',
                      fontFamily: 'monospace'
                    }}>
                      {codeFile.name}
                    </span>
                    <span style={{ 
                      fontSize: '10px', 
                      opacity: 0.7 
                    }}>
                      ({codeFile.language} • {Math.round(codeFile.size / 1024)}KB)
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => copyCodeToClipboard(codeFile.content)}
                      style={{
                        background: 'rgba(52, 152, 219, 0.8)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                      title="Copy code"
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={() => setExpandedCodeFile(codeFile)}
                      style={{
                        background: 'rgba(46, 204, 113, 0.8)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                      title="View full code"
                    >
                      👁️ View
                    </button>
                  </div>
                </div>
                
                {/* Code preview */}
                <div style={{
                  padding: '8px 12px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  background: isOwnMessage ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)',
                  color: isOwnMessage ? 'rgba(255, 255, 255, 0.9)' : '#333',
                  maxHeight: '100px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <pre style={{ 
                    margin: 0, 
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {codeFile.content.substring(0, 200)}
                    {codeFile.content.length > 200 && '...'}
                  </pre>
                  {codeFile.content.length > 200 && (
                    <div style={{
                      position: 'absolute',
                      bottom: '0',
                      left: '0',
                      right: '0',
                      height: '20px',
                      background: `linear-gradient(transparent, ${isOwnMessage ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)'})`
                    }} />
                  )}
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
            gap: '4px',
            flexWrap: 'wrap'
          }}>
            {message.competencyTags.map((tag, index) => (
              <span
                key={index}
                style={{
                  background: isOwnMessage ? 'rgba(255, 255, 255, 0.3)' : 'rgba(139, 69, 19, 0.2)',
                  color: isOwnMessage ? 'white' : '#8B4513',
                  fontSize: '9px',
                  padding: '2px 6px',
                  borderRadius: '8px',
                  fontWeight: 'bold'
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Timestamp and Read Receipts */}
        <div style={{
          fontSize: '10px',
          opacity: 0.6,
          marginTop: '6px',
          textAlign: isOwnMessage ? 'right' : 'left',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
          gap: '4px'
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

      {/* Code File Modal */}
      {expandedCodeFile && (
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
          onClick={() => setExpandedCodeFile(null)}
        >
          <div style={{
            position: 'relative',
            width: '90vw',
            maxHeight: '90vh',
            background: '#2c3e50',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              background: '#34495e',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #1a252f'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>
                  {getLanguageIcon(expandedCodeFile.language)}
                </span>
                <span style={{ 
                  color: 'white', 
                  fontWeight: 'bold',
                  fontFamily: 'monospace'
                }}>
                  {expandedCodeFile.name}
                </span>
                <span style={{ 
                  color: '#bdc3c7', 
                  fontSize: '12px' 
                }}>
                  ({expandedCodeFile.language} • {Math.round(expandedCodeFile.size / 1024)}KB)
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => copyCodeToClipboard(expandedCodeFile.content)}
                  style={{
                    background: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  📋 Copy All
                </button>
                <button
                  onClick={() => setExpandedCodeFile(null)}
                  style={{
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  ✕ Close
                </button>
              </div>
            </div>
            
            {/* Code Content */}
            <div style={{
              padding: '16px',
              fontFamily: 'monospace',
              fontSize: '13px',
              color: '#ecf0f1',
              background: '#2c3e50',
              maxHeight: '70vh',
              overflow: 'auto',
              lineHeight: '1.4'
            }}>
              <pre style={{ 
                margin: 0, 
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {expandedCodeFile.content}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedMessageBubble;
