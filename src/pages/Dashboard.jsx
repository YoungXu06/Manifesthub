import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiCalendar, FiCheck, FiPlus, FiStar, FiHeart,
  FiChevronLeft, FiChevronRight, FiBookmark, FiTrendingUp, FiLoader,
  FiZap, FiSun, FiMoon, FiCloud, FiSmile, FiEdit3, FiTarget,
} from 'react-icons/fi';
import useStore from '../store';
import IndexNotification from '../components/IndexNotification';
import { ToastContainer } from '../components/Toast';
import useToast from '../hooks/useToast';

/* ─── Affirmations ─── */
const AFFIRMATIONS = [
  { text: "I am worthy of my dreams and goals.", visualization: "Imagine yourself achieving your biggest dream. How does it feel?", emoji: "✨" },
  { text: "Every day, I am moving closer to my goals.", visualization: "See yourself taking small, meaningful actions today.", emoji: "🎯" },
  { text: "I have the power to create change in my life.", visualization: "Visualize the positive changes you want to create.", emoji: "⚡" },
  { text: "I attract success and abundance into my life.", visualization: "Imagine abundance flowing effortlessly into your life.", emoji: "🌟" },
  { text: "My potential is unlimited, and I can achieve anything.", visualization: "See yourself easily overcoming any obstacle.", emoji: "🦋" },
];

