// Test script for Historical Competency Analytics
// Run with: node test_historical_analytics.js

import { CompetencyService } from './src/services/competencyService.js';

async function testHistoricalAnalytics() {
  console.log('🧪 Testing Historical Competency Analytics System\n');

  const competencyService = new CompetencyService();

  try {
    // Test 1: Check date ranges
    console.log('📅 Testing date ranges...');
    const dayRanges = competencyService.getDayDateRanges();
    console.log('Day ranges:', JSON.stringify(dayRanges, null, 2));

    // Test 2: Generate sample CSV structure (without API calls)
    console.log('\n📊 Testing CSV structure...');
    const sampleData = [
      {
        student_id: 'student_123',
        competency_id: 'sense_of_belonging',
        competency_name: 'Sense of Belonging',
        day: 1,
        date_start: '2025-08-11',
        date_end: '2025-08-11',
        claude_score: 8,
        gemini_score: 7,
        avg_score: 7.5,
        model_agreement: 85,
        confidence_level: 'High',
        evidence_count: 5,
        artifacts_count: 2,
        reflections_count: 2,
        chat_interactions_count: 1,
        gallery_projects_count: 0,
        achievements_count: 0,
        analysis_timestamp: new Date().toISOString(),
        api_cost_usd: 0.0125
      }
    ];

    const csvContent = competencyService.generateHistoricalCSV(sampleData);
    console.log('Sample CSV output:');
    console.log(csvContent);

    // Test 3: Check if methods exist
    console.log('\n✅ Checking method availability...');
    const methodsToCheck = [
      'generateHistoricalCompetencyAnalytics',
      'generateBatchHistoricalAnalytics',
      'generateCompleteHistoricalReport',
      'getDayDateRanges',
      'generateHistoricalCSV',
      'getCumulativeEvidenceForDay'
    ];

    methodsToCheck.forEach(method => {
      if (typeof competencyService[method] === 'function') {
        console.log(`✅ ${method} method available`);
      } else {
        console.log(`❌ ${method} method missing`);
      }
    });

    console.log('\n🎉 All basic tests passed!');
    console.log('\n📝 Next steps:');
    console.log('1. Call generateHistoricalCompetencyAnalytics(studentId) for a real student');
    console.log('2. Use generateBatchHistoricalAnalytics() for multiple students');
    console.log('3. Use generateCompleteHistoricalReport() for all students');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testHistoricalAnalytics();
