import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ModernSkillTree from '../Game/ModernSkillTree';
import DebugSkillTreeFixed from '../Game/DebugSkillTreeFixed';
import WebsitePreview from './WebsitePreview';
import ModernEvidenceModal from '../Documentation/ModernEvidenceModal';
import AchievementToast from '../Shared/AchievementToast';
import LoadingSpinner from '../Shared/LoadingSpinner';
import { useGameState } from '../../hooks/useGameState';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn, formatXP, calculateProgress } from '../../lib/utils';

const ModernDashboard = () => {
  const { studentId } = useParams();
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showAchievement, setShowAchievement] = useState(null);
  
  const {
    studentProgress,
    loading,
    error,
    unlockSkill,
    addAchievement,
    updateWebsitePower
  } = useGameState(studentId);

  const handleSkillClick = (skill) => {
    setSelectedSkill(skill);
    setShowDocumentModal(true);
  };

  const handleSubmitEvidence = async (evidenceData) => {
    try {
      await unlockSkill(selectedSkill.id, evidenceData);
      setShowDocumentModal(false);
      setSelectedSkill(null);
      
      // Show achievement notification
      setShowAchievement({
        title: 'Skill Unlocked!',
        description: `You've mastered ${selectedSkill.name}`,
        xpGained: selectedSkill.xpReward
      });
    } catch (error) {
      console.error('Error submitting evidence:', error);
    }
  };

  useEffect(() => {
    if (showAchievement) {
      const timer = setTimeout(() => {
        setShowAchievement(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showAchievement]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="destructive"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!studentProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Student Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No student found with ID: {studentId}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const levelProgress = calculateProgress(
    studentProgress.totalXP % 1000, 
    1000
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Web Dev Journey
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                Welcome back, <span className="font-semibold">{studentProgress.name}</span>
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    Level {studentProgress.currentLevel}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatXP(studentProgress.totalXP)} XP
                  </div>
                  <div style={{ width: '96px', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '8px', marginTop: '8px' }}>
                    <div 
                      style={{ 
                        backgroundColor: '#2563eb', 
                        height: '8px', 
                        borderRadius: '9999px', 
                        transition: 'all 0.3s',
                        width: `${levelProgress}%` 
                      }}
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Skill Tree Section */}
          <div className="xl:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Skill Development Path
                </CardTitle>
                <p className="text-muted-foreground">
                  Click on available skills to unlock them by submitting evidence
                </p>
              </CardHeader>
              <CardContent className="p-4">
                <DebugSkillTreeFixed 
                  studentProgress={studentProgress}
                />
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Website Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Your Website
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Power Level: {studentProgress.websitePower}
                </p>
              </CardHeader>
              <CardContent>
                <WebsitePreview 
                  studentProgress={studentProgress}
                />
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            {studentProgress.achievements && studentProgress.achievements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Recent Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {studentProgress.achievements.slice(-3).map((achievement, index) => (
                      <div 
                        key={index}
                        className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                      >
                        <div className="text-yellow-600 mr-3">🏆</div>
                        <div>
                          <div className="font-medium text-sm">
                            {achievement.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {achievement.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progress Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Skills Unlocked</span>
                    <span className="font-semibold">
                      {Object.values(studentProgress.skills || {}).filter(skill => skill.unlocked).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total XP</span>
                    <span className="font-semibold">
                      {formatXP(studentProgress.totalXP)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Website Power</span>
                    <span className="font-semibold">
                      {studentProgress.websitePower}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showDocumentModal && (
        <ModernEvidenceModal
          skill={selectedSkill}
          onSubmit={handleSubmitEvidence}
          onClose={() => {
            setShowDocumentModal(false);
            setSelectedSkill(null);
          }}
        />
      )}

      {/* Achievement Toast */}
      {showAchievement && (
        <AchievementToast
          achievement={showAchievement}
          onClose={() => setShowAchievement(null)}
        />
      )}
    </div>
  );
};

export default ModernDashboard;