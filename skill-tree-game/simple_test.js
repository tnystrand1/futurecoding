#!/usr/bin/env node

/**
 * Simple test for Historical Analytics CLI without Firebase dependencies
 */

import fs from 'fs';
import path from 'path';

// Mock competency service that doesn't require Firebase
class MockCompetencyService {
  getDayDateRanges() {
    return {
      1: { start: '2025-08-11', end: '2025-08-11' },
      2: { start: '2025-08-12', end: '2025-08-12' },
      3: { start: '2025-08-13', end: '2025-08-13' },
      4: { start: '2025-08-14', end: '2025-08-14' },
      5: { start: '2025-08-18', end: '2025-08-18' },
      6: { start: '2025-08-19', end: '2025-08-19' },
      7: { start: '2025-08-20', end: '2025-08-20' },
      8: { start: '2025-08-21', end: '2025-08-21' }
    };
  }

  generateHistoricalCSV(csvData) {
    if (csvData.length === 0) {
      return 'No data available';
    }

    const headers = [
      'student_id', 'competency_id', 'competency_name', 'day', 'date_start', 'date_end',
      'claude_score', 'gemini_score', 'avg_score', 'model_agreement', 'confidence_level',
      'evidence_count', 'artifacts_count', 'reflections_count', 'chat_interactions_count',
      'gallery_projects_count', 'achievements_count', 'analysis_timestamp', 'api_cost_usd'
    ];

    const csvRows = csvData.map(row => {
      return headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) {
          return 'NA';
        }
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',');
    });

    return [headers.join(','), ...csvRows].join('\n');
  }

  async generateHistoricalCompetencyAnalytics(studentId) {
    console.log(`🔄 Generating mock analytics for ${studentId}...`);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockData = [];
    const competencies = [
      'sense_of_belonging', 'steam_interest', 'communication',
      'teamwork', 'problem_solving', 'opportunity_recognition',
      'steam_agency', 'continuous_learning'
    ];

    const competencyNames = {
      'sense_of_belonging': 'Sense of Belonging',
      'steam_interest': 'STEAM Interest',
      'communication': 'Communication',
      'teamwork': 'Teamwork',
      'problem_solving': 'Problem Solving',
      'opportunity_recognition': 'Opportunity Recognition',
      'steam_agency': 'STEAM Agency',
      'continuous_learning': 'Continuous Learning'
    };

    for (let day = 1; day <= 8; day++) {
      const dayRange = this.getDayDateRanges()[day];

      competencies.forEach(compId => {
        const claudeScore = Math.floor(Math.random() * 10) + 1;
        const geminiScore = Math.floor(Math.random() * 10) + 1;
        const avgScore = Math.round((claudeScore + geminiScore) / 2);
        const agreement = Math.abs(claudeScore - geminiScore) <= 1 ? 90 : 70;

        mockData.push({
          student_id: studentId,
          competency_id: compId,
          competency_name: competencyNames[compId],
          day: day,
          date_start: dayRange.start,
          date_end: dayRange.end,
          claude_score: claudeScore,
          gemini_score: geminiScore,
          avg_score: avgScore,
          model_agreement: agreement,
          confidence_level: agreement > 80 ? 'High' : 'Medium',
          evidence_count: Math.floor(Math.random() * 10) + 1,
          artifacts_count: Math.floor(Math.random() * 5),
          reflections_count: Math.floor(Math.random() * 5) + 1,
          chat_interactions_count: Math.floor(Math.random() * 8) + 1,
          gallery_projects_count: Math.floor(Math.random() * 3),
          achievements_count: Math.floor(Math.random() * 3),
          analysis_timestamp: new Date().toISOString(),
          api_cost_usd: (Math.random() * 0.05).toFixed(4)
        });
      });
    }

    return {
      csvData: mockData,
      summary: {
        studentId,
        totalRows: mockData.length,
        totalApiCost: mockData.reduce((sum, row) => sum + parseFloat(row.api_cost_usd), 0),
        daysProcessed: 8,
        competenciesAnalyzed: competencies.length
      }
    };
  }
}

class SimpleHistoricalAnalyticsCLI {
  constructor() {
    this.competencyService = new MockCompetencyService();
  }

  printHeader() {
    console.log('🎓 SIMPLE HISTORICAL COMPETENCY ANALYTICS CLI');
    console.log('=' .repeat(55));
    console.log('📊 Mock version for testing (no Firebase required)');
    console.log('🤖 Generates sample historical competency data');
    console.log('📈 Outputs R-optimized CSV format');
    console.log('');
  }

