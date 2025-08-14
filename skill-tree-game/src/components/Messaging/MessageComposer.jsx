import React, { useState, useRef } from 'react';

const MessageComposer = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if ((!message.trim() && uploadedImages.length === 0) || isSending) return;

    setIsSending(true);
    try {
      // Images are already in the correct format, just pass them through
      const processedImages = uploadedImages;

      await onSendMessage(message.trim(), processedImages);
      setMessage('');
      setUploadedImages([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Message data:', { text: message.trim(), imageCount: uploadedImages.length });
      alert('Failed to send message. Please try again.');
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
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const insertQuickMessage = (text) => {
    setMessage(prev => prev + text);
    textareaRef.current?.focus();
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const imagePromises = files
        .filter(file => file.type.startsWith('image/'))
        .slice(0, 5) // Limit to 5 images
        .map(file => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({
                id: Date.now() + Math.random(),
                dataUrl: e.target.result,
                name: file.name,
                size: file.size
                // Note: Don't store the File object, only the data we need
              });
            };
            reader.readAsDataURL(file);
          });
        });

      const newImages = await Promise.all(imagePromises);
      setUploadedImages(prev => [...prev, ...newImages].slice(0, 5)); // Max 5 images total
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (imageId) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
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
              size: file.size
              // Note: Don't store the File object
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
    { emoji: '🔗', text: "Check out my project: ", label: "Share project" }
  ];

  return (
    <div style={{
      padding: '15px 20px',
      borderTop: '1px solid #8B4513',
      background: 'rgba(139, 69, 19, 0.02)'
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
            onClick={() => insertQuickMessage(quick.text)}
            style={{
              background: 'rgba(139, 69, 19, 0.1)',
              color: '#8B4513',
              border: '1px solid rgba(139, 69, 19, 0.2)',
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
              e.target.style.background = 'rgba(139, 69, 19, 0.15)';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(139, 69, 19, 0.1)';
              e.target.style.transform = 'translateY(0)';
            }}
            title={quick.label}
          >
            <span>{quick.emoji}</span>
            <span>{quick.label}</span>
          </button>
        ))}
      </div>

      {/* Image Previews */}
      {uploadedImages.length > 0 && (
        <div style={{
          marginBottom: '12px',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
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
            placeholder="Type your message... (Enter to send, Shift+Enter for new line, Ctrl+V to paste images)"
            disabled={isSending || isUploading}
            style={{
              width: '100%',
              minHeight: '44px',
              maxHeight: '120px',
              padding: '12px 56px 12px 16px', // Extra padding for attachment button
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

          {/* Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || uploadedImages.length >= 5}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: isUploading ? '#9ca3af' : '#8B4513',
              cursor: isUploading || uploadedImages.length >= 5 ? 'not-allowed' : 'pointer',
              fontSize: '18px',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={uploadedImages.length >= 5 ? 'Maximum 5 images' : 'Attach image'}
          >
            {isUploading ? '⏳' : '📎'}
          </button>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          
          {/* Character count */}
          <div style={{
            position: 'absolute',
            bottom: '4px',
            right: '16px',
            fontSize: '10px',
            color: '#8B4513',
            opacity: message.length > 200 ? 1 : 0.5,
            pointerEvents: 'none'
          }}>
            {message.length}/500
          </div>
        </div>

        <button
          type="submit"
          disabled={(!message.trim() && uploadedImages.length === 0) || isSending || isUploading || message.length > 500}
          style={{
            background: ((!message.trim() && uploadedImages.length === 0) || isSending || isUploading || message.length > 500) 
              ? 'rgba(139, 69, 19, 0.3)' 
              : 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            cursor: ((!message.trim() && uploadedImages.length === 0) || isSending || isUploading || message.length > 500) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            boxShadow: ((!message.trim() && uploadedImages.length === 0) || isSending || isUploading || message.length > 500) 
              ? 'none' 
              : '0 2px 8px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.2s',
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            if (!((!message.trim() && uploadedImages.length === 0) || isSending || isUploading || message.length > 500)) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = ((!message.trim() && uploadedImages.length === 0) || isSending || isUploading || message.length > 500) 
              ? 'none' 
              : '0 2px 8px rgba(0, 0, 0, 0.2)';
          }}
        >
          {isSending ? '⏳' : isUploading ? '📎' : '➤'}
        </button>
      </form>

      {/* Help Text */}
      <div style={{
        fontSize: '11px',
        color: '#8B4513',
        opacity: 0.6,
        marginTop: '8px',
        textAlign: 'center'
      }}>
        💡 Tip: Be respectful and focus on learning together! Your messages help improve competency analytics.
      </div>
    </div>
  );
};

export default MessageComposer;
