import React, { useState, useMemo } from 'react';
import { UserProfile, ProgressEntry } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Scale, Ruler, Plus, Trash2, Edit3, Save, X, Calendar, TrendingUp, TrendingDown, Info, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../services/firebase';
import { firestoreService } from '../services/firestoreService';

interface Props {
  profile: UserProfile;
  entries: ProgressEntry[];
  onUpdateEntries: (entries: ProgressEntry[]) => void;
}

const Progress: React.FC<Props> = ({ profile, entries, onUpdateEntries }) => {
  const [activeTab, setActiveTab] = useState<'charts' | 'logs' | 'measurements'>('charts');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ProgressEntry | null>(null);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    bodyFat: '',
    chest: '',
    waist: '',
    arms: '',
    thigh: '',
    shoulders: '',
    notes: ''
  });

  // Calculate BMI based on weight and profile height
  const calculateBMI = (weight: number): number => {
    if (!profile.height || profile.height <= 0) return 0;
    const heightInMeters = profile.height / 100;
    return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
  };

  // Memoized stats & calculations
  const stats = useMemo(() => {
    if (entries.length === 0) {
      return {
        currentWeight: profile.weight || 0,
        currentBMI: profile.weight ? calculateBMI(profile.weight) : 0,
        weeklyChange: 0,
        monthlyChange: 0,
        overallChange: 0,
        latestBodyFat: 0
      };
    }

    const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const latest = sorted[sorted.length - 1];
    const earliest = sorted[0];

    const currentWeight = latest.weight;
    const currentBMI = latest.bmi || calculateBMI(currentWeight);
    const latestBodyFat = latest.bodyFat || 0;

    // Helper to find entry closest to a specific target date
    const getChangeFromDaysAgo = (days: number): number => {
      const targetTime = new Date().getTime() - days * 24 * 60 * 60 * 1000;
      let closest = sorted[0];
      let minDiff = Math.abs(new Date(closest.date).getTime() - targetTime);

      for (let i = 1; i < sorted.length; i++) {
        const diff = Math.abs(new Date(sorted[i].date).getTime() - targetTime);
        if (diff < minDiff) {
          minDiff = diff;
          closest = sorted[i];
        }
      }
      
      // Only compute change if the entry found is reasonably in the past
      const dateDiffDays = (new Date(latest.date).getTime() - new Date(closest.date).getTime()) / (24 * 60 * 60 * 1000);
      if (dateDiffDays < 3 && days > 5) return 0; // Not enough time difference

      return parseFloat((latest.weight - closest.weight).toFixed(1));
    };

    const weeklyChange = getChangeFromDaysAgo(7);
    const monthlyChange = getChangeFromDaysAgo(30);
    const overallChange = parseFloat((latest.weight - earliest.weight).toFixed(1));

    return {
      currentWeight,
      currentBMI,
      weeklyChange,
      monthlyChange,
      overallChange,
      latestBodyFat
    };
  }, [entries, profile.weight, profile.height]);

  // Form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Open form for adding
  const handleOpenAdd = () => {
    setEditingEntry(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      weight: (profile.weight || '').toString(),
      bodyFat: '',
      chest: '',
      waist: '',
      arms: '',
      thigh: '',
      shoulders: '',
      notes: ''
    });
    setShowAddForm(true);
  };

  // Open form for editing
  const handleEdit = (entry: ProgressEntry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date,
      weight: entry.weight.toString(),
      bodyFat: entry.bodyFat?.toString() || '',
      chest: entry.chest?.toString() || '',
      waist: entry.waist?.toString() || '',
      arms: entry.arms?.toString() || '',
      thigh: entry.thigh?.toString() || '',
      shoulders: entry.shoulders?.toString() || '',
      notes: entry.notes || ''
    });
    setShowAddForm(true);
  };

  // Delete Progress Entry
  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this measurement entry?')) {
      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          await firestoreService.deleteProgressEntry(uid, id);
        } catch (e) {
          console.error('Failed to delete progress entry from Firestore:', e);
        }
      }
      const updated = entries.filter(e => e.id !== id);
      onUpdateEntries(updated);
    }
  };

  // Submit progress form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = parseFloat(formData.weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      alert('Please enter a valid weight');
      return;
    }

    const entry: ProgressEntry = {
      id: editingEntry?.id || Date.now().toString(),
      date: formData.date,
      weight: weightNum,
      bodyFat: formData.bodyFat ? parseFloat(formData.bodyFat) : undefined,
      chest: formData.chest ? parseFloat(formData.chest) : undefined,
      waist: formData.waist ? parseFloat(formData.waist) : undefined,
      arms: formData.arms ? parseFloat(formData.arms) : undefined,
      thigh: formData.thigh ? parseFloat(formData.thigh) : undefined,
      shoulders: formData.shoulders ? parseFloat(formData.shoulders) : undefined,
      bmi: calculateBMI(weightNum),
      notes: formData.notes || undefined,
      createdAt: editingEntry?.createdAt
    };

    const uid = auth.currentUser?.uid;
    if (uid) {
      try {
        await firestoreService.saveProgressEntry(uid, entry);
      } catch (err) {
        console.error('Failed to save progress entry to Firestore:', err);
      }
    }

    const updated = editingEntry
      ? entries.map(e => e.id === entry.id ? entry : e)
      : [entry, ...entries];
    
    onUpdateEntries(updated);
    setShowAddForm(false);
  };

  // Sort entries for charts chronologically
  const chartData = useMemo(() => {
    return [...entries]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(e => ({
        ...e,
        displayDate: new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      }));
  }, [entries]);

  const latestEntry = entries[0] || null; // Entries are already sorted descending by date from service

  return (
    <div className="p-6 lg:p-10 space-y-8 pb-32">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 border-b border-white/10 pb-6"
      >
        <div>
          <h1 className="text-4xl lg:text-5xl font-display font-bold text-white uppercase tracking-tight flex items-center gap-3">
            PROGRESS TRACKING
          </h1>
          <p className="text-gray-400 mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            Log measurements, calculate BMI, and monitor fitness goals
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-black font-bold px-5 py-3 rounded-lg font-display uppercase text-sm tracking-wider transition-all shadow-lg hover:shadow-primary/25"
        >
          <Plus size={16} />
          Log Measurements
        </button>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Weight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-white/5 rounded-xl p-6 relative overflow-hidden group"
        >
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Current Weight</p>
          <h3 className="text-3xl font-display font-bold text-white mt-2">
            {stats.currentWeight > 0 ? `${stats.currentWeight} kg` : 'Not Logged'}
          </h3>
          <div className="flex items-center gap-1.5 mt-3">
            {stats.overallChange < 0 ? (
              <span className="text-green-400 text-xs font-bold flex items-center gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" />
                {stats.overallChange} kg overall
              </span>
            ) : stats.overallChange > 0 ? (
              <span className="text-blue-400 text-xs font-bold flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" />
                +{stats.overallChange} kg overall
              </span>
            ) : (
              <span className="text-gray-500 text-xs font-bold">Stable overall</span>
            )}
          </div>
        </motion.div>

        {/* Weekly Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-white/5 rounded-xl p-6 relative overflow-hidden group"
        >
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Weekly Trend</p>
          <h3 className="text-3xl font-display font-bold text-white mt-2">
            {stats.weeklyChange === 0 ? 'Stable' : `${stats.weeklyChange > 0 ? '+' : ''}${stats.weeklyChange} kg`}
          </h3>
          <p className="text-xs text-gray-500 mt-3 font-semibold uppercase tracking-wider">Last 7 Days Change</p>
        </motion.div>

        {/* Monthly Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-white/5 rounded-xl p-6 relative overflow-hidden group"
        >
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Monthly Trend</p>
          <h3 className="text-3xl font-display font-bold text-white mt-2">
            {stats.monthlyChange === 0 ? 'Stable' : `${stats.monthlyChange > 0 ? '+' : ''}${stats.monthlyChange} kg`}
          </h3>
          <p className="text-xs text-gray-500 mt-3 font-semibold uppercase tracking-wider">Last 30 Days Change</p>
        </motion.div>

        {/* BMI Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-white/5 rounded-xl p-6 relative overflow-hidden group"
        >
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Current BMI</p>
          <h3 className="text-3xl font-display font-bold text-white mt-2">
            {stats.currentBMI > 0 ? stats.currentBMI : 'N/A'}
          </h3>
          <div className="flex items-center gap-1.5 mt-3">
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
              stats.currentBMI <= 0 ? 'bg-gray-800 text-gray-400' :
              stats.currentBMI < 18.5 ? 'bg-blue-500/20 text-blue-400' :
              stats.currentBMI < 25 ? 'bg-green-500/20 text-green-400' :
              stats.currentBMI < 30 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {stats.currentBMI <= 0 ? 'Unknown' :
               stats.currentBMI < 18.5 ? 'Underweight' :
               stats.currentBMI < 25 ? 'Normal weight' :
               stats.currentBMI < 30 ? 'Overweight' : 'Obese'}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-card border border-white/5 rounded-lg p-1">
        {[
          { id: 'charts', label: 'Analytics Charts', icon: Activity },
          { id: 'measurements', label: 'Body Measurements', icon: Ruler },
          { id: 'logs', label: 'Logs History', icon: Calendar }
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
            <span className="text-xs lg:text-sm font-display uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Panels */}
      <AnimatePresence mode="wait">
        {activeTab === 'charts' && (
          <motion.div
            key="charts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Weight Line Chart */}
            <div className="bg-card border border-white/5 rounded-xl p-6">
              <h3 className="text-xl font-display font-bold text-white mb-6 uppercase flex items-center gap-2">
                <Scale className="text-primary w-5 h-5" /> Weight History (kg)
              </h3>
              <div className="h-[300px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="displayDate" stroke="#666" tick={{ fill: '#888', fontSize: 11 }} />
                      <YAxis stroke="#666" tick={{ fill: '#888' }} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f0f0f', borderColor: '#ffffff20', borderRadius: '8px', color: '#fff' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="#ff5e00"
                        strokeWidth={3}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm font-medium">
                    Log at least one measurement entry to see weight trends
                  </div>
                )}
              </div>
            </div>

            {/* BMI Line Chart */}
            <div className="bg-card border border-white/5 rounded-xl p-6">
              <h3 className="text-xl font-display font-bold text-white mb-6 uppercase flex items-center gap-2">
                <Activity className="text-primary w-5 h-5" /> BMI History
              </h3>
              <div className="h-[300px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="displayDate" stroke="#666" tick={{ fill: '#888', fontSize: 11 }} />
                      <YAxis stroke="#666" tick={{ fill: '#888' }} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f0f0f', borderColor: '#ffffff20', borderRadius: '8px', color: '#fff' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="bmi"
                        stroke="#10b981"
                        strokeWidth={3}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm font-medium">
                    Log at least one measurement entry to see BMI trends
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'measurements' && (
          <motion.div
            key="measurements"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Body Circumference Overview */}
            <div className="bg-card border border-white/5 rounded-xl p-6">
              <h3 className="text-xl font-display font-bold text-white mb-6 uppercase flex items-center gap-2">
                <Ruler className="text-primary w-5 h-5" /> Circumference Stats (cm)
              </h3>
              {latestEntry ? (
                <div className="space-y-4">
                  {[
                    { label: 'Shoulders', val: latestEntry.shoulders },
                    { label: 'Chest', val: latestEntry.chest },
                    { label: 'Waist', val: latestEntry.waist },
                    { label: 'Arms', val: latestEntry.arms },
                    { label: 'Thigh', val: latestEntry.thigh }
                  ].map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-3 border-b border-white/5">
                      <span className="text-gray-400 font-medium">{item.label}</span>
                      <span className="text-white font-bold text-lg">
                        {item.val ? `${item.val} cm` : 'Not Tracked'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500 text-sm">
                  <Ruler className="mb-2 text-gray-600" size={32} />
                  <span>No measurements logged yet</span>
                </div>
              )}
            </div>

            {/* AI Progress Coach Note */}
            <div className="bg-card border border-white/5 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-display font-bold text-white mb-4 uppercase flex items-center gap-2">
                  <Info className="text-primary w-5 h-5" /> Progress Tips
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  Consistency is key. Body fat and muscle building take time. Log your measurements under identical conditions (e.g. morning fasting) once a week to ensure high-fidelity insights.
                </p>
                <div className="bg-white/5 p-4 rounded-lg border border-white/5 space-y-2">
                  <p className="text-xs text-gray-400"><strong className="text-white">Height:</strong> {profile.height || 'Not set'} cm</p>
                  <p className="text-xs text-gray-400"><strong className="text-white">Starting Weight:</strong> {profile.weight || 'Not set'} kg</p>
                  <p className="text-xs text-gray-400"><strong className="text-white">Target split:</strong> {profile.splitPreference || 'Not set'}</p>
                </div>
              </div>
              {latestEntry?.notes && (
                <div className="mt-6 border-t border-white/5 pt-4">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1.5">Latest Entry Notes</p>
                  <p className="text-sm text-gray-300 italic">"{latestEntry.notes}"</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'logs' && (
          <motion.div
            key="logs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card border border-white/5 rounded-xl overflow-hidden"
          >
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-display font-bold text-white uppercase">Logs History</h3>
              <span className="text-xs text-gray-500 font-bold">{entries.length} Entries Logged</span>
            </div>
            
            {entries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      <th className="p-4">Date</th>
                      <th className="p-4">Weight (kg)</th>
                      <th className="p-4">Body Fat %</th>
                      <th className="p-4">Waist (cm)</th>
                      <th className="p-4">Arms (cm)</th>
                      <th className="p-4">BMI</th>
                      <th className="p-4">Notes</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-white/[0.02] transition-all">
                        <td className="p-4 font-semibold text-white">{entry.date}</td>
                        <td className="p-4 text-white">{entry.weight} kg</td>
                        <td className="p-4 text-gray-300">{entry.bodyFat ? `${entry.bodyFat}%` : '-'}</td>
                        <td className="p-4 text-gray-300">{entry.waist ? `${entry.waist} cm` : '-'}</td>
                        <td className="p-4 text-gray-300">{entry.arms ? `${entry.arms} cm` : '-'}</td>
                        <td className="p-4 text-gray-300">{entry.bmi || '-'}</td>
                        <td className="p-4 text-gray-400 max-w-[200px] truncate" title={entry.notes}>
                          {entry.notes || '-'}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(entry)}
                              className="p-2 bg-white/5 hover:bg-primary/20 text-gray-400 hover:text-primary rounded transition-all"
                              aria-label={`Edit entry from ${entry.date}`}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded transition-all"
                              aria-label={`Delete entry from ${entry.date}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-16 text-center text-gray-500 text-sm">
                No progress entries logged yet. Click "Log Measurements" above to get started.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add / Edit Modal Overlay */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-white/10 rounded-xl max-w-xl w-full p-6 shadow-2xl relative"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-display font-bold text-white uppercase flex items-center gap-2">
                  {editingEntry ? <Edit3 className="text-primary" /> : <Plus className="text-primary" />}
                  {editingEntry ? 'Edit Entry' : 'Log New Measurements'}
                </h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-white"
                  aria-label="Close form"
                >
                  <X />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Date */}
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 font-bold uppercase mb-1">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                      className="bg-black/40 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-primary text-sm"
                    />
                  </div>

                  {/* Weight */}
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 font-bold uppercase mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      placeholder="e.g. 75.4"
                      required
                      className="bg-black/40 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* Body Fat */}
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 font-bold uppercase mb-1">Body Fat %</label>
                    <input
                      type="number"
                      step="0.1"
                      name="bodyFat"
                      value={formData.bodyFat}
                      onChange={handleInputChange}
                      placeholder="e.g. 15.2"
                      className="bg-black/40 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-primary text-sm"
                    />
                  </div>

                  {/* Chest */}
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 font-bold uppercase mb-1">Chest (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="chest"
                      value={formData.chest}
                      onChange={handleInputChange}
                      placeholder="e.g. 104"
                      className="bg-black/40 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-primary text-sm"
                    />
                  </div>

                  {/* Waist */}
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 font-bold uppercase mb-1">Waist (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="waist"
                      value={formData.waist}
                      onChange={handleInputChange}
                      placeholder="e.g. 82"
                      className="bg-black/40 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* Arms */}
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 font-bold uppercase mb-1">Arms (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="arms"
                      value={formData.arms}
                      onChange={handleInputChange}
                      placeholder="e.g. 38"
                      className="bg-black/40 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-primary text-sm"
                    />
                  </div>

                  {/* Thigh */}
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 font-bold uppercase mb-1">Thigh (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="thigh"
                      value={formData.thigh}
                      onChange={handleInputChange}
                      placeholder="e.g. 58"
                      className="bg-black/40 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-primary text-sm"
                    />
                  </div>

                  {/* Shoulders */}
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500 font-bold uppercase mb-1">Shoulders (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="shoulders"
                      value={formData.shoulders}
                      onChange={handleInputChange}
                      placeholder="e.g. 120"
                      className="bg-black/40 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 font-bold uppercase mb-1">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Enter workouts, feeling, or extra measurements details..."
                    rows={3}
                    className="bg-black/40 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-primary text-sm"
                  />
                </div>

                {/* Calculated BMI Help */}
                {profile.height && profile.height > 0 && formData.weight && (
                  <div className="bg-primary/5 p-3 rounded border border-primary/10 flex justify-between items-center text-xs">
                    <span className="text-gray-400">Calculated BMI for height ({profile.height} cm)</span>
                    <strong className="text-primary text-sm">{calculateBMI(parseFloat(formData.weight) || 0)}</strong>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="bg-white/5 hover:bg-white/10 text-white font-bold px-4 py-2.5 rounded text-sm uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary/80 text-black font-bold px-5 py-2.5 rounded text-sm uppercase tracking-wider flex items-center gap-2"
                  >
                    <Save size={16} />
                    {editingEntry ? 'Update Entry' : 'Save Entry'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Progress;
