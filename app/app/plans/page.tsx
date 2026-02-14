'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plan } from '@/types';
import styles from './page.module.css';

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlan, setNewPlan] = useState({
    title: '',
    description: '',
    date: '',
    theme: '',
    showDriving: true,
  });

  // Helper to handle fetch with auth redirect
  const fetchWithAuth = useCallback(async (url: string, options?: RequestInit): Promise<Response | null> => {
    const response = await fetch(url, options);
    if (response.status === 401) {
      router.push('/auth/signin');
      return null;
    }
    return response;
  }, [router]);

  const fetchPlans = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/api/plans');
      if (!response) return; // Redirected to sign-in
      if (!response.ok) throw new Error('Failed to fetch plans');
      const data = await response.json();
      setPlans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const createPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.title.trim()) return;

    try {
      const response = await fetchWithAuth('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newPlan.title,
          description: newPlan.description || null,
          date: newPlan.date || null,
          theme: newPlan.theme || null,
          showDriving: newPlan.showDriving,
        }),
      });
      if (!response) return; // Redirected to sign-in
      if (!response.ok) throw new Error('Failed to create plan');
      
      const created = await response.json();
      setPlans([created, ...plans]);
      setNewPlan({ title: '', description: '', date: '', theme: '', showDriving: true });
      setIsCreating(false);
      router.push(`/plans/${created.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create plan');
    }
  };

  const deletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      const response = await fetchWithAuth(`/api/plans/${id}`, {
        method: 'DELETE',
      });
      if (!response) return; // Redirected to sign-in
      if (!response.ok) throw new Error('Failed to delete plan');
      
      setPlans(plans.filter(plan => plan.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete plan');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading your plans...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Your Plans</h1>
          <p className={styles.subtitle}>Create and manage your outing plans</p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className={styles.createButton}
          >
            + New Plan
          </button>
        )}
      </header>

      {isCreating && (
        <form onSubmit={createPlan} className={styles.createForm}>
          <input
            type="text"
            value={newPlan.title}
            onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })}
            placeholder="Plan title*"
            className={styles.input}
            autoFocus
            required
          />
          <textarea
            value={newPlan.description}
            onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
            placeholder="Description (optional)"
            className={styles.textarea}
            rows={3}
          />
          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Date</label>
              <input
                type="date"
                value={newPlan.date}
                onChange={(e) => setNewPlan({ ...newPlan, date: e.target.value })}
                className={styles.input}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Theme</label>
              <input
                type="text"
                value={newPlan.theme}
                onChange={(e) => setNewPlan({ ...newPlan, theme: e.target.value })}
                placeholder="e.g., Adventure, Romantic, Cultural"
                className={styles.input}
              />
            </div>
          </div>
          <div className={styles.toggleRow}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={newPlan.showDriving}
                onChange={(e) => setNewPlan({ ...newPlan, showDriving: e.target.checked })}
                className={styles.toggleCheckbox}
              />
              <span className={styles.toggleSwitch} />
              Show driving time between events
            </label>
          </div>
          <div className={styles.formActions}>
            <button type="submit" className={styles.submitButton}>
              Create Plan
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setNewPlan({ title: '', description: '', date: '', theme: '', showDriving: true });
              }}
              className={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {plans.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>No plans yet</h2>
          <p>Create your first outing plan to get started!</p>
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className={styles.createButton}
            >
              + Create Your First Plan
            </button>
          )}
        </div>
      ) : (
        <div className={styles.planGrid}>
          {plans.map((plan) => (
            <div key={plan.id} className={styles.planCard}>
              <div
                className={styles.planCardContent}
                onClick={() => router.push(`/plans/${plan.id}`)}
              >
                <h2 className={styles.planTitle}>{plan.title}</h2>
                {plan.description && (
                  <p className={styles.planDescription}>{plan.description}</p>
                )}
                {plan.theme && (
                  <div className={styles.theme}>
                    <span className={styles.themeIcon}>🎨</span>
                    {plan.theme}
                  </div>
                )}
                <div className={styles.planMeta}>
                  <span>{plan.event_count || plan.events?.length || 0} events</span>
                  {plan.collaborators && plan.collaborators.length > 0 && (
                    <span>• {plan.collaborators.length} collaborators</span>
                  )}
                </div>
              </div>
              <div className={styles.planActions}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/plans/${plan.id}`);
                  }}
                  className={styles.viewButton}
                >
                  View
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePlan(plan.id);
                  }}
                  className={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
