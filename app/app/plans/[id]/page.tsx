'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Plan, Event, Branch, DecisionLogic, AIAnalysis, AISuggestion } from '@/types';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { BranchCard } from '@/components/BranchCard';
import { Timeline } from '@/components/Timeline';
import { SharePlan } from '@/components/SharePlan';
import { PresenceIndicators } from '@/components/PresenceIndicators';
import { MapView } from '@/components/MapView';
import { AIGenerateModal } from '@/components/AIGenerateModal';
import { CollaborationPanel } from '@/components/CollaborationPanel';
import { useGeolocation } from '@/lib/useGeolocation';
import { useCollaboration } from '@/lib/useCollaboration';
import { calculateDuration, calculateEndTime } from '@/lib/timeUtils';
import styles from './page.module.css';

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;
  const userLocation = useGeolocation();
  const { data: session } = useSession();

  const { activeUsers, startEditing, stopEditing } = useCollaboration({
    planId,
    enabled: !!session?.user,
  });

  const [plan, setPlan] = useState<Plan | null>(null);
  const [showMapView, setShowMapView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isGeneratingEvent, setIsGeneratingEvent] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [aiGeneratedOptions, setAiGeneratedOptions] = useState<{
    event: { title: string; description?: string; location?: string; startTime?: string | null; duration?: number | null; notes?: string | null };
    placement: { strategy: string; referenceEvent?: string | null; explanation: string };
    style: string;
  }[]>([]);

  // Plan editing state
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [planEditForm, setPlanEditForm] = useState({
    title: '',
    description: '',
    date: '',
    theme: '',
    showDriving: true,
  });

  // Drag state
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);

  // Edit event state
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    duration: '',
    notes: '',
  });

  // Branch state
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [newBranch, setNewBranch] = useState({
    title: '',
    description: '',
    previousEventId: '',
    nextEventId: '',
  });

  // Branch option state
  const [addingOptionBranchId, setAddingOptionBranchId] = useState<string | null>(null);
  const [newOption, setNewOption] = useState({
    label: '',
    description: '',
    logicType: 'preference' as DecisionLogic['type'],
    logicCondition: '',
  });

  // New event form state
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    duration: '',
    notes: '',
  });

  const fetchPlan = useCallback(async () => {
    try {
      const response = await fetch(`/api/plans/${planId}`);
      if (!response.ok) throw new Error('Failed to fetch plan');
      const data = await response.json();
      // Map snake_case API response to camelCase Plan interface
      const mappedPlan: Plan = {
        ...data,
        isPublic: data.is_public ?? data.isPublic ?? false,
        showDriving: data.show_driving ?? data.showDriving ?? true,
        userId: data.user_id ?? data.userId,
        createdAt: data.created_at ?? data.createdAt,
        updatedAt: data.updated_at ?? data.updatedAt,
        events: (data.events || []).map((ev: Record<string, unknown>) => ({
          ...ev,
          startTime: ev.start_time ?? ev.startTime,
          endTime: ev.end_time ?? ev.endTime,
          isOptional: ev.is_optional ?? ev.isOptional ?? false,
          createdAt: ev.created_at ?? ev.createdAt,
          updatedAt: ev.updated_at ?? ev.updatedAt,
        })),
        branches: data.branches || [],
        optionalEvents: data.optionalEvents || [],
        collaborators: data.collaborators || [],
      };
      setPlan(mappedPlan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const refreshAI = useCallback(async () => {
    await Promise.all([analyzeWithAI(), getSuggestions()]);
  }, [planId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-load AI analysis and suggestions when plan is loaded
  const aiLoadedRef = React.useRef(false);
  useEffect(() => {
    if (plan && plan.events && plan.events.length > 0 && !aiLoadedRef.current) {
      aiLoadedRef.current = true;
      refreshAI();
    }
  }, [plan, refreshAI]);

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return;

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          ...newEvent,
          duration: newEvent.duration ? parseInt(newEvent.duration) : null,
        }),
      });

      if (!response.ok) throw new Error('Failed to create event');

      await fetchPlan();
      setNewEvent({
        title: '',
        description: '',
        location: '',
        startTime: '',
        endTime: '',
        duration: '',
        notes: '',
      });
      setIsAddingEvent(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create event');
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Delete this event?')) return;

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete event');
      await fetchPlan();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete event');
    }
  };

  // Shared time calculation logic
  const calculateTimeFields = <T extends { startTime: string; endTime: string; duration: string }>(
    eventData: T,
    field: 'startTime' | 'endTime' | 'duration',
    value: string
  ): T => {
    const updated = { ...eventData, [field]: value };

    // Calculate duration if both start and end times are provided
    if (field === 'startTime' || field === 'endTime') {
      if (updated.startTime && updated.endTime) {
        const duration = calculateDuration(updated.startTime, updated.endTime);
        if (duration !== null) {
          updated.duration = String(duration);
        }
      }
    }

    // Calculate end time if start time and duration are provided
    if ((field === 'startTime' || field === 'duration') && updated.startTime && updated.duration) {
      const durationNum = parseInt(updated.duration);
      if (!isNaN(durationNum) && durationNum > 0) {
        const endTime = calculateEndTime(updated.startTime, durationNum);
        if (endTime !== null) {
          updated.endTime = endTime;
        }
      }
    }

    return updated;
  };

  // Time calculation handlers for new event form
  const handleNewEventTimeChange = (field: 'startTime' | 'endTime' | 'duration', value: string) => {
    setNewEvent(calculateTimeFields(newEvent, field, value));
  };

  // Time calculation handlers for edit event form
  const handleEditEventTimeChange = (field: 'startTime' | 'endTime' | 'duration', value: string) => {
    setEditForm(calculateTimeFields(editForm, field, value));
  };

  // Event editing
  const startEditEvent = (event: Event) => {
    setEditingEvent(event);
    startEditing(event.id, 'event');
    setEditForm({
      title: event.title || '',
      description: event.description || '',
      location: event.location || '',
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      duration: event.duration ? String(event.duration) : '',
      notes: event.notes || '',
    });
  };

  const saveEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    try {
      const response = await fetch(`/api/events/${editingEvent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          duration: editForm.duration ? parseInt(editForm.duration) : null,
        }),
      });

      if (!response.ok) throw new Error('Failed to update event');

      await fetchPlan();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update event');
    } finally {
      stopEditing(editingEvent.id);
      setEditingEvent(null);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (eventId: string) => {
    setDraggedEventId(eventId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetEventId: string) => {
    if (!draggedEventId || !plan?.events || draggedEventId === targetEventId) {
      setDraggedEventId(null);
      return;
    }

    const events = [...plan.events];
    const dragIdx = events.findIndex((ev) => ev.id === draggedEventId);
    const dropIdx = events.findIndex((ev) => ev.id === targetEventId);

    if (dragIdx === -1 || dropIdx === -1) {
      setDraggedEventId(null);
      return;
    }

    // Reorder locally
    const [moved] = events.splice(dragIdx, 1);
    events.splice(dropIdx, 0, moved);

    // Validate time constraints
    let lastTime: string | null = null;
    for (const ev of events) {
      if (ev.startTime && lastTime && ev.startTime < lastTime) {
        alert('Cannot reorder: events with start times must remain in chronological order.');
        setDraggedEventId(null);
        return;
      }
      if (ev.startTime) lastTime = ev.startTime;
    }

    // Optimistic update
    setPlan({ ...plan, events });
    setDraggedEventId(null);

    try {
      const response = await fetch('/api/events/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          eventIds: events.map((ev) => ev.id),
        }),
      });

      if (!response.ok) {
        await fetchPlan(); // Revert on failure
      }
    } catch {
      await fetchPlan();
    }
  };

  const handleDragEnd = () => {
    setDraggedEventId(null);
  };

  // Toggle optional status
  const toggleOptional = async (eventId: string, isOptional: boolean) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOptional }),
      });

      if (!response.ok) throw new Error('Failed to update event');
      await fetchPlan();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update event');
    }
  };

  // Toggle plan public/private
  const togglePublic = async (isPublic: boolean) => {
    try {
      const response = await fetch(`/api/plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic }),
      });

      if (!response.ok) throw new Error('Failed to update plan');
      await fetchPlan();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update plan');
    }
  };

  // Plan editing
  const startEditPlan = () => {
    if (!plan) return;
    setPlanEditForm({
      title: plan.title || '',
      description: plan.description || '',
      date: plan.date || '',
      theme: plan.theme || '',
      showDriving: plan.showDriving !== false,
    });
    setIsEditingPlan(true);
  };

  const saveEditPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planEditForm.title.trim()) return;

    try {
      const response = await fetch(`/api/plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: planEditForm.title,
          description: planEditForm.description || null,
          date: planEditForm.date || null,
          theme: planEditForm.theme || null,
          showDriving: planEditForm.showDriving,
        }),
      });

      if (!response.ok) throw new Error('Failed to update plan');
      setIsEditingPlan(false);
      await fetchPlan();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update plan');
    }
  };

  // Branch handlers
  const createBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.title.trim()) return;

    try {
      const response = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          ...newBranch,
          previousEventId: newBranch.previousEventId || null,
          nextEventId: newBranch.nextEventId || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to create branch');

      setNewBranch({ title: '', description: '', previousEventId: '', nextEventId: '' });
      setIsAddingBranch(false);
      await fetchPlan();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create branch');
    }
  };

  const deleteBranch = async (branchId: string) => {
    if (!confirm('Delete this branch?')) return;

    try {
      const response = await fetch(`/api/branches/${branchId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete branch');
      await fetchPlan();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete branch');
    }
  };

  const addBranchOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingOptionBranchId || !newOption.label.trim()) return;

    try {
      const response = await fetch(`/api/branches/${addingOptionBranchId}/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newOption.label,
          description: newOption.description || null,
          decisionLogic: {
            type: newOption.logicType,
            condition: newOption.logicCondition,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to add option');

      setAddingOptionBranchId(null);
      setNewOption({ label: '', description: '', logicType: 'preference', logicCondition: '' });
      await fetchPlan();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add option');
    }
  };

  // AI handlers
  const analyzeWithAI = async () => {
    setAnalyzingAI(true);
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) throw new Error('AI analysis failed');
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'AI analysis failed');
    } finally {
      setAnalyzingAI(false);
    }
  };

  const getSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) throw new Error('Failed to get suggestions');
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error(err instanceof Error ? err.message : 'Failed to get suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const generateEventFromAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    setIsGeneratingEvent(true);
    try {
      // Call AI to generate event options
      const response = await fetch('/api/ai/generate-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, userInput: aiInput }),
      });

      if (!response.ok) throw new Error('Failed to generate event');
      const data = await response.json();

      // Handle new multi-option format
      if (data.options && Array.isArray(data.options)) {
        setAiGeneratedOptions(data.options);
      } else if (data.event) {
        // Backwards compatibility: wrap single result as option
        setAiGeneratedOptions([{
          event: data.event,
          placement: data.placement,
          style: 'Suggested',
        }]);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate event');
    } finally {
      setIsGeneratingEvent(false);
    }
  };

  const handleSelectAiOption = (option: typeof aiGeneratedOptions[0]) => {
    const startTime = option.event.startTime || '';
    const duration = option.event.duration ? String(option.event.duration) : '';
    let endTime = '';
    if (startTime && duration) {
      const durationNum = parseInt(duration);
      if (!isNaN(durationNum) && durationNum > 0) {
        endTime = calculateEndTime(startTime, durationNum) ?? '';
      }
    }

    setNewEvent({
      title: option.event.title || '',
      description: option.event.description || '',
      location: option.event.location || '',
      startTime,
      endTime,
      duration,
      notes: option.event.notes || '',
    });

    setAiGeneratedOptions([]);
    setIsAddingEvent(true);
    setShowAiGenerator(false);
    setAiInput('');
  };

  if (loading) {
    return <div className={styles.container}><div className={styles.loading}>Loading plan...</div></div>;
  }

  if (error || !plan) {
    return <div className={styles.container}><div className={styles.error}>Error: {error || 'Plan not found'}</div></div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <button
              onClick={() => router.push('/plans')}
              className={styles.backArrow}
              aria-label="Back to plans"
            >
              ←
            </button>
            <h1 className={styles.title}>{plan.title}</h1>
            <button
              onClick={startEditPlan}
              className={styles.pencilButton}
              aria-label="Edit plan details"
            >
              ✏️
            </button>
          </div>
          {plan.description && <p className={styles.description}>{plan.description}</p>}
          {plan.date && (
            <div className={styles.date}>
              <span className={styles.dateIcon}>📅</span>
              {plan.date}
            </div>
          )}
          {plan.theme && (
            <div className={styles.theme}>
              <span className={styles.themeIcon}>🎨</span>
              Theme: {plan.theme}
            </div>
          )}
          <div className={styles.shareRow}>
            <SharePlan
              planId={planId}
              isPublic={plan.isPublic}
              onTogglePublic={togglePublic}
            />
            <PresenceIndicators
              activeUsers={activeUsers}
              currentUserId={session?.user?.id}
            />
          </div>
          <CollaborationPanel
            planId={planId}
            collaborators={plan.collaborators || []}
            onCollaboratorsChange={fetchPlan}
          />
        </div>
      </header>

      {/* Plan edit form */}
      {isEditingPlan && (
        <form onSubmit={saveEditPlan} className={styles.eventForm}>
          <h3 className={styles.editFormTitle}>Edit Plan</h3>
          <input
            type="text"
            value={planEditForm.title}
            onChange={(e) => setPlanEditForm({ ...planEditForm, title: e.target.value })}
            placeholder="Plan title*"
            className={styles.input}
            required
          />
          <textarea
            value={planEditForm.description}
            onChange={(e) => setPlanEditForm({ ...planEditForm, description: e.target.value })}
            placeholder="Description"
            className={styles.textarea}
            rows={3}
          />
          <div className={styles.timeRow}>
            <div>
              <label className={styles.selectLabel}>Date</label>
              <input
                type="date"
                value={planEditForm.date}
                onChange={(e) => setPlanEditForm({ ...planEditForm, date: e.target.value })}
                className={styles.input}
              />
            </div>
            <div>
              <label className={styles.selectLabel}>Theme</label>
              <input
                type="text"
                value={planEditForm.theme}
                onChange={(e) => setPlanEditForm({ ...planEditForm, theme: e.target.value })}
                placeholder="Theme"
                className={styles.input}
              />
            </div>
          </div>
          <div className={styles.toggleRow}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={planEditForm.showDriving}
                onChange={(e) => setPlanEditForm({ ...planEditForm, showDriving: e.target.checked })}
                className={styles.toggleCheckbox}
              />
              <span className={styles.toggleSwitch} />
              Show driving time
            </label>
          </div>
          <div className={styles.formActions}>
            <button type="submit" className={styles.submitButton}>
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => setIsEditingPlan(false)}
              className={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className={styles.pageLayout}>
        <div className={styles.mainContent}>

      <section className={styles.eventsSection}>
        <div className={styles.sectionHeader}>
          <h2>Events</h2>
          <div className={styles.buttonGroup}>
            <button
              onClick={() => setShowMapView(!showMapView)}
              className={styles.timelineButton}
              aria-label={showMapView ? 'Hide map view' : 'Show map view'}
            >
              {showMapView ? '🗺️ Hide Map' : '🗺️ Map View'}
            </button>
            {!showAiGenerator && !isAddingEvent && (
              <button
                onClick={() => setShowAiGenerator(true)}
                className={styles.aiButton}
              >
                ✨ AI Generate
              </button>
            )}
            {!isAddingEvent && !showAiGenerator && (
              <button
                onClick={() => setIsAddingEvent(true)}
                className={styles.addButton}
              >
                + Add Event
              </button>
            )}
          </div>
        </div>

        {showMapView && plan.events && plan.events.length > 0 && (
          <MapView events={plan.events} />
        )}

        {showAiGenerator && (
          <form onSubmit={generateEventFromAI} className={styles.eventForm}>
            <h3 className={styles.aiGeneratorTitle}>
              ✨ AI Event Generator
            </h3>
            <p className={styles.aiGeneratorDescription}>
              Describe the event you want to add in natural language. For example: &ldquo;I want to go to dinner at Eataly after the walk in the park&rdquo;
            </p>
            <textarea
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="E.g., 'Add a coffee break at Starbucks before the museum visit' or 'I want to go shopping at the mall for 2 hours'"
              className={styles.textarea}
              rows={3}
              required
            />
            <div className={styles.formActions}>
              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={isGeneratingEvent}
              >
                {isGeneratingEvent ? '🤔 Generating...' : '✨ Generate Event'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAiGenerator(false);
                  setAiInput('');
                }}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {isAddingEvent && (
          <form onSubmit={createEvent} className={styles.eventForm}>
            <input
              type="text"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              placeholder="Event title*"
              className={styles.input}
              required
            />
            <textarea
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              placeholder="Description"
              className={styles.textarea}
              rows={3}
            />
            <LocationAutocomplete
              value={newEvent.location}
              onChange={(val) => setNewEvent({ ...newEvent, location: val })}
              onSelect={(displayName) => setNewEvent({ ...newEvent, location: displayName })}
              placeholder="Location"
              className={styles.input}
              centerLat={userLocation.lat}
              centerLon={userLocation.lon}
            />
            <div className={styles.timeRow}>
              <input
                type="time"
                value={newEvent.startTime}
                onChange={(e) => handleNewEventTimeChange('startTime', e.target.value)}
                placeholder="Start time"
                className={styles.input}
              />
              <input
                type="time"
                value={newEvent.endTime}
                onChange={(e) => handleNewEventTimeChange('endTime', e.target.value)}
                placeholder="End time"
                className={styles.input}
              />
              <input
                type="number"
                value={newEvent.duration}
                onChange={(e) => handleNewEventTimeChange('duration', e.target.value)}
                placeholder="Duration (min)"
                className={styles.input}
              />
            </div>
            <textarea
              value={newEvent.notes}
              onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
              placeholder="Notes"
              className={styles.textarea}
              rows={2}
            />
            <div className={styles.formActions}>
              <button type="submit" className={styles.submitButton}>
                Add Event
              </button>
              <button
                type="button"
                onClick={() => setIsAddingEvent(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Edit event form */}
        {editingEvent && (
          <form onSubmit={saveEditEvent} className={styles.eventForm}>
            <h3 className={styles.editFormTitle}>Edit Event</h3>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              placeholder="Event title*"
              className={styles.input}
              required
            />
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="Description"
              className={styles.textarea}
              rows={3}
            />
            <LocationAutocomplete
              value={editForm.location}
              onChange={(val) => setEditForm({ ...editForm, location: val })}
              onSelect={(displayName) => setEditForm({ ...editForm, location: displayName })}
              placeholder="Location"
              className={styles.input}
              centerLat={userLocation.lat}
              centerLon={userLocation.lon}
            />
            <div className={styles.timeRow}>
              <input
                type="time"
                value={editForm.startTime}
                onChange={(e) => handleEditEventTimeChange('startTime', e.target.value)}
                placeholder="Start time"
                className={styles.input}
              />
              <input
                type="time"
                value={editForm.endTime}
                onChange={(e) => handleEditEventTimeChange('endTime', e.target.value)}
                placeholder="End time"
                className={styles.input}
              />
              <input
                type="number"
                value={editForm.duration}
                onChange={(e) => handleEditEventTimeChange('duration', e.target.value)}
                placeholder="Duration (min)"
                className={styles.input}
              />
            </div>
            <textarea
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              placeholder="Notes"
              className={styles.textarea}
              rows={2}
            />
            <div className={styles.formActions}>
              <button type="submit" className={styles.submitButton}>
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {plan.events && plan.events.length > 0 ? (
          <div className={styles.timelineSection}>
            <Timeline
              events={plan.events}
              planDate={plan.date}
              showDriving={plan.showDriving !== false}
              onEventClick={startEditEvent}
              onEdit={startEditEvent}
              onDelete={deleteEvent}
              onToggleOptional={toggleOptional}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              draggedEventId={draggedEventId}
              editingEventId={editingEvent?.id || null}
            />
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>No events yet. Add your first event to start planning!</p>
          </div>
        )}
      </section>

      {/* Branches section */}
      <section className={styles.branchesSection}>
        <div className={styles.sectionHeader}>
          <h2>Branches</h2>
          {!isAddingBranch && (
            <button
              onClick={() => setIsAddingBranch(true)}
              className={styles.addButton}
            >
              + Add Branch
            </button>
          )}
        </div>

        {isAddingBranch && (
          <form onSubmit={createBranch} className={styles.eventForm}>
            <input
              type="text"
              value={newBranch.title}
              onChange={(e) => setNewBranch({ ...newBranch, title: e.target.value })}
              placeholder="Branch title*"
              className={styles.input}
              required
            />
            <textarea
              value={newBranch.description}
              onChange={(e) => setNewBranch({ ...newBranch, description: e.target.value })}
              placeholder="Description"
              className={styles.textarea}
              rows={2}
            />
            <div className={styles.timeRow}>
              <div>
                <label className={styles.selectLabel}>Previous Event</label>
                <select
                  value={newBranch.previousEventId}
                  onChange={(e) => setNewBranch({ ...newBranch, previousEventId: e.target.value })}
                  className={styles.select}
                >
                  <option value="">None</option>
                  {plan.events?.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={styles.selectLabel}>Next Event</label>
                <select
                  value={newBranch.nextEventId}
                  onChange={(e) => setNewBranch({ ...newBranch, nextEventId: e.target.value })}
                  className={styles.select}
                >
                  <option value="">None</option>
                  {plan.events?.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="submit" className={styles.submitButton}>
                Create Branch
              </button>
              <button
                type="button"
                onClick={() => setIsAddingBranch(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Add option form */}
        {addingOptionBranchId && (
          <form onSubmit={addBranchOption} className={styles.eventForm}>
            <h3 className={styles.editFormTitle}>Add Branch Option</h3>
            <input
              type="text"
              value={newOption.label}
              onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
              placeholder="Option label*"
              className={styles.input}
              required
            />
            <textarea
              value={newOption.description}
              onChange={(e) => setNewOption({ ...newOption, description: e.target.value })}
              placeholder="Option description"
              className={styles.textarea}
              rows={2}
            />
            <div className={styles.timeRow}>
              <div>
                <label className={styles.selectLabel}>Decision Logic Type</label>
                <select
                  value={newOption.logicType}
                  onChange={(e) => setNewOption({ ...newOption, logicType: e.target.value as typeof newOption.logicType })}
                  className={styles.select}
                >
                  <option value="time">Time</option>
                  <option value="weather">Weather</option>
                  <option value="preference">Preference</option>
                  <option value="budget">Budget</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className={styles.selectLabel}>Condition</label>
                <input
                  type="text"
                  value={newOption.logicCondition}
                  onChange={(e) => setNewOption({ ...newOption, logicCondition: e.target.value })}
                  placeholder="e.g., 'If raining'"
                  className={styles.input}
                />
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="submit" className={styles.submitButton}>
                Add Option
              </button>
              <button
                type="button"
                onClick={() => setAddingOptionBranchId(null)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {plan.branches && plan.branches.length > 0 ? (
          <div className={styles.branchesList}>
            {plan.branches.map((branch: Branch) => (
              <BranchCard
                key={branch.id}
                branch={branch}
                events={plan.events || []}
                onAddOption={(branchId) => setAddingOptionBranchId(branchId)}
                onDeleteBranch={deleteBranch}
              />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>No branches yet. Add a branch to create alternative paths!</p>
          </div>
        )}
      </section>

        </div>{/* end mainContent */}

        <aside className={styles.sidePanel} aria-label="AI Insights">
          <div className={styles.sidePanelHeader}>
            <h2 className={styles.sidePanelTitle}>🤖 AI Insights</h2>
            <button
              onClick={refreshAI}
              disabled={analyzingAI || loadingSuggestions}
              className={styles.refreshButton}
              aria-label="Refresh AI analysis and suggestions"
            >
              {analyzingAI || loadingSuggestions ? '⏳' : '🔄'}
            </button>
          </div>

          <div className={styles.sidePanelSection}>
            <h3 className={styles.sidePanelSectionTitle}>Analysis</h3>
            {analyzingAI && (
              <p className={styles.sidePanelLoading}>Analyzing your plan...</p>
            )}
            {!analyzingAI && !analysis && (
              <p className={styles.sidePanelEmpty}>No analysis yet. Add events to get AI insights.</p>
            )}
            {analysis && (
              <div className={styles.analysisCards}>
                <div className={styles.analysisCard}>
                  <h4>Pacing</h4>
                  <div className={styles.rating}>⭐ {analysis.pacing.rating}/10</div>
                  <p>{analysis.pacing.feedback}</p>
                  {analysis.pacing.suggestions.length > 0 && (
                    <ul>
                      {analysis.pacing.suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className={styles.analysisCard}>
                  <h4>Quality</h4>
                  <div className={styles.rating}>⭐ {analysis.quality.rating}/10</div>
                  <p>{analysis.quality.feedback}</p>
                  {analysis.quality.improvements.length > 0 && (
                    <ul>
                      {analysis.quality.improvements.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className={styles.analysisCard}>
                  <h4>Theme</h4>
                  <div className={styles.rating}>⭐ {analysis.theme.coherence}/10</div>
                  <p><strong>Suggested:</strong> {analysis.theme.suggested}</p>
                  <p>{analysis.theme.description}</p>
                </div>
              </div>
            )}
          </div>

          <div className={styles.sidePanelSection}>
            <h3 className={styles.sidePanelSectionTitle}>Suggestions</h3>
            {loadingSuggestions && (
              <p className={styles.sidePanelLoading}>Getting suggestions...</p>
            )}
            {!loadingSuggestions && suggestions.length === 0 && (
              <p className={styles.sidePanelEmpty}>No suggestions yet.</p>
            )}
            {suggestions.length > 0 && (
              <div className={styles.suggestionCards}>
                {suggestions.map((suggestion, idx) => (
                  <div key={idx} className={styles.suggestionCard}>
                    <h4>{suggestion.title}</h4>
                    <p>{suggestion.description}</p>
                    <div className={styles.reasoning}><em>{suggestion.reasoning}</em></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>{/* end pageLayout */}

      {/* AI Generate Options Modal */}
      {aiGeneratedOptions.length > 0 && (
        <AIGenerateModal
          options={aiGeneratedOptions}
          onSelect={handleSelectAiOption}
          onClose={() => setAiGeneratedOptions([])}
        />
      )}
    </div>
  );
}
