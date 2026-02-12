'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Plan, AIAnalysis, AISuggestion } from '@/types';
import { EventCard } from '@/components/EventCard';
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
          <div style={{ display: 'flex', gap: '0.75rem' }}>
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
            <h3 style={{ fontFamily: 'var(--font-display), serif', marginBottom: '1rem' }}>
              ✨ AI Event Generator
            </h3>
            <p style={{ fontFamily: 'var(--font-body), monospace', color: 'var(--text-secondary, #6b7280)', marginBottom: '1rem' }}>
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
            <input
              type="text"
              value={newEvent.location}
              onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
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

        {plan.events && plan.events.length > 0 ? (
          <div className={styles.eventsList}>
            {plan.events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onDelete={deleteEvent}
              />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>No events yet. Add your first event to start planning!</p>
          </div>
        )}
      </section>
    </div>
  );
}
