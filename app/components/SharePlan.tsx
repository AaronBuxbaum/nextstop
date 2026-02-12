'use client';

import { useState } from 'react';
import styles from './SharePlan.module.css';

interface SharePlanProps {
  planId: string;
  isPublic: boolean;
  onTogglePublic: (isPublic: boolean) => void;
}

export function SharePlan({ planId, isPublic, onTogglePublic }: SharePlanProps) {
  const [copied, setCopied] = useState(false);
  const [toggling, setToggling] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/plans/${planId}`
    : `/plans/${planId}`;

  const handleCopyLink = async () => {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      } catch {
        // Fall through to fallback
      }
    }

    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Unable to copy link. Please copy manually: ' + shareUrl);
    }
  };

  const handleTogglePublic = async () => {
    setToggling(true);
    try {
      onTogglePublic(!isPublic);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.visibilityToggle}>
        <button
          onClick={handleTogglePublic}
          disabled={toggling}
          className={`${styles.toggleButton} ${isPublic ? styles.public : styles.private}`}
          aria-label={isPublic ? 'Make plan private' : 'Make plan public'}
        >
          {isPublic ? '🌍 Public' : '🔒 Private'}
        </button>
      </div>

      {isPublic && (
        <div className={styles.shareActions}>
          <button
            onClick={handleCopyLink}
            className={styles.copyButton}
            aria-label="Copy share link"
          >
            {copied ? '✅ Copied!' : '🔗 Copy Link'}
          </button>
        </div>
      )}
    </div>
  );
}
