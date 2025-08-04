import React, { useState, useMemo, useCallback } from 'react';
import { SKILL_TREE } from '../../data/skillTreeData';
import ModernSkillNode from './ModernSkillNode';
import ModernSkillConnections from './ModernSkillConnections';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { Filter, Eye, RotateCcw } from 'lucide-react';

const ModernSkillTree = ({ studentProgress, onSkillClick }) => {
  const [hoveredSkill, setHoveredSkill] = useState(null);
  const [filterTier, setFilterTier] = useState('all');
  const [showCompleted, setShowCompleted] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Skill state calculations
  const skillStates = useMemo(() => {
    const states = {};
    
    Object.values(SKILL_TREE).forEach(skill => {
      const skillProgress = studentProgress?.skills?.[skill.id];
      const isUnlocked = skillProgress?.unlocked || false;
      const isCompleted = skillProgress?.completed || false;
      
      // Check if skill is available
      let isAvailable = false;
      if (skill.tier === 1) {
        isAvailable = true;
      } else {
        const prereqsMet = skill.prerequisites.every(prereq => 
          studentProgress?.skills?.[prereq]?.unlocked
        );
        const altPathMet = skill.alternativePaths?.some(path =>
          path.every(skillId => studentProgress?.skills?.[skillId]?.unlocked)
        ) || false;
        isAvailable = prereqsMet || altPathMet;
      }

      states[skill.id] = {
        unlocked: isUnlocked,
        available: isAvailable,
        completed: isCompleted
      };
    });

    return states;
  }, [studentProgress]);

  // Filter skills based on current filters
  const filteredSkills = useMemo(() => {
    return Object.values(SKILL_TREE).filter(skill => {
      if (filterTier !== 'all' && skill.tier !== parseInt(filterTier)) {
        return false;
      }
      if (!showCompleted && skillStates[skill.id]?.completed) {
        return false;
      }
      return true;
    });
  }, [filterTier, showCompleted, skillStates]);

  // Progress statistics
  const progressStats = useMemo(() => {
    const total = Object.keys(SKILL_TREE).length;
    const unlocked = Object.values(skillStates).filter(state => state.unlocked).length;
    const completed = Object.values(skillStates).filter(state => state.completed).length;
    const available = Object.values(skillStates).filter(state => state.available && !state.unlocked).length;

    return { total, unlocked, completed, available };
  }, [skillStates]);

  const handleSkillHover = useCallback((skill) => {
    setHoveredSkill(skill);
  }, []);

  const handleSkillClick = useCallback((skill) => {
    if (onSkillClick && skillStates[skill.id]?.available && !skillStates[skill.id]?.unlocked) {
      onSkillClick(skill);
    }
  }, [onSkillClick, skillStates]);

  const resetFilters = () => {
    setFilterTier('all');
    setShowCompleted(true);
    setZoomLevel(1);
  };

  return (
    <div className="w-full h-full flex flex-col space-y-4">
      {/* Control Panel */}
      <Card className="flex-shrink-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Skill Development Tree</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {progressStats.unlocked}/{progressStats.total} Skills
              </Badge>
              <Badge variant="tier1">
                {progressStats.available} Available
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-3">
            {/* Tier Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="text-sm border rounded px-2 py-1 bg-white"
              >
                <option value="all">All Tiers</option>
                <option value="1">Tier 1: Foundations</option>
                <option value="2">Tier 2: Applications</option>
                <option value="3">Tier 3: Specializations</option>
              </select>
            </div>

            {/* Show Completed Toggle */}
            <Button
              variant={showCompleted ? "default" : "outline"}
              size="sm"
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center space-x-1"
            >
              <Eye className="w-3 h-3" />
              <span>Show Completed</span>
            </Button>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
              >
                -
              </Button>
              <span className="text-sm px-2">{Math.round(zoomLevel * 100)}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoomLevel(Math.min(1.5, zoomLevel + 0.1))}
              >
                +
              </Button>
            </div>

            {/* Reset Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </Button>
          </div>

          {/* Progress Bars */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Unlocked</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progressStats.unlocked / progressStats.total) * 100}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {progressStats.unlocked}/{progressStats.total}
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Available</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progressStats.available / progressStats.total) * 100}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {progressStats.available} ready
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Completed</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progressStats.completed / progressStats.total) * 100}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {progressStats.completed} mastered
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skill Tree Visualization */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
          <div 
            className="relative w-full h-full overflow-auto bg-gradient-to-br from-slate-50 to-blue-50"
            style={{ minHeight: '600px' }}
          >
            <div
              className="relative w-full h-full transition-transform duration-300"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
                minWidth: '1000px',
                minHeight: '700px'
              }}
            >
              {/* Background Grid */}
              <div className="absolute inset-0 opacity-30">
                <svg width="100%" height="100%" className="absolute inset-0">
                  <defs>
                    <pattern
                      id="grid"
                      width="50"
                      height="50"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 50 0 L 0 0 0 50"
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="1"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              {/* Skill Connections */}
              <ModernSkillConnections
                skills={SKILL_TREE}
                studentProgress={studentProgress}
                hoveredSkill={hoveredSkill}
              />

              {/* Skill Nodes */}
              {filteredSkills.map(skill => (
                <ModernSkillNode
                  key={skill.id}
                  skill={skill}
                  unlocked={skillStates[skill.id]?.unlocked}
                  available={skillStates[skill.id]?.available}
                  completed={skillStates[skill.id]?.completed}
                  onHover={handleSkillHover}
                  onClick={handleSkillClick}
                  studentProgress={studentProgress}
                />
              ))}

              {/* Legend */}
              <Card className="absolute top-4 right-4 w-48 z-30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Legend</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-3 h-3 bg-green-100 border border-green-200 rounded" />
                    <span>Unlocked Skills</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded animate-pulse" />
                    <span>Available to Unlock</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded opacity-60" />
                    <span>Locked Skills</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded" />
                    <span>Completed Skills</span>
                  </div>
                </CardContent>
              </Card>

              {/* Hover Info Panel */}
              {hoveredSkill && (
                <Card className="absolute bottom-4 left-4 w-72 z-30 bg-white/95 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{hoveredSkill.name}</CardTitle>
                      <Badge variant={`tier${hoveredSkill.tier}`}>
                        Tier {hoveredSkill.tier}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-gray-600 mb-2">
                      {hoveredSkill.description || "Master this skill to advance your web development journey."}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-green-600 font-medium">
                        +{hoveredSkill.xpReward} XP
                      </span>
                      <Badge 
                        variant={skillStates[hoveredSkill.id]?.completed ? "unlocked" : 
                                skillStates[hoveredSkill.id]?.unlocked ? "unlocked" :
                                skillStates[hoveredSkill.id]?.available ? "available" : "locked"}
                      >
                        {skillStates[hoveredSkill.id]?.completed ? "Completed" :
                         skillStates[hoveredSkill.id]?.unlocked ? "Unlocked" :
                         skillStates[hoveredSkill.id]?.available ? "Available" : "Locked"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModernSkillTree;