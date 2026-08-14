import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiPlus, FiFilter, FiSearch, FiX, FiCalendar,
  FiGrid, FiList, FiChevronUp, FiChevronDown, FiLayout,
  FiStar, FiTarget, FiCheck, FiClock, FiZap, FiLock,
} from 'react-icons/fi';
import useStore from '../store';
import EnhancedVisionBoardItem from '../components/visionboard/EnhancedVisionBoardItem';
import VisionBoardListItem from '../components/visionboard/VisionBoardListItem';
import EnhancedVisionBoardItemForm from '../components/visionboard/EnhancedVisionBoardItemForm';
import useToast from '../hooks/useToast';
import useSubscription from '../hooks/useSubscription';
import { useConfirm } from '../hooks/useConfirm.jsx';
import Skeleton from '../components/common/Skeleton';
import { LENS_LEVELS, FREE_TIER_LIMITS } from '../utils/manifestProtocol';
import { isLensCapped } from '../utils/subscription';
import '../styles/timeline.css';

/* ─────────────────────────────────────────────
   Category icon / color map
───────────────────────────────────────────── */
const CATEGORY_META = {
  career:       { emoji: '💼', color: 'from-blue-500 to-sky-400' },
  health:       { emoji: '💪', color: 'from-emerald-500 to-green-400' },
  relationships:{ emoji: '💜', color: 'from-purple-500 to-violet-400' },
  finances:     { emoji: '💰', color: 'from-amber-500 to-yellow-400' },
  personal:     { emoji: '🌟', color: 'from-orange-500 to-amber-400' },
  travel:       { emoji: '✈️', color: 'from-cyan-500 to-teal-400' },
  home:         { emoji: '🏡', color: 'from-lime-500 to-green-400' },
  education:    { emoji: '📚', color: 'from-indigo-500 to-blue-400' },
  spirituality: { emoji: '🧘', color: 'from-violet-500 to-purple-400' },
  general:      { emoji: '⭐', color: 'from-gray-500 to-slate-400' },
};

