import React, { useState } from 'react';
import { storage } from '../../utils/firebase-config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const EvidenceUploader = ({ evidenceType, onUpload, currentValue }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

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
      const fileName = `${evidenceType}/${timestamp}_${file.name}`;
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

  return (
    <div className="evidence-uploader">
      <div className="upload-area">
        <input
          type="file"
          id={`upload-${evidenceType}`}
          onChange={handleFileUpload}
          accept={evidenceType === 'screenshot' ? 'image/*' : '*'}
          disabled={uploading}
          style={{ display: 'none' }}
        />
        
        <label 
          htmlFor={`upload-${evidenceType}`}
          className={`upload-button ${uploading ? 'uploading' : ''}`}
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

      {currentValue && (
        <div className="uploaded-file">
          {evidenceType === 'screenshot' ? (
            <div className="screenshot-preview">
              <img 
                src={currentValue} 
                alt="Uploaded screenshot" 
                style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'cover' }}
              />
              <p>✅ Screenshot uploaded</p>
            </div>
          ) : (
            <p>✅ File uploaded: {currentValue.split('/').pop()}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default EvidenceUploader;
