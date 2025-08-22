import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../../utils/firebase-config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const EvidenceUploader = ({ evidenceType, onUpload, currentValue, uniqueId }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const pasteAreaRef = useRef(null);

  // Unified upload function that can handle files from input or paste
  const uploadFile = async (file, filename = null) => {
    // Validate file type
    if (evidenceType === 'screenshot') {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file for screenshots');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image file must be less than 5MB');
        return;
      }
    }

    setUploading(true);
    try {
      // Create unique filename with timestamp
      const timestamp = Date.now();
      const fileName = `${evidenceType}/${timestamp}_${filename || file.name || 'pasted-image.png'}`;
      const storageRef = ref(storage, fileName);

      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Call parent component with the URL
      onUpload(downloadURL);
      
      console.log('File uploaded successfully:', downloadURL);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    await uploadFile(file);
  };

  // Handle paste events for images
  const handlePaste = async (event) => {
    if (evidenceType !== 'screenshot') return; // Only for screenshots
    
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          event.preventDefault();
          await uploadFile(file, 'pasted-image.png');
          break;
        }
      }
    }
  };

  // Add paste event listener
  useEffect(() => {
    if (evidenceType === 'screenshot' && pasteAreaRef.current) {
      const handleDocumentPaste = (event) => {
        // Only handle paste if the component is focused or if the target is within our component
        if (pasteAreaRef.current && pasteAreaRef.current.contains(event.target)) {
          handlePaste(event);
        }
      };
      
      document.addEventListener('paste', handleDocumentPaste);
      return () => document.removeEventListener('paste', handleDocumentPaste);
    }
  }, [evidenceType]);

  return (
    <div ref={pasteAreaRef} style={{ marginTop: '8px' }}>
      <div>
        <input
          type="file"
          id={`upload-${uniqueId || evidenceType}`}
          onChange={handleFileUpload}
          accept={evidenceType === 'screenshot' ? 'image/*' : '*'}
          disabled={uploading}
          style={{ display: 'none' }}
        />
        
        <label 
          htmlFor={`upload-${uniqueId || evidenceType}`}
          style={{
            display: 'inline-block',
            padding: '12px 16px',
            backgroundColor: uploading ? 'rgba(139, 69, 19, 0.3)' : '#8B4513',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'background-color 0.2s'
          }}
        >
          {uploading ? (
            <span>
              📤 Uploading... {uploadProgress}%
            </span>
          ) : (
            <span>
              📎 {evidenceType === 'screenshot' ? 'Upload Screenshot' : 'Upload File'}
            </span>
          )}
        </label>
      </div>

      {evidenceType === 'screenshot' && !currentValue && (
        <div style={{
          marginTop: '8px',
          padding: '8px 12px',
          background: 'rgba(139, 69, 19, 0.1)',
          border: '1px dashed #8B4513',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#8B4513',
          fontStyle: 'italic'
        }}>
          💡 Tip: You can also paste an image here (Ctrl+V) after taking a screenshot
        </div>
      )}

      {currentValue && (
        <div style={{ 
          marginTop: '12px',
          padding: '12px',
          background: 'rgba(76, 175, 80, 0.1)',
          border: '1px solid #4CAF50',
          borderRadius: '6px'
        }}>
          {evidenceType === 'screenshot' ? (
            <div>
              <img 
                src={currentValue} 
                alt="Uploaded screenshot" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '200px', 
                  objectFit: 'contain',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}
              />
              <p style={{ 
                margin: 0, 
                color: '#4CAF50', 
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                ✅ Screenshot uploaded successfully
              </p>
            </div>
          ) : (
            <p style={{ 
              margin: 0, 
              color: '#4CAF50', 
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              ✅ File uploaded: {currentValue.split('/').pop()}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default EvidenceUploader;
