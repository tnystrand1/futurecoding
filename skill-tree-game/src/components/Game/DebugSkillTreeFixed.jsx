import React from 'react';
import { SKILL_TREE } from '../../data/skillTreeData';

const DebugSkillTreeFixed = ({ studentProgress }) => {
  console.log('DebugSkillTree - studentProgress:', studentProgress);
  console.log('DebugSkillTree - SKILL_TREE keys:', Object.keys(SKILL_TREE));
  
  const skills = Object.values(SKILL_TREE);
  
  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    padding: '16px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  };

  const skillCardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
    padding: '12px',
    marginBottom: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  };
  
  return (
    <div style={{ 
      width: '100%', 
      minHeight: '600px', 
      padding: '16px', 
      backgroundColor: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Debug Information */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>
          🔍 Debug Information
        </h3>
        <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>Total skills in SKILL_TREE:</strong> {skills.length}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Student progress available:</strong> {studentProgress ? '✅ Yes' : '❌ No'}
          </div>
          {studentProgress && (
            <>
              <div style={{ marginBottom: '8px' }}>
                <strong>Student name:</strong> {studentProgress.name || 'Unknown'}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Student skills count:</strong> {Object.keys(studentProgress.skills || {}).length}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Website power:</strong> {studentProgress.websitePower || 0}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Total XP:</strong> {studentProgress.totalXP || 0}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Current Level:</strong> {studentProgress.currentLevel || 1}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Skills List */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>
          🎮 Skills List (First 6 Skills)
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '12px' 
        }}>
          {skills.slice(0, 6).map(skill => {
            const skillProgress = studentProgress?.skills?.[skill.id];
            const isUnlocked = skillProgress?.unlocked || false;
            const isAvailable = skill.tier === 1 || skill.prerequisites.every(prereq => 
              studentProgress?.skills?.[prereq]?.unlocked
            );
            
            let borderColor = '#e5e7eb';
            let backgroundColor = '#f9fafb';
            let statusColor = '#6b7280';
            let statusText = 'Locked';
            
            if (isUnlocked) {
              borderColor = '#10b981';
              backgroundColor = '#ecfdf5';
              statusColor = '#059669';
              statusText = '✅ Unlocked';
            } else if (isAvailable) {
              borderColor = '#3b82f6';
              backgroundColor = '#eff6ff';
              statusColor = '#2563eb';
              statusText = '🔓 Available';
            }
            
            return (
              <div 
                key={skill.id}
                style={{
                  ...skillCardStyle,
                  borderColor,
                  backgroundColor
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
                  {skill.name}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                  Tier {skill.tier} • XP: {skill.xpReward}
                </div>
                <div style={{ fontSize: '12px', marginBottom: '8px', color: statusColor, fontWeight: '500' }}>
                  Status: {statusText}
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
                  Position: ({skill.position.x}, {skill.position.y})
                </div>
                {skill.prerequisites.length > 0 && (
                  <div style={{ fontSize: '11px', color: '#7c3aed', marginTop: '8px' }}>
                    <strong>Prerequisites:</strong> {skill.prerequisites.join(', ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {skills.length > 6 && (
          <div style={{ 
            textAlign: 'center', 
            marginTop: '16px', 
            color: '#6b7280', 
            fontSize: '14px' 
          }}>
            ... and {skills.length - 6} more skills
          </div>
        )}
      </div>

      {/* Tailwind CSS Test */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>
          🎨 Visual Test Squares
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            width: '120px',
            height: '120px',
            backgroundColor: '#ef4444',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            fontWeight: '600'
          }}>
            Red Square
          </div>
          <div style={{
            width: '120px',
            height: '120px',
            backgroundColor: '#3b82f6',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            fontWeight: '600'
          }}>
            Blue Square
          </div>
          <div style={{
            width: '120px',
            height: '120px',
            backgroundColor: '#10b981',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            fontWeight: '600',
            border: '2px solid #000'
          }}>
            Green Square
          </div>
        </div>
      </div>

      {/* Data Deep Dive */}
      {studentProgress && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>
            📊 Detailed Student Data
          </h3>
          <pre style={{ 
            backgroundColor: '#f3f4f6', 
            padding: '12px', 
            borderRadius: '6px',
            fontSize: '12px',
            overflow: 'auto',
            maxHeight: '200px'
          }}>
            {JSON.stringify(studentProgress, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DebugSkillTreeFixed;