/* ─── Moods ─── */
const MOODS = [
  { icon: '😊', label: 'Great', color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
  { icon: '😌', label: 'Good',  color: 'text-blue-500 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
  { icon: '😐', label: 'Okay',  color: 'text-amber-500 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
  { icon: '😔', label: 'Low',   color: 'text-purple-500 dark:text-purple-400',bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' },
];

/* ─── Helpers ─── */
function toDateStr(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function isSameDay(a, b) { return toDateStr(a) === toDateStr(b); }
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', icon: <FiSun className="text-amber-400" /> };
  if (h < 17) return { text: 'Good afternoon', icon: <FiCloud className="text-blue-400" /> };
  return { text: 'Good evening', icon: <FiMoon className="text-indigo-400" /> };
}

/* ─── Stat Card ─── */
const StatCard = ({ icon, label, value, colorClass, bgClass }) => (
  <div className="stat-card group transition-all hover:shadow-md hover:-translate-y-0.5">
    <div className={`p-2.5 rounded-xl ${bgClass}`}>
      <span className={`text-lg ${colorClass}`}>{icon}</span>
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none mt-0.5">{value}</p>
    </div>
  </div>
);

/* ─── Gratitude entry ─── */
const GratitudeEntry = ({ entry }) => (
  <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:shadow-sm transition-shadow">
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-xs text-gray-400 flex items-center gap-1">
        <FiCalendar className="h-3 w-3" />{entry.formattedDate}
      </span>
      <FiHeart className="h-3 w-3 text-pink-400" />
    </div>
    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap line-clamp-3">
      {entry.gratitude || entry.content}
    </p>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   Dashboard
══════════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const { t } = useTranslation();
  const {
    user, visionBoard, fetchVisionBoard,
    streakCount, lastCheckIn,
    fetchMonthCalendarData, fetchRecentGratitude,
    addCheckIn,                       // legacy — kept for compat
    saveDailyLog, fetchDailyLog, fetchMonthDailyLogs,
  } = useStore();

  const { toasts, removeToast, showSuccess, showError } = useToast();
  const greeting = getGreeting();

  /* ── calendar state ── */
  const [currentDate, setCurrentDate]   = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  /* ── month logs map:  { "YYYY-MM-DD": { mood, intention, gratitude, checkIn } } ── */
  const [monthLogs, setMonthLogs] = useState({});

  /* ── current selected-day log ── */
  const [dayLog, setDayLog] = useState({ mood: null, intention: null, gratitude: '', checkIn: false });

  /* ── loading flags ── */
  const [isLoading, setIsLoading]             = useState(true);
  const [checkInLoading, setCheckInLoading]   = useState(false);
  const [savingGratitude, setSavingGratitude] = useState(false);
  const [savingIntention, setSavingIntention] = useState(false);
  const [showIntentionInput, setShowIntentionInput] = useState(false);
  const [intentionDraft, setIntentionDraft]   = useState('');

  /* ── recent entries for "Recent Gratitude" list ── */
  const [recentEntries, setRecentEntries] = useState([]);

  /* ── affirmation carousel ── */
  const [affirmIdx, setAffirmIdx] = useState(0);
  const affirmTimer = useRef(null);

  /* ── derived ── */
  const todayStr    = toDateStr(new Date());
  const selectedStr = toDateStr(selectedDate);
  const isToday     = selectedStr === todayStr;

  /* ════════════════════════════ init load ════════════════════════════ */
  useEffect(() => {
    const load = async () => {
      await fetchVisionBoard();
      await loadMonth(currentDate.getFullYear(), currentDate.getMonth() + 1);
      await loadRecentEntries();
      setIsLoading(false);
    };
    load();

    affirmTimer.current = setInterval(() => setAffirmIdx(p => (p + 1) % AFFIRMATIONS.length), 5500);
    return () => clearInterval(affirmTimer.current);
  }, []);

  /* ════════════════════════════ month change ════════════════════════════ */
  useEffect(() => {
    loadMonth(currentDate.getFullYear(), currentDate.getMonth() + 1);
  }, [currentDate]);

  /* ════════════════════════════ selected date change ════════════════════════════ */
  useEffect(() => {
    const log = monthLogs[selectedStr] || { mood: null, intention: null, gratitude: '', checkIn: false };
    setDayLog(log);
    setIntentionDraft(log.intention || '');
    setShowIntentionInput(false);
  }, [selectedStr, monthLogs]);

  /* ─── loaders ─── */
  async function loadMonth(year, month) {
    const { logs } = await fetchMonthDailyLogs(year, month);
    // Also merge legacy data (checkIns + gratitudeEntries) for backward compat
    const { data: legacyData } = await fetchMonthCalendarData(year, month);
    const merged = { ...logs };
    Object.entries(legacyData || {}).forEach(([dateStr, v]) => {
      if (!merged[dateStr]) merged[dateStr] = {};
      if (v.checkIn)   merged[dateStr].checkIn   = merged[dateStr].checkIn   || true;
      if (v.gratitude) merged[dateStr].gratitude = merged[dateStr].gratitude || v.gratitude;
    });
    setMonthLogs(merged);
  }

  async function loadRecentEntries() {
    const { entries } = await fetchRecentGratitude(7);
    setRecentEntries(entries || []);
  }

  /* ════════════════════════════ actions ════════════════════════════ */
  const handleCheckIn = async () => {
    if (checkInLoading || dayLog.checkIn) return;
    setCheckInLoading(true);
    // Optimistic
    const updated = { ...dayLog, checkIn: true };
    setDayLog(updated);
    setMonthLogs(prev => ({ ...prev, [selectedStr]: updated }));
    try {
      const result = await saveDailyLog(selectedDate, { checkIn: true });
      if (result.success) {
        showSuccess(t('dashboard.checkInSuccess'), 2000);
      } else {
        setDayLog(prev => ({ ...prev, checkIn: false }));
        showError(result.error || t('dashboard.checkInFailed'));
      }
    } catch {
      setDayLog(prev => ({ ...prev, checkIn: false }));
      showError(t('dashboard.checkInError'));
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleSaveMood = async (moodLabel) => {
    const updated = { ...dayLog, mood: moodLabel };
    setDayLog(updated);
    setMonthLogs(prev => ({ ...prev, [selectedStr]: updated }));
    await saveDailyLog(selectedDate, { mood: moodLabel });
    showSuccess('Mood saved ✨', 1500);
  };

  const handleSaveIntention = async () => {
    if (!intentionDraft.trim()) return;
    setSavingIntention(true);
    const updated = { ...dayLog, intention: intentionDraft.trim() };
    setDayLog(updated);
    setMonthLogs(prev => ({ ...prev, [selectedStr]: updated }));
    setShowIntentionInput(false);
    const result = await saveDailyLog(selectedDate, { intention: intentionDraft.trim() });
    setSavingIntention(false);
    if (result.success) showSuccess("Intention set 🎯", 1800);
    else showError('Failed to save intention');
  };

  const handleSaveGratitude = async () => {
    if (!dayLog.gratitude?.trim() || savingGratitude) return;
    setSavingGratitude(true);
    const result = await saveDailyLog(selectedDate, { gratitude: dayLog.gratitude.trim() });
    setSavingGratitude(false);
    if (result.success) {
      setMonthLogs(prev => ({ ...prev, [selectedStr]: { ...dayLog } }));
      showSuccess(t('dashboard.gratitudeSaved'), 2000);
      await loadRecentEntries();
    } else {
      showError(result.error || t('dashboard.gratitudeSaveFailed'));
    }
  };

  /* ── calendar helpers ── */
  const getMonthName = d => d.toLocaleString('default', { month: 'long', year: 'numeric' });
  const getCalendarDays = () => {
    const year = currentDate.getFullYear(), month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++)
      days.unshift({ date: new Date(year, month, 0 - i), isCurrentMonth: false });
    for (let i = 1; i <= lastDay.getDate(); i++)
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    const rem = 42 - days.length;
    for (let i = 1; i <= rem; i++)
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    return days;
  };

  const stats = [
    { icon: <FiBookmark />,  label: t('dashboard.visionItems'), value: visionBoard.length, colorClass: 'text-indigo-500', bgClass: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { icon: <FiTrendingUp />,label: t('dashboard.inProgress'),  value: visionBoard.filter(v => !v.completed).length, colorClass: 'text-blue-500', bgClass: 'bg-blue-50 dark:bg-blue-900/20' },
    { icon: <FiCheck />,     label: t('dashboard.completed'),   value: visionBoard.filter(v => v.completed).length,  colorClass: 'text-emerald-500', bgClass: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { icon: <FiZap />,       label: t('dashboard.currentStreak'),value: streakCount, colorClass: 'text-amber-500', bgClass: 'bg-amber-50 dark:bg-amber-900/20' },
  ];

  if (isLoading) return (
    <div className="flex flex-col justify-center items-center h-64 gap-3">
      <div className="w-10 h-10 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading your manifestation hub…</p>
    </div>
  );

  const aff = AFFIRMATIONS[affirmIdx];

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <IndexNotification />

      {/* ── Welcome ── */}
      <div className="mb-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">{greeting.icon}<span className="text-sm font-medium text-gray-500 dark:text-gray-400">{greeting.text}</span></div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user?.displayName || 'Manifestor'} ✨</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('dashboard.manifestationJourney')}</p>
        </div>
        {streakCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800/50 shadow-sm">
            <span className="text-xl">🔥</span>
            <div><p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Day Streak</p><p className="text-xl font-bold text-amber-700 dark:text-amber-300 leading-none">{streakCount}</p></div>
          </div>
        )}
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ────── LEFT ────── */}
        <div className="lg:col-span-1 flex flex-col gap-5">

          {/* Affirmation carousel */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-5 shadow-lg shadow-purple-500/20 min-h-[200px] flex flex-col">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8 blur-2xl pointer-events-none" />
            <h2 className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-4 relative z-10">✨ Daily Affirmation</h2>
            <div className="flex-1 relative z-10">
              {AFFIRMATIONS.map((a, i) => (
                <div key={i} className="absolute inset-0 flex flex-col justify-center transition-opacity duration-700"
                  style={{ opacity: i === affirmIdx ? 1 : 0, pointerEvents: i === affirmIdx ? 'auto' : 'none' }}>
                  <p className="text-3xl mb-2">{a.emoji}</p>
                  <p className="text-white font-semibold text-base leading-snug mb-3 italic">"{a.text}"</p>
                  <p className="text-white/70 text-xs leading-relaxed">{a.visualization}</p>
                </div>
              ))}
            </div>
            <div className="relative z-10 flex gap-1.5 mt-auto pt-8">
              {AFFIRMATIONS.map((_, i) => (
                <button key={i} onClick={() => setAffirmIdx(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === affirmIdx ? 'bg-white w-5' : 'bg-white/35 w-1.5'}`} />
              ))}
            </div>
          </div>

          {/* Mood */}
          <div className="card p-5">
            <h2 className="section-title mb-1 flex items-center gap-2"><FiSmile className="text-purple-500" />How are you feeling?</h2>
            <p className="text-xs text-gray-400 mb-1">{isToday ? 'Today' : selectedDate.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</p>
            <div className="grid grid-cols-4 gap-2">
              {MOODS.map(mood => (
                <button key={mood.label} onClick={() => isToday && handleSaveMood(mood.label)}
                  disabled={!isToday}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${
                    dayLog.mood === mood.label
                      ? `${mood.bg} ring-2 ring-offset-1 ring-indigo-400 scale-105`
                      : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  } ${!isToday ? 'opacity-60 cursor-default' : ''}`}>
                  <span className="text-2xl leading-none">{mood.icon}</span>
                  <span className={`text-xs font-medium ${dayLog.mood === mood.label ? mood.color : 'text-gray-500 dark:text-gray-400'}`}>{mood.label}</span>
                </button>
              ))}
            </div>
            {dayLog.mood && !isToday && <p className="mt-2 text-xs text-center text-gray-400">Feeling {dayLog.mood} on this day</p>}
            {dayLog.mood && isToday && <p className="mt-2 text-xs text-center text-indigo-500 dark:text-indigo-400 font-medium">✓ Feeling {dayLog.mood} — your energy is noted</p>}
          </div>

          {/* Intention */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title flex items-center gap-2"><FiTarget className="text-indigo-500" />
                {isToday ? "Today's Intention" : `Intention for ${selectedDate.toLocaleDateString('en-US',{month:'short',day:'numeric'})}`}
              </h2>
              {isToday && !showIntentionInput && (
                <button onClick={() => { setIntentionDraft(dayLog.intention || ''); setShowIntentionInput(true); }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-indigo-500 transition-colors">
                  <FiEdit3 className="w-4 h-4" />
                </button>
              )}
            </div>
            {showIntentionInput ? (
              <div className="space-y-2">
                <input autoFocus value={intentionDraft} onChange={e => setIntentionDraft(e.target.value)}
                  onKeyDown={e => { if (e.key==='Enter') handleSaveIntention(); if (e.key==='Escape') setShowIntentionInput(false); }}
                  placeholder="I intend to…" className="input w-full text-sm" maxLength={100} />
                <div className="flex gap-2">
                  <button onClick={handleSaveIntention} disabled={savingIntention}
                    className="btn btn-primary btn-sm flex-1 text-xs">
                    {savingIntention ? <FiLoader className="animate-spin" /> : 'Set Intention'}
                  </button>
                  <button onClick={() => setShowIntentionInput(false)} className="btn btn-secondary btn-sm text-xs">Cancel</button>
                </div>
              </div>
            ) : dayLog.intention ? (
              <div className="flex items-start gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                <span className="text-lg">🎯</span>
                <p className="text-sm text-indigo-700 dark:text-indigo-300 italic">"{dayLog.intention}"</p>
              </div>
            ) : (
              <button onClick={() => isToday && setShowIntentionInput(true)} disabled={!isToday}
                className={`w-full flex items-center gap-2 p-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-sm text-gray-400 transition-all ${isToday ? 'hover:border-indigo-300 hover:text-indigo-400' : 'opacity-50 cursor-default'}`}>
                <FiPlus className="w-4 h-4" />
                {isToday ? 'Set your intention for today' : 'No intention recorded'}
              </button>
            )}
          </div>

          {/* Vision quick-links */}
          <div className="card overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800/30 border-b border-gray-100 dark:border-gray-700/50">
              <h2 className="section-title flex items-center gap-2"><FiBookmark className="text-indigo-500" />{t('dashboard.visionOverview')}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {visionBoard.length > 0
                  ? `${visionBoard.filter(v=>v.completed).length} of ${visionBoard.length} visions manifested`
                  : 'Your vision board is empty'}
              </p>
            </div>
            {visionBoard.length > 0 && (
              <div className="px-5 pt-3">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                  <span>Overall progress</span>
                  <span className="font-medium text-indigo-600 dark:text-indigo-400">
                    {Math.round(visionBoard.reduce((a,v)=>a+(v.progress||0),0)/visionBoard.length)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                    style={{width:`${Math.round(visionBoard.reduce((a,v)=>a+(v.progress||0),0)/visionBoard.length)}%`}}/>
                </div>
              </div>
            )}
            <div className="p-5 pt-2 flex flex-col gap-2.5">
              <Link to="/visionboard" className="btn btn-secondary btn-sm flex items-center justify-center gap-2 text-sm">
                <FiBookmark className="w-4 h-4" />{t('dashboard.viewAll')}
              </Link>
              <Link to="/visionboard" className="btn btn-primary btn-sm flex items-center justify-center gap-2 text-sm">
                <FiPlus className="w-4 h-4" />{t('dashboard.createVisionCard')}
              </Link>
            </div>
          </div>
        </div>

        {/* ────── RIGHT ────── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Calendar */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title flex items-center gap-2"><FiCalendar className="text-indigo-500" />{t('dashboard.calendarAndProgress')}</h2>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()-1))}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
                  <FiChevronLeft className="h-4 w-4"/>
                </button>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 px-2 min-w-[140px] text-center">{getMonthName(currentDate)}</span>
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()+1))}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
                  <FiChevronRight className="h-4 w-4"/>
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=>(
                <div key={d} className="text-center text-xs font-semibold text-gray-400 dark:text-gray-500 py-1">{d}</div>
              ))}
            </div>

            {/* Cells */}
            <div className="grid grid-cols-7 gap-0.5 mb-4">
              {getCalendarDays().map((day, i) => {
                const ds  = toDateStr(day.date);
                const log = monthLogs[ds] || {};
                const isT = ds === todayStr;
                const isSel = ds === selectedStr;
                return (
                  <button key={i} onClick={() => setSelectedDate(day.date)}
                    className={`relative flex flex-col items-center justify-center aspect-square rounded-xl text-xs font-medium transition-all ${
                      !day.isCurrentMonth ? 'text-gray-300 dark:text-gray-700'
                      : isSel ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-300 dark:shadow-indigo-900'
                      : isT   ? 'ring-2 ring-indigo-400 ring-offset-1 dark:ring-offset-gray-900 text-indigo-600 dark:text-indigo-400 font-bold'
                      :         'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                    }`}>
                    <span>{day.date.getDate()}</span>
                    <div className="absolute bottom-0.5 flex gap-0.5">
                      {log.checkIn   && <span className={`w-1.5 h-1.5 rounded-full ${isSel?'bg-white/80':'bg-emerald-400'}`}/>}
                      {log.gratitude && <span className={`w-1.5 h-1.5 rounded-full ${isSel?'bg-white/60':'bg-purple-400'}`}/>}
                      {log.mood      && <span className={`w-1.5 h-1.5 rounded-full ${isSel?'bg-white/50':'bg-amber-400'}`}/>}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-5 text-xs text-gray-400 border-t border-gray-100 dark:border-gray-700/50 pt-3 mb-4">
              {[['bg-emerald-400','Check-in'],['bg-purple-400','Gratitude'],['bg-amber-400','Mood']].map(([c,l])=>(
                <div key={l} className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${c}`}/>{l}</div>
              ))}
            </div>

            {/* Date label */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {isToday ? '📅 Today' : selectedDate.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}
              </p>
            </div>

            {/* Check-in */}
            {isToday ? (
              <div className="border-t border-gray-100 dark:border-gray-700/50 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <FiZap className="text-amber-400"/>{t('dashboard.dailyCheckIn')}
                  </h3>
                  {streakCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 font-medium">
                      🔥 {streakCount} day streak
                    </span>
                  )}
                </div>
                {dayLog.checkIn ? (
                  <div className="flex items-center gap-3 p-3.5 bg-emerald-50 dark:bg-emerald-900/15 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm"><FiCheck className="w-4 h-4 text-white"/></div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{t('dashboard.checkedInToday')}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">{t('dashboard.keepUpGoodWork')}</p>
                    </div>
                  </div>
                ) : (
                  <button onClick={handleCheckIn} disabled={checkInLoading}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                      checkInLoading ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-500/25 hover:shadow-lg hover:-translate-y-0.5'
                    }`}>
                    {checkInLoading ? <><FiLoader className="animate-spin"/> Checking in…</> : <><FiZap className="w-4 h-4"/>{t('dashboard.checkInNow')}</>}
                  </button>
                )}
              </div>
            ) : (
              <div className="border-t border-gray-100 dark:border-gray-700/50 pt-4">
                {dayLog.checkIn
                  ? <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium"><FiCheck className="w-4 h-4"/> Checked in this day</div>
                  : <p className="text-sm text-gray-400">No check-in recorded for this day</p>}
              </div>
            )}
          </div>

          {/* Gratitude Journal */}
          <div className="card p-5">
            <h2 className="section-title mb-1 flex items-center gap-2">
              <FiHeart className="text-pink-500"/>{t('dashboard.gratitudeJournal')}
              {!isToday && <span className="text-xs font-normal text-gray-400 ml-1">· {selectedDate.toLocaleDateString()}</span>}
            </h2>
            <p className="text-xs text-gray-400 mb-4">Gratitude raises your vibration and amplifies your manifestation power.</p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 uppercase tracking-wider">
                {isToday ? '✨ Today I am grateful for...' : `Grateful for on ${selectedDate.toLocaleDateString()}...`}
              </label>
              <textarea
                value={dayLog.gratitude || ''}
                onChange={e => setDayLog(prev => ({ ...prev, gratitude: e.target.value }))}
                rows={4}
                className="input w-full resize-none text-sm leading-relaxed"
                placeholder={isToday
                  ? "Write 3 things you're grateful for today…"
                  : "What were you grateful for on this day?"}
              />
              <div className="flex justify-between items-center mt-2.5">
                <span className="text-xs text-gray-400">
                  {monthLogs[selectedStr]?.gratitude ? '✓ Saved' : 'Unsaved'}
                </span>
                <button onClick={handleSaveGratitude}
                  disabled={!dayLog.gratitude?.trim() || savingGratitude}
                  className={`btn btn-sm text-xs font-semibold transition-all ${
                    !dayLog.gratitude?.trim() || savingGratitude
                      ? 'btn-disabled bg-gray-100 dark:bg-gray-800 text-gray-400'
                      : 'btn-primary shadow-sm hover:shadow-md hover:shadow-indigo-500/20'
                  }`}>
                  {savingGratitude
                    ? <><FiLoader className="animate-spin mr-1.5 w-3 h-3"/>Saving…</>
                    : <><FiHeart className="mr-1.5 w-3 h-3"/>
                        {monthLogs[selectedStr]?.gratitude ? t('dashboard.updateGratitude') : t('dashboard.saveGratitude')}
                      </>}
                </button>
              </div>
            </div>

            {/* Recent entries */}
            {recentEntries.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FiStar className="text-amber-400 w-3.5 h-3.5"/>{t('dashboard.recentGratitude')}
                </h3>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                  {recentEntries.map((entry, i) => <GratitudeEntry key={i} entry={entry}/>)}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
