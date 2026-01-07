import React from 'react';
import { useAppContext } from '../context/AppContext';
import { BookText, Calendar, MessageSquare } from 'lucide-react';

const CandidateNotesPage: React.FC = () => {
  const { interviewHistory } = useAppContext();

  // Filter sessions and transcripts to only include items with notes
  const sessionsWithNotes = interviewHistory
    .map(session => ({
      ...session,
      transcript: session.transcript.filter(entry => entry.notes && entry.notes.trim() !== ''),
    }))
    .filter(session => session.transcript.length > 0);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center">
          <BookText size={28} className="mr-3 text-indigo-600" />
          My Interview Notes
        </h1>
        <p className="text-slate-600 mt-1">
          A collection of all the notes you've taken during your practice interviews.
        </p>
      </div>

      {sessionsWithNotes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-200">
          <BookText size={48} className="mx-auto text-slate-400" />
          <h2 className="mt-4 text-xl font-semibold text-slate-700">No Notes Found</h2>
          <p className="mt-2 text-slate-500">
            Notes you take in the text area during an interview will be saved here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sessionsWithNotes.map((session, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-200 mb-4">
                <Calendar size={20} className="text-slate-500" />
                <div>
                  <h2 className="font-semibold text-lg text-slate-800">{session.type}</h2>
                  <p className="text-sm text-slate-500">
                    {new Date(session.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {session.transcript.map((entry, entryIndex) => (
                  <div key={entryIndex} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="font-semibold text-slate-700 flex items-start gap-2">
                      <MessageSquare size={16} className="mt-1 flex-shrink-0 text-indigo-500" />
                      <span>{entry.question}</span>
                    </p>
                    <div className="mt-2 pl-6 border-l-2 border-indigo-200 ml-2">
                      <p className="text-slate-600 whitespace-pre-wrap">{entry.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CandidateNotesPage;
