import React, { useState } from 'react';
import { UserProfile, WorkoutSession, DailyLog, NutritionEntry, Note, ProgressEntry, AchievementBadge } from '../types';
import { firestoreService } from '../services/firestoreService';
import { auth } from '../services/firebase';
import { Download, FileText, Calendar, Database, Loader2, CheckCircle } from 'lucide-react';

interface Props {
  profile: UserProfile;
  sessions: WorkoutSession[];
  logs: DailyLog[];
  nutritionEntries: NutritionEntry[];
  progressEntries: ProgressEntry[];
}

const ExportCenter: React.FC<Props> = ({ profile, sessions, logs, nutritionEntries, progressEntries }) => {
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Options
  const [options, setOptions] = useState({
    workouts: true,
    nutrition: true,
    progress: true,
    achievements: true,
  });

  const [exporting, setExporting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Filter helper based on date range
  const filterByDate = <T extends { date?: string; timestamp?: number }>(items: T[]): T[] => {
    return items.filter(item => {
      const itemDateStr = item.date || new Date(item.timestamp || 0).toISOString().split('T')[0];
      return itemDateStr >= startDate && itemDateStr <= endDate;
    });
  };

  const handleExport = async () => {
    setExporting(true);
    setSuccess(false);

    try {
      const filteredSessions = filterByDate(sessions);
      const filteredNutrition = filterByDate(nutritionEntries);
      const filteredProgress = filterByDate(progressEntries);

      // Fetch achievements
      let userAchievements: AchievementBadge[] = [];
      const uid = auth.currentUser?.uid;
      if (uid) {
        userAchievements = await firestoreService.getAchievements(uid);
      }

      if (exportFormat === 'json') {
        // --- JSON BACKUP ---
        const backupData: any = {
          exportDate: new Date().toISOString(),
          dateRange: { start: startDate, end: endDate },
          profile: {
            name: profile.name,
            age: profile.age,
            weight: profile.weight,
            height: profile.height,
            goal: profile.goal,
            xp: profile.xp,
            level: profile.level,
            currentStreak: profile.currentStreak,
            longestStreak: profile.longestStreak,
          },
        };

        if (options.workouts) backupData.workoutSessions = filteredSessions;
        if (options.nutrition) backupData.nutritionLogs = filteredNutrition;
        if (options.progress) backupData.progressLogs = filteredProgress;
        if (options.achievements) backupData.achievements = userAchievements;

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute("href", dataStr);
        dlAnchor.setAttribute("download", `leoAI_backup_${startDate}_to_${endDate}.json`);
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.remove();

      } else if (exportFormat === 'csv') {
        // --- CSV EXPORTS ---
        if (options.workouts) {
          let csv = 'Date,Session Name,Duration (min),ExercisesCount\n';
          filteredSessions.forEach(s => {
            csv += `"${s.date}","${s.dayName}",${s.duration},${s.exercises.length}\n`;
          });
          downloadCSV(csv, 'workouts_history');
        }

        if (options.nutrition) {
          let csv = 'Date,Meal Name,Calories,Protein(g),Carbs(g),Fat(g)\n';
          filteredNutrition.forEach(n => {
            const dateStr = n.date || new Date(n.timestamp || 0).toISOString().split('T')[0];
            csv += `"${dateStr}","${n.name}",${n.calories},${n.protein},${n.carbs},${n.fats}\n`;
          });
          downloadCSV(csv, 'nutrition_history');
        }

        if (options.progress) {
          let csv = 'Date,Weight(kg),BMI,BodyFat(%),Chest(cm),Waist(cm),Arms(cm),Thigh(cm),Shoulders(cm),Notes\n';
          filteredProgress.forEach(p => {
            csv += `"${p.date}",${p.weight || ''},${p.bmi || ''},${p.bodyFat || ''},${p.chest || ''},${p.waist || ''},${p.arms || ''},${p.thigh || ''},${p.shoulders || ''},"${p.notes || ''}"\n`;
          });
          downloadCSV(csv, 'progress_history');
        }

        if (options.achievements) {
          let csv = 'BadgeTitle,Description,Unlocked,UnlockedAt,Category\n';
          userAchievements.forEach(a => {
            csv += `"${a.title}","${a.description}",${a.unlocked},"${a.unlockedAt || ''}","${a.category}"\n`;
          });
          downloadCSV(csv, 'achievements_history');
        }

      } else if (exportFormat === 'pdf') {
        // --- PDF REPORT (PRINTER-FRIENDLY POPUP) ---
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          alert('Popup blocker prevented generating monthly fitness report. Please enable popups.');
          setExporting(false);
          return;
        }

        // Calculate statistics
        const totalWorkouts = filteredSessions.length;
        const totalActiveMins = filteredSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
        const avgCalories = filteredNutrition.length > 0 
          ? Math.round(filteredNutrition.reduce((acc, n) => acc + (n.calories || 0), 0) / filteredNutrition.length)
          : 0;
        const avgProtein = filteredNutrition.length > 0
          ? Math.round(filteredNutrition.reduce((acc, n) => acc + (n.protein || 0), 0) / filteredNutrition.length)
          : 0;
        const latestWeight = filteredProgress.length > 0 ? filteredProgress[0].weight : profile.weight;
        const latestBmi = filteredProgress.length > 0 ? filteredProgress[0].bmi : undefined;

        const reportHTML = `
          <html>
            <head>
              <title>LeoAI Monthly Fitness Report</title>
              <style>
                body {
                  font-family: 'Helvetica Neue', Arial, sans-serif;
                  color: #111827;
                  line-height: 1.5;
                  padding: 40px;
                  max-width: 800px;
                  margin: 0 auto;
                }
                .header {
                  border-bottom: 2px solid #ef4444;
                  padding-bottom: 20px;
                  margin-bottom: 30px;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                }
                .logo {
                  font-size: 24px;
                  font-weight: bold;
                  text-transform: uppercase;
                  color: #000;
                }
                .logo span {
                  color: #ef4444;
                }
                .title {
                  font-size: 28px;
                  font-weight: bold;
                  margin-top: 0;
                }
                .meta-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
                  margin-bottom: 30px;
                }
                .card {
                  background: #f9fafb;
                  border: 1px solid #e5e7eb;
                  border-radius: 8px;
                  padding: 20px;
                }
                .card h3 {
                  margin-top: 0;
                  font-size: 14px;
                  text-transform: uppercase;
                  color: #6b7280;
                  border-bottom: 1px solid #e5e7eb;
                  padding-bottom: 8px;
                }
                .card p {
                  margin: 8px 0;
                  font-size: 14px;
                }
                .section {
                  margin-bottom: 30px;
                }
                .section h2 {
                  font-size: 18px;
                  text-transform: uppercase;
                  border-bottom: 1px solid #e5e7eb;
                  padding-bottom: 6px;
                  margin-bottom: 15px;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 10px;
                }
                th, td {
                  text-align: left;
                  padding: 10px;
                  border-bottom: 1px solid #e5e7eb;
                  font-size: 13px;
                }
                th {
                  background: #f3f4f6;
                  font-weight: bold;
                }
                .print-btn {
                  position: fixed;
                  bottom: 20px;
                  right: 20px;
                  background: #000;
                  color: #fff;
                  border: none;
                  padding: 12px 24px;
                  border-radius: 6px;
                  font-weight: bold;
                  cursor: pointer;
                  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                @media print {
                  .print-btn {
                    display: none;
                  }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="logo">LEO<span>.AI</span></div>
                <div style="text-align: right; font-size: 12px; color: #6b7280;">
                  Report Date: ${new Date().toLocaleDateString()}<br>
                  Range: ${startDate} to ${endDate}
                </div>
              </div>

              <h1 class="title">MONTHLY FITNESS REPORT</h1>

              <div class="meta-grid">
                <div class="card">
                  <h3>User Profile Summary</h3>
                  <p><strong>Name:</strong> ${profile.name}</p>
                  <p><strong>Age:</strong> ${profile.age || 'N/A'}</p>
                  <p><strong>Goal:</strong> ${profile.goal || 'N/A'}</p>
                  <p><strong>Level:</strong> ${profile.level || '1'} (${profile.xp || '0'} Total XP)</p>
                </div>
                <div class="card">
                  <h3>Key Aggregates</h3>
                  <p><strong>Workouts Logged:</strong> ${totalWorkouts}</p>
                  <p><strong>Total Duration:</strong> ${totalActiveMins} min</p>
                  <p><strong>Avg Daily Calories:</strong> ${avgCalories} kcal</p>
                  <p><strong>Avg Protein Intake:</strong> ${avgProtein}g</p>
                  <p><strong>Latest Weight:</strong> ${latestWeight ? `${latestWeight} kg` : 'N/A'}</p>
                  ${latestBmi ? `<p><strong>Latest BMI:</strong> ${latestBmi}</p>` : ''}
                </div>
              </div>

              ${options.workouts && filteredSessions.length > 0 ? `
                <div class="section">
                  <h2>Workout History</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Session Name</th>
                        <th>Duration</th>
                        <th>Exercises Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${filteredSessions.map(s => `
                        <tr>
                          <td>${s.date}</td>
                          <td>${s.dayName}</td>
                          <td>${s.duration} min</td>
                          <td>${s.exercises.map(ex => ex.name).join(', ')}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : ''}

              ${options.nutrition && filteredNutrition.length > 0 ? `
                <div class="section">
                  <h2>Nutrition Summary</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Meal</th>
                        <th>Calories</th>
                        <th>Protein</th>
                        <th>Carbs</th>
                        <th>Fat</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${filteredNutrition.map(n => {
                        const dateStr = n.date || new Date(n.timestamp || 0).toISOString().split('T')[0];
                        return `
                          <tr>
                            <td>${dateStr}</td>
                            <td>${n.name}</td>
                            <td>${n.calories} kcal</td>
                            <td>${n.protein}g</td>
                            <td>${n.carbs}g</td>
                            <td>${n.fats}g</td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              ` : ''}

              ${options.achievements && userAchievements.length > 0 ? `
                <div class="section">
                  <h2>Unlocked Badges</h2>
                  <ul>
                    ${userAchievements.filter(a => a.unlocked).map(a => `
                      <li><strong>${a.title}</strong>: ${a.description} (Unlocked on ${new Date(a.unlockedAt || '').toLocaleDateString()})</li>
                    `).join('')}
                  </ul>
                </div>
              ` : ''}

              <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
            </body>
          </html>
        `;

        printWindow.document.write(reportHTML);
        printWindow.document.close();
      }

      setSuccess(true);
    } catch (e) {
      console.error('Failed to export data:', e);
      alert('Failed to export. Please check connection and try again.');
    } finally {
      setExporting(false);
    }
  };

  // Helper to trigger CSV file download in browser
  const downloadCSV = (csvContent: string, fileName: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `leoAI_${fileName}_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 lg:p-10 pb-32 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-display font-bold text-white uppercase tracking-tight mb-2">
          Export Center
        </h1>
        <p className="text-gray-400">Download backups, CSV logs, or generate print-ready Monthly Fitness Reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Panel: Configuration Options */}
        <div className="md:col-span-2 bg-card border border-white/5 rounded-xl p-6 space-y-6">
          <h3 className="text-lg font-display font-bold text-white uppercase">Export Configuration</h3>

          {/* Date Range Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-bold uppercase">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white focus:border-primary focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-bold uppercase">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Checklist checkboxes */}
          <div className="space-y-3">
            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Include Datasets</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.workouts}
                  onChange={e => setOptions({ ...options, workouts: e.target.checked })}
                  className="accent-primary"
                />
                <span>Workout Sessions & History</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.nutrition}
                  onChange={e => setOptions({ ...options, nutrition: e.target.checked })}
                  className="accent-primary"
                />
                <span>Nutrition & Macros Logs</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.progress}
                  onChange={e => setOptions({ ...options, progress: e.target.checked })}
                  className="accent-primary"
                />
                <span>Progress & Body Metrics Logs</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.achievements}
                  onChange={e => setOptions({ ...options, achievements: e.target.checked })}
                  className="accent-primary"
                />
                <span>Achievements & Level Summary</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Panel: Export formats & Trigger */}
        <div className="bg-card border border-white/5 rounded-xl p-6 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-display font-bold text-white uppercase">Choose Format</h3>

            <div className="space-y-2">
              <button
                onClick={() => setExportFormat('json')}
                className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                  exportFormat === 'json'
                    ? 'bg-primary/20 border-primary text-white font-bold'
                    : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/10'
                }`}
              >
                <span>JSON Backup</span>
                <Database size={16} />
              </button>
              <button
                onClick={() => setExportFormat('csv')}
                className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                  exportFormat === 'csv'
                    ? 'bg-primary/20 border-primary text-white font-bold'
                    : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/10'
                }`}
              >
                <span>CSV Spreadsheet</span>
                <Download size={16} />
              </button>
              <button
                onClick={() => setExportFormat('pdf')}
                className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                  exportFormat === 'pdf'
                    ? 'bg-primary/20 border-primary text-white font-bold'
                    : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/10'
                }`}
              >
                <span>PDF Fitness Report</span>
                <FileText size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {success && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle size={14} />
                <span>Export generated successfully!</span>
              </div>
            )}

            <button
              onClick={handleExport}
              disabled={exporting || (!options.workouts && !options.nutrition && !options.progress && !options.achievements)}
              className="w-full bg-primary hover:bg-primary/80 disabled:bg-gray-800 disabled:text-gray-500 text-black py-4 rounded-xl font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              {exporting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>Export Data</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportCenter;
