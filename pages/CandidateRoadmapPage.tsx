
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { generateRoadmap } from '../services/geminiService';
import { PageSpinner } from '../components/Spinner';
import { Milestone, Flag, Target, BookOpen, AlertTriangle, Lightbulb } from 'lucide-react';
import type { RoadmapStep } from '../types';

const RoadmapColumn: React.FC<{title: string, plan: RoadmapStep[], icon: React.ReactNode}> = ({title, plan, icon}) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-xl font-semibold mb-4 flex items-center text-slate-800">{icon} <span className="ml-2">{title}</span></h3>
        <div className="space-y-4">
            {plan.map((step, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-indigo-700">{step.title} <span className="text-sm font-normal text-slate-500 ml-2">({step.duration})</span></h4>
                    <p className="text-sm text-slate-600 mt-1">{step.description}</p>
                    <div className="mt-2">
                        <p className="text-xs font-semibold text-slate-500 flex items-center"><BookOpen size={12} className="mr-1"/> Resources:</p>
                        <ul className="list-disc list-inside text-sm text-slate-600 pl-2">
                            {step.resources.map((res, i) => <li key={i} className="text-xs">{res}</li>)}
                        </ul>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const CandidateRoadmapPage: React.FC = () => {
  const { resumeData, careerRoadmap, setCareerRoadmap, isLoading, setLoading, setError, error } = useAppContext();
  const [targetRole, setTargetRole] = useState('Software Engineer');

  const fetchRoadmap = async () => {
    if (!resumeData) {
      setError("Please analyze your resume on the dashboard first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await generateRoadmap(resumeData.skills, targetRole);
      setCareerRoadmap(data);
    } catch (err) {
      setError("Failed to generate roadmap. The AI model might be busy. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (resumeData && !careerRoadmap) {
        fetchRoadmap();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeData, careerRoadmap]);
  

  if (isLoading && !careerRoadmap) return <PageSpinner message="Generating your personalized roadmap..." />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Career Roadmap</h1>
        <p className="text-slate-600 mt-1">Your personalized path to becoming a {careerRoadmap?.targetRole || targetRole}.</p>
      </div>

      <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
        <label htmlFor="targetRole" className="font-semibold">Target Role:</label>
        <input
            id="targetRole"
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
        />
        <button
            onClick={fetchRoadmap}
            disabled={isLoading}
            className="px-5 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition"
        >
            {isLoading ? 'Generating...' : 'Regenerate'}
        </button>
      </div>
      
       {error && <p className="text-red-500 text-sm flex items-center p-4 bg-red-50 border border-red-200 rounded-lg"><AlertTriangle size={16} className="mr-2" />{error}</p>}
       {!process.env.API_KEY && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm flex items-start">
            <Lightbulb size={18} className="mr-2 flex-shrink-0 mt-0.5" />
            <span><strong>Warning:</strong> An API key is not configured. This feature is disabled.</span>
        </div>
        )}

      {careerRoadmap && (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-xl font-semibold mb-2 flex items-center text-slate-800"><Target className="mr-2 text-red-500"/> Skill Gaps Identified</h3>
            <div className="flex flex-wrap gap-2">
                {careerRoadmap.skillGaps.map(gap => <span key={gap} className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded-full">{gap}</span>)}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <RoadmapColumn title="Short-Term Plan (1-3 Months)" plan={careerRoadmap.shortTermPlan} icon={<Flag className="text-green-500"/>} />
            <RoadmapColumn title="Long-Term Plan (6-12 Months)" plan={careerRoadmap.longTermPlan} icon={<Milestone className="text-purple-500"/>} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateRoadmapPage;
