import React, { useState } from 'react';

const ProjectSubmission = ({ onSubmit, onCancel, teamId }) => {
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    websiteUrl: '',
    technologies: [],
    screenshots: []
  });
  const [customTech, setCustomTech] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const commonTechnologies = [
    'HTML', 'CSS', 'JavaScript', 'React', 'Tailwind CSS'
  ];

  const validateUrl = (url) => {
    try {
      new URL(url);
      return url.includes('github.io') || url.includes('netlify.app') || url.includes('vercel.app');
    } catch {
      return false;
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleTechToggle = (tech) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.includes(tech)
        ? prev.technologies.filter(t => t !== tech)
        : [...prev.technologies, tech]
    }));
  };

  const handleAddCustomTech = () => {
    if (customTech.trim() && !formData.technologies.includes(customTech.trim())) {
      setFormData(prev => ({
        ...prev,
        technologies: [...prev.technologies, customTech.trim()]
      }));
      setCustomTech('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Project title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    } else if (formData.description.length < 50) {
      newErrors.description = 'Description should be at least 50 characters';
    }

    if (!formData.websiteUrl.trim()) {
      newErrors.websiteUrl = 'Website URL is required';
    } else if (!validateUrl(formData.websiteUrl)) {
      newErrors.websiteUrl = 'Please enter a valid deployment URL (GitHub Pages, Netlify, or Vercel)';
    }

    if (formData.technologies.length === 0) {
      newErrors.technologies = 'Please select at least one technology';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      
      const projectData = {
        ...formData,
        teamId,
        teamName: getTeamDisplayName(teamId)
      };

      await onSubmit(projectData);
    } catch (error) {
      console.error('Error submitting project:', error);
      alert('Failed to submit project. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTeamDisplayName = (teamId) => {
    const teamNames = {
      'jeremy_client_team_1': 'Charles, Julius, Robert (Jeremy Client)',
      'jeremy_client_team_2': 'Matthew, Ocasio, Taii (Jeremy Client)',
      'fiona_client_team_1': 'Aaron, Luis, Sapphire (Fiona Client)',
      'fiona_client_team_2': 'Anthony, Jephte, Keyler (Fiona Client)',
      'jonathan_client_team_1': 'Miguel T, Mikayla, Seyvon, Yousha (Jonathan Client)',
      'jonathan_client_team_2': 'Aiden, Fradauryn, Romain (Jonathan Client)',
      'unassigned_team': 'Unassigned Team'
    };
    return teamNames[teamId] || teamId?.replace(/_/g, ' ') || 'Unknown Team';
  };

  const teamDisplayName = getTeamDisplayName(teamId);
  
  return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
        padding: '20px',
        zIndex: 1001,
        overflowY: 'auto'
      }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'linear-gradient(135deg, #F4E4BC 0%, #E6D5A8 100%)',
        border: '3px solid #8B4513',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '2px solid #8B4513'
        }}>
          <div>
            <h1 style={{
              margin: '0 0 8px 0',
              color: '#8B4513',
              fontSize: '24px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              📤 Submit Your Project
            </h1>
            <p style={{
              margin: 0,
              color: '#8B4513',
              fontSize: '14px',
              opacity: 0.8
            }}>
              Team: {teamDisplayName}
            </p>
          </div>

          <button
            onClick={onCancel}
            style={{
              background: 'rgba(139, 69, 19, 0.1)',
              color: '#8B4513',
              border: '1px solid rgba(139, 69, 19, 0.3)',
              borderRadius: '6px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ← Back to Gallery
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Project Title */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontWeight: 'bold',
              marginBottom: '6px',
              color: '#8B4513',
              fontSize: '14px'
            }}>
              Project Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Pocket Bloom - Plant Care App"
              style={{
                width: '100%',
                padding: '12px',
                border: `2px solid ${errors.title ? '#e74c3c' : '#8B4513'}`,
                borderRadius: '6px',
                fontSize: '14px',
                background: 'rgba(255, 255, 255, 0.9)'
              }}
              maxLength={100}
            />
            {errors.title && (
              <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '4px' }}>
                {errors.title}
              </div>
            )}
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontWeight: 'bold',
              marginBottom: '6px',
              color: '#8B4513',
              fontSize: '14px'
            }}>
              Project Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your project, its features, and what makes it special..."
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                border: `2px solid ${errors.description ? '#e74c3c' : '#8B4513'}`,
                borderRadius: '6px',
                fontSize: '14px',
                background: 'rgba(255, 255, 255, 0.9)',
                resize: 'vertical'
              }}
              maxLength={500}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '4px',
              fontSize: '12px'
            }}>
              {errors.description ? (
                <span style={{ color: '#e74c3c' }}>{errors.description}</span>
              ) : (
                <span style={{ color: '#8B4513', opacity: 0.7 }}>
                  Minimum 50 characters
                </span>
              )}
              <span style={{ color: '#8B4513', opacity: 0.7 }}>
                {formData.description.length}/500
              </span>
            </div>
          </div>

          {/* Website URL */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontWeight: 'bold',
              marginBottom: '6px',
              color: '#8B4513',
              fontSize: '14px'
            }}>
              Live Website URL *
            </label>
            <input
              type="url"
              value={formData.websiteUrl}
              onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
              placeholder="https://username.github.io/project-name"
              style={{
                width: '100%',
                padding: '12px',
                border: `2px solid ${errors.websiteUrl ? '#e74c3c' : '#8B4513'}`,
                borderRadius: '6px',
                fontSize: '14px',
                background: 'rgba(255, 255, 255, 0.9)'
              }}
            />
            {errors.websiteUrl && (
              <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '4px' }}>
                {errors.websiteUrl}
              </div>
            )}
            <div style={{
              fontSize: '11px',
              color: '#8B4513',
              opacity: 0.7,
              marginTop: '4px'
            }}>
              Supported: GitHub Pages, Netlify, Vercel
            </div>
          </div>

          {/* Technologies */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontWeight: 'bold',
              marginBottom: '6px',
              color: '#8B4513',
              fontSize: '14px'
            }}>
              Technologies Used *
            </label>
            
            {/* Common Technologies */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '8px',
              marginBottom: '12px'
            }}>
              {commonTechnologies.map(tech => (
                <button
                  key={tech}
                  type="button"
                  onClick={() => handleTechToggle(tech)}
                  style={{
                    background: formData.technologies.includes(tech)
                      ? 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)'
                      : 'rgba(139, 69, 19, 0.1)',
                    color: formData.technologies.includes(tech) ? 'white' : '#8B4513',
                    border: '1px solid #8B4513',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tech}
                </button>
              ))}
            </div>

            {/* Custom Technology */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                value={customTech}
                onChange={(e) => setCustomTech(e.target.value)}
                placeholder="Add custom technology..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #8B4513',
                  borderRadius: '6px',
                  fontSize: '12px',
                  background: 'rgba(255, 255, 255, 0.9)'
                }}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTech())}
              />
              <button
                type="button"
                onClick={handleAddCustomTech}
                disabled={!customTech.trim()}
                style={{
                  background: customTech.trim() ? '#27ae60' : '#bdc3c7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: customTech.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Add
              </button>
            </div>

            {/* Selected Technologies */}
            {formData.technologies.length > 0 && (
              <div style={{
                background: 'rgba(52, 152, 219, 0.1)',
                border: '1px solid rgba(52, 152, 219, 0.3)',
                borderRadius: '6px',
                padding: '8px',
                marginBottom: '8px'
              }}>
                <div style={{
                  fontSize: '11px',
                  color: '#2980b9',
                  fontWeight: 'bold',
                  marginBottom: '4px'
                }}>
                  Selected Technologies:
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {formData.technologies.map(tech => (
                    <span
                      key={tech}
                      style={{
                        background: '#3498db',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => handleTechToggle(tech)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.3)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '14px',
                          height: '14px',
                          fontSize: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {errors.technologies && (
              <div style={{ color: '#e74c3c', fontSize: '12px' }}>
                {errors.technologies}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            paddingTop: '20px',
            borderTop: '1px solid rgba(139, 69, 19, 0.2)'
          }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                background: 'rgba(139, 69, 19, 0.1)',
                color: '#8B4513',
                border: '1px solid rgba(139, 69, 19, 0.3)',
                borderRadius: '8px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={submitting}
              style={{
                background: submitting 
                  ? '#bdc3c7' 
                  : 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {submitting ? (
                <>
                  <span>⏳</span>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Submit Project</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    );
};

export default ProjectSubmission;
