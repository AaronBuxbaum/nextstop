'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Plan, Event, Branch, DecisionLogic, AIAnalysis, AISuggestion } from '@/types';
import { EventCard } from '@/components/EventCard';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { TravelTime } from '@/components/TravelTime';
import { BranchCard } from '@/components/BranchCard';
import styles from './page.module.css';

export default function PlanDetailPage() {
  const params = useParams();
  const planId = params.id as string;

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [isGeneratingEvent, setIsGeneratingEvent] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [showAiGenerator, setShowAiGenerator] = useState(false);

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
      setPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

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

  // Event editing
  const startEditEvent = (event: Event) => {
    setEditingEvent(event);
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

      setEditingEvent(null);
      await fetchPlan();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update event');
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
      alert(err instanceof Error ? err.message : 'Failed to get suggestions');
    }
  };

  const generateEventFromAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    setIsGeneratingEvent(true);
    try {
      // Call AI to generate event details
      const response = await fetch('/api/ai/generate-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, userInput: aiInput }),
      });

      if (!response.ok) throw new Error('Failed to generate event');
      const data = await response.json();

      // Pre-fill the event form with AI-generated data
      setNewEvent({
        title: data.event.title || '',
        description: data.event.description || '',
        location: data.event.location || '',
        startTime: '',
        endTime: '',
        duration: data.event.duration ? String(data.event.duration) : '',
        notes: data.event.notes || '',
      });

      // Show the event form and hide AI generator
      setIsAddingEvent(true);
      setShowAiGenerator(false);
      setAiInput('');

      // Store placement info for later (we'll need to handle ordering in createEvent)
      // For now, we'll just add it to the end as the simplest implementation
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate event');
    } finally {
      setIsGeneratingEvent(false);
    }
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
          <h1 className={styles.title}>{plan.title}</h1>
          {plan.description && <p className={styles.description}>{plan.description}</p>}
          {plan.theme && (
            <div className={styles.theme}>
              <span className={styles.themeIcon}>🎨</span>
              Theme: {plan.theme}
            </div>
          )}
        </div>
        <div className={styles.aiActions}>
          <button
            onClick={analyzeWithAI}
            disabled={analyzingAI}
            className={styles.aiButton}
          >
            {analyzingAI ? '🤔 Analyzing...' : '🤖 AI Analysis'}
          </button>
          <button
            onClick={getSuggestions}
            className={styles.aiButton}
          >
            💡 Get Suggestions
          </button>
        </div>
      </header>

      {analysis && (
        <div className={styles.analysisPanel}>
          <h2>AI Analysis</h2>
          <div className={styles.analysisGrid}>
            <div className={styles.analysisCard}>
              <h3>Pacing</h3>
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
              <h3>Quality</h3>
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
              <h3>Theme</h3>
              <div className={styles.rating}>⭐ {analysis.theme.coherence}/10</div>
              <p><strong>Suggested:</strong> {analysis.theme.suggested}</p>
              <p>{analysis.theme.description}</p>
            </div>
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className={styles.suggestionsPanel}>
          <h2>AI Suggestions</h2>
          <div className={styles.suggestionsGrid}>
            {suggestions.map((suggestion, idx) => (
              <div key={idx} className={styles.suggestionCard}>
                <h3>{suggestion.title}</h3>
                <p>{suggestion.description}</p>
                <div className={styles.reasoning}><em>{suggestion.reasoning}</em></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <section className={styles.eventsSection}>
        <div className={styles.sectionHeader}>
          <h2>Events</h2>
          <div className={styles.buttonGroup}>
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
            />
            <div className={styles.timeRow}>
              <input
                type="time"
                value={newEvent.startTime}
                onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                placeholder="Start time"
                className={styles.input}
              />
              <input
                type="time"
                value={newEvent.endTime}
                onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                placeholder="End time"
                className={styles.input}
              />
              <input
                type="number"
                value={newEvent.duration}
                onChange={(e) => setNewEvent({ ...newEvent, duration: e.target.value })}
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
            />
            <div className={styles.timeRow}>
              <input
                type="time"
                value={editForm.startTime}
                onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                placeholder="Start time"
                className={styles.input}
              />
              <input
                type="time"
                value={editForm.endTime}
                onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                placeholder="End time"
                className={styles.input}
              />
              <input
                type="number"
                value={editForm.duration}
                onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
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
          <div className={styles.eventsList}>
            {plan.events.map((event, index) => (
              <React.Fragment key={event.id}>
                <EventCard
                  event={event}
                  onEdit={startEditEvent}
                  onDelete={deleteEvent}
                  isEditing={editingEvent?.id === event.id}
                  isDragging={draggedEventId === event.id}
                  dragHandleProps={{
                    onDragStart: () => handleDragStart(event.id),
                  }}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(event.id)}
                  onDragEnd={handleDragEnd}
                />
                {/* Travel time between consecutive events with locations */}
                {index < plan.events.length - 1 &&
                  event.location &&
                  plan.events[index + 1].location && (
                    <TravelTime
                      fromLocation={event.location}
                      toLocation={plan.events[index + 1].location}
                    />
                  )}
              </React.Fragment>
            ))}
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
    </div>
  );
}
