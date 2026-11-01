import React, { useState } from 'react';
import {
  Sparkles, ArrowRight, ArrowLeft, Check, Plus, Trash2
} from 'lucide-react';
import { api } from '../services/api';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(1);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [initStage, setInitStage] = useState<string>('');

  // Step 1: User Profile
  const [name, setName] = useState<string>('');
  const [currentSituation, setCurrentSituation] = useState<string>('');
  const [challenges, setChallenges] = useState<string>('');

  // Step 2: Desired Future
  const [desiredFuture, setDesiredFuture] = useState<string>('');
  const [skillsToDevelop, setSkillsToDevelop] = useState<string>('');
  const [successDefinition, setSuccessDefinition] = useState<string>('');

  // Step 3: Goals
  const [goals, setGoals] = useState<Array<{
    title: string;
    description: string;
    category: string;
    importance: string;
    challenges: string;
    why_matters: string;
  }>>([]);

  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('Career');
  const [newGoalImportance, setNewGoalImportance] = useState('high');

  // Step 4: Persona & Personality
  const [personaName, setPersonaName] = useState<string>('');
  const [selectedTraits, setSelectedTraits] = useState<string[]>([
    'Calm and reflective',
    'Disciplined and direct'
  ]);

  const personalityOptions = [
    { label: 'Calm and reflective', desc: 'Patient, thoughtful, and contemplative.' },
    { label: 'Disciplined and direct', desc: 'Focused on habits and daily accountability.' },
    { label: 'Analytical and strategic', desc: 'Rigorous models, structured reasoning.' },
    { label: 'Supportive and empathetic', desc: 'Warm, encouraging, and understanding.' },
    { label: 'Ambitious and challenging', desc: 'Pushes you to exceed perceived limits.' },
  ];

  const categories = [
    'Career', 'Education', 'Business', 'Finance',
    'Health and fitness', 'Personal development', 'Relationships',
    'Creativity', 'Other'
  ];

  const toggleTrait = (trait: string) => {
    if (selectedTraits.includes(trait)) {
      if (selectedTraits.length > 1) {
        setSelectedTraits(selectedTraits.filter((t) => t !== trait));
      }
    } else {
      setSelectedTraits([...selectedTraits, trait]);
    }
  };

  const addGoal = () => {
    if (!newGoalTitle.trim()) return;
    setGoals([
      ...goals,
      {
        title: newGoalTitle.trim(),
        description: '',
        category: newGoalCategory,
        importance: newGoalImportance,
        challenges: '',
        why_matters: ''
      }
    ]);
    setNewGoalTitle('');
  };

  const removeGoal = (idx: number) => {
    setGoals(goals.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setIsInitializing(true);
    try {
      setInitStage('Calibrating identity profile...');
      await new Promise((r) => setTimeout(r, 600));

      setInitStage('Connecting to local ChromaDB vault...');
      await api.completeOnboarding({
        name: name || 'User',
        current_situation: currentSituation || 'Working diligently towards personal growth.',
        challenges: challenges || 'Consistency and discipline.',
        desired_future: desiredFuture || 'Achieving technical mastery and deep fulfillment.',
        skills_to_develop: skillsToDevelop || 'Core fundamentals, system architecture, research.',
        success_definition: successDefinition || 'Creating impact through sustained excellence.',
        goals: goals.map((g) => ({
          title: g.title,
          description: g.description,
          category: g.category,
          importance: g.importance,
          challenges: g.challenges,
          why_matters: g.why_matters
        })),
        persona_name: personaName || 'Future Self',
        personality_traits: selectedTraits
      });

      setInitStage('Initializing persona embedding space...');
      await new Promise((r) => setTimeout(r, 700));

      setInitStage('Ready.');
      await new Promise((r) => setTimeout(r, 400));

      onComplete();
    } catch (err) {
      console.error('Onboarding failed:', err);
      alert('Initialization failed. Check if local backend is running.');
      setIsInitializing(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center p-6 font-apple">
        <div className="max-w-md w-full bg-[#1c1c1e] border border-white/[0.1] p-8 rounded-3xl text-center space-y-6 shadow-2xl">
          <div className="relative mx-auto w-12 h-12 flex items-center justify-center">
            <span className="w-12 h-12 rounded-full border-2 border-white/[0.15] border-t-[#0a84ff] animate-spin" />
            <Sparkles className="w-5 h-5 text-[#0a84ff] absolute" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-[#f5f5f7]">
              {initStage}
            </h3>
            <p className="text-xs text-[#86868b]">
              Setting up your local memory archive and personas.
            </p>
          </div>
          <div className="w-full bg-[#121214] h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-[#0a84ff] rounded-full w-2/3 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 font-apple overflow-y-auto">
      <div className="max-w-xl w-full bg-[#1c1c1e] border border-white/[0.12] rounded-3xl p-6 md:p-10 shadow-2xl relative my-auto">
        {/* Step Indicator - Apple Setup Assistant Dots */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center space-x-1.5">
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  step === i
                    ? 'w-6 bg-[#0a84ff]'
                    : step > i
                    ? 'bg-[#30d158]'
                    : 'bg-white/[0.15]'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-[#86868b]">
            Step {step} of 4
          </span>
        </div>

        {/* STEP 1: ABOUT USER */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-[#f5f5f7]">
                Who are you today?
              </h2>
              <p className="text-xs text-[#86868b] mt-1">
                Your future self remembers where you started and understands your current context.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#86868b]">
                What should we call you? *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Victor"
                className="w-full bg-[#121214] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#86868b]">
                What is your current situation & focus? *
              </label>
              <textarea
                value={currentSituation}
                onChange={(e) => setCurrentSituation(e.target.value)}
                placeholder="e.g. Working on software engineering, studying distributed systems and aiming to build high-scale products."
                rows={3}
                className="w-full bg-[#121214] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff] resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#86868b]">
                What are your biggest current challenges or obstacles?
              </label>
              <textarea
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
                placeholder="e.g. Maintaining sustained focus, time management across projects, imposter syndrome."
                rows={2}
                className="w-full bg-[#121214] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff] resize-none"
              />
            </div>
          </div>
        )}

        {/* STEP 2: DESIRED FUTURE */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-[#f5f5f7]">
                The Person You Aspire to Become
              </h2>
              <p className="text-xs text-[#86868b] mt-1">
                Define the future reality you are working to inhabit.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#86868b]">
                Who do you want to become & what do you want to achieve? *
              </label>
              <textarea
                value={desiredFuture}
                onChange={(e) => setDesiredFuture(e.target.value)}
                placeholder="e.g. A senior technical leader building impactful autonomous systems and mentoring promising engineers."
                rows={4}
                className="w-full bg-[#121214] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff] resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#86868b]">
                Core skills to master along the way
              </label>
              <input
                type="text"
                value={skillsToDevelop}
                onChange={(e) => setSkillsToDevelop(e.target.value)}
                placeholder="e.g. System architecture, AI engineering, communication, execution speed"
                className="w-full bg-[#121214] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#86868b]">
                What does true success mean to you?
              </label>
              <input
                type="text"
                value={successDefinition}
                onChange={(e) => setSuccessDefinition(e.target.value)}
                placeholder="e.g. Creative autonomy, deep technical mastery, and meaningful work."
                className="w-full bg-[#121214] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff]"
              />
            </div>
          </div>
        )}

        {/* STEP 3: GOALS */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-[#f5f5f7]">
                Your Primary Goals
              </h2>
              <p className="text-xs text-[#86868b] mt-1">
                Establish the milestones your future self will monitor.
              </p>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {goals.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#121214] text-center text-xs text-[#6e6e73]">
                  No goals added yet. Type below to create your first goal.
                </div>
              ) : (
                goals.map((g, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#121214] border border-white/[0.06] flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-[#f5f5f7]">{g.title}</span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-[#86868b]">
                          {g.category}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeGoal(idx)}
                      className="text-[#6e6e73] hover:text-[#ff453a] p-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Goal Bar */}
            <div className="pt-2 border-t border-white/[0.08] flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                placeholder="Add goal..."
                className="flex-1 bg-[#121214] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff]"
                onKeyDown={(e) => e.key === 'Enter' && addGoal()}
              />
              <select
                value={newGoalCategory}
                onChange={(e) => setNewGoalCategory(e.target.value)}
                className="bg-[#121214] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-[#f5f5f7] focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-[#1c1c1e] text-[#f5f5f7]">
                    {c}
                  </option>
                ))}
              </select>
              <button
                onClick={addGoal}
                className="px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-xs font-medium text-[#f5f5f7] flex items-center justify-center space-x-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: FUTURE SELF PERSONALITY */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-[#f5f5f7]">
                Tone & Voice of Your Future Self
              </h2>
              <p className="text-xs text-[#86868b] mt-1">
                Customize how your future self communicates and guides you.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#86868b]">
                Persona Name / Identity
              </label>
              <input
                type="text"
                value={personaName}
                onChange={(e) => setPersonaName(e.target.value)}
                placeholder="e.g. Future Victor, Senior Lead"
                className="w-full bg-[#121214] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#f5f5f7] focus:outline-none focus:border-[#0a84ff]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-[#86868b]">
                Select Personality Traits
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {personalityOptions.map((opt) => {
                  const isSelected = selectedTraits.includes(opt.label);
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => toggleTrait(opt.label)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-[#242426] border-[#0a84ff] text-[#f5f5f7]'
                          : 'bg-[#121214] border-white/[0.06] text-[#86868b] hover:bg-[#1a1a1c]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold">{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#0a84ff]" />}
                      </div>
                      <p className="text-[11px] text-[#6e6e73] leading-relaxed">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation Buttons */}
        <div className="mt-8 pt-4 border-t border-white/[0.08] flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-xs font-medium text-[#f5f5f7] flex items-center space-x-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={() => {
                if (step === 1 && !name.trim()) {
                  alert('Please enter your name.');
                  return;
                }
                setStep(step + 1);
              }}
              className="px-6 py-2.5 rounded-xl bg-[#0a84ff] hover:bg-[#0071e3] text-white text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl bg-[#0a84ff] hover:bg-[#0071e3] text-white text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Complete Setup</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
