import React, { useState, useEffect } from 'react';
import { UserProfile, InsightReport, AnalyticsComparison, ProgressExport } from '../types';
import { adaptiveTrainingService } from '../services/adaptiveTrainingService';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus, Download, Share2, Target,
  Award, BarChart3, Activity, Zap, Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  profile: UserProfile;
}

const Analytics: React.FC<Props> = ({ profile }) => {
  const [activeTab, setActiveTab] = useState<'insights' | 'comparison' | 'export'>('insights');
  const [insightPeriod, setInsightPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [comparisonPeriod, setComparisonPeriod] = useState<'week' | 'month'>('week');
  const [insightReport, setInsightReport] = useState<InsightReport | null>(null);
  const [comparison, setComparison] = useState<AnalyticsComparison | null>(null);
  const [progressExport, setProgressExport] = useState<ProgressExport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInsights();
    loadComparison();
    loadProgressExport();
  }, [insightPeriod, comparisonPeriod]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const report = await adaptiveTrainingService.generateInsightReport(insightPeriod);
      setInsightReport(report);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComparison = async () => {
    try {
      const comp = await adaptiveTrainingService.generateComparison(comparisonPeriod);
      setComparison(comp);
    } catch (error) {
      console.error('Failed to load comparison:', error);
    }
  };

  const loadProgressExport = async () => {
    try {
      const exportData = await adaptiveTrainingService.generateProgressExport(profile, 'Last 6 Months');
      setProgressExport(exportData);
    } catch (error) {
      console.error('Failed to load progress export:', error);
    }
  };

  const exportProgress = () => {
    if (!progressExport) return;

    const dataStr = JSON.stringify(progressExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `leo-progress-${profile.name.toLowerCase().replace(/\s+/g, '-')}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const shareProgress = async () => {
    if (!progressExport) return;

    const shareData = {
      title: `${profile.name}'s Fitness Progress`,
      text: `Check out my fitness journey with LEO AI! ${progressExport.achievements.length} achievements unlocked.`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
      alert('Progress summary copied to clipboard!');
    }
  };

  const statColorMap: Record<string, string> = {
    'from-blue-500 to-blue-600': 'text-blue-400',
    'from-orange-500 to-red-500': 'text-orange-400',
    'from-green-500 to-emerald-500': 'text-green-400',
    'from-purple-500 to-pink-500': 'text-purple-400',
  };

  const StatCard = ({ title, value, change, icon: Icon, color, delay }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card border border-white/5 rounded-xl p-6 relative overflow-hidden group hover:border-primary/50 transition-all"
    >
      <div
        className="absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-10 group-hover:opacity-20 blur-2xl transition-all duration-500"
        style={{ background: `linear-gradient(135deg, ${color.replace('from-', '').replace(' to-', ',')})` }}
      />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-display font-bold text-white mt-1">{value}</h3>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {change > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : change < 0 ? (
                <TrendingDown className="w-4 h-4 text-red-400" />
              ) : (
                <Minus className="w-4 h-4 text-gray-400" />
              )}
              <span className={`text-xs font-bold ${
                change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-gray-400'
              }`}>
                {change > 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded bg-white/5 ${statColorMap[color] || 'text-white'}`}>
          <Icon size={20} />
        </div>
      </div>
    </motion.div>
  );

  const insightColorMap: Record<string, string> = {
    yellow: 'bg-yellow-500/20 text-yellow-400',
    red: 'bg-red-500/20 text-red-400',
    blue: 'bg-blue-500/20 text-blue-400',
  };

  const InsightCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card border border-white/5 rounded-lg p-4 hover:border-primary/30 transition-all"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded ${insightColorMap[color] || 'bg-white/20 text-white'}`}>
          <Icon size={16} />
        </div>
        <div>
          <h4 className="font-bold text-white text-sm">{title}</h4>
          <p className="text-lg font-display font-bold text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="p-6 lg:p-10 space-y-8 pb-32">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-end gap-4 border-b border-white/10 pb-6"
      >
        <div>
          <h1 className="text-4xl lg:text-5xl font-display font-bold text-white uppercase tracking-tight">
            ANALYTICS
          </h1>
          <p className="text-gray-400 mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            Data-driven insights for <span className="text-white font-bold">{profile.name}</span>
          </p>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 bg-card border border-white/5 rounded-lg p-1"
      >
        {[
          { id: 'insights', label: 'Insights', icon: BarChart3 },
          { id: 'comparison', label: 'Compare', icon: Activity },
          { id: 'export', label: 'Export', icon: Download }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-black font-bold'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon size={16} />
            <span className="text-sm font-display uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === 'insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* Period Selector */}
            <div className="flex gap-2">
              {['weekly', 'monthly'].map((period) => (
                <button
                  key={period}
                  onClick={() => setInsightPeriod(period as any)}
                  className={`px-4 py-2 rounded-lg font-bold uppercase text-xs transition-all ${
                    insightPeriod === period
                      ? 'bg-primary text-black'
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : insightReport ? (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title="Total Workouts"
                    value={insightReport.summary.totalWorkouts}
                    icon={Target}
                    color="from-blue-500 to-blue-600"
                    delay={0.1}
                  />
                  <StatCard
                    title="Calories Burned"
                    value={`${insightReport.summary.totalCalories.toLocaleString()}`}
                    icon={Zap}
                    color="from-orange-500 to-red-500"
                    delay={0.2}
                  />
                  <StatCard
                    title="Avg Protein"
                    value={`${insightReport.summary.avgProteinIntake.toFixed(1)}g`}
                    icon={Award}
                    color="from-green-500 to-emerald-500"
                    delay={0.3}
                  />
                  <StatCard
                    title="Consistency"
                    value={`${insightReport.summary.consistencyScore}%`}
                    icon={Trophy}
                    color="from-purple-500 to-pink-500"
                    delay={0.4}
                  />
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Performance Chart */}
                  <div className="bg-card border border-white/5 rounded-xl p-6">
                    <h3 className="text-xl font-display font-bold text-white mb-6 uppercase">Performance Trends</h3>
                    <div className="h-[300px]">
                      {insightReport.trends.performanceHistory && insightReport.trends.performanceHistory.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={insightReport.trends.performanceHistory}>
                            <defs>
                              <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ff5e00" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#ff5e00" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="name" stroke="#666" />
                            <YAxis stroke="#666" domain={[0, 100]} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff' }}
                            />
                            <Area
                              type="monotone"
                              dataKey="performance"
                              stroke="#ff5e00"
                              fillOpacity={1}
                              fill="url(#performanceGradient)"
                              strokeWidth={3}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                          No performance history logged in this period.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Muscle Group Distribution */}
                  <div className="bg-card border border-white/5 rounded-xl p-6">
                    <h3 className="text-xl font-display font-bold text-white mb-6 uppercase">Muscle Focus</h3>
                    <div className="h-[300px]">
                      {insightReport.summary.muscleFocus && insightReport.summary.muscleFocus.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={insightReport.summary.muscleFocus}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {insightReport.summary.muscleFocus.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                          No workout data for muscle focus.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Insights Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <InsightCard
                    title="Best Workout"
                    value={insightReport.summary.bestPerformingWorkout}
                    subtitle="Highest performance rating"
                    icon={Trophy}
                    color="yellow"
                  />
                  <InsightCard
                    title="Weakest Area"
                    value={insightReport.summary.weakestMuscleGroup}
                    subtitle="Needs more focus"
                    icon={Target}
                    color="red"
                  />
                  <InsightCard
                    title="Adherence Rate"
                    value={`${insightReport.summary.adherenceRate}%`}
                    subtitle="Workout completion"
                    icon={Activity}
                    color="blue"
                  />
                </div>

                {/* Advanced Analytics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* AI Fitness Score & Goal Adherence */}
                  <div className="bg-card border border-white/5 rounded-xl p-6">
                    <h3 className="text-xl font-display font-bold text-white mb-6 uppercase flex items-center gap-2">
                      <Trophy className="text-primary w-5 h-5" /> Advanced Fitness Metrics
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-400 font-bold uppercase">AI Fitness Score</span>
                          <span className="text-xl font-display font-bold text-primary">{insightReport.summary.fitnessScore || 0} / 100</span>
                        </div>
                        <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden">
                          <div 
                            className="bg-primary h-full rounded-full transition-all duration-500" 
                            style={{ width: `${insightReport.summary.fitnessScore || 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Calculated based on training consistency, nutrition targets, and progress logging.</p>
                      </div>

                      <div className="pt-4 border-t border-white/5">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-400 font-bold uppercase">Goal Completion Rate</span>
                          <span className="text-xl font-display font-bold text-green-400">{insightReport.summary.goalCompletion || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden">
                          <div 
                            className="bg-green-400 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${insightReport.summary.goalCompletion || 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Adherence to weekly volume and macronutrient targets.</p>
                      </div>
                    </div>
                  </div>

                  {/* Personal Records (PRs) */}
                  <div className="bg-card border border-white/5 rounded-xl p-6">
                    <h3 className="text-xl font-display font-bold text-white mb-6 uppercase flex items-center gap-2">
                      <Award className="text-primary w-5 h-5" /> Personal Records (PRs)
                    </h3>
                    <div className="max-h-[220px] overflow-y-auto pr-2 space-y-3">
                      {insightReport.prs && insightReport.prs.length > 0 ? (
                        insightReport.prs.map((pr: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center py-2 border-b border-white/5 text-sm">
                            <span className="text-gray-300 font-medium">{pr.exercise}</span>
                            <span className="text-white font-bold">{pr.weight} kg</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-500 py-12 text-sm">
                          Log workouts with weights to establish Personal Records.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Calories & Protein Trend Chart */}
                  <div className="bg-card border border-white/5 rounded-xl p-6">
                    <h3 className="text-xl font-display font-bold text-white mb-6 uppercase flex items-center gap-2">
                      <Activity className="text-primary w-5 h-5" /> Calories & Protein Trend
                    </h3>
                    <div className="h-[250px]">
                      {insightReport.caloriesProteinTrend && insightReport.caloriesProteinTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={insightReport.caloriesProteinTrend}>
                            <defs>
                              <linearGradient id="calGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ff5e00" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#ff5e00" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="date" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} />
                            <YAxis yAxisId="left" stroke="#666" tick={{ fill: '#888' }} />
                            <YAxis yAxisId="right" orientation="right" stroke="#666" tick={{ fill: '#888' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f0f0f', borderColor: '#ffffff20', color: '#fff' }} />
                            <Area yAxisId="left" type="monotone" dataKey="calories" stroke="#ff5e00" fill="url(#calGradient)" strokeWidth={2.5} name="Calories (kcal)" />
                            <Line yAxisId="right" type="monotone" dataKey="protein" stroke="#3b82f6" strokeWidth={2} name="Protein (g)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                          No nutrition entries logged in this period.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Workout Duration Trend */}
                  <div className="bg-card border border-white/5 rounded-xl p-6">
                    <h3 className="text-xl font-display font-bold text-white mb-6 uppercase flex items-center gap-2">
                      <Zap className="text-primary w-5 h-5" /> Workout Duration Trend (min)
                    </h3>
                    <div className="h-[250px]">
                      {insightReport.durationTrend && insightReport.durationTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={insightReport.durationTrend}>
                            <defs>
                              <linearGradient id="durGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="date" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} />
                            <YAxis stroke="#666" tick={{ fill: '#888' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f0f0f', borderColor: '#ffffff20', color: '#fff' }} />
                            <Area type="monotone" dataKey="duration" stroke="#10b981" fill="url(#durGradient)" strokeWidth={2.5} name="Duration (min)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                          No completed workout sessions logged in this period.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {insightReport.recommendations.length > 0 && (
                  <div className="bg-card border border-white/5 rounded-xl p-6">
                    <h3 className="text-xl font-display font-bold text-white mb-6 uppercase flex items-center gap-3">
                      <Zap className="text-primary" />
                      AI Recommendations
                    </h3>
                    <div className="space-y-4">
                      {insightReport.recommendations.map((rec, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-3 p-4 bg-white/5 rounded-lg"
                        >
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-gray-300 text-sm">{rec}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <BarChart3 className="w-16 h-16 text-gray-700 mb-4" />
                <p className="text-lg font-display font-bold text-white mb-2">No data yet</p>
                <p className="text-sm text-gray-500 max-w-md text-center">
                  Complete a few workouts and log your nutrition to unlock insights,
                  performance trends, and personalized recommendations.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'comparison' && (
          <motion.div
            key="comparison"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* Period Selector */}
            <div className="flex gap-2">
              {['week', 'month'].map((period) => (
                <button
                  key={period}
                  onClick={() => setComparisonPeriod(period as any)}
                  className={`px-4 py-2 rounded-lg font-bold uppercase text-xs transition-all ${
                    comparisonPeriod === period
                      ? 'bg-primary text-black'
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            {comparison ? (
              <>
                {/* Comparison Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title="Workouts"
                    value={`${comparison.currentPeriod.workouts} vs ${comparison.previousPeriod.workouts}`}
                    change={comparison.differences.workoutsChange}
                    icon={Target}
                    color="from-blue-500 to-blue-600"
                    delay={0.1}
                  />
                  <StatCard
                    title="Calories"
                    value={`${comparison.currentPeriod.calories} vs ${comparison.previousPeriod.calories}`}
                    change={comparison.differences.caloriesChange}
                    icon={Zap}
                    color="from-orange-500 to-red-500"
                    delay={0.2}
                  />
                  <StatCard
                    title="Weight Change"
                    value={`${comparison.differences.weightChange > 0 ? '+' : ''}${comparison.differences.weightChange.toFixed(1)}kg`}
                    icon={TrendingUp}
                    color="from-green-500 to-emerald-500"
                    delay={0.3}
                  />
                  <StatCard
                    title="Consistency"
                    value={`${comparison.currentPeriod.consistency.toFixed(1)}% vs ${comparison.previousPeriod.consistency.toFixed(1)}%`}
                    change={comparison.differences.consistencyChange}
                    icon={Trophy}
                    color="from-purple-500 to-pink-500"
                    delay={0.4}
                  />
                </div>

                {/* Comparison Chart */}
                <div className="bg-card border border-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-display font-bold text-white mb-6 uppercase">
                    Period Comparison
                  </h3>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          {
                            period: 'Previous',
                            workouts: comparison.previousPeriod.workouts,
                            calories: comparison.previousPeriod.calories / 100, // Scale down for visibility
                            consistency: comparison.previousPeriod.consistency
                          },
                          {
                            period: 'Current',
                            workouts: comparison.currentPeriod.workouts,
                            calories: comparison.currentPeriod.calories / 100,
                            consistency: comparison.currentPeriod.consistency
                          }
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="period" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff' }}
                        />
                        <Bar dataKey="workouts" fill="#ff5e00" name="Workouts" />
                        <Bar dataKey="consistency" fill="#4ade80" name="Consistency %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <Activity className="w-16 h-16 text-gray-700 mb-4" />
                <p className="text-lg font-display font-bold text-white mb-2">No comparison data</p>
                <p className="text-sm text-gray-500 max-w-md text-center">
                  Log data across multiple periods to compare your performance and see
                  how your consistency and results evolve over time.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'export' && (
          <motion.div
            key="export"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {progressExport ? (
              <>
                {/* Export Preview */}
                <div className="bg-card border border-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-display font-bold text-white mb-6 uppercase">
                    Progress Summary
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="text-center">
                      <div className="text-3xl font-display font-bold text-primary mb-2">
                        {progressExport.stats.totalWorkouts}
                      </div>
                      <div className="text-xs text-gray-400 uppercase">Total Workouts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-display font-bold text-green-400 mb-2">
                        -{progressExport.stats.totalWeightLost}kg
                      </div>
                      <div className="text-xs text-gray-400 uppercase">Weight Lost</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-display font-bold text-blue-400 mb-2">
                        {progressExport.stats.bestStreak}
                      </div>
                      <div className="text-xs text-gray-400 uppercase">Best Streak</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-display font-bold text-purple-400 mb-2">
                        {progressExport.stats.avgConsistency.toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-400 uppercase">Avg Consistency</div>
                    </div>
                  </div>

                  {/* Achievements */}
                  {progressExport.achievements.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-lg font-display font-bold text-white mb-4 uppercase">Achievements</h4>
                      <div className="flex flex-wrap gap-2">
                        {progressExport.achievements.map((achievement, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-bold"
                          >
                            {achievement}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Insights */}
                  <div className="mb-8">
                    <h4 className="text-lg font-display font-bold text-white mb-4 uppercase">Key Insights</h4>
                    <div className="space-y-2">
                      {progressExport.insights.map((insight, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center gap-3 text-gray-300"
                        >
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-sm">{insight}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Export Actions */}
                  <div className="flex gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={exportProgress}
                      className="flex items-center gap-3 bg-primary hover:bg-orange-600 text-black py-3 px-6 rounded-lg font-bold uppercase tracking-wider transition-all"
                    >
                      <Download size={18} />
                      Export JSON
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={shareProgress}
                      className="flex items-center gap-3 bg-white/10 hover:bg-white/20 text-white py-3 px-6 rounded-lg font-bold uppercase tracking-wider transition-all"
                    >
                      <Share2 size={18} />
                      Share Progress
                    </motion.button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <Download className="w-16 h-16 text-gray-700 mb-4" />
                <p className="text-lg font-display font-bold text-white mb-2">Nothing to export yet</p>
                <p className="text-sm text-gray-500 max-w-md text-center">
                  Complete workouts, track nutrition, and log measurements to build
                  a comprehensive progress report you can export or share.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Analytics;
