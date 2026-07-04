import React from 'react';
import { WorkoutPlan } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Props {
    plan: WorkoutPlan;
}

const COLORS = ['#ff5e00', '#fbbf24', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316'];

const WorkoutChart: React.FC<Props> = ({ plan }) => {
    // Calculate muscle group distribution
    const muscleGroupData = plan.schedule.reduce((acc, day) => {
        day.exercises.forEach(exercise => {
            const muscle = exercise.muscleGroup;
            if (!acc[muscle]) {
                acc[muscle] = 0;
            }
            acc[muscle] += exercise.sets;
        });
        return acc;
    }, {} as Record<string, number>);

    const muscleChartData = Object.entries(muscleGroupData).map(([name, value]) => ({
        name,
        sets: value
    }));

    // Calculate exercises per day
    const dayData = plan.schedule.map(day => ({
        name: day.dayName.replace(/Day \d+ - /, ''),
        exercises: day.exercises.length,
        totalSets: day.exercises.reduce((sum, ex) => sum + ex.sets, 0)
    }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Muscle Group Distribution */}
            <div className="bg-card border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-display font-bold text-white mb-4 uppercase flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    Muscle Group Volume
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={muscleChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis
                            dataKey="name"
                            stroke="#9ca3af"
                            tick={{ fill: '#9ca3af', fontSize: 11 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />
                        <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #ffffff20',
                                borderRadius: '8px',
                                color: '#fff'
                            }}
                        />
                        <Bar dataKey="sets" fill="#ff5e00" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Workout Split Overview */}
            <div className="bg-card border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-display font-bold text-white mb-4 uppercase flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    Split Overview
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={dayData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="totalSets"
                        >
                            {dayData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #ffffff20',
                                borderRadius: '8px',
                                color: '#fff'
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Weekly Volume Stats */}
            <div className="bg-card border border-white/10 rounded-xl p-6 lg:col-span-2">
                <h3 className="text-xl font-display font-bold text-white mb-4 uppercase flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    Weekly Training Volume
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                        <div className="text-primary text-3xl font-bold mb-1">
                            {plan.schedule.length}
                        </div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Training Days</div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                        <div className="text-green-400 text-3xl font-bold mb-1">
                            {plan.schedule.reduce((sum, day) => sum + day.exercises.length, 0)}
                        </div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Total Exercises</div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                        <div className="text-blue-400 text-3xl font-bold mb-1">
                            {plan.schedule.reduce((sum, day) => sum + day.exercises.reduce((s, ex) => s + ex.sets, 0), 0)}
                        </div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Total Sets</div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                        <div className="text-purple-400 text-3xl font-bold mb-1">
                            {Object.keys(muscleGroupData).length}
                        </div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Muscle Groups</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkoutChart;
