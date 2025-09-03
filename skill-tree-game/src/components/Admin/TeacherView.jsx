import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase-config';
import PendingEvidence from './PendingEvidence';
import ChatLogViewer from './ChatLogViewer';
import CompetencyAnalytics from './CompetencyAnalytics';
import ThreeCompetencyAnalytics from './ThreeCompetencyAnalytics';
import DailyReflectionsViewer from './DailyReflectionsViewer';
import competencyService from '../../services/competencyService';
import pdfExportService from '../../services/pdfExportService';

const TeacherView = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPin, setEditingPin] = useState(null);
  const [newPin, setNewPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState('students'); // 'students', 'pending', 'chatlogs', 'reflections', 'analytics', or 'three-competency'
  const [selectedStudentForAnalytics, setSelectedStudentForAnalytics] = useState(null);
  
  // PDF Export state
  const [selectedStudentsForPDF, setSelectedStudentsForPDF] = useState(new Set());
  const [isGeneratingPDFs, setIsGeneratingPDFs] = useState(false);
  const [pdfProgress, setPdfProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    if (isAuthenticated) {
      loadStudents();
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    const correctPassword = 'TPZVibes31!';
    
    if (password === correctPassword) {
      setIsAuthenticated(true);
      setAuthError('');
      setPassword(''); // Clear password from memory
    } else {
      setAuthError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setStudents([]);
    setEditingPin(null);
    setNewPin('');
    setActiveTab('students');
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const studentsData = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePinEdit = (studentId, currentPin = '') => {
    setEditingPin(studentId);
    setNewPin(currentPin);
  };

  const handlePinSave = async (studentId) => {
    try {
      const studentRef = doc(db, 'students', studentId);
      await updateDoc(studentRef, {
        pin: newPin.trim() || null
      });
      
      // Update local state
      setStudents(prev => prev.map(student => 
        student.id === studentId 
          ? { ...student, pin: newPin.trim() || null }
          : student
      ));
      
      setEditingPin(null);
      setNewPin('');
    } catch (error) {
      console.error('Error updating PIN:', error);
      alert('Error updating PIN. Please try again.');
    }
  };

  const handlePinCancel = () => {
    setEditingPin(null);
    setNewPin('');
  };

  // PDF Export Functions
  const handleStudentSelect = (studentId, isSelected) => {
    const newSelected = new Set(selectedStudentsForPDF);
    if (isSelected) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudentsForPDF(newSelected);
  };

  const handleSelectAll = (selectAll) => {
    if (selectAll) {
      setSelectedStudentsForPDF(new Set(students.map(s => s.id)));
    } else {
      setSelectedStudentsForPDF(new Set());
    }
  };

  const generatePDFReports = async () => {
    if (selectedStudentsForPDF.size === 0) {
      alert('Please select at least one student for PDF export.');
      return;
    }

    setIsGeneratingPDFs(true);
    setPdfProgress({ current: 0, total: selectedStudentsForPDF.size + 1 }); // +1 for summary

    const selectedStudents = students.filter(s => selectedStudentsForPDF.has(s.id));
    const competencyAnalyses = {};

    try {
      // Generate individual student PDFs
      for (let i = 0; i < selectedStudents.length; i++) {
        const student = selectedStudents[i];
        setPdfProgress({ current: i + 1, total: selectedStudentsForPDF.size + 1 });
        
        console.log(`🔄 Generating PDF for ${student.name || student.id}...`);
        
        // Get competency analysis for this student
        const analysis = await competencyService.getCompetencyAnalysis(student.id);
        competencyAnalyses[student.id] = analysis;
        
        // Add debugging to see what data we're working with
        console.log(`📊 Student data:`, {
          id: student.id,
          name: student.name,
          totalXP: student.totalXP,
          websitePower: student.websitePower,
          skills: Object.keys(student.skills || {}).length
        });
        console.log(`📊 Analysis result:`, {
          competencies: analysis?.competencies?.length || 0,
          competencyScore: analysis?.competencyScore,
          totalInteractions: analysis?.totalInteractions
        });
        
        // Generate PDF
        const pdf = await pdfExportService.generateStudentReport(student, analysis);
        const filename = `${(student.name || student.id).replace(/[^a-zA-Z0-9]/g, '_')}_Competency_Report.pdf`;
        pdfExportService.downloadPDF(pdf, filename);
        
        // Small delay to prevent browser from blocking multiple downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Generate summary report
      setPdfProgress({ current: selectedStudentsForPDF.size + 1, total: selectedStudentsForPDF.size + 1 });
      console.log('🔄 Generating summary report...');
      
      const summaryPdf = await pdfExportService.generateSummaryReport(selectedStudents, competencyAnalyses);
      pdfExportService.downloadPDF(summaryPdf, 'Class_Competency_Summary.pdf');

      console.log('✅ All PDF reports generated successfully!');
      alert(`Successfully generated ${selectedStudentsForPDF.size} individual reports + 1 summary report!`);
      
    } catch (error) {
      console.error('Error generating PDF reports:', error);
      alert(`Error generating PDF reports: ${error.message}`);
    } finally {
      setIsGeneratingPDFs(false);
      setPdfProgress({ current: 0, total: 0 });
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          maxWidth: '400px',
          width: '90%'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            <h1 style={{
              fontSize: '28px',
              margin: '0 0 8px 0',
              color: '#1f2937'
            }}>
              👩‍🏫 Teacher Access
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              margin: 0
            }}>
              Enter the teacher password to access student management
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#374151'
              }}>
                Teacher Password:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: authError ? '2px solid #ef4444' : '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter password"
                required
              />
              {authError && (
                <p style={{
                  color: '#ef4444',
                  fontSize: '14px',
                  marginTop: '8px',
                  margin: '8px 0 0 0'
                }}>
                  {authError}
                </p>
              )}
            </div>

            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <a
                href="/"
                style={{
                  padding: '12px 24px',
                  border: '2px solid #d1d5db',
                  background: 'white',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: '#374151',
                  textAlign: 'center',
                  flex: 1
                }}
              >
                ← Back to Students
              </a>
              <button
                type="submit"
                style={{
                  padding: '12px 24px',
                  background: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  flex: 1
                }}
              >
                Access Dashboard
              </button>
            </div>
          </form>

          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: '#f3f4f6',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            <strong>Note:</strong> This area is restricted to authorized teachers only.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          color: 'white',
          marginBottom: '24px'
        }}>
          <button
            onClick={handleLogout}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🚪 Logout
          </button>

          <h1 style={{
            fontSize: '36px',
            margin: '0 0 16px 0',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
          }}>
            👩‍🏫 Teacher Dashboard
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.9,
            margin: '0 0 8px 0'
          }}>
            Student Account Management & Evidence Review
          </p>
          <div style={{
            fontSize: '14px',
            opacity: 0.8
          }}>
            {students.length} Students Registered
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          background: 'white',
          borderRadius: '12px 12px 0 0',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <button
            onClick={() => setActiveTab('students')}
            style={{
              flex: 1,
              padding: '16px 24px',
              background: activeTab === 'students' ? '#7c3aed' : 'transparent',
              color: activeTab === 'students' ? 'white' : '#374151',
              border: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            👥 Student Management ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              flex: 1,
              padding: '16px 24px',
              background: activeTab === 'pending' ? '#7c3aed' : 'transparent',
              color: activeTab === 'pending' ? 'white' : '#374151',
              border: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            ⏳ Pending Evidence
          </button>
          <button
            onClick={() => setActiveTab('chatlogs')}
            style={{
              flex: 1,
              padding: '16px 24px',
              background: activeTab === 'chatlogs' ? '#7c3aed' : 'transparent',
              color: activeTab === 'chatlogs' ? 'white' : '#374151',
              border: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            🤖 AI Chat Logs
          </button>
          
          <button
            onClick={() => setActiveTab('reflections')}
            style={{
              flex: 1,
              padding: '16px 24px',
              background: activeTab === 'reflections' ? '#7c3aed' : 'transparent',
              color: activeTab === 'reflections' ? 'white' : '#374151',
              border: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            📝 Daily Reflections
          </button>
          
          <button
            onClick={() => setActiveTab('analytics')}
            style={{
              flex: 1,
              padding: '16px 24px',
              background: activeTab === 'analytics' ? '#7c3aed' : 'transparent',
              color: activeTab === 'analytics' ? 'white' : '#374151',
              border: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            📊 Competency Analytics
          </button>
          
          <button
            onClick={() => setActiveTab('three-competency')}
            style={{
              flex: 1,
              padding: '16px 24px',
              background: activeTab === 'three-competency' ? '#7c3aed' : 'transparent',
              color: activeTab === 'three-competency' ? 'white' : '#374151',
              border: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            🎯 Three Competency Analytics
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'students' && (
          <div style={{
            background: 'white',
            borderRadius: '0 0 12px 12px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}>
            {/* Students Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
              gap: '16px',
              marginBottom: '16px',
              paddingBottom: '16px',
              borderBottom: '2px solid #e5e7eb',
              fontWeight: 'bold',
              color: '#374151'
            }}>
              <div>Student Name</div>
              <div>Level</div>
              <div>Total XP</div>
              <div>Skills</div>
              <div>Current PIN</div>
              <div>Actions</div>
            </div>

            {/* Students Table Rows */}
            {students.map((student) => (
              <div
                key={student.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
                  gap: '16px',
                  padding: '16px 0',
                  borderBottom: '1px solid #e5e7eb',
                  alignItems: 'center'
                }}
              >
                <div style={{ fontWeight: 'bold' }}>
                  {student.name || student.id.replace(/_/g, ' ')}
                </div>
                <div>Level {student.currentLevel || 1}</div>
                <div>{student.totalXP || 0} XP</div>
                <div>
                  {Object.values(student.skills || {}).filter(skill => skill.unlocked).length} unlocked
                </div>
                <div>
                  {editingPin === student.id ? (
                    <input
                      type="text"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="Enter PIN"
                      style={{
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        width: '80px',
                        fontSize: '14px'
                      }}
                      maxLength="10"
                    />
                  ) : (
                    <span style={{
                      fontFamily: 'monospace',
                      background: student.pin ? '#f3f4f6' : 'transparent',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}>
                      {student.pin || 'No PIN'}
                    </span>
                  )}
                </div>
                <div>
                  {editingPin === student.id ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handlePinSave(student.id)}
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={handlePinCancel}
                        style={{
                          background: '#6b7280',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handlePinEdit(student.id, student.pin)}
                        style={{
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        {student.pin ? 'Change PIN' : 'Set PIN'}
                      </button>
                      <button
                        onClick={() => setSelectedStudentForAnalytics(student)}
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                        title="View detailed competency analysis"
                      >
                        📊 Analyze
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {students.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#6b7280'
              }}>
                No students found. Students will appear here after they create accounts.
              </div>
            )}

            {/* Instructions */}
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '20px',
              marginTop: '24px',
              color: '#374151',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '18px' }}>
                📝 Instructions for Teachers:
              </h3>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li style={{ marginBottom: '8px' }}>
                  <strong>PIN Management:</strong> Set or change student PINs for account security
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong>Student Progress:</strong> View each student's level, XP, and unlocked skills
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong>Student Access:</strong> Students need this PIN to access their account if set
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Pending Evidence Tab */}
        {activeTab === 'pending' && (
          <div style={{
            background: 'white',
            borderRadius: '0 0 12px 12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}>
            <PendingEvidence />
          </div>
        )}

        {/* AI Chat Logs Tab */}
        {activeTab === 'chatlogs' && (
          <div style={{
            background: 'white',
            borderRadius: '0 0 12px 12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}>
            <ChatLogViewer />
          </div>
        )}

        {/* Daily Reflections Tab */}
        {activeTab === 'reflections' && (
          <div style={{
            background: 'white',
            borderRadius: '0 0 12px 12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}>
            <DailyReflectionsViewer />
          </div>
        )}

        {/* Three Competency Analytics Tab */}
        {activeTab === 'three-competency' && (
          <div style={{
            background: 'white',
            borderRadius: '0 0 12px 12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}>
            <ThreeCompetencyAnalytics />
          </div>
        )}

        {/* Competency Analytics Tab */}
        {activeTab === 'analytics' && (
          <div style={{
            background: 'white',
            borderRadius: '0 0 12px 12px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>📊 Competency Analytics</h3>
                <p style={{ color: '#6b7280', margin: 0 }}>
                  View detailed competency analysis or generate PDF reports for selected students.
                </p>
              </div>
              
              {/* PDF Export Controls */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px',
                alignItems: 'flex-end',
                minWidth: '250px'
              }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    fontSize: '14px',
                    color: '#374151',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedStudentsForPDF.size === students.length && students.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      style={{ transform: 'scale(1.2)' }}
                    />
                    Select All ({students.length})
                  </label>
                </div>
                
                <button
                  onClick={generatePDFReports}
                  disabled={selectedStudentsForPDF.size === 0 || isGeneratingPDFs}
                  style={{
                    background: selectedStudentsForPDF.size > 0 && !isGeneratingPDFs 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                      : '#9ca3af',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: selectedStudentsForPDF.size > 0 && !isGeneratingPDFs ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    minWidth: '180px',
                    justifyContent: 'center'
                  }}
                >
                  {isGeneratingPDFs ? (
                    <>
                      <span>🔄</span>
                      Generating... ({pdfProgress.current}/{pdfProgress.total})
                    </>
                  ) : (
                    <>
                      <span>📄</span>
                      Export PDFs ({selectedStudentsForPDF.size})
                    </>
                  )}
                </button>
                
                {selectedStudentsForPDF.size > 0 && (
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#6b7280',
                    textAlign: 'right'
                  }}>
                    Will generate {selectedStudentsForPDF.size} individual reports + 1 summary
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gap: '12px' 
            }}>
              {students.map(student => (
                <div 
                  key={student.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    background: selectedStudentsForPDF.has(student.id) ? '#f0f9ff' : '#f9fafb',
                    borderRadius: '8px',
                    border: selectedStudentsForPDF.has(student.id) ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Checkbox for PDF selection */}
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedStudentsForPDF.has(student.id)}
                        onChange={(e) => handleStudentSelect(student.id, e.target.checked)}
                        style={{ 
                          transform: 'scale(1.3)',
                          marginRight: '8px'
                        }}
                      />
                    </label>
                    
                    <div style={{ fontSize: '24px' }}>
                      {typeof student.avatar === 'string' ? student.avatar : student.avatar?.emoji || '👤'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#374151' }}>
                        {student.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        Skills: {Object.values(student.skills || {}).filter(skill => skill.unlocked).length} | 
                        XP: {student.websitePower || 0}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setSelectedStudentForAnalytics(student)}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      transition: 'transform 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    📊 Analyze Competencies
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back Button */}
        <div style={{
          textAlign: 'center',
          marginTop: '24px'
        }}>
          <a
            href="/"
            style={{
              color: 'white',
              textDecoration: 'none',
              padding: '12px 24px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '8px',
              display: 'inline-block'
            }}
          >
            ← Back to Student Selection
          </a>
        </div>
      </div>
      
      {/* Competency Analytics Modal */}
      {selectedStudentForAnalytics && (
        <CompetencyAnalytics
          studentId={selectedStudentForAnalytics.id}
          studentName={selectedStudentForAnalytics.name}
          onClose={() => setSelectedStudentForAnalytics(null)}
        />
      )}
    </div>
  );
};

export default TeacherView;