  printUsage() {
    console.log('USAGE:');
    console.log('  node simple_test.js [command] [options]');
    console.log('');
    console.log('COMMANDS:');
    console.log('  test                 Run basic functionality test');
    console.log('  student <id>         Generate sample report for student');
    console.log('');
    console.log('OPTIONS:');
    console.log('  --output <file>      Save CSV to specific file');
    console.log('');
    console.log('EXAMPLES:');
    console.log('  node simple_test.js test');
    console.log('  node simple_test.js student Charles --output charles_report.csv');
  }

  async runTest() {
    console.log('🧪 Running basic functionality test...\n');

    try {
      // Test date ranges
      console.log('📅 Testing date ranges...');
      const dayRanges = this.competencyService.getDayDateRanges();
      console.log('✅ Date ranges loaded:', Object.keys(dayRanges).length, 'days');

      // Test CSV generation with sample data
      console.log('📊 Testing CSV generation...');
      const sampleData = [{
        student_id: 'test_student',
        competency_id: 'sense_of_belonging',
        competency_name: 'Sense of Belonging',
        day: 1,
        date_start: '2025-08-11',
        date_end: '2025-08-11',
        claude_score: 8,
        gemini_score: 7,
        avg_score: 8,
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
      }];

      const csvContent = this.competencyService.generateHistoricalCSV(sampleData);
      console.log('✅ CSV generation successful:', csvContent.split('\n').length, 'lines');

      console.log('\n🎉 All tests passed! System is ready for report generation.');
      console.log('📝 Note: This is using mock data. For real data, use the full CLI with Firebase config.');

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    }
  }

  async generateForStudent(studentId, options = {}) {
    const { outputFile = null } = options;

    console.log(`🚀 Generating sample historical analytics for student: ${studentId}\n`);

    try {
      const result = await this.competencyService.generateHistoricalCompetencyAnalytics(studentId);
      const csvContent = this.competencyService.generateHistoricalCSV(result.csvData);

      console.log('\n📊 STUDENT SUMMARY:');
      console.log('===================');
      console.log(`Student ID: ${result.summary.studentId}`);
      console.log(`Total Rows: ${result.summary.totalRows.toLocaleString()}`);
      console.log(`Days Processed: ${result.summary.daysProcessed}`);
      console.log(`Competencies Analyzed: ${result.summary.competenciesAnalyzed}`);
      console.log(`Total API Cost: $${result.summary.totalApiCost.toFixed(4)}`);

      if (outputFile) {
        await this.saveReportToFile(csvContent, outputFile);
      } else {
        console.log('\n📊 CSV Preview (first 15 lines):');
        console.log('=' .repeat(50));
        console.log(csvContent.split('\n').slice(0, 15).join('\n'));
        console.log('... (' + (csvContent.split('\n').length - 15) + ' more lines)');
      }

      console.log('\n📋 R Analysis Recommendations:');
      console.log('===============================');
      console.log(`
# Score progression over time
ggplot(data, aes(x=day, y=avg_score, color=competency_name)) +
  geom_line(aes(group=student_id), alpha=0.3) +
  geom_smooth(method="loess") +
  facet_wrap(~competency_name) +
  labs(title="Competency Score Progression Over 8 Days",
       x="Day", y="Average Score") +
  theme_minimal()
      `);

    } catch (error) {
      console.error('❌ Error generating student report:', error.message);
      process.exit(1);
    }
  }

  async saveReportToFile(csvContent, fileName) {
    try {
      const exportsDir = path.join(process.cwd(), 'exports');
      await fs.promises.mkdir(exportsDir, { recursive: true });

      const filePath = path.join(exportsDir, fileName);
      await fs.promises.writeFile(filePath, csvContent, 'utf8');

      console.log(`💾 Report saved to: ${filePath}`);
      console.log(`📊 File size: ${csvContent.length.toLocaleString()} characters`);
      return filePath;
    } catch (error) {
      console.error('❌ Error saving file:', error.message);
      throw error;
    }
  }

  async main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      this.printHeader();
      this.printUsage();
      return;
    }

    const command = args[0];
    const options = this.parseOptions(args.slice(1));

    this.printHeader();

    switch (command) {
      case 'test':
        await this.runTest();
        break;

      case 'student':
        if (args.length < 2) {
          console.error('❌ Student ID required. Usage: node simple_test.js student <id>');
          process.exit(1);
        }
        await this.generateForStudent(args[1], options);
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        this.printUsage();
        process.exit(1);
    }
  }

  parseOptions(args) {
    const options = {};
    for (let i = 0; i < args.length; i++) {
      switch (args[i]) {
        case '--output':
          if (i + 1 < args.length) {
            options.outputFile = args[++i];
          }
          break;
      }
    }
    return options;
  }
}

// Run the CLI tool
const cli = new SimpleHistoricalAnalyticsCLI();
cli.main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
