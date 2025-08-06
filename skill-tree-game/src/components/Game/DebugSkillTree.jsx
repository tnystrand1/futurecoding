import React from 'react';
import { SKILL_TREE } from '../../data/skillTreeData';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

const DebugSkillTree = ({ studentProgress }) => {
  console.log('DebugSkillTree - studentProgress:', studentProgress);
  console.log('DebugSkillTree - SKILL_TREE keys:', Object.keys(SKILL_TREE));
  
  const skills = Object.values(SKILL_TREE);
  
  return (
    <div style={{ width: '100%', minHeight: '600px', padding: '16px', backgroundColor: '#f3f4f6' }}>
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        border: '1px solid #e5e7eb',
        marginBottom: '16px',
        padding: '16px'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
          Debug Information
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
          <div className="space-y-2 text-sm">
            <div>Total skills in SKILL_TREE: {skills.length}</div>
            <div>Student progress available: {studentProgress ? 'Yes' : 'No'}</div>
            {studentProgress && (
              <>
                <div>Student name: {studentProgress.name || 'Unknown'}</div>
                <div>Student skills count: {Object.keys(studentProgress.skills || {}).length}</div>
                <div>Website power: {studentProgress.websitePower || 0}</div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Simple skill list without complex positioning */}
      <Card>
        <CardHeader>
          <CardTitle>Skills List (Debug View)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.slice(0, 6).map(skill => { // Show first 6 skills
              const isUnlocked = studentProgress?.skills?.[skill.id]?.unlocked || false;
              const isAvailable = skill.tier === 1 || skill.prerequisites.every(prereq => 
                studentProgress?.skills?.[prereq]?.unlocked
              );
              
              return (
                <Card 
                  key={skill.id}
                  className={`p-3 border-2 ${
                    isUnlocked 
                      ? 'border-green-400 bg-green-50' 
                      : isAvailable 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="text-sm font-semibold mb-1">{skill.name}</div>
                  <div className="text-xs text-gray-600 mb-2">Tier {skill.tier}</div>
                  <div className="text-xs">
                    Status: {isUnlocked ? 'Unlocked' : isAvailable ? 'Available' : 'Locked'}
                  </div>
                  <div className="text-xs">XP: {skill.xpReward}</div>
                  <div className="text-xs">
                    Position: ({skill.position.x}, {skill.position.y})
                  </div>
                  {skill.prerequisites.length > 0 && (
                    <div className="text-xs text-purple-600 mt-1">
                      Prerequisites: {skill.prerequisites.join(', ')}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
          
          {skills.length > 6 && (
            <div className="mt-4 text-center text-gray-500">
              ... and {skills.length - 6} more skills
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test basic Tailwind classes */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Tailwind CSS Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="w-32 h-32 bg-red-500 text-white flex items-center justify-center">
              Red Square
            </div>
            <div className="w-32 h-32 bg-blue-500 text-white flex items-center justify-center">
              Blue Square
            </div>
            <div className="w-32 h-32 bg-green-500 text-white flex items-center justify-center border-2 border-black">
              Green Square with Border
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DebugSkillTree;