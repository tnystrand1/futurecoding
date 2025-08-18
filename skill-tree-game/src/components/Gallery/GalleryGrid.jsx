import React, { useState, useEffect } from 'react';
import galleryService from '../../services/galleryService';
import GalleryCard from './GalleryCard';
import GalleryDetail from './GalleryDetail';
import ProjectSubmission from './ProjectSubmission';
import LoadingSpinner from '../Shared/LoadingSpinner';

const GalleryGrid = ({ currentStudentId, currentStudentTeam, onClose }) => {
  const [projects, setProjects] = useState([]);
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'featured', 'myTeam'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProjects();
    loadFeaturedProjects();
    
    // Set up real-time listener
    const unsubscribe = galleryService.listenToAllProjects((updatedProjects) => {
      setProjects(updatedProjects);
    });

    return () => unsubscribe();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const result = await galleryService.getAllProjects();
      if (result.success) {
        setProjects(result.projects);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedProjects = async () => {
    try {
      const result = await galleryService.getFeaturedProjects();
      if (result.success) {
        setFeaturedProjects(result.projects);
      }
    } catch (error) {
      console.error('Error loading featured projects:', error);
    }
  };

  const handleProjectSubmission = async (projectData) => {
    try {
      const result = await galleryService.createProject({
        ...projectData,
        teamId: currentStudentTeam
      });
      
      if (result.success) {
        setShowSubmissionForm(false);
        // Projects will update automatically via real-time listener
      } else {
        alert(`Failed to submit project: ${result.error}`);
      }
    } catch (error) {
      console.error('Error submitting project:', error);
      alert('Failed to submit project. Please try again.');
    }
  };

  const getFilteredProjects = () => {
    let filtered = projects;

    // Apply filter
    switch (filter) {
      case 'featured':
        filtered = projects.filter(p => p.featured);
        break;
      case 'myTeam':
        filtered = projects.filter(p => p.teamId === currentStudentTeam);
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.technologies && project.technologies.some(tech => 
          tech.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      );
    }

    return filtered;
  };

  const filteredProjects = getFilteredProjects();
  const hasTeamProject = projects.some(p => p.teamId === currentStudentTeam);
  


  if (selectedProject) {
    return (
      <GalleryDetail
        project={selectedProject}
        currentStudentId={currentStudentId}
        onBack={() => setSelectedProject(null)}
      />
    );
  }

  if (showSubmissionForm) {
    return (
      <ProjectSubmission
        onSubmit={handleProjectSubmission}
        onCancel={() => setShowSubmissionForm(false)}
        teamId={currentStudentTeam}
      />
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
      padding: '20px',
      zIndex: 1000,
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #F4E4BC 0%, #E6D5A8 100%)',
        border: '3px solid #8B4513',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
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
              🎨 Website Gallery
            </h1>
            <p style={{
              margin: 0,
              color: '#8B4513',
              fontSize: '14px',
              opacity: 0.8
            }}>
              Showcase your team's amazing web development projects
            </p>
          </div>

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'rgba(139, 69, 19, 0.1)',
                color: '#8B4513',
                border: '1px solid rgba(139, 69, 19, 0.3)',
                borderRadius: '6px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              ← Back to Dashboard
            </button>
          )}

          {/* Submit Project Button */}
          {currentStudentTeam === 'unassigned_team' ? (
            <div style={{
              background: 'rgba(243, 156, 18, 0.1)',
              border: '2px solid #f39c12',
              borderRadius: '8px',
              padding: '12px 20px',
              fontSize: '14px',
              color: '#8B4513',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚠️</span>
              <span>No Team Assignment</span>
            </div>
          ) : !hasTeamProject ? (
            <button
              onClick={() => setShowSubmissionForm(true)}
              style={{
                background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
              }}
            >
              <span>📤</span>
              <span>Submit Project</span>
            </button>
          ) : (
            <div style={{
              background: 'rgba(46, 204, 113, 0.1)',
              border: '2px solid #2ecc71',
              borderRadius: '8px',
              padding: '12px 20px',
              fontSize: '14px',
              color: '#8B4513',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>✅</span>
              <span>Project Submitted</span>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          {/* Search */}
          <input
            type="text"
            placeholder="Search projects, teams, or technologies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '10px',
              border: '2px solid #8B4513',
              borderRadius: '6px',
              fontSize: '14px',
              background: 'rgba(255, 255, 255, 0.9)'
            }}
          />

          {/* Filter Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'featured', 'myTeam'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                style={{
                  background: filter === filterOption 
                    ? 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)'
                    : 'rgba(139, 69, 19, 0.1)',
                  color: filter === filterOption ? 'white' : '#8B4513',
                  border: '1px solid #8B4513',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {filterOption === 'all' && '🌐 All Projects'}
                {filterOption === 'featured' && '⭐ Featured'}
                {filterOption === 'myTeam' && '👥 My Team'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex',
          gap: '20px',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(139, 69, 19, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: '#8B4513'
          }}>
            <span>🏆</span>
            <span><strong>{projects.length}</strong> Total Projects</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: '#8B4513'
          }}>
            <span>⭐</span>
            <span><strong>{featuredProjects.length}</strong> Featured</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: '#8B4513'
          }}>
            <span>👥</span>
            <span><strong>{new Set(projects.map(p => p.teamId)).size}</strong> Teams</span>
          </div>
        </div>
      </div>

      {/* Featured Section */}
      {featuredProjects.length > 0 && filter === 'all' && (
        <div style={{
          background: 'linear-gradient(135deg, #FFE5B4 0%, #FFCC8F 100%)',
          border: '3px solid #8B4513',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{
            margin: '0 0 16px 0',
            color: '#8B4513',
            fontSize: '18px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ⭐ Featured Projects
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {featuredProjects.slice(0, 3).map(project => (
              <GalleryCard
                key={project.id}
                project={project}
                currentStudentId={currentStudentId}
                onProjectClick={setSelectedProject}
                compact={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Projects Grid */}
      <div style={{
        background: 'linear-gradient(135deg, #F4E4BC 0%, #E6D5A8 100%)',
        border: '3px solid #8B4513',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <h2 style={{
            margin: 0,
            color: '#8B4513',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            {filter === 'all' && 'All Projects'}
            {filter === 'featured' && 'Featured Projects'}
            {filter === 'myTeam' && 'My Team Projects'}
          </h2>
          
          <div style={{
            fontSize: '12px',
            color: '#8B4513',
            opacity: 0.7
          }}>
            {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <LoadingSpinner />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#8B4513'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              {searchTerm ? '🔍' : filter === 'myTeam' ? '👥' : '🎨'}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
              {searchTerm 
                ? 'No projects match your search'
                : filter === 'myTeam' 
                  ? 'No team projects yet'
                  : 'No projects yet'
              }
            </div>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>
              {searchTerm 
                ? 'Try different keywords or filters'
                : filter === 'myTeam'
                  ? 'Submit your first team project to get started!'
                  : 'Be the first to showcase your amazing work!'
              }
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {filteredProjects.map(project => (
              <GalleryCard
                key={project.id}
                project={project}
                currentStudentId={currentStudentId}
                onProjectClick={setSelectedProject}
                compact={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryGrid;
