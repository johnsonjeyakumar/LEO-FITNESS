import React, { useState, useMemo } from 'react';
import { UserProfile, Goal, MacroGoals, Gender, NutritionEntry } from '../types';
import { Utensils, Apple, Plus, Edit2, Trash2, Check, X, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../services/firebase';
import { firestoreService } from '../services/firestoreService';

interface Props {
  profile: UserProfile;
  entries: NutritionEntry[];
  onUpdateEntries: (entries: NutritionEntry[]) => void;
}

const Nutrition: React.FC<Props> = ({ profile, entries, onUpdateEntries }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: ''
  });

  // Calculate daily macro goals based on user profile
  const dailyGoals = useMemo<MacroGoals>(() => {
    let bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age;
    bmr += profile.gender === Gender.MALE ? 5 : -161;
    const tdee = bmr * 1.55;
    let targetCalories = tdee;
    if (profile.goal === Goal.BULKING) targetCalories += 500;
    if (profile.goal === Goal.CUTTING) targetCalories -= 500;

    const protein = Math.round((targetCalories * 0.3) / 4);
    const fats = Math.round((targetCalories * 0.25) / 9);
    const carbs = Math.round((targetCalories * 0.45) / 4);

    return { calories: Math.round(targetCalories), protein, fats, carbs };
  }, [profile]);

  // Calculate today's totals
  const todayTotals = useMemo(() => {
    const today = new Date().toDateString();
    const todayEntries = entries.filter(entry =>
      new Date(entry.timestamp).toDateString() === today
    );

    return todayEntries.reduce((acc, entry) => ({
      calories: acc.calories + entry.calories,
      protein: acc.protein + entry.protein,
      carbs: acc.carbs + entry.carbs,
      fats: acc.fats + entry.fats
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
  }, [entries]);

  // Calculate progress percentages
  const progressPercentages = {
    calories: Math.min((todayTotals.calories / dailyGoals.calories) * 100, 100),
    protein: Math.min((todayTotals.protein / dailyGoals.protein) * 100, 100),
    carbs: Math.min((todayTotals.carbs / dailyGoals.carbs) * 100, 100),
    fats: Math.min((todayTotals.fats / dailyGoals.fats) * 100, 100)
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const entry: any = {
      id: editingEntry?.id || Date.now().toString(),
      name: formData.name,
      calories: parseInt(formData.calories) || 0,
      protein: parseInt(formData.protein) || 0,
      carbs: parseInt(formData.carbs) || 0,
      fats: parseInt(formData.fats) || 0,
      timestamp: editingEntry?.timestamp || Date.now()
    };

    const uid = auth.currentUser?.uid;
    if (uid) {
      try {
        await firestoreService.saveNutritionEntry(uid, entry);
      } catch (error) {
        console.error("Failed to save nutrition entry to Firestore:", error);
      }
    }

    const updated = editingEntry
      ? entries.map((e: any) => e.id === entry.id ? entry : e)
      : [entry, ...entries];
    
    onUpdateEntries(updated);

    if (editingEntry) {
      setEditingEntry(null);
    } else {
      setShowAddForm(false);
    }

    setFormData({ name: '', calories: '', protein: '', carbs: '', fats: '' });
  };

  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    setFormData({
      name: entry.name || entry.meal || entry.food || '',
      calories: entry.calories.toString(),
      protein: entry.protein.toString(),
      carbs: entry.carbs.toString(),
      fats: entry.fats.toString()
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this entry?')) {
      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          await firestoreService.deleteNutritionEntry(uid, id);
        } catch (error) {
          console.error("Failed to delete nutrition entry from Firestore:", error);
        }
      }
      const updated = entries.filter((e: any) => e.id !== id);
      onUpdateEntries(updated);
    }
  };

  const cancelEdit = () => {
    setEditingEntry(null);
    setFormData({ name: '', calories: '', protein: '', carbs: '', fats: '' });
    setShowAddForm(false);
  };

  const ProgressBar = ({ current, goal, color }: { current: number; goal: number; color: string }) => {
    const percentage = Math.min((current / goal) * 100, 100);
    return (
      <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full ${color} transition-all duration-300`}
        />
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-10 pb-32 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl lg:text-5xl font-display font-bold text-white uppercase tracking-tight mb-2">
          Nutrition Tracker
        </h1>
        <p className="text-gray-400">Track your daily intake and stay on target</p>
      </div>

      {/* Daily Goals & Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-white/5 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Target className="text-orange-400" size={24} />
            <span className="text-xs text-gray-500 uppercase font-bold">Calories</span>
          </div>
          <div className="text-3xl font-display font-bold text-white mb-2">
            {todayTotals.calories} / {dailyGoals.calories}
          </div>
          <ProgressBar current={todayTotals.calories} goal={dailyGoals.calories} color="bg-orange-400" />
          <div className="text-xs text-gray-400 mt-2">
            {Math.round(progressPercentages.calories)}% of daily goal
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-white/5 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Target className="text-blue-400" size={24} />
            <span className="text-xs text-gray-500 uppercase font-bold">Protein</span>
          </div>
          <div className="text-3xl font-display font-bold text-white mb-2">
            {todayTotals.protein}g / {dailyGoals.protein}g
          </div>
          <ProgressBar current={todayTotals.protein} goal={dailyGoals.protein} color="bg-blue-400" />
          <div className="text-xs text-gray-400 mt-2">
            {Math.round(progressPercentages.protein)}% of daily goal
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-white/5 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Target className="text-green-400" size={24} />
            <span className="text-xs text-gray-500 uppercase font-bold">Carbs</span>
          </div>
          <div className="text-3xl font-display font-bold text-white mb-2">
            {todayTotals.carbs}g / {dailyGoals.carbs}g
          </div>
          <ProgressBar current={todayTotals.carbs} goal={dailyGoals.carbs} color="bg-green-400" />
          <div className="text-xs text-gray-400 mt-2">
            {Math.round(progressPercentages.carbs)}% of daily goal
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-white/5 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Target className="text-purple-400" size={24} />
            <span className="text-xs text-gray-500 uppercase font-bold">Fats</span>
          </div>
          <div className="text-3xl font-display font-bold text-white mb-2">
            {todayTotals.fats}g / {dailyGoals.fats}g
          </div>
          <ProgressBar current={todayTotals.fats} goal={dailyGoals.fats} color="bg-purple-400" />
          <div className="text-xs text-gray-400 mt-2">
            {Math.round(progressPercentages.fats)}% of daily goal
          </div>
        </motion.div>
      </div>

      {/* Add Entry Button */}
      <div className="flex justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(true)}
          className="bg-primary hover:bg-orange-600 text-black px-8 py-4 rounded-xl font-bold uppercase tracking-wider flex items-center gap-3 transition-all"
        >
          <Plus size={20} />
          Add Nutrition Entry
        </motion.button>
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={cancelEdit}
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              exit={{ y: 50 }}
              className="bg-card border border-white/10 rounded-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-display font-bold text-white uppercase">
                  {editingEntry ? 'Edit Entry' : 'Add Nutrition'}
                </h2>
                <button
                  onClick={cancelEdit}
                  className="text-gray-400 hover:text-white"
                  aria-label="Close form"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Food Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none"
                    placeholder="e.g., Chicken Breast"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Calories</label>
                    <input
                      type="number"
                      value={formData.calories}
                      onChange={(e) => setFormData(prev => ({ ...prev, calories: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none"
                      placeholder="kcal"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Protein (g)</label>
                    <input
                      type="number"
                      value={formData.protein}
                      onChange={(e) => setFormData(prev => ({ ...prev, protein: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none"
                      placeholder="g"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Carbs (g)</label>
                    <input
                      type="number"
                      value={formData.carbs}
                      onChange={(e) => setFormData(prev => ({ ...prev, carbs: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none"
                      placeholder="g"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Fats (g)</label>
                    <input
                      type="number"
                      value={formData.fats}
                      onChange={(e) => setFormData(prev => ({ ...prev, fats: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none"
                      placeholder="g"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-orange-600 text-black py-3 rounded-lg font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    <Check size={18} />
                    {editingEntry ? 'Update' : 'Add'} Entry
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-6 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-bold uppercase tracking-wider transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Today's Entries */}
      <div className="bg-card border border-white/5 rounded-xl p-6">
        <h3 className="text-xl font-display font-bold text-white mb-6 uppercase">Today's Entries</h3>

        {entries.filter(entry => new Date(entry.timestamp).toDateString() === new Date().toDateString()).length === 0 ? (
          <div className="text-center py-12">
            <Utensils className="mx-auto text-gray-600 mb-4" size={48} />
            <p className="text-gray-400">No entries for today. Add your first meal!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries
              .filter(entry => new Date(entry.timestamp).toDateString() === new Date().toDateString())
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-black/20 border border-white/5 rounded-lg p-4 flex justify-between items-center"
                >
                  <div className="flex-1">
                    <h4 className="text-white font-bold">{entry.name}</h4>
                    <div className="text-sm text-gray-400 mt-1">
                      {entry.calories} kcal • {entry.protein}g protein • {entry.carbs}g carbs • {entry.fats}g fats
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                      aria-label={`Edit ${entry.name}`}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      aria-label={`Delete ${entry.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Nutrition;