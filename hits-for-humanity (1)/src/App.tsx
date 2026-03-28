import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Heart, 
  ChevronRight, 
  CheckCircle2, 
  Loader2,
  ExternalLink,
  IndianRupee,
  ShieldCheck,
  Lock,
  ArrowLeft,
  Users
} from 'lucide-react';
import { fetchIPLMatches } from './services/gemini';
import { Match, Prediction } from './types';
import { cn } from './lib/utils';

export default function App() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');
  const [isDonating, setIsDonating] = useState(false);
  const [donationSuccess, setDonationSuccess] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const allMatchesPredicted = matches.length > 0 && Object.keys(predictions).length === matches.length;

  useEffect(() => {
    async function loadMatches() {
      try {
        const data = await fetchIPLMatches();
        setMatches(data);
      } catch (error) {
        console.error("Failed to load matches:", error);
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, []);

  const handlePredict = (matchId: number, team: string) => {
    setPredictions(prev => {
      const newPredictions = { ...prev };
      if (newPredictions[matchId] === team) {
        delete newPredictions[matchId];
      } else {
        newPredictions[matchId] = team;
      }
      return newPredictions;
    });
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) {
      alert("Please enter your email for the donation receipt.");
      return;
    }
    setIsDonating(true);

    try {
      await fetch('/api/notify-donation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail }),
      });

      setDonationSuccess(true);
      const stanfordGivingUrl = `https://give.stanford.edu/fund?kwoDCFilter=KDC-3VA2AK7&kwoDCPreselect=KDC-3VA2AK7`;
      
      setTimeout(() => {
        window.open(stanfordGivingUrl, '_blank');
        setIsDonating(false);
        setTimeout(() => setDonationSuccess(false), 5000);
      }, 1500);
    } catch (error) {
      console.error("Donation notification failed:", error);
      setIsDonating(false);
      alert("Something went wrong. Please try again.");
    }
  };

  const progress = matches.length > 0 ? (Object.keys(predictions).length / matches.length) * 100 : 0;
  const isBracketComplete = matches.length > 0 && Object.keys(predictions).length === matches.length;

  const handleSubmitBracket = async () => {
    if (!isBracketComplete) return;
    if (!userEmail) {
      alert("Please enter your email in the donation section first so we can identify your bracket.");
      const donateSection = document.getElementById('donate');
      donateSection?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/submit-bracket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, predictions }),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        throw new Error("Failed to submit");
      }
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Failed to submit bracket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAdminView) {
    return <AdminPage onBack={() => setIsAdminView(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header */}
      <header className="border-b border-[#141414] sticky top-0 bg-[#E4E3E0]/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            <h1 className="font-serif italic text-xl tracking-tight">Hits for Humanity</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2">
              <div className="w-32 h-2 bg-[#141414]/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-[#141414]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-mono opacity-50">{Object.keys(predictions).length}/{matches.length}</span>
            </div>
            <a 
              href="#donate" 
              className="bg-[#141414] text-[#E4E3E0] px-4 py-1.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Heart className="w-4 h-4" />
              Support HAI
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Match List */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex items-baseline justify-between mb-8 border-b border-[#141414]/10 pb-4">
                <h2 className="text-4xl font-serif italic">Full Season Schedule</h2>
                <p className="text-sm font-mono opacity-50 uppercase tracking-widest">Regular Season 2026</p>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-50">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p className="font-mono text-xs uppercase tracking-widest">Fetching Schedule...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {matches.map((match, idx) => (
                    <motion.div 
                      key={match.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group border border-[#141414] p-6 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all duration-300"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-mono opacity-50 group-hover:opacity-70">
                            <Calendar className="w-3 h-3" />
                            {match.date}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-mono opacity-50 group-hover:opacity-70">
                            <MapPin className="w-3 h-3" />
                            {match.venue}
                          </div>
                        </div>

                        <div className="md:col-span-2 flex items-center justify-between gap-4">
                          <button 
                            onClick={() => handlePredict(match.id, match.team1)}
                            className={cn(
                              "flex-1 p-3 border border-[#141414] text-center transition-all font-medium",
                              predictions[match.id] === match.team1 
                                ? "bg-[#141414] text-[#E4E3E0] group-hover:bg-[#E4E3E0] group-hover:text-[#141414] group-hover:border-[#E4E3E0]" 
                                : "opacity-40 hover:opacity-100 hover:bg-[#141414]/5 group-hover:border-[#E4E3E0]/30 group-hover:text-[#E4E3E0]/50 group-hover:hover:text-[#E4E3E0]"
                            )}
                          >
                            <span>{match.team1}</span>
                          </button>
                          <span className="font-serif italic opacity-30">vs</span>
                          <button 
                            onClick={() => handlePredict(match.id, match.team2)}
                            className={cn(
                              "flex-1 p-3 border border-[#141414] text-center transition-all font-medium",
                              predictions[match.id] === match.team2 
                                ? "bg-[#141414] text-[#E4E3E0] group-hover:bg-[#E4E3E0] group-hover:text-[#141414] group-hover:border-[#E4E3E0]" 
                                : "opacity-40 hover:opacity-100 hover:bg-[#141414]/5 group-hover:border-[#E4E3E0]/30 group-hover:text-[#E4E3E0]/50 group-hover:hover:text-[#E4E3E0]"
                            )}
                          >
                            <span>{match.team2}</span>
                          </button>
                        </div>

                        <div className="flex justify-end">
                          {predictions[match.id] ? (
                            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-tighter">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              Selected
                            </div>
                          ) : (
                            <div className="text-xs font-mono uppercase tracking-tighter opacity-30">
                              Pending
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            <div className="mt-12 flex flex-col items-center gap-6">
              <div className="w-full h-px bg-[#141414]/10" />
              
              <div className="text-center space-y-4">
                <p className="text-xs font-mono uppercase tracking-widest opacity-50">
                  {allMatchesPredicted ? "Bracket Complete" : `${matches.length - Object.keys(predictions).length} Matches Remaining`}
                </p>
                <button 
                  onClick={handleSubmitBracket}
                  disabled={!allMatchesPredicted || isSubmitting || submitSuccess}
                  className={cn(
                    "px-12 py-6 font-bold uppercase tracking-[0.3em] text-sm transition-all border-2",
                    allMatchesPredicted && !submitSuccess
                      ? "bg-[#141414] text-[#E4E3E0] border-[#141414] hover:bg-transparent hover:text-[#141414]" 
                      : "opacity-20 cursor-not-allowed border-[#141414]"
                  )}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : submitSuccess ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Submitted</span>
                    </div>
                  ) : (
                    "Submit Bracket"
                  )}
                </button>
                {submitSuccess && (
                  <p className="text-[10px] font-mono text-green-600 uppercase tracking-widest mt-2">
                    Your predictions have been saved!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar / Donation */}
          <div className="space-y-8">
            <section id="donate" className="sticky top-28">
              <div className="border border-[#141414] bg-[#141414] text-[#E4E3E0] p-8 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[#E4E3E0]/60">
                    <Heart className="w-4 h-4 fill-current" />
                    <span className="text-xs font-mono uppercase tracking-widest">Philanthropy</span>
                  </div>
                  <h3 className="text-3xl font-serif italic">Support HAI</h3>
                  <p className="text-sm leading-relaxed opacity-70">
                    Stanford University: Human-Centered Artificial Intelligence (HAI) works to advance AI research, education, policy, and practice to improve the human condition.
                  </p>
                </div>

                <form onSubmit={handleDonate} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest opacity-50">Your Email</label>
                    <input 
                      type="email" 
                      required
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full bg-transparent border border-[#E4E3E0]/20 p-4 focus:border-[#E4E3E0] outline-none transition-colors font-mono text-sm"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="p-4 bg-[#E4E3E0]/5 border border-[#E4E3E0]/10 text-xs leading-relaxed opacity-70 italic">
                    To be considered in the challenge, please send your donation receipt to <strong>arjunmadaan29@gmail.com</strong> after completing your gift on the Stanford site.
                  </div>

                  <button 
                    disabled={isDonating || donationSuccess}
                    className="w-full bg-[#E4E3E0] text-[#141414] py-4 font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    {isDonating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : donationSuccess ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      'Proceed to Stanford Giving'
                    )}
                  </button>
                </form>

                <div className="pt-6 border-t border-[#E4E3E0]/10 flex items-center justify-between text-[10px] font-mono opacity-50 uppercase tracking-widest">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Secure Transaction
                  </div>
                  <a href="https://hai.stanford.edu" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:opacity-100 transition-opacity">
                    HAI.STANFORD.EDU
                    <ExternalLink className="w-2 h-2" />
                  </a>
                </div>
              </div>

              {/* Stats Card */}
              <div className="mt-8 border border-[#141414] p-6 space-y-6 bg-white shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
                <div className="space-y-4">
                  <h4 className="font-serif italic text-lg">Prediction Stats</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-mono uppercase opacity-50">Completion</span>
                      <span className="text-xl font-mono">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-1 bg-[#141414]/10">
                      <motion.div 
                        className="h-full bg-[#141414]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSubmitBracket}
                  disabled={!isBracketComplete || isSubmitting || submitSuccess}
                  className={cn(
                    "w-full py-4 font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2",
                    isBracketComplete 
                      ? "bg-[#141414] text-[#E4E3E0] hover:scale-[1.02] active:scale-[0.98]" 
                      : "bg-[#141414]/10 text-[#141414]/30 cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : submitSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Bracket Submitted
                    </>
                  ) : (
                    'Submit Bracket'
                  )}
                </button>
                
                {!isBracketComplete && (
                  <p className="text-[9px] font-mono uppercase opacity-40 text-center">
                    Complete all {matches.length} matches to submit
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#141414] py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            <span className="font-serif italic">Hits for Humanity</span>
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-30">
            Created for the 2026 Season &bull; Supporting Stanford HAI
          </p>
          <div className="flex gap-8">
            <button 
              onClick={() => setIsAdminView(true)}
              className="text-[10px] font-mono uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity flex items-center gap-1"
            >
              <Users className="w-3 h-3" />
              Admin
            </button>
            <a href="#" className="text-[10px] font-mono uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity">Terms</a>
            <a href="#" className="text-[10px] font-mono uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity">Privacy</a>
          </div>
        </div>
      </footer>

      {/* Success Toast */}
      <AnimatePresence>
        {(donationSuccess || submitSuccess) && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-2xl z-[100] flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">
              {donationSuccess ? "Thank you for your contribution to HAI!" : "Bracket submitted successfully!"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminPage({ onBack }: { onBack: () => void }) {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/submissions', {
        headers: { 'x-admin-password': password }
      });
      const data = await response.json();
      if (data.success) {
        setSubmissions(data.submissions);
        setIsAuthenticated(true);
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans">
      {!isAuthenticated ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center space-y-2">
              <Trophy className="w-12 h-12 mx-auto opacity-20" />
              <h2 className="font-serif italic text-3xl">Admin Access</h2>
              <p className="text-xs font-mono uppercase tracking-widest opacity-50">Hits for Humanity</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Admin Password"
                className="w-full bg-transparent border-b-2 border-[#141414]/20 p-4 focus:border-[#141414] outline-none transition-colors font-mono text-center"
              />
              <button 
                className="w-full bg-[#141414] text-[#E4E3E0] py-4 font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-opacity"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Login'}
              </button>
              {error && <p className="text-center text-red-600 text-[10px] font-mono uppercase tracking-widest">{error}</p>}
            </form>
            <button onClick={onBack} className="w-full text-[10px] font-mono uppercase tracking-widest opacity-30 hover:opacity-100">Back to Site</button>
          </div>
        </div>
      ) : (
        <div className="p-8">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="flex justify-between items-end border-b border-[#141414]/10 pb-8">
              <div className="space-y-2">
                <h2 className="font-serif italic text-5xl">Submissions</h2>
                <p className="text-xs font-mono uppercase tracking-widest opacity-50">{submissions.length} Total Brackets</p>
              </div>
              <button onClick={onBack} className="text-[10px] font-mono uppercase tracking-widest border border-[#141414] px-4 py-2 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all">Exit Admin</button>
            </div>

            <div className="grid gap-6">
              {submissions.map((sub, i) => (
                <div key={i} className="bg-white/50 border border-[#141414]/5 p-8 hover:border-[#141414]/20 transition-all group">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest opacity-40 mb-1">User Email</p>
                      <p className="font-medium text-lg">{sub.userEmail}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-mono uppercase tracking-widest opacity-40 mb-1">Submitted At</p>
                      <p className="font-mono text-xs">{new Date(sub.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Object.entries(sub.predictions).map(([matchId, team]: [any, any]) => (
                      <div key={matchId} className="p-3 border border-[#141414]/10 rounded">
                        <p className="text-[8px] font-mono uppercase opacity-40 mb-1">Match {matchId}</p>
                        <p className="text-xs font-bold">{team}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {submissions.length === 0 && (
                <p className="text-center py-24 font-mono text-xs uppercase tracking-widest opacity-30">No submissions yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
