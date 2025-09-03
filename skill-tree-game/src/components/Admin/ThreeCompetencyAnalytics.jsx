import React, { useState, useEffect } from 'react';
import threeCompetencyService from '../../services/ThreeCompetencyAnalyticsService';
import { db } from '../../utils/firebase-config';
import { collection, getDocs } from 'firebase/firestore';

const ThreeCompetencyAnalytics = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  // Test run state
  const [showTestOverlay, setShowTestOverlay] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testStudent, setTestStudent] = useState('');
  const [testModel, setTestModel] = useState('openai/gpt-4.1-mini');
  const [testResults, setTestResults] = useState(null);
  
  // Batch consistency state
  const [showBatchConsistencyOverlay, setShowBatchConsistencyOverlay] = useState(false);
  const [batchConsistencyLoading, setBatchConsistencyLoading] = useState(false);
  const [batchConsistencyResults, setBatchConsistencyResults] = useState(null);
  const [batchConsistencyProgress, setBatchConsistencyProgress] = useState(null);
  const [partialResults, setPartialResults] = useState(null);

  // Load students on component mount
  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      console.log('📋 Loading students for three-competency analytics...');
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const studentsList = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || doc.id.replace(/_/g, ' '),
        ...doc.data()
      }));
      
      setStudents(studentsList);
      console.log(`✅ Loaded ${studentsList.length} students`);
    } catch (error) {
      console.error('Error loading students:', error);
      setError('Failed to load students: ' + error.message);
    }
  };

  const handleStudentSelection = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const selectAllStudents = () => {
    setSelectedStudents(students.map(s => s.id));
  };

  const clearSelection = () => {
    setSelectedStudents([]);
  };

  const runSingleStudentAnalysis = async (studentId) => {
    try {
      setLoading(true);
      setError(null);
      setProgress({ current: 1, total: 1, studentId, status: 'Processing...' });
      
      console.log(`🚀 Running three-competency analysis for ${studentId}...`);
      const result = await threeCompetencyService.generateAndDownloadFiles(studentId);
      
      setResults({
        type: 'single',
        student: studentId,
        success: true,
        files: result.files_generated,
        timestamp: result.timestamp
      });
      
      setProgress({ current: 1, total: 1, studentId, status: 'Complete!' });
      
    } catch (error) {
      console.error(`Error analyzing ${studentId}:`, error);
      setError(`Failed to analyze ${studentId}: ${error.message}`);
      setProgress(null);
    } finally {
      setLoading(false);
    }
  };

  const runBatchAnalysis = async () => {
    if (selectedStudents.length === 0) {
      setError('Please select at least one student for batch analysis.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResults(null);
      
      console.log(`🚀 Running batch three-competency analysis for ${selectedStudents.length} students...`);
      
      const batchResults = await threeCompetencyService.generateBatchAnalysis(
        selectedStudents,
        {
          downloadFiles: true,
          onProgress: (progressData) => {
            setProgress({
              current: progressData.current,
              total: progressData.total,
              studentId: progressData.studentId,
              status: progressData.success ? 'Complete!' : `Error: ${progressData.error}`,
              success: progressData.success
            });
          }
        }
      );
      
      setResults({
        type: 'batch',
        summary: batchResults,
        timestamp: new Date().toISOString()
      });
      
      setProgress(null);
      
    } catch (error) {
      console.error('Error in batch analysis:', error);
      setError('Batch analysis failed: ' + error.message);
      setProgress(null);
    } finally {
      setLoading(false);
    }
  };

  const runTestAnalysis = async () => {
    if (!testStudent) {
      setError('Please select a student for testing');
      return;
    }

    setTestLoading(true);
    setError(null);
    
    try {
      console.log(`🧪 Running consistency test for ${testStudent} with ${testModel}...`);
      
      const results = await threeCompetencyService.runConsistencyTest(testStudent, testModel);
      setTestResults(results);
      console.log('✅ Test analysis completed:', results);
      
    } catch (error) {
      console.error('❌ Error in test analysis:', error);
      setError(error.message || 'An error occurred during test analysis');
    } finally {
      setTestLoading(false);
    }
  };

  const runBatchConsistencyAnalysis = async () => {
    if (selectedStudents.length === 0) {
      setError('Please select at least one student for batch consistency analysis');
      return;
    }

    setBatchConsistencyLoading(true);
    setError(null);
    setBatchConsistencyProgress(null);
    
    try {
      console.log(`🔬 Running batch consistency analysis for ${selectedStudents.length} students...`);
      
      const results = await threeCompetencyService.runBatchConsistencyAnalysis(selectedStudents, {
        onProgress: (progressData) => {
          setBatchConsistencyProgress(progressData);
        }
      });
      
      setBatchConsistencyResults(results);
      console.log('✅ Batch consistency analysis completed:', results);
      
    } catch (error) {
      console.error('❌ Error in batch consistency analysis:', error);
      setError(error.message || 'An error occurred during batch consistency analysis');
    } finally {
      setBatchConsistencyLoading(false);
      setBatchConsistencyProgress(null);
    }
  };

  const exportConsistencyReport = () => {
    if (!batchConsistencyResults) return;
    
    const report = threeCompetencyService.generateConsistencyReport(batchConsistencyResults);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `LLM_Consistency_Analysis_Report_${timestamp}.rtf`;
    
    threeCompetencyService.downloadRTFFile(report, filename);
    console.log(`📄 Exported consistency report: ${filename}`);
  };

  const extractPartialResults = async () => {
    try {
      console.log('🔍 Attempting to extract partial results from browser memory...');
      
      // Try to get data from the service's internal state (if available)
      if (window.lastBatchResults && window.lastBatchResults.studentResults) {
        const partialData = threeCompetencyService.extractPartialResults(window.lastBatchResults.studentResults);
        setPartialResults(partialData);
        
        // Generate a partial report
        const partialReport = `PARTIAL BATCH CONSISTENCY RESULTS
Generated: ${new Date().toISOString()}

EXTRACTED DATA SUMMARY:
${partialData.map(student => {
  const successfulModels = student.models.filter(m => m.status !== 'failed');
  return `
Student: ${student.studentId}
- Successful Models: ${successfulModels.length}/3
${student.models.map(model => 
  `  • ${model.modelName}: ${model.status} (${model.successfulRuns || 0}/3 runs)${model.consistencyRate ? ` - ${model.consistencyRate}% consistent` : ''}`
).join('\n')}`;
}).join('\n')}

Note: This is partial data extracted after analysis failure.
For complete results, re-run the batch analysis.`;

        // Auto-download the partial report
        const blob = new Blob([partialReport], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `partial-results-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('✅ Partial results extracted and downloaded');
      } else {
        console.log('⚠️ No partial results found in browser memory');
        alert('No partial results found. The analysis may need to be re-run.');
      }
    } catch (error) {
      console.error('Error extracting partial results:', error);
      alert('Failed to extract partial results: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '28px' }}>
          📊 Three Competency Analytics
        </h2>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '16px' }}>
          STEAM Interest • Sense of Belonging • Communication | Dual LLM Analysis (Claude Sonnet-4 & Gemini 2.5 Flash)
        </p>
        <div style={{ 
          marginTop: '12px', 
          padding: '8px 12px', 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: '6px',
          fontSize: '14px'
        }}>
          ⚠️ Day 8 student self-ratings are automatically excluded from evidence as requested
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          background: '#ffebee',
          border: '1px solid #f44336',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
          color: '#d32f2f'
        }}>
          <strong>Error:</strong> {error}
          <button 
            onClick={() => setError(null)}
            style={{
              float: 'right',
              background: 'none',
              border: 'none',
              color: '#d32f2f',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Progress Display */}
      {progress && (
        <div style={{
          background: '#e3f2fd',
          border: '1px solid #2196f3',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>Processing: {progress.studentId}</strong>
              <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                Student {progress.current} of {progress.total} • {progress.status}
              </div>
            </div>
            <div style={{
              width: '100px',
              height: '8px',
              background: '#e0e0e0',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(progress.current / progress.total) * 100}%`,
                height: '100%',
                background: progress.success === false ? '#f44336' : '#4caf50',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div style={{
          background: '#e8f5e8',
          border: '1px solid #4caf50',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#2e7d32' }}>
            ✅ Analysis Complete
          </h3>
          
          {results.type === 'single' ? (
            <div>
              <p><strong>Student:</strong> {results.student}</p>
              <p><strong>Files Generated:</strong></p>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                {results.files.map((file, index) => (
                  <li key={index} style={{ marginBottom: '4px' }}>{file}</li>
                ))}
              </ul>
              <p style={{ fontSize: '14px', color: '#666' }}>
                Files have been downloaded to your Downloads folder.
              </p>
            </div>
          ) : (
            <div>
              <p><strong>Batch Analysis Summary:</strong></p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', margin: '12px 0' }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
                    {results.summary.successful}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Successful</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d32f2f' }}>
                    {results.summary.failed}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Failed</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                    {results.summary.success_rate}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Success Rate</div>
                </div>
              </div>
              
              {results.summary.errors.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <strong>Errors:</strong>
                  <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                    {results.summary.errors.map((error, index) => (
                      <li key={index} style={{ marginBottom: '4px', color: '#d32f2f' }}>
                        {error.student_id}: {error.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <p style={{ fontSize: '14px', color: '#666', marginTop: '12px' }}>
                All generated files have been downloaded to your Downloads folder.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
        
        {/* Student List */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Select Students ({students.length} total)</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={selectAllStudents}
                style={{
                  background: '#2196f3',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Select All
              </button>
              <button
                onClick={clearSelection}
                style={{
                  background: '#757575',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Clear
              </button>
            </div>
          </div>

          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            border: '1px solid #e0e0e0',
            borderRadius: '8px'
          }}>
            {students.map(student => (
              <div
                key={student.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  background: selectedStudents.includes(student.id) ? '#e3f2fd' : 'white',
                  cursor: 'pointer'
                }}
                onClick={() => handleStudentSelection(student.id)}
              >
                <div>
                  <div style={{ fontWeight: 'bold' }}>{student.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Level {student.currentLevel || 1} • {student.totalXP || 0} XP
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => {}} // Handled by parent div click
                    style={{ cursor: 'pointer' }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      runSingleStudentAnalysis(student.id);
                    }}
                    disabled={loading}
                    style={{
                      background: '#4caf50',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '11px',
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    Analyze
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Control Panel */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          height: 'fit-content'
        }}>
          <h3 style={{ margin: '0 0 16px 0' }}>Analysis Controls</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              Selected: {selectedStudents.length} students
            </div>
            
            <button
              onClick={runBatchAnalysis}
              disabled={loading || selectedStudents.length === 0}
              style={{
                width: '100%',
                background: selectedStudents.length === 0 ? '#ccc' : '#667eea',
                color: 'white',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                cursor: selectedStudents.length === 0 || loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '12px'
              }}
            >
              {loading ? '🔄 Processing...' : '🚀 Run Batch Analysis'}
            </button>

            <button
              onClick={() => setShowTestOverlay(true)}
              disabled={loading}
              style={{
                width: '100%',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                padding: '10px',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}
            >
              🧪 Test Model Consistency
            </button>

            <button
              onClick={() => setShowBatchConsistencyOverlay(true)}
              disabled={loading || selectedStudents.length === 0}
              style={{
                width: '100%',
                background: selectedStudents.length === 0 ? '#ccc' : '#dc2626',
                color: 'white',
                border: 'none',
                padding: '10px',
                borderRadius: '8px',
                cursor: selectedStudents.length === 0 || loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '12px'
              }}
            >
              🔬 Batch Consistency Analysis
            </button>
            
            <button
              onClick={extractPartialResults}
              style={{
                width: '100%',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                padding: '8px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                marginTop: '8px'
              }}
            >
              🔍 Debug: Extract Partial Results
            </button>
          </div>

          <div style={{
            background: '#f8f9fa',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '14px',
            lineHeight: '1.4'
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>📋 What This Generates:</h4>
            <ul style={{ margin: '8px 0', paddingLeft: '16px' }}>
              <li>Prompt files (with all evidence & LLM prompts)</li>
              <li>Results files (with triple LLM analysis)</li>
              <li>Triple inter-rater reliability comparison</li>
              <li>Summary statistics & agreement metrics</li>
            </ul>
            
            <h4 style={{ margin: '16px 0 8px 0', fontSize: '16px' }}>⚙️ Configuration:</h4>
            <ul style={{ margin: '8px 0', paddingLeft: '16px' }}>
              <li><strong>Models:</strong> GPT-4.1 Mini, Gemini 2.5 Flash & Llama-4 Scout</li>
              <li><strong>Competencies:</strong> 3 (STEAM Interest, Sense of Belonging, Communication)</li>
              <li><strong>Evidence:</strong> All types (Day 8 self-ratings excluded)</li>
              <li><strong>Output:</strong> RTF files downloaded locally (compatible with Word/Google Docs)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Test Run Overlay */}
      {showTestOverlay && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '2px solid #eee',
              paddingBottom: '12px'
            }}>
              <h3 style={{ margin: 0, color: '#333' }}>🧪 Model Consistency Test</h3>
              <button
                onClick={() => {
                  setShowTestOverlay(false);
                  setTestResults(null);
                  setError(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>

            {!testResults ? (
              <div>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                  This test runs the same prompt through a selected model 3 times to check consistency. 
                  You'll see all 9 dimension scores and variance analysis.
                </p>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Select Student:
                  </label>
                  <select
                    value={testStudent}
                    onChange={(e) => setTestStudent(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Choose a student...</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Select Model:
                  </label>
                  <select
                    value={testModel}
                    onChange={(e) => setTestModel(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  >
                    <option value="openai/gpt-4.1-mini">GPT-4.1 Mini</option>
                    <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="meta-llama/llama-4-scout:free">Llama-4 Scout</option>
                  </select>
                </div>

                <button
                  onClick={runTestAnalysis}
                  disabled={!testStudent || testLoading}
                  style={{
                    width: '100%',
                    background: !testStudent ? '#ccc' : '#f59e0b',
                    color: 'white',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    cursor: !testStudent || testLoading ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  {testLoading ? '🔄 Running Test (this may take 2-3 minutes)...' : '🚀 Run Consistency Test'}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ color: '#333', marginBottom: '8px' }}>
                    Test Results for {testResults.studentId} - {testResults.modelName}
                  </h4>
                  <p style={{ color: '#666', fontSize: '14px' }}>
                    Run 3 times with identical prompts • Generated: {new Date(testResults.timestamp).toLocaleString()}
                  </p>
                </div>

                {testResults.competencies.map(comp => (
                  <div key={comp.competency_id} style={{ marginBottom: '24px' }}>
                    <h5 style={{ 
                      background: '#f8f9fa', 
                      padding: '8px 12px', 
                      margin: '0 0 12px 0', 
                      borderRadius: '4px',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}>
                      {comp.competency_name}
                    </h5>
                    
                    {comp.dimensions.map((dim, dimIndex) => (
                      <div key={dimIndex} style={{
                        background: dim.variance > 0 ? '#fef3cd' : '#d1edff',
                        padding: '12px',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        border: `1px solid ${dim.variance > 0 ? '#fdbf47' : '#84d3ff'}`
                      }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                          {dim.dimension_name}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          <span style={{ display: 'inline-block', minWidth: '100px' }}>
                            <strong>Scores:</strong> {dim.scores.join(', ')}
                          </span>
                          <span style={{ display: 'inline-block', minWidth: '80px', marginLeft: '16px' }}>
                            <strong>Variance:</strong> {dim.variance}
                          </span>
                          <span style={{ display: 'inline-block', marginLeft: '16px' }}>
                            <strong>Status:</strong> {dim.variance === 0 ? '✅ Consistent' : '⚠️ Variable'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                <div style={{
                  background: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '8px',
                  marginTop: '20px'
                }}>
                  <h5 style={{ margin: '0 0 8px 0' }}>📊 Consistency Summary</h5>
                  <div style={{ fontSize: '14px' }}>
                    <div>Total Dimensions: {testResults.summary.totalDimensions}</div>
                    <div>Perfectly Consistent: {testResults.summary.consistentDimensions} ({testResults.summary.consistencyRate}%)</div>
                    <div>Variable Dimensions: {testResults.summary.variableDimensions}</div>
                    <div>Average Variance: {testResults.summary.averageVariance}</div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '12px',
                borderRadius: '8px',
                marginTop: '16px'
              }}>
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Batch Consistency Analysis Overlay */}
      {showBatchConsistencyOverlay && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '95%',
            maxWidth: '1000px',
            maxHeight: '95vh',
            overflow: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '2px solid #eee',
              paddingBottom: '12px'
            }}>
              <h3 style={{ margin: 0, color: '#333' }}>🔬 Comprehensive LLM Consistency Analysis</h3>
              <button
                onClick={() => {
                  setShowBatchConsistencyOverlay(false);
                  setBatchConsistencyResults(null);
                  setBatchConsistencyProgress(null);
                  setError(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>

            {!batchConsistencyResults ? (
              <div>
                <div style={{
                  background: '#fef3cd',
                  border: '1px solid #fbbf24',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '20px'
                }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#92400e' }}>⚠️ High Token Usage Warning</h4>
                  <p style={{ margin: 0, color: '#92400e', fontSize: '14px' }}>
                    This analysis will run <strong>{selectedStudents.length} students × 3 models × 3 runs = {selectedStudents.length * 9} total LLM calls</strong>.
                    This is a comprehensive analysis that will use significant API tokens but provides critical reliability data for model optimization.
                  </p>
                </div>

                <p style={{ color: '#666', marginBottom: '20px' }}>
                  This analysis validates AI model readiness for comparison with 5 human experts. Each AI model is tested 3 times per student to measure self-consistency.
                  <strong> Goal: 90%+ individual consistency for reliable human expert comparison</strong>. Cross-model agreement is less critical since different models can have different perspectives, like human raters.
                </p>

                {batchConsistencyProgress && (
                  <div style={{
                    background: '#dbeafe',
                    border: '1px solid #3b82f6',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '20px'
                  }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#1e40af' }}>Progress Update</h4>
                    <div style={{ fontSize: '14px', color: '#1e40af' }}>
                      {batchConsistencyProgress.phase === 'student_processing' && (
                        <div>Processing student {batchConsistencyProgress.currentStudent}/{batchConsistencyProgress.totalStudents}: {batchConsistencyProgress.studentId}</div>
                      )}
                      {batchConsistencyProgress.phase === 'model_testing' && (
                        <div>
                          <div>Student {batchConsistencyProgress.currentStudent}/{batchConsistencyProgress.totalStudents}: {batchConsistencyProgress.studentId}</div>
                          <div>Testing: {batchConsistencyProgress.currentModel}</div>
                          <div>Overall Progress: {batchConsistencyProgress.progress}% ({batchConsistencyProgress.completedOperations}/{batchConsistencyProgress.totalOperations} operations)</div>
                        </div>
                      )}
                      {batchConsistencyProgress.phase === 'analysis' && (
                        <div>{batchConsistencyProgress.message}</div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={runBatchConsistencyAnalysis}
                  disabled={selectedStudents.length === 0 || batchConsistencyLoading}
                  style={{
                    width: '100%',
                    background: selectedStudents.length === 0 ? '#ccc' : '#dc2626',
                    color: 'white',
                    border: 'none',
                    padding: '16px',
                    borderRadius: '8px',
                    cursor: selectedStudents.length === 0 || batchConsistencyLoading ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  {batchConsistencyLoading 
                    ? `🔄 Running Analysis... (${selectedStudents.length * 9} operations)` 
                    : `🚀 Start Comprehensive Analysis (${selectedStudents.length} students)`
                  }
                </button>
              </div>
            ) : (
              <div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '20px',
                  background: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '8px'
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#333' }}>
                      Analysis Complete - {batchConsistencyResults.totalStudents} Students
                    </h4>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                      Generated: {new Date(batchConsistencyResults.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={exportConsistencyReport}
                      style={{
                        background: '#059669',
                        color: 'white',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      📄 Full Report
                    </button>
                    <button
                      onClick={() => {
                        const dimensionReport = threeCompetencyService.generateDimensionAnalysisReport(batchConsistencyResults);
                        const timestamp = new Date().toISOString().split('T')[0];
                        threeCompetencyService.downloadRTFFile(dimensionReport, `Dimension_Analysis_${timestamp}.rtf`);
                      }}
                      style={{
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      🔍 Dimension Analysis
                    </button>
                    <button
                      onClick={() => {
                        const problemReport = threeCompetencyService.generateProblemStudentReport(batchConsistencyResults, 0.4);
                        const timestamp = new Date().toISOString().split('T')[0];
                        threeCompetencyService.downloadRTFFile(problemReport, `Problem_Students_${timestamp}.rtf`);
                      }}
                      style={{
                        background: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      🚨 Problem Students
                    </button>
                  </div>
                </div>

                {/* Executive Summary */}
                <div style={{
                  background: '#ecfdf5',
                  border: '1px solid #10b981',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '20px'
                }}>
                  <h5 style={{ margin: '0 0 8px 0', color: '#047857' }}>📊 Human Comparison Readiness</h5>
                  <div style={{ fontSize: '14px', color: '#047857' }}>
                    <div style={{ fontWeight: 'bold' }}>
                      Individual Consistency (Primary): {Object.entries(batchConsistencyResults.overallStatistics.modelStats).map(([name, stats]) => 
                        `${name.split(' ')[0]}: ${stats.averageConsistencyRate}%`
                      ).join(', ')}
                    </div>
                    <div>Cross-Model Agreement (Secondary): {batchConsistencyResults.overallStatistics.overallConsistency.averageCrossModelAgreement}%</div>
                    <div style={{ fontSize: '12px', fontStyle: 'italic', marginTop: '4px' }}>
                      Target: 90%+ individual consistency for human expert comparison
                    </div>
                    
                    {/* Add problem student count */}
                    {(() => {
                      const problemStudents = batchConsistencyResults.studentResults.filter(s => 
                        s.crossModelConsistency.summary.crossModelAgreementRate < 40
                      );
                      return problemStudents.length > 0 && (
                        <div style={{ color: '#dc2626', fontWeight: 'bold', marginTop: '4px' }}>
                          ⚠️ Problem Students: {problemStudents.length}/{batchConsistencyResults.totalStudents} 
                          ({Math.round((problemStudents.length / batchConsistencyResults.totalStudents) * 100)}%)
                        </div>
                      );
                    })()}

                    <div style={{ marginTop: '8px', fontStyle: 'italic' }}>
                      {batchConsistencyResults.recommendations.summary}
                    </div>
                  </div>
                </div>

                {/* Model Performance */}
                <div style={{ marginBottom: '20px' }}>
                  <h5 style={{ marginBottom: '12px', color: '#333' }}>🤖 Model Performance</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                    {Object.entries(batchConsistencyResults.overallStatistics.modelStats).map(([modelName, stats]) => (
                      <div key={modelName} style={{
                        background: '#f8f9fa',
                        padding: '12px',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{modelName}</div>
                        <div style={{ fontSize: '13px', color: '#666' }}>
                          <div>Consistency: {stats.averageConsistencyRate}%</div>
                          <div>Variance: {stats.averageVariance}</div>
                          <div>Tests: {stats.testCount}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Show model failures if any */}
                  {batchConsistencyResults.studentResults.some(student => 
                    student.models.some(model => model.status === 'failed')
                  ) && (
                    <div style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '6px',
                      padding: '12px',
                      marginTop: '12px'
                    }}>
                      <h6 style={{ margin: '0 0 8px 0', color: '#dc2626' }}>⚠️ Model Issues Detected</h6>
                      <div style={{ fontSize: '13px', color: '#dc2626' }}>
                        {batchConsistencyResults.studentResults.flatMap(student => 
                          student.models.filter(model => model.status === 'failed')
                        ).map((failedModel, index) => (
                          <div key={index}>
                            {failedModel.modelName}: {failedModel.error}
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: '12px', color: '#7f1d1d', marginTop: '8px' }}>
                        Note: Free tier models may have rate limits. Consider upgrading to paid tiers for more reliable analysis.
                      </div>
                    </div>
                  )}
                </div>

                {/* High Priority Recommendations */}
                <div style={{ marginBottom: '20px' }}>
                  <h5 style={{ marginBottom: '12px', color: '#333' }}>⚡ Key Recommendations</h5>
                  
                  {batchConsistencyResults.recommendations.general.filter(r => r.priority === 'HIGH').length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <h6 style={{ color: '#dc2626', fontSize: '14px', margin: '0 0 4px 0' }}>High Priority Issues:</h6>
                      {batchConsistencyResults.recommendations.general.filter(r => r.priority === 'HIGH').map((rec, index) => (
                        <div key={index} style={{
                          background: '#fee2e2',
                          border: '1px solid #fecaca',
                          borderRadius: '4px',
                          padding: '8px',
                          marginBottom: '4px',
                          fontSize: '13px'
                        }}>
                          <strong>{rec.issue}:</strong> {rec.recommendation}
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <h6 style={{ color: '#059669', fontSize: '14px', margin: '0 0 4px 0' }}>Parameter Recommendations:</h6>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                      {Object.entries(batchConsistencyResults.recommendations.parameterSuggestions).map(([param, suggestion]) => (
                        <div key={param} style={{
                          background: '#ecfdf5',
                          border: '1px solid #d1fae5',
                          borderRadius: '4px',
                          padding: '8px',
                          fontSize: '13px'
                        }}>
                          <strong>{param}:</strong> {suggestion.current} → {suggestion.recommended}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: '#f3f4f6',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#6b7280'
                }}>
                  <strong>Next Steps:</strong> Export the full report for detailed analysis, implement recommended parameter changes, 
                  and re-run analysis on a subset to validate improvements.
                </div>
              </div>
            )}

            {error && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '12px',
                borderRadius: '8px',
                marginTop: '16px'
              }}>
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreeCompetencyAnalytics;
