import React, { useState } from 'react';
import { UserProfile, Gender, Experience, Goal, Equipment, DietType, SplitPreference } from '../types';
import { ChevronRight, Activity, Dumbbell, Target, AlertCircle, Utensils, Check, Layers } from 'lucide-react';

import { motion, AnimatePresence, Variants } from 'framer-motion';

interface Props {
   onComplete: (profile: UserProfile) => void;
   initialData?: UserProfile;
   mode?: 'create' | 'edit';
}

const Onboarding: React.FC<Props> = ({ onComplete, initialData, mode = 'create' }) => {
   const [step, setStep] = useState(1);
   const totalSteps = 5;
   const [formData, setFormData] = useState<Partial<UserProfile>>(initialData || {
      name: '',
      age: 24,
      weight: 75,
      height: 178,
      gender: Gender.MALE,
      experience: Experience.BEGINNER,
      daysAvailable: 4,
      goal: Goal.MAINTENANCE,
      equipment: Equipment.FULL_GYM,
      splitPreference: SplitPreference.PPL,
      dietType: DietType.ANY,

      injuries: '',
   });

   const nextStep = () => setStep(s => s + 1);
   const prevStep = () => setStep(s => s - 1);

   const handleSubmit = () => {
      onComplete({ ...formData, completedOnboarding: true } as UserProfile);
   };

   const variants: Variants = {
      initial: { opacity: 0, x: 100 },
      animate: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100, damping: 20 } },
      exit: { opacity: 0, x: -100, transition: { duration: 0.3 } }
   };

   return (
      <div className="min-h-screen flex flex-col lg:flex-row bg-black overflow-hidden relative font-sans text-white">
         {/* Background Image Overlay */}
         <div className="absolute inset-0 z-0">
            <img
               src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop"
               className="w-full h-full object-cover opacity-20 filter grayscale contrast-125"
               alt="Gym Background"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
         </div>

         {/* Left Panel - Branding */}
         <div className="relative z-10 lg:w-1/3 p-10 flex flex-col justify-between border-r border-white/10 bg-black/50 backdrop-blur-sm">
            <div>
               <h1 className="text-6xl font-display font-bold text-primary tracking-tighter mb-4">LEO</h1>
               <p className="text-xl text-gray-400 font-light">"Naan Thanda Leo"</p>
            </div>
            <div className="hidden lg:block">
               <div className="mb-4">
                  <span className="text-xs text-primary font-bold tracking-widest uppercase">Progress</span>
                  <div className="h-1 w-full bg-gray-800 rounded-full mt-2">
                     <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(step / totalSteps) * 100}%` }}
                     />
                  </div>
               </div>
               <p className="text-sm text-gray-500">Step {step} of {totalSteps}</p>
            </div>
         </div>

         {/* Right Panel - Form */}
         <div className="relative z-10 flex-1 flex items-center justify-center p-6 lg:p-20">
            <div className="w-full max-w-2xl">
               <AnimatePresence mode="wait">

                  {/* STEP 1: IDENTITY */}
                  {step === 1 && (
                     <motion.div key="step1" variants={variants} initial="initial" animate="animate" exit="exit" className="space-y-8">
                        <div>
                           <h2 className="text-4xl font-display font-bold mb-2">Identify Yourself</h2>
                           <p className="text-gray-400">Let's build your profile.</p>
                        </div>

                        <div className="space-y-6">
                           <div>
                              <label className="text-xs text-primary uppercase font-bold tracking-wider mb-2 block">Name</label>
                              <input
                                 type="text"
                                 value={formData.name}
                                 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                 className="w-full bg-transparent border-b-2 border-gray-700 text-3xl py-2 focus:border-primary focus:outline-none transition-colors font-display"
                                 placeholder="ENTER NAME"
                                 autoFocus
                              />
                           </div>
                           <div className="flex gap-8">
                              <div className="flex-1">
                                 <label className="text-xs text-primary uppercase font-bold tracking-wider mb-2 block">Age</label>
                                 <input
                                    type="number"
                                    value={formData.age}
                                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                                    className="w-full bg-transparent border-b-2 border-gray-700 text-3xl py-2 focus:border-primary focus:outline-none transition-colors font-display"
                                 />
                              </div>
                              <div className="flex-1">
                                 <label className="text-xs text-primary uppercase font-bold tracking-wider mb-2 block">Gender</label>
                                 <div className="flex gap-2">
                                    {Object.values(Gender).map(g => (
                                       <button
                                          key={g}
                                          onClick={() => setFormData({ ...formData, gender: g })}
                                          className={`px-4 py-2 rounded border border-gray-700 text-sm font-bold uppercase transition-all ${formData.gender === g ? 'bg-primary text-black border-primary' : 'hover:border-gray-500'}`}
                                       >
                                          {g}
                                       </button>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        </div>
                        <button onClick={nextStep} disabled={!formData.name} className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded font-bold uppercase hover:bg-primary transition-colors disabled:opacity-50">
                           Next Step <ChevronRight size={18} />
                        </button>
                     </motion.div>
                  )}

                  {/* STEP 2: METRICS */}
                  {step === 2 && (
                     <motion.div key="step2" variants={variants} initial="initial" animate="animate" exit="exit" className="space-y-8">
                        <div>
                           <h2 className="text-4xl font-display font-bold mb-2">Your Metrics</h2>
                           <p className="text-gray-400">Precision is key for AI calculations.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-10">
                           <div className="bg-card p-6 rounded-lg border border-white/5 relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                 <Activity size={100} />
                              </div>
                              <label className="text-xs text-primary uppercase font-bold tracking-wider mb-4 block">Weight (KG)</label>
                              <div className="flex items-baseline gap-2 mb-4">
                                 <span className="text-5xl font-display font-bold">{formData.weight}</span>
                                 <span className="text-gray-500">kg</span>
                              </div>
                              <input
                                 type="range" min="40" max="150"
                                 value={formData.weight}
                                 onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                                 className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                              />
                           </div>

                           <div className="bg-card p-6 rounded-lg border border-white/5 relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                 <Activity size={100} />
                              </div>
                              <label className="text-xs text-primary uppercase font-bold tracking-wider mb-4 block">Height (CM)</label>
                              <div className="flex items-baseline gap-2 mb-4">
                                 <span className="text-5xl font-display font-bold">{formData.height}</span>
                                 <span className="text-gray-500">cm</span>
                              </div>
                              <input
                                 type="range" min="140" max="220"
                                 value={formData.height}
                                 onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                                 className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                              />
                           </div>
                        </div>

                        <div className="flex gap-4">
                           <button onClick={prevStep} className="px-6 py-3 text-gray-400 hover:text-white font-bold uppercase">Back</button>
                           <button onClick={nextStep} className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded font-bold uppercase hover:bg-primary transition-colors">
                              Next Step <ChevronRight size={18} />
                           </button>
                        </div>
                     </motion.div>
                  )}

                  {/* STEP 3: EXPERIENCE & EQUIPMENT */}
                  {step === 3 && (
                     <motion.div key="step3" variants={variants} initial="initial" animate="animate" exit="exit" className="space-y-8">
                        <div>
                           <h2 className="text-4xl font-display font-bold mb-2">Training Setup</h2>
                           <p className="text-gray-400">Customize the AI to your environment.</p>
                        </div>

                        <div className="space-y-6">
                           <div>
                              <label className="text-xs text-primary uppercase font-bold tracking-wider mb-3 block">Experience Level</label>
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                 {Object.values(Experience).map(exp => (
                                    <button
                                       key={exp}
                                       onClick={() => setFormData({ ...formData, experience: exp })}
                                       className={`p-3 rounded border text-sm font-bold uppercase transition-all ${formData.experience === exp ? 'bg-primary text-black border-primary' : 'border-gray-700 hover:border-white'
                                          }`}
                                    >
                                       {exp}
                                    </button>
                                 ))}
                              </div>
                           </div>

                           <div>
                              <label className="text-xs text-primary uppercase font-bold tracking-wider mb-3 block">Equipment Access</label>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                 {Object.values(Equipment).map(eq => (
                                    <button
                                       key={eq}
                                       onClick={() => setFormData({ ...formData, equipment: eq })}
                                       className={`p-4 rounded border text-left text-sm font-bold uppercase transition-all flex justify-between items-center ${formData.equipment === eq ? 'bg-white text-black border-white' : 'border-gray-700 hover:border-gray-500'
                                          }`}
                                    >
                                       {eq}
                                       {formData.equipment === eq && <Check size={16} />}
                                    </button>
                                 ))}
                              </div>
                           </div>

                           <div>
                              <label className="text-xs text-primary uppercase font-bold tracking-wider mb-3 block">Training Frequency (Days/Week)</label>
                              <div className="flex gap-2">
                                 {[2, 3, 4, 5, 6, 7].map(d => (
                                    <button
                                       key={d}
                                       onClick={() => setFormData({ ...formData, daysAvailable: d })}
                                       className={`w-12 h-12 rounded border font-bold text-lg transition-all ${formData.daysAvailable === d ? 'bg-primary text-black border-primary' : 'border-gray-700 text-gray-400 hover:border-white'
                                          }`}
                                    >
                                       {d}
                                    </button>
                                 ))}
                              </div>
                           </div>




                           <div>
                              <label className="text-xs text-primary uppercase font-bold tracking-wider mb-3 block">Workout Split Style</label>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                 {Object.values(SplitPreference).map(split => (
                                    <button
                                       key={split}
                                       onClick={() => setFormData({ ...formData, splitPreference: split })}
                                       className={`p-4 rounded border text-left text-sm font-bold uppercase transition-all flex justify-between items-center ${formData.splitPreference === split ? 'bg-white text-black border-white' : 'border-gray-700 hover:border-gray-500'
                                          }`}
                                    >
                                       <div className="flex items-center gap-3">
                                          <Layers size={16} className={formData.splitPreference === split ? 'text-primary' : 'text-gray-500'} />
                                          {split}
                                       </div>
                                       {formData.splitPreference === split && <Check size={16} />}
                                    </button>
                                 ))}
                              </div>
                           </div>
                        </div>


                        <div className="flex gap-4">
                           <button onClick={prevStep} className="px-6 py-3 text-gray-400 hover:text-white font-bold uppercase">Back</button>
                           <button onClick={nextStep} className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded font-bold uppercase hover:bg-primary transition-colors">
                              Next Step <ChevronRight size={18} />
                           </button>
                        </div>
                     </motion.div>
                  )}

                  {/* STEP 4: DIET & HEALTH */}
                  {step === 4 && (
                     <motion.div key="step4" variants={variants} initial="initial" animate="animate" exit="exit" className="space-y-8">
                        <div>
                           <h2 className="text-4xl font-display font-bold mb-2">Fuel & Health</h2>
                           <p className="text-gray-400">Safety and nutrition factors.</p>
                        </div>

                        <div className="space-y-6">
                           <div>
                              <label className="text-xs text-primary uppercase font-bold tracking-wider mb-3 block">Dietary Preference</label>
                              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                 {Object.values(DietType).map(dt => (
                                    <button
                                       key={dt}
                                       onClick={() => setFormData({ ...formData, dietType: dt })}
                                       className={`p-3 rounded border text-sm font-bold uppercase transition-all flex items-center gap-2 ${formData.dietType === dt ? 'bg-primary text-black border-primary' : 'border-gray-700 hover:border-white'
                                          }`}
                                    >
                                       <Utensils size={14} /> {dt}
                                    </button>
                                 ))}
                              </div>
                           </div>

                           <div>
                              <label className="text-xs text-primary uppercase font-bold tracking-wider mb-3 block">Injuries / Limitations</label>
                              <div className="bg-card border border-gray-700 rounded p-4 flex gap-3">
                                 <AlertCircle className="text-primary shrink-0" />
                                 <textarea
                                    value={formData.injuries}
                                    onChange={(e) => setFormData({ ...formData, injuries: e.target.value })}
                                    className="w-full bg-transparent border-none focus:outline-none text-sm text-white placeholder-gray-600 resize-none h-20"
                                    placeholder="e.g. Lower back pain, Shoulder impingement (Optional)"
                                 />
                              </div>
                           </div>
                        </div>

                        <div className="flex gap-4">
                           <button onClick={prevStep} className="px-6 py-3 text-gray-400 hover:text-white font-bold uppercase">Back</button>
                           <button onClick={nextStep} className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded font-bold uppercase hover:bg-primary transition-colors">
                              Next Step <ChevronRight size={18} />
                           </button>
                        </div>
                     </motion.div>
                  )}

                  {/* STEP 5: GOAL */}
                  {step === 5 && (
                     <motion.div key="step5" variants={variants} initial="initial" animate="animate" exit="exit" className="space-y-8">
                        <div>
                           <h2 className="text-4xl font-display font-bold mb-2">Final Objective</h2>
                           <p className="text-gray-400">What is your mission?</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                           {Object.values(Goal).map(g => (
                              <button
                                 key={g}
                                 onClick={() => setFormData({ ...formData, goal: g })}
                                 className={`p-6 rounded border flex flex-col items-start gap-2 transition-all group ${formData.goal === g
                                    ? 'bg-white text-black border-white'
                                    : 'bg-card border-gray-700 hover:border-primary'
                                    }`}
                              >
                                 <Target className={`mb-2 ${formData.goal === g ? 'text-primary' : 'text-gray-500 group-hover:text-primary'}`} size={32} />
                                 <span className="font-display font-bold text-xl uppercase">{g}</span>
                                 <span className={`text-xs ${formData.goal === g ? 'text-gray-600' : 'text-gray-500'}`}>
                                    {g === Goal.BULKING && "Maximize muscle mass gain."}
                                    {g === Goal.CUTTING && "Shred fat, preserve muscle."}
                                    {g === Goal.MAINTENANCE && "Stay fit and healthy."}
                                    {g === Goal.STRENGTH && "Increase 1RM and power."}
                                    {g === Goal.ATHLETIC && "Speed, agility, and endurance."}
                                 </span>
                              </button>
                           ))}
                        </div>

                        <div className="flex gap-4 pt-4">
                           <button onClick={prevStep} className="px-6 py-3 text-gray-400 hover:text-white font-bold uppercase">Back</button>
                           <button
                              onClick={handleSubmit}
                              className="flex-1 bg-gradient-to-r from-primary to-orange-600 text-black font-display font-bold text-xl uppercase py-4 rounded hover:scale-[1.02] transition-transform shadow-lg shadow-orange-900/50 flex items-center justify-center gap-2"
                           >
                              Initiate Protocol <ChevronRight size={24} />
                           </button>
                        </div>
                     </motion.div>
                  )}

               </AnimatePresence>
            </div>
         </div>
      </div >
   );
};

export default Onboarding;