'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plan } from '@/types';
import styles from './page.module.css';

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans');
      if (!response.ok) throw new Error('Failed to fetch plans');
      const data = await response.json();
      setPlans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanTitle.trim()) return;

    try {
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newPlanTitle }),
      });

      if (!response.ok) throw new Error('Failed to create plan');
      
      const newPlan = await response.json();
      setPlans([newPlan, ...plans]);
      setNewPlanTitle('');
      setIsCreating(false);
      router.push(`/plans/${newPlan.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create plan');
    }
  };

  const deletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      const response = await fetch(`/api/plans/${id}`, {
        method: 'DELETE',
      });

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
            value={newPlanTitle}
            onChange={(e) => setNewPlanTitle(e.target.value)}
            placeholder="Enter plan title..."
            className={styles.input}
            autoFocus
          />
          <div className={styles.formActions}>
            <button type="submit" className={styles.submitButton}>
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setNewPlanTitle('');
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
