'use client';

import React, { useState } from 'react';
import { Collaborator } from '@/types';
import styles from './CollaborationPanel.module.css';

interface CollaborationPanelProps {
  planId: string;
  collaborators: Collaborator[];
  onCollaboratorsChange: () => void;
}

export function CollaborationPanel({
  planId,
  collaborators,
  onCollaboratorsChange,
}: CollaborationPanelProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/plans/${planId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add collaborator');
      }

      setEmail('');
      setIsAdding(false);
      onCollaboratorsChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add collaborator');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      const response = await fetch(
        `/api/plans/${planId}/collaborators?userId=${userId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to remove collaborator');
      onCollaboratorsChange();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove collaborator');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>👥 Collaborators</h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className={styles.inviteButton}
            aria-label="Invite collaborator"
          >
            + Invite
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleInvite} className={styles.inviteForm}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            className={styles.input}
            required
            autoFocus
          />
          <div className={styles.roleRow}>
            <label className={styles.roleLabel}>Role:</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
              className={styles.roleSelect}
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setError(null);
                setEmail('');
              }}
              className={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {collaborators.length > 0 ? (
        <ul className={styles.list}>
          {collaborators.map((collab) => (
            <li key={collab.id} className={styles.item}>
              <div className={styles.collabInfo}>
                <span className={styles.avatar}>
                  {(collab.name || collab.email || '?').charAt(0).toUpperCase()}
                </span>
                <div>
                  <span className={styles.name}>{collab.name || collab.email}</span>
                  <span className={styles.role}>{collab.role}</span>
                </div>
              </div>
              <button
                onClick={() => handleRemove(collab.id)}
                className={styles.removeButton}
                aria-label={`Remove ${collab.name || collab.email}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>No collaborators yet. Invite someone to collaborate!</p>
      )}
    </div>
  );
}
