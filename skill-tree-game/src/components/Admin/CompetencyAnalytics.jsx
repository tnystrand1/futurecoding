import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import competencyService from '../../services/competencyService';

const CompetencyAnalytics = ({ studentId, studentName, onClose }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('current');

  useEffect(() => {
    if (studentId) {
      loadCompetencyAnalysis();
    }
  }, [studentId]);

  const loadCompetencyAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`🔄 Loading competency analysis for student: ${studentId}`);
      
      const analysisData = await competencyService.getCompetencyAnalysis(studentId);
      setAnalysis(analysisData);
      console.log('📈 Analysis loaded:', analysisData);
    } catch (err) {
      console.error('Error loading competency analysis:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatRadarData = (competencies) => {
    return competencies.map(comp => ({
      subject: comp.name,
      value: comp.rating,
      fullMark: 10
    }));
  };

  const getRatingColor = (rating) => {
    if (rating >= 8) return '#4CAF50'; // Green for Proficient
    if (rating >= 4) return '#FF9800'; // Orange for Developing
    return '#F44336'; // Red for Emerging
  };

  const getRatingLabel = (rating) => {
    if (rating >= 8) return 'Proficient';
    if (rating >= 4) return 'Developing';
    return 'Emerging';
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  if (loading) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        background: 'rgba(0,0,0,0.8)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 10000 
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '400px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '20px' }}>🔍</div>
          <h3>Analyzing Competencies</h3>
          <p>Processing student evidence and interactions...</p>
          <div style={{
            width: '100%',
            height: '4px',
            background: '#f0f0f0',
            borderRadius: '2px',
            marginTop: '20px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              animation: 'pulse 2s ease-in-out infinite'
            }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        background: 'rgba(0,0,0,0.8)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 10000 
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '400px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <h3>Analysis Error</h3>
          <p>{error}</p>
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              onClick={loadCompetencyAnalysis}
              style={{
                background: '#667eea',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
            <button 
              onClick={onClose}
              style={{
                background: '#ccc',
                color: '#333',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const radarData = formatRadarData(analysis.competencies);

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      background: 'rgba(0,0,0,0.8)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        width: '95%',
        maxWidth: '1200px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '16px 16px 0 0'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px' }}>📊 Competency Analysis</h2>
            <p style={{ margin: '4px 0 0 0', opacity: 0.9 }}>{studentName}</p>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              borderRadius: '8px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Analysis Info */}
          <div style={{
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <strong>Analysis Date:</strong> {new Date(analysis.analysisDate).toLocaleDateString()}
            </div>
            <div>
              <strong>Evidence Analyzed:</strong> {analysis.evidenceCount?.skillsUnlocked || 0} skills, {analysis.evidenceCount?.artifacts || 0} artifacts, {analysis.evidenceCount?.chatInteractions || 0} conversations
            </div>
          </div>

          {/* Main Content Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* Radar Chart */}
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #eee',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 20px 0', textAlign: 'center' }}>Competency Radar</h3>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fontSize: 12, fill: '#333' }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 10]} 
                    tick={{ fontSize: 10, fill: '#666' }}
                  />
                  <Radar
                    name="Competency Level"
                    dataKey="value"
                    stroke="#667eea"
                    fill="#667eea"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
              
              {/* Legend */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '20px', 
                marginTop: '16px',
                fontSize: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '12px', height: '12px', background: '#F44336', borderRadius: '2px' }}></div>
                  Emerging (1-3)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '12px', height: '12px', background: '#FF9800', borderRadius: '2px' }}></div>
                  Developing (4-7)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '12px', height: '12px', background: '#4CAF50', borderRadius: '2px' }}></div>
                  Proficient (8-10)
                </div>
              </div>
            </div>

            {/* Overall Assessment */}
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #eee',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 16px 0' }}>Overall Assessment</h3>
              <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>
                {analysis.overall_assessment}
              </p>
              
              <h4 style={{ margin: '0 0 12px 0', color: '#4CAF50' }}>🎯 Growth Highlights</h4>
              <ul style={{ paddingLeft: '20px', lineHeight: '1.6', marginBottom: '20px' }}>
                {analysis.growth_highlights?.map((highlight, index) => (
                  <li key={index}>{highlight}</li>
                ))}
              </ul>
              
              <h4 style={{ margin: '0 0 12px 0', color: '#667eea' }}>🚀 Next Steps</h4>
              <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                {analysis.next_steps?.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Detailed Competency Breakdown */}
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ marginBottom: '20px' }}>Detailed Competency Analysis</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
              gap: '16px' 
            }}>
              {analysis.competencies.map((competency, index) => (
                <div key={index} style={{
                  background: '#fff',
                  border: '1px solid #eee',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '16px' }}>{competency.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>{getTrendIcon(competency.trend)}</span>
                      <span style={{
                        background: getRatingColor(competency.rating),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}>
                        {competency.rating}/10
                      </span>
                    </div>
                  </div>
                  
                  <div style={{
                    background: getRatingColor(competency.rating),
                    opacity: 0.1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    marginBottom: '12px',
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}>
                    {getRatingLabel(competency.rating)}
                  </div>
                  
                  <p style={{ fontSize: '14px', lineHeight: '1.5', marginBottom: '12px', color: '#666' }}>
                    {competency.narrative}
                  </p>
                  
                  {competency.evidence && competency.evidence.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <strong style={{ fontSize: '14px', color: '#333' }}>Evidence:</strong>
                      <ul style={{ fontSize: '13px', paddingLeft: '16px', margin: '4px 0', lineHeight: '1.4' }}>
                        {competency.evidence.slice(0, 3).map((evidence, evidenceIndex) => (
                          <li key={evidenceIndex} style={{ marginBottom: '4px' }}>{evidence}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {competency.areas_for_improvement && competency.areas_for_improvement.length > 0 && (
                    <div>
                      <strong style={{ fontSize: '14px', color: '#FF9800' }}>Growth Areas:</strong>
                      <ul style={{ fontSize: '13px', paddingLeft: '16px', margin: '4px 0', lineHeight: '1.4' }}>
                        {competency.areas_for_improvement.slice(0, 2).map((area, areaIndex) => (
                          <li key={areaIndex} style={{ marginBottom: '4px' }}>{area}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetencyAnalytics;
