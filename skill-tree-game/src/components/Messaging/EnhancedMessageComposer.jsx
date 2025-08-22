import React, { useState, useRef } from 'react';
import { detectUrls } from '../../utils/urlUtils';

const EnhancedMessageComposer = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedCodeFiles, setUploadedCodeFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showCodeTips, setShowCodeTips] = useState(false);
  const [showUrlTips, setShowUrlTips] = useState(false);
  const [detectedUrls, setDetectedUrls] = useState([]);
  const textareaRef = useRef(null);
  const imageFileInputRef = useRef(null);
  const codeFileInputRef = useRef(null);

  // Constants
  const MAX_MESSAGE_LENGTH = 2000;
  const MAX_FILES = 10; // 5 images + 5 code files
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if ((!message.trim() && uploadedImages.length === 0 && uploadedCodeFiles.length === 0) || isSending) return;

    setIsSending(true);
    try {
      // Combine all attachments with enhanced validation
      const allAttachments = [
        ...uploadedImages.map(img => {
          // Only include serializable properties for images
          return {
            id: String(img.id || Date.now()),
            type: 'image',
            name: String(img.name || 'image.png'),
            size: Number(img.size || 0),
            dataUrl: String(img.dataUrl || '')
          };
        }),
        ...uploadedCodeFiles.map(file => {
          // Only include serializable properties for code files
          return {
            id: String(file.id || Date.now()),
            type: 'code',
            name: String(file.name || 'code.txt'),
            size: Number(file.size || 0),
            content: String(file.content || ''),
            language: String(file.language || 'text')
          };
        })
      ];

      // Validate attachments before sending
      console.log('Sending message with attachments:', allAttachments.map(att => ({
        type: att.type,
        name: att.name,
        hasDataUrl: att.type === 'image' ? !!att.dataUrl : undefined,
        hasContent: att.type === 'code' ? !!att.content : undefined
      })));

      await onSendMessage(message.trim(), allAttachments);
      setMessage('');
      setUploadedImages([]);
      setUploadedCodeFiles([]);
      setShowCodeTips(false);
      setShowUrlTips(false);
      setDetectedUrls([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Message data:', { 
        text: message.trim(), 
        imageCount: uploadedImages.length,
        codeFileCount: uploadedCodeFiles.length 
      });
      
      // Show specific error message based on error type
      if (error.message?.includes('nested entity')) {
        alert('Failed to send message with attachments. This might be due to large file sizes or corrupted data. Please try with smaller images or without attachments.');
      } else if (error.message?.includes('permission')) {
        alert('You do not have permission to send messages in this conversation.');
      } else {
        alert('Failed to send message. Please check your internet connection and try again.');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e) => {
    const newMessage = e.target.value;
    setMessage(newMessage);
    
    // Smart code detection
    const hasCodeKeywords = newMessage.includes('function') || 
                           newMessage.includes('<div') || 
                           newMessage.includes('const ') ||
                           newMessage.includes('let ') ||
                           newMessage.includes('var ') ||
                           newMessage.includes('class ') ||
                           newMessage.includes('import ') ||
                           newMessage.includes('return ') ||
                           newMessage.includes('.css') ||
                           newMessage.includes('.js') ||
                           newMessage.includes('.html') ||
                           newMessage.includes('{') ||
                           newMessage.includes('</') ||
                           newMessage.includes('margin:') ||
                           newMessage.includes('padding:') ||
                           newMessage.includes('color:');
    
    const hasBackticks = newMessage.includes('```');
    setShowCodeTips(hasCodeKeywords && !hasBackticks && newMessage.length > 20);
    
    // URL detection and tips
    const urls = detectUrls(newMessage);
    setDetectedUrls(urls);
    setShowUrlTips(urls.length > 0 && !urls.some(url => !url.isSafe));
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
  };

  const insertQuickMessage = (text) => {
    setMessage(prev => prev + text);
    textareaRef.current?.focus();
  };

  const insertCodeTemplate = () => {
    const codeTemplate = '```\n// Your code here\n```';
    setMessage(prev => prev + codeTemplate);
    setShowCodeTips(false);
    textareaRef.current?.focus();
    
    // Position cursor inside the code block
    setTimeout(() => {
      if (textareaRef.current) {
        const cursorPos = textareaRef.current.value.indexOf('// Your code here');
        if (cursorPos !== -1) {
          textareaRef.current.setSelectionRange(cursorPos, cursorPos + 17);
        }
      }
    }, 100);
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const imagePromises = files
        .filter(file => file.type.startsWith('image/'))
        .slice(0, 5 - uploadedImages.length) // Respect current limit
        .map(file => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({
                id: Date.now() + Math.random(),
                dataUrl: e.target.result,
                name: file.name,
                size: file.size,
                type: 'image'
              });
            };
            reader.readAsDataURL(file);
          });
        });

      const newImages = await Promise.all(imagePromises);
      setUploadedImages(prev => [...prev, ...newImages].slice(0, 5));
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
      if (imageFileInputRef.current) {
        imageFileInputRef.current.value = '';
      }
    }
  };

  const handleCodeFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const codeFilePromises = files
        .filter(file => {
          const name = file.name.toLowerCase();
          return name.endsWith('.js') || 
                 name.endsWith('.html') || 
                 name.endsWith('.css') || 
                 name.endsWith('.txt') ||
                 name.endsWith('.jsx') ||
                 name.endsWith('.json') ||
                 file.type === 'text/plain';
        })
        .slice(0, 5 - uploadedCodeFiles.length) // Respect current limit
        .map(file => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({
                id: Date.now() + Math.random(),
                content: e.target.result,
                name: file.name,
                size: file.size,
                type: 'code',
                language: detectLanguage(file.name)
              });
            };
            reader.readAsText(file);
          });
        });

      const newCodeFiles = await Promise.all(codeFilePromises);
      setUploadedCodeFiles(prev => [...prev, ...newCodeFiles].slice(0, 5));
    } catch (error) {
      console.error('Error uploading code files:', error);
      alert('Failed to upload code files. Please try again.');
    } finally {
      setIsUploading(false);
      if (codeFileInputRef.current) {
        codeFileInputRef.current.value = '';
      }
    }
  };

  const detectLanguage = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const langMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'txt': 'text'
    };
    return langMap[ext] || 'text';
  };

  const removeImage = (imageId) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const removeCodeFile = (fileId) => {
    setUploadedCodeFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const insertCodeFileIntoMessage = (codeFile) => {
    const codeBlock = `\`\`\`${codeFile.language}\n${codeFile.content}\n\`\`\``;
    setMessage(prev => prev + '\n' + codeBlock);
    removeCodeFile(codeFile.id);
    textareaRef.current?.focus();
  };

  const handlePaste = (e) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.indexOf('image') !== -1);
    
    if (imageItems.length > 0) {
      e.preventDefault();
      
      imageItems.forEach(item => {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const newImage = {
              id: Date.now() + Math.random(),
              dataUrl: e.target.result,
              name: `pasted-image-${Date.now()}.png`,
              size: file.size,
              type: 'image'
            };
            setUploadedImages(prev => [...prev, newImage].slice(0, 5));
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const quickMessages = [
    { emoji: '🙋', text: "Can you help me with ", label: "Ask for help" },
    { emoji: '🤝', text: "Want to work together on ", label: "Collaborate" },
    { emoji: '💡', text: "I figured out how to ", label: "Share solution" },
    { emoji: '✅', text: "I completed ", label: "Share progress" },
    { emoji: '🔗', text: "Check out my project: ", label: "Share project" },
    { emoji: '💻', text: "```\n// Code here\n```", label: "Add code block" }
  ];

  const getTotalAttachments = () => uploadedImages.length + uploadedCodeFiles.length;
  const canAddMoreFiles = () => getTotalAttachments() < MAX_FILES;

  return (
    <div style={{
      padding: '15px 20px',
      borderTop: '1px solid #8B4513',
      background: 'rgba(139, 69, 19, 0.02)',
      maxHeight: '40vh', // Limit composer to 40% of viewport height
      overflow: 'auto', // Enable scrolling if content exceeds max height
      flexShrink: 0 // Prevent composer from shrinking
    }}>
      {/* Quick Message Buttons */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '12px',
        flexWrap: 'wrap'
      }}>
        {quickMessages.map((quick, index) => (
          <button
            key={index}
            onClick={() => {
              if (quick.text.includes('```')) {
                insertCodeTemplate();
              } else {
                insertQuickMessage(quick.text);
              }
            }}
            style={{
              background: quick.text.includes('```') ? 'rgba(52, 152, 219, 0.1)' : 'rgba(139, 69, 19, 0.1)',
              color: quick.text.includes('```') ? '#3498db' : '#8B4513',
              border: quick.text.includes('```') ? '1px solid rgba(52, 152, 219, 0.2)' : '1px solid rgba(139, 69, 19, 0.2)',
              borderRadius: '16px',
              padding: '6px 10px',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = quick.text.includes('```') ? 'rgba(52, 152, 219, 0.15)' : 'rgba(139, 69, 19, 0.15)';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = quick.text.includes('```') ? 'rgba(52, 152, 219, 0.1)' : 'rgba(139, 69, 19, 0.1)';
              e.target.style.transform = 'translateY(0)';
            }}
            title={quick.label}
          >
            <span>{quick.emoji}</span>
            <span>{quick.label}</span>
          </button>
        ))}
      </div>

      {/* Smart Code Tip */}
      {showCodeTips && (
        <div style={{
          marginBottom: '12px',
          padding: '8px 12px',
          background: 'rgba(241, 196, 15, 0.1)',
          border: '1px solid rgba(241, 196, 15, 0.3)',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#f39c12'
        }}>
          💡 <strong>Looks like code!</strong> Wrap it with ```backticks``` for proper formatting.
          <button
            onClick={insertCodeTemplate}
            style={{
              marginLeft: '8px',
              background: '#f39c12',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Add Code Block
          </button>
        </div>
      )}

      {/* URL Detection Tip */}
      {showUrlTips && detectedUrls.length > 0 && (
        <div style={{
          marginBottom: '12px',
          padding: '8px 12px',
          background: 'rgba(52, 152, 219, 0.1)',
          border: '1px solid rgba(52, 152, 219, 0.3)',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#3498db'
        }}>
          🔗 <strong>Found {detectedUrls.length} link{detectedUrls.length > 1 ? 's' : ''}!</strong> 
          Consider adding context about what you're sharing.
          <div style={{ marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {detectedUrls.slice(0, 3).map((urlInfo, index) => (
              <span key={index} style={{
                background: 'rgba(52, 152, 219, 0.15)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                <span>{urlInfo.icon}</span>
                <span>{urlInfo.domain}</span>
                {!urlInfo.isSafe && <span style={{ color: '#e74c3c' }}>⚠️</span>}
              </span>
            ))}
            {detectedUrls.length > 3 && (
              <span style={{
                fontSize: '10px',
                opacity: 0.7,
                padding: '2px 4px'
              }}>
                +{detectedUrls.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Image Previews */}
      {uploadedImages.length > 0 && (
        <div style={{
          marginBottom: '12px',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          maxHeight: '120px', // Limit preview height
          overflowY: 'auto' // Allow scrolling if many images
        }}>
          {uploadedImages.map(image => (
            <div
              key={image.id}
              style={{
                position: 'relative',
                width: '80px',
                height: '80px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '2px solid #8B4513'
              }}
            >
              <img
                src={image.dataUrl}
                alt={image.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              <button
                type="button"
                onClick={() => removeImage(image.id)}
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  background: 'rgba(220, 38, 38, 0.9)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
              <div style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                right: '0',
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                fontSize: '8px',
                padding: '2px 4px',
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

      {/* Code File Previews */}
      {uploadedCodeFiles.length > 0 && (
        <div style={{
          marginBottom: '12px',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          maxHeight: '150px', // Limit code preview height
          overflowY: 'auto' // Allow scrolling if many files
        }}>
          {uploadedCodeFiles.map(codeFile => (
            <div
              key={codeFile.id}
              style={{
                position: 'relative',
                minWidth: '200px',
                maxWidth: '300px',
                borderRadius: '8px',
                border: '2px solid #3498db',
                background: 'rgba(52, 152, 219, 0.05)',
                padding: '8px'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '6px'
              }}>
                <span style={{ fontSize: '16px' }}>📄</span>
                <span style={{ 
                  fontSize: '12px', 
                  fontWeight: 'bold',
                  color: '#3498db',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {codeFile.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeCodeFile(codeFile.id)}
                  style={{
                    background: 'rgba(220, 38, 38, 0.9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>
              
              <div style={{
                fontSize: '10px',
                color: '#666',
                marginBottom: '6px'
              }}>
                {codeFile.language} • {Math.round(codeFile.size / 1024)}KB
              </div>
              
              <div style={{
                fontSize: '11px',
                color: '#333',
                background: 'rgba(255, 255, 255, 0.8)',
                padding: '4px 6px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                maxHeight: '60px',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {codeFile.content.substring(0, 100)}...
              </div>
              
              <button
                onClick={() => insertCodeFileIntoMessage(codeFile)}
                style={{
                  marginTop: '6px',
                  width: '100%',
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Insert into Message
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Message Input Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <textarea
            ref={textareaRef}
            data-message-composer
            value={message}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            onPaste={handlePaste}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line, ``` for code blocks)"
            disabled={isSending || isUploading}
            style={{
              width: '100%',
              minHeight: '44px',
              maxHeight: '150px',
              padding: '12px 96px 12px 16px', // Extra padding for both buttons
              border: '2px solid #8B4513',
              borderRadius: '22px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'none',
              background: 'rgba(255, 255, 255, 0.9)',
              color: '#8B4513',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#A0522D'}
            onBlur={(e) => e.target.style.borderColor = '#8B4513'}
          />

          {/* Attachment Buttons */}
          <div style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            gap: '4px'
          }}>
            {/* Image Upload Button */}
            <button
              type="button"
              onClick={() => imageFileInputRef.current?.click()}
              disabled={isUploading || uploadedImages.length >= 5}
              style={{
                background: 'none',
                border: 'none',
                color: isUploading ? '#9ca3af' : '#8B4513',
                cursor: isUploading || uploadedImages.length >= 5 ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={uploadedImages.length >= 5 ? 'Maximum 5 images' : 'Attach image'}
            >
              📷
            </button>

            {/* Code File Upload Button */}
            <button
              type="button"
              onClick={() => codeFileInputRef.current?.click()}
              disabled={isUploading || uploadedCodeFiles.length >= 5}
              style={{
                background: 'none',
                border: 'none',
                color: isUploading ? '#9ca3af' : '#3498db',
                cursor: isUploading || uploadedCodeFiles.length >= 5 ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={uploadedCodeFiles.length >= 5 ? 'Maximum 5 code files' : 'Attach code file'}
            >
              📄
            </button>
          </div>

          {/* Hidden File Inputs */}
          <input
            ref={imageFileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          
          <input
            ref={codeFileInputRef}
            type="file"
            accept=".js,.jsx,.html,.css,.txt,.json,text/plain"
            multiple
            onChange={handleCodeFileUpload}
            style={{ display: 'none' }}
          />
          
          {/* Character count */}
          <div style={{
            position: 'absolute',
            bottom: '4px',
            right: '16px',
            fontSize: '10px',
            color: message.length > MAX_MESSAGE_LENGTH * 0.8 ? '#e74c3c' : '#8B4513',
            opacity: message.length > 200 ? 1 : 0.5,
            pointerEvents: 'none'
          }}>
            {message.length}/{MAX_MESSAGE_LENGTH}
          </div>
        </div>

        <button
          type="submit"
          disabled={(!message.trim() && getTotalAttachments() === 0) || isSending || isUploading || message.length > MAX_MESSAGE_LENGTH}
          style={{
            background: ((!message.trim() && getTotalAttachments() === 0) || isSending || isUploading || message.length > MAX_MESSAGE_LENGTH) 
              ? 'rgba(139, 69, 19, 0.3)' 
              : 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            cursor: ((!message.trim() && getTotalAttachments() === 0) || isSending || isUploading || message.length > MAX_MESSAGE_LENGTH) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            boxShadow: ((!message.trim() && getTotalAttachments() === 0) || isSending || isUploading || message.length > MAX_MESSAGE_LENGTH) 
              ? 'none' 
              : '0 2px 8px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.2s',
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            if (!((!message.trim() && getTotalAttachments() === 0) || isSending || isUploading || message.length > MAX_MESSAGE_LENGTH)) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = ((!message.trim() && getTotalAttachments() === 0) || isSending || isUploading || message.length > MAX_MESSAGE_LENGTH) 
              ? 'none' 
              : '0 2px 8px rgba(0, 0, 0, 0.2)';
          }}
        >
          {isSending ? '⏳' : isUploading ? '📎' : '➤'}
        </button>
      </form>

      {/* Enhanced Help Text */}
      <div style={{
        fontSize: '11px',
        color: '#8B4513',
        opacity: 0.6,
        marginTop: '8px',
        textAlign: 'center'
      }}>
        💻 Code blocks: ```your code here``` • 📷 Images: drag/paste/click • 📄 Files: .js, .html, .css
        <br />
        💡 <strong>Tip:</strong> Upload files for large code, use inline blocks for snippets!
      </div>
    </div>
  );
};

export default EnhancedMessageComposer;