/* ─────────────────────────────────────────────
   Grid / Mood Board Card
───────────────────────────────────────────── */
const MoodBoardCard = ({ item, onEdit, showSuccess, showError, showWarning }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { deleteVisionBoardItem, updateVisionBoardItem } = useStore();
  const [confirm, confirmEl] = useConfirm();

  const meta = CATEGORY_META[item.category] || CATEGORY_META.general;
  const lensLevel = LENS_LEVELS.find(l => l.id === (item.level || 'month'));
  const progress = item.progress || 0;
  const isCompleted = item.completed || progress === 100;
  const isDue = item.dueDate && new Date(item.dueDate) < new Date() && !isCompleted;

  const handleDelete = async (e) => {
    e.stopPropagation();
    const ok = await confirm({
      title: t('visionboard.confirmDeleteTitle', { defaultValue: 'Delete this vision?' }),
      message: t('visionboard.confirmDeleteMessage', { defaultValue: 'This vision card will be permanently removed.' }),
      confirmLabel: t('common.delete', { defaultValue: 'Delete' }),
      danger: true,
    });
    if (!ok) return;
    try {
      if (item.id.toString().startsWith('goal-')) {
        const result = await useStore.getState().deleteGoal(item.id.replace('goal-', ''));
        if (result.success) showSuccess?.(t('visionboard.visionDeleted'));
        else showError?.(result.error || t('visionboard.failedDelete', { defaultValue: 'Delete failed' }));
      } else {
        const result = await deleteVisionBoardItem(item.id);
        if (result.success) showSuccess?.(t('visionboard.visionDeleted'));
        else showError?.(result.error || t('visionboard.failedDelete', { defaultValue: 'Delete failed' }));
      }
    } catch { showError?.(t('visionboard.deleteError')); }
  };

  const handleProgressUpdate = async (e) => {
    e.stopPropagation();
    const val = parseInt(e.target.value);
    const completed = val === 100;
    try {
      if (item.id.toString().startsWith('goal-')) {
        await useStore.getState().updateGoal(item.id.replace('goal-', ''), { progress: val, completed });
      } else {
        await updateVisionBoardItem(item.id, { progress: val, completed });
      }
      if (completed) showSuccess?.(t('visionboard.visionAchieved'), 4000);
    } catch { showError?.(t('visionboard.failedUpdate')); }
  };

  const handleCardClick = () => {
    const { user } = useStore.getState();
    if (!user) return;
    navigate(`/visionboard/${user.uid}/${item.id}`);
  };

  return (
    <div
      className="group relative bg-white dark:bg-gray-800/80 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700/50 hover:shadow-xl hover:shadow-black/8 dark:hover:shadow-black/30 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
      onClick={handleCardClick}
    >
      {confirmEl}
      {/* Image or gradient header */}
      <div className={`relative h-36 overflow-hidden ${!item.imageData && !item.imageUrl ? `bg-gradient-to-br ${meta.color}` : ''}`}>
        {(item.imageData || item.imageUrl) ? (
          <img
            src={item.imageData || item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-80">{meta.emoji}</span>
          </div>
        )}
        {/* Overlay on image */}
        {(item.imageData || item.imageUrl) && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        )}
        {/* Completed tint overlay */}
        {isCompleted && (
          <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
        )}
        {/* Status badge */}
        {isCompleted && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-semibold shadow">
            <FiCheck className="w-3 h-3" /> Done
          </div>
        )}
        {isDue && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-semibold shadow">
            <FiClock className="w-3 h-3" /> Overdue
          </div>
        )}
        {/* Action buttons */}
        <div
          className="absolute top-2 left-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={e => { e.stopPropagation(); onEdit(item); }}
            className="w-7 h-7 rounded-full bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-300 hover:text-indigo-500 flex items-center justify-center shadow text-xs backdrop-blur-sm transition-colors"
          >
            ✏️
          </button>
          <button
            onClick={handleDelete}
            className="w-7 h-7 rounded-full bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-300 hover:text-red-500 flex items-center justify-center shadow text-xs backdrop-blur-sm transition-colors"
          >
            🗑
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        {/* Lens level + Title */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2 flex-1">
            {isCompleted && <span className="text-emerald-500 mr-1">✓</span>}
            {item.title}
          </h3>
          {lensLevel && (
            <span className={`shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-lg text-base bg-gradient-to-br ${lensLevel.gradient} text-white shadow-sm`}>
              {lensLevel.emoji}
            </span>
          )}
        </div>

        {item.identityLink && (
          <p className="text-[11px] italic text-indigo-500 dark:text-indigo-400 line-clamp-1 mb-2">
            ↳ {item.identityLink}
          </p>
        )}

        {item.category && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 mb-3">
            {meta.emoji} {item.category}
          </span>
        )}

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Progress</span>
            <span className={`font-semibold ${isCompleted ? 'text-emerald-500' : 'text-indigo-500'}`}>{progress}%</span>
          </div>
          <div className="relative h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-indigo-400 to-purple-500'}`}
              style={{ width: `${progress}%` }}
            />
            <input
              type="range"
              min="0" max="100" step="5"
              value={progress}
              onChange={handleProgressUpdate}
              onClick={e => e.stopPropagation()}
              aria-label="Progress"
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer meta */}
        {item.dueDate && (
          <div className={`mt-3 text-xs flex items-center gap-1 ${isDue ? 'text-red-400' : 'text-gray-400'}`}>
            <FiCalendar className="w-3 h-3" />
            {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Empty state
───────────────────────────────────────────── */
const EmptyState = ({ hasFilters, onAdd, onClear }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 flex items-center justify-center text-4xl mb-5 shadow-inner">
        {hasFilters ? '🔍' : '🎯'}
      </div>
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
        {hasFilters
          ? t('visionboard.noMatchTitle', { defaultValue: 'No matching visions' })
          : t('visionboard.emptyTitle', { defaultValue: 'Your vision board awaits' })}
      </h3>
      <p className="text-gray-400 dark:text-gray-500 max-w-xs text-sm leading-relaxed mb-6">
        {hasFilters
          ? t('visionboard.noMatchHint', { defaultValue: "Try adjusting your search or filters to find what you're looking for." })
          : t('visionboard.emptyHint', { defaultValue: 'Add your first vision card to start manifesting your dreams into reality.' })}
      </p>
      {hasFilters ? (
        <button onClick={onClear} className="btn btn-secondary flex items-center gap-2">
          <FiX className="w-4 h-4" /> {t('visionboard.clearAllFilters', { defaultValue: 'Clear all filters' })}
        </button>
      ) : (
        <button onClick={onAdd} className="btn btn-primary flex items-center gap-2">
          <FiPlus className="w-4 h-4" /> {t('visionboard.createFirst', { defaultValue: 'Create Your First Vision' })}
        </button>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Main UnifiedVisionBoard
───────────────────────────────────────────── */
const UnifiedVisionBoard = () => {
  const { t } = useTranslation();
  const { visionBoard, goals, fetchVisionBoard, fetchGoals, deleteVisionBoardItem, addVisionBoardItem } = useStore();
  const { isPaid } = useSubscription();
  const { showSuccess, showError, showWarning } = useToast();
  const [confirm, confirmEl] = useConfirm();

  // Support deep-linking from the dashboard's Lens Snapshot (?level=year|month|week|day).
  const location = useLocation();
  useEffect(() => {
    const level = new URLSearchParams(location.search).get('level');
    if (level && ['year', 'month', 'week', 'day'].includes(level)) {
      setFilterLevel(level);
    }
  }, []); // run once on mount

  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [defaultLevel, setDefaultLevel] = useState(null);  // for create flow
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    try { return localStorage.getItem('visionboard-view-mode') || 'grid'; } catch { return 'grid'; }
  });
  const [sortBy, setSortBy] = useState(() => {
    try { return localStorage.getItem('visionboard-sort-by') || 'created'; } catch { return 'created'; }
  });
  const [sortOrder, setSortOrder] = useState(() => {
    try { return localStorage.getItem('visionboard-sort-order') || 'desc'; } catch { return 'desc'; }
  });

  const [unifiedItems, setUnifiedItems] = useState([]);

  // ── Virtual pagination ──────────────────────────────────────────────
  const PAGE_SIZE = 12;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Reset visible count whenever filters/sort change (skip the initial mount)
  const isFirstFilterRun = useRef(true);
  useEffect(() => {
    if (isFirstFilterRun.current) { isFirstFilterRun.current = false; return; }
    setVisibleCount(PAGE_SIZE);
    try { sessionStorage.removeItem('visionboard-scroll'); } catch {}
  }, [filterCategory, filterStatus, filterLevel, searchTerm, sortBy, sortOrder]);

  // ── Scroll restoration — save visibleCount + scrollY on unmount, restore on mount ──
  const visibleCountRef = useRef(visibleCount);
  useEffect(() => { visibleCountRef.current = visibleCount; }, [visibleCount]);
  const restoredScroll = useRef(null);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('visionboard-scroll');
      if (saved) {
        const data = JSON.parse(saved);
        if (Number.isFinite(data?.visibleCount) && data.visibleCount >= PAGE_SIZE) {
          setVisibleCount(data.visibleCount);
        }
        if (Number.isFinite(data?.scrollY)) restoredScroll.current = data.scrollY;
      }
    } catch {}
    return () => {
      try {
        sessionStorage.setItem('visionboard-scroll', JSON.stringify({
          visibleCount: visibleCountRef.current,
          scrollY: window.scrollY,
        }));
      } catch {}
    };
  }, []);
  // Apply the saved scroll position once content has loaded
  useEffect(() => {
    if (!isLoading && restoredScroll.current != null) {
      window.scrollTo(0, restoredScroll.current);
      restoredScroll.current = null;
    }
  }, [isLoading]);

  useEffect(() => {
    const load = async () => {
      try {
        await Promise.all([fetchVisionBoard(), fetchGoals()]);
      } catch {
        showError('Failed to load vision board. Please refresh.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [fetchVisionBoard, fetchGoals]);

  useEffect(() => { try { localStorage.setItem('visionboard-view-mode', viewMode); } catch {} }, [viewMode]);
  useEffect(() => { try { localStorage.setItem('visionboard-sort-by', sortBy); } catch {} }, [sortBy]);
  useEffect(() => { try { localStorage.setItem('visionboard-sort-order', sortOrder); } catch {} }, [sortOrder]);

  useEffect(() => {
    if (isLoading || !visionBoard || !goals) return;
    const goalsAsMapped = goals.map(g => ({
      id: `goal-${g.id}`,
      title: g.title,
      content: g.description || g.title,
      category: g.category,
      dueDate: g.dueDate,
      priority: g.priority !== undefined && g.priority !== null ? Number(g.priority) : g.priority,
      progress: g.progress,
      completed: g.completed,
      steps: g.steps || [],
      createdAt: g.createdAt || new Date().toISOString(),
    }));
    const combined = [...visionBoard, ...goalsAsMapped].sort((a, b) => {
      if (a.createdAt && b.createdAt) return new Date(b.createdAt) - new Date(a.createdAt);
      if (a.createdAt) return -1;
      if (b.createdAt) return 1;
      return 0;
    });
    setUnifiedItems(combined);
  }, [visionBoard, goals, isLoading]);

  // ── IntersectionObserver: load more when sentinel scrolls into view ─
  const sentinelRef = useCallback((el) => {
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisibleCount(c => c + PAGE_SIZE); },
      { rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleAddItem = (level = null) => {
    // Free-tier quota gate per-level — no level defaults to the active lens tab
    const effLevel = level || (filterLevel !== 'all' ? filterLevel : 'month');
    if (effLevel !== 'day' && !isPaid) {
      const currentCountForLevel = visionBoard.filter(v => (v.level || 'month') === effLevel).length;
      if (isLensCapped(effLevel, currentCountForLevel, isPaid)) {
        showWarning(t('lens.quotaExceeded'));
        return; // non-blocking: warn only, no auto-checkout
      }
    }
    setDefaultLevel(effLevel);
    setItemToEdit(null);
    setShowForm(true);
  };
  const handleEditItem = (item) => { setItemToEdit(item); setShowForm(true); };

  // Close modal — edit mode gets a discard-changes confirmation (unless forced after save)
  const confirmBusyRef = useRef(false);
  const handleFormClose = async (opts = {}) => {
    const { force = false } = opts;
    if (!force && itemToEdit) {
      if (confirmBusyRef.current) return;
      confirmBusyRef.current = true;
      const ok = await confirm({
        title: t('visionboard.discardChangesTitle', { defaultValue: 'Discard changes?' }),
        message: t('visionboard.discardChangesMessage', { defaultValue: 'You have unsaved changes. Discard them?' }),
        confirmLabel: t('common.discard', { defaultValue: 'Discard' }),
        danger: true,
      });
      confirmBusyRef.current = false;
      if (!ok) return;
    }
    setShowForm(false);
    setItemToEdit(null);
    setDefaultLevel(null);
  };

  // Modal: Escape closes, body scroll locked while open
  const handleFormCloseRef = useRef(handleFormClose);
  useEffect(() => { handleFormCloseRef.current = handleFormClose; });
  useEffect(() => {
    if (!showForm) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') handleFormCloseRef.current(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [showForm]);

  const handleFormSubmit = async (formData) => {
    try {
      // Default level for new items so the lens hierarchy isn't undefined
      const dataWithLevel = {
        ...formData,
        level: formData.level || defaultLevel || itemToEdit?.level || 'month',
      };
      if (itemToEdit?.id) {
        const { updateVisionBoardItem, updateGoal } = useStore.getState();
        if (String(itemToEdit.id).startsWith('goal-')) {
          const goalId = itemToEdit.id.replace('goal-', '');
          const goalUpdates = {
            title: dataWithLevel.title,
            description: dataWithLevel.content,
            category: dataWithLevel.category,
            progress: dataWithLevel.progress,
            completed: dataWithLevel.completed,
            steps: dataWithLevel.steps || [],
          };
          if (dataWithLevel.dueDate) goalUpdates.dueDate = dataWithLevel.dueDate;
          if (dataWithLevel.priority !== undefined && dataWithLevel.priority !== null) {
            goalUpdates.priority = dataWithLevel.priority;
          }
          const result = await updateGoal(goalId, goalUpdates);
          if (result.success) { showSuccess(t('visionboard.visionUpdated'), 3000); handleFormClose({ force: true }); }
          else showError(result.error || t('visionboard.failedUpdate'));
        } else {
          const result = await updateVisionBoardItem(itemToEdit.id, dataWithLevel);
          if (result.success) { showSuccess(t('visionboard.visionUpdated'), 3000); handleFormClose({ force: true }); }
          else showError(result.error || t('visionboard.failedUpdate'));
        }
      } else {
        const result = await addVisionBoardItem(dataWithLevel);
        if (result.success) { showSuccess(t('visionboard.visionCreated'), 3000); handleFormClose({ force: true }); }
        else showError(result.error || t('visionboard.failedCreate'));
      }
    } catch { showError(t('visionboard.saveError', { defaultValue: 'Something went wrong while saving. Please try again.' })); }
  };

  const getAllCategories = () => {
    const cats = new Set(['all']);
    unifiedItems.forEach(item => { if (item.category) cats.add(item.category); });
    return Array.from(cats);
  };

  const filteredItems = unifiedItems.filter(item => {
    const itemLevel = item.level || 'month';
    const matchLevel = filterLevel === 'all' || itemLevel === filterLevel;
    const matchCat = filterCategory === 'all' || item.category === filterCategory;
    const matchStatus = filterStatus === 'all' ||
      (filterStatus === 'completed' && item.completed) ||
      (filterStatus === 'inProgress' && !item.completed && item.progress > 0) ||
      (filterStatus === 'notStarted' && !item.completed && item.progress === 0);
    const matchSearch = !searchTerm ||
      (item.title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.content?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchLevel && matchCat && matchStatus && matchSearch;
  }).sort((a, b) => {
    let aV, bV;
    switch (sortBy) {
      case 'title':   aV = a.title || '';          bV = b.title || '';          break;
      case 'progress':aV = a.progress || 0;        bV = b.progress || 0;        break;
      case 'dueDate': aV = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31'); bV = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31'); break;
      case 'priority':aV = a.priority || 0;        bV = b.priority || 0;        break;
      default:        aV = a.createdAt ? new Date(a.createdAt) : new Date(); bV = b.createdAt ? new Date(b.createdAt) : new Date();
    }
    return sortOrder === 'asc' ? (aV > bV ? 1 : -1) : (aV < bV ? 1 : -1);
  });

  const hasFilters = !!(searchTerm || filterCategory !== 'all' || filterStatus !== 'all');

  /* summary stats */
  const completedCount = filteredItems.filter(i => i.completed).length;
  // Global-caliber due stats from unifiedItems (uncompleted only)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart.getTime() + 86400000);
  const dueTodayCount = unifiedItems.filter(i => {
    if (i.completed || !i.dueDate) return false;
    const ts = new Date(i.dueDate).getTime();
    return ts >= todayStart.getTime() && ts < tomorrowStart.getTime();
  }).length;
  const overdueCount = unifiedItems.filter(i => {
    if (i.completed || !i.dueDate) return false;
    return new Date(i.dueDate).getTime() < todayStart.getTime();
  }).length;

  // Sliced list for rendering — only show visibleCount items
  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMore = visibleCount < filteredItems.length;

  /* Timeline columns — must come after visibleItems is declared */
  const leftColumn = visibleItems.filter((_, i) => i % 2 === 0);
  const rightColumn = visibleItems.filter((_, i) => i % 2 !== 0);

  const handleSort = col => {
    if (sortBy === col) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortOrder('asc'); }
  };
  const getSortIcon = col => sortBy !== col ? null : sortOrder === 'asc'
    ? <FiChevronUp className="w-3 h-3" />
    : <FiChevronDown className="w-3 h-3" />;

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setFilterStatus('all');
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">

      {/* ── Page Header ── */}
      <div className="mb-7">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">
              {t('visionboard.title')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
              {t('visionboard.subtitle')}
            </p>
            {/* quick summary — global caliber */}
            {unifiedItems.length > 0 && (
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  {t('visionboard.visionsTotal', {count: unifiedItems.length})}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {t('visionboard.manifested', {count: unifiedItems.filter(i => i.completed).length})}
                </span>
                <span
                  className="flex items-center gap-1"
                  title={t('visionboard.dueTodayHint', { defaultValue: 'Due today, not yet completed' })}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  {t('visionboard.dueToday', { count: dueTodayCount, defaultValue: 'Due today: {{count}}' })}
                </span>
                <span
                  className="flex items-center gap-1"
                  title={t('visionboard.overdueHint', { defaultValue: 'Overdue and not completed' })}
                >
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  {t('visionboard.overdueCount', { count: overdueCount, defaultValue: 'Overdue: {{count}}' })}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* View mode switcher */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-0.5">
              {[
                { mode: 'grid', icon: <FiGrid className="w-4 h-4" />, label: t('visionboard.gridView') },
                { mode: 'timeline', icon: <FiLayout className="w-4 h-4" />, label: t('visionboard.timelineView') },
                { mode: 'list', icon: <FiList className="w-4 h-4" />, label: t('visionboard.listView') },
              ].map(v => (
                <button
                  key={v.mode}
                  onClick={() => setViewMode(v.mode)}
                  title={v.label}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    viewMode === v.mode
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {v.icon}
                  <span className="hidden sm:inline">{v.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => handleAddItem()}
              className="btn btn-primary flex items-center gap-2 shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0"
            >
              <FiPlus className="w-4 h-4" />
              <span>Add Vision</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Lens Hierarchy tabs ── */}
      <div className="mb-5 flex flex-wrap gap-2">
        <button
          onClick={() => setFilterLevel('all')}
          className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
            filterLevel === 'all'
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {t('lens.all')} · {unifiedItems.length}
        </button>
        {LENS_LEVELS.map(({ id, emoji, gradient }) => {
          const count = unifiedItems.filter(i => (i.level || 'month') === id).length;
          const max = FREE_TIER_LIMITS[`${id}Lens`];
          const showQuota = !isPaid && Number.isFinite(max);
          const capped = showQuota && count >= max;
          const active = filterLevel === id;
          return (
            <button
              key={id}
              onClick={() => setFilterLevel(id)}
              title={t(`lens.${id}.help`)}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                active
                  ? `bg-gradient-to-r ${gradient} text-white shadow-md`
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span>{emoji}</span>
              <span>{t(`lens.${id}.label`)}</span>
              <span className={`text-xs ${active ? 'text-white/80' : 'text-gray-400'}`}>
                {showQuota ? `${count}/${max}` : count}
              </span>
              {capped && <FiLock className={`w-3 h-3 ${active ? 'text-white/70' : 'text-gray-400'}`} />}
            </button>
          );
        })}
        {filterLevel !== 'all' && (
          <button
            onClick={() => handleAddItem(filterLevel)}
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
          >
            <FiPlus className="w-3.5 h-3.5" />
            {t('lens.addAt', { level: t(`lens.${filterLevel}.label`) })}
          </button>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="mb-7 card p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              className="input pl-9 w-full text-sm h-9"
              placeholder={t('visionboard.searchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => setSearchTerm('')}
              >
                <FiX className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Selects — horizontal scroll on mobile, inline on sm+ */}
          <div className="flex items-center gap-2 overflow-x-auto sm:overflow-visible flex-nowrap">
            {/* Category */}
            <select
              className="input text-sm h-9 bg-transparent shrink-0 w-auto min-w-[130px]"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              {getAllCategories().map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? t('visionboard.allCategories') : (CATEGORY_META[cat]?.emoji || '') + ' ' + cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>

            {/* Status */}
            <select
              className="input text-sm h-9 bg-transparent shrink-0 w-auto min-w-[130px]"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="all">{t('visionboard.allStatuses')}</option>
              <option value="completed">✅ Completed</option>
              <option value="inProgress">🔄 In Progress</option>
              <option value="notStarted">🌱 Not Started</option>
            </select>

            {/* Sort (list only) */}
            {viewMode === 'list' && (
              <select
                className="input text-sm h-9 bg-transparent shrink-0 w-auto min-w-[140px]"
                value={`${sortBy}-${sortOrder}`}
                onChange={e => {
                  const [sb, so] = e.target.value.split('-');
                  setSortBy(sb); setSortOrder(so);
                }}
              >
                <option value="created-desc">{t('visionboard.newestFirst')}</option>
                <option value="created-asc">{t('visionboard.oldestFirst')}</option>
                <option value="title-asc">{t('visionboard.titleAZ')}</option>
                <option value="title-desc">{t('visionboard.titleZA')}</option>
                <option value="progress-desc">{t('visionboard.highestProgress')}</option>
                <option value="progress-asc">{t('visionboard.progressLow', { defaultValue: 'Progress: low first' })}</option>
                <option value="dueDate-asc">{t('visionboard.dueSoon')}</option>
                <option value="priority-desc">{t('visionboard.highPriority')}</option>
              </select>
            )}
          </div>
        </div>

        {/* Filter chips */}
        {hasFilters && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
            <span className="text-xs text-gray-400">Filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                "{searchTerm}"
                <button onClick={() => setSearchTerm('')}><FiX className="w-3 h-3" /></button>
              </span>
            )}
            {filterCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-medium">
                {filterCategory}
                <button onClick={() => setFilterCategory('all')}><FiX className="w-3 h-3" /></button>
              </span>
            )}
            {filterStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-medium">
                {filterStatus}
                <button onClick={() => setFilterStatus('all')}><FiX className="w-3 h-3" /></button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-auto"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Results count ── */}
      {!isLoading && filteredItems.length > 0 && (
        <div className="flex items-center justify-between mb-4 px-0.5">
          <p className="text-xs text-gray-400">
            {t('visionboard.visibleCount', { count: filteredItems.length, defaultValue: 'Visible {{count}} items' })}
            <span className="mx-1">·</span>
            {t('visionboard.completedCount', { count: completedCount, defaultValue: '{{count}} completed' })}
          </p>
        </div>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState hasFilters={hasFilters} onAdd={() => handleAddItem()} onClear={clearFilters} />
      ) : viewMode === 'grid' ? (
        /* ── GRID / MOOD BOARD VIEW ── */
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {visibleItems.map(item => (
              <MoodBoardCard
                key={item.id}
                item={item}
                onEdit={handleEditItem}
                showSuccess={showSuccess}
                showError={showError}
                showWarning={showWarning}
              />
            ))}
          </div>
          {/* sentinel */}
          <div ref={sentinelRef} className="h-4" />
          {hasMore && (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
            </div>
          )}
        </>
      ) : viewMode === 'timeline' ? (
        /* ── TIMELINE VIEW ── */
        <>
          <div className="timeline-container">
            <div className="timeline-center-line" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-16">
                {leftColumn.map(item => (
                  <div key={item.id} className="timeline-item left">
                    <div className="timeline-connector" />
                    <div className="timeline-dot" />
                    <div className="timeline-date">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <FiCalendar className="w-3 h-3 text-indigo-400" />
                        {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                      </div>
                    </div>
                    <div className="timeline-content mt-6">
                      <EnhancedVisionBoardItem
                        item={item}
                        onEdit={() => handleEditItem(item)}
                        showSuccess={showSuccess}
                        showError={showError}
                        showWarning={showWarning}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-16 md:mt-28">
                {rightColumn.map(item => (
                  <div key={item.id} className="timeline-item right">
                    <div className="timeline-connector" />
                    <div className="timeline-dot" />
                    <div className="timeline-date">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <FiCalendar className="w-3 h-3 text-indigo-400" />
                        {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                      </div>
                    </div>
                    <div className="timeline-content mt-6">
                      <EnhancedVisionBoardItem
                        item={item}
                        onEdit={() => handleEditItem(item)}
                        showSuccess={showSuccess}
                        showError={showError}
                        showWarning={showWarning}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div ref={sentinelRef} className="h-4" />
          {hasMore && (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
            </div>
          )}
        </>
      ) : (
        /* ── LIST VIEW ── */
        <>
          <div className="card overflow-hidden">
            <div className="hidden md:grid grid-cols-[1fr_80px_90px_72px_80px] gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {[
                { col: 'title', label: 'Vision' },
                { col: 'progress', label: 'Progress' },
                { col: 'dueDate', label: 'Due Date' },
                { col: 'priority', label: 'Priority' },
              ].map(c => (
                <button
                  key={c.col}
                  onClick={() => handleSort(c.col)}
                  className="flex items-center gap-1 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-left"
                >
                  {c.label}
                  {getSortIcon(c.col)}
                </button>
              ))}
              <span>Actions</span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {visibleItems.map(item => (
                <VisionBoardListItem
                  key={item.id}
                  item={item}
                  onEdit={() => handleEditItem(item)}
                  showSuccess={showSuccess}
                  showError={showError}
                  showWarning={showWarning}
                />
              ))}
            </div>
          </div>
          <div ref={sentinelRef} className="h-4 mt-1" />
          {hasMore && (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
            </div>
          )}
        </>
      )}

      {/* ── Form Modal — rendered via Portal so fixed is relative to viewport ── */}
      {showForm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[5vh] px-4 pb-4">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleFormClose}
          />
          {/* centered modal panel */}
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-slide-up">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700/50 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                  {itemToEdit ? t('visionboard.editVision') : t('visionboard.newVision')}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {itemToEdit
                    ? t('visionboard.editVisionSubtitle', { defaultValue: 'Update your vision details' })
                    : t('visionboard.newVisionSubtitle', { defaultValue: 'Bring your dream to life' })}
                </p>
              </div>
              <button
                onClick={handleFormClose}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
            {/* Modal body — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <EnhancedVisionBoardItemForm
                itemToEdit={itemToEdit}
                defaultLevel={defaultLevel}
                onClose={handleFormClose}
                onSubmit={handleFormSubmit}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
      {confirmEl}
    </div>
  );
};

export default UnifiedVisionBoard;