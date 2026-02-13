'use client';

import React from 'react';
import styles from './AIGenerateModal.module.css';

interface GeneratedOption {
  event: {
    title: string;
    description?: string;
    location?: string;
    startTime?: string | null;
    duration?: number | null;
    notes?: string | null;
  };
  placement: {
    strategy: string;
    referenceEvent?: string | null;
    explanation: string;
  };
  style: string;
}

interface AIGenerateModalProps {
  options: GeneratedOption[];
  onSelect: (option: GeneratedOption) => void;
  onClose: () => void;
}

export function AIGenerateModal({ options, onSelect, onClose }: AIGenerateModalProps) {
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Select AI generated event">
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>✨ Choose an Option</h2>
          <p className={styles.subtitle}>
            We generated 3 options with different styles. Pick the one that fits best!
          </p>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <div className={styles.optionsGrid}>
          {options.map((option, index) => (
            <div key={index} className={styles.optionCard}>
              <div className={styles.styleBadge}>{option.style}</div>
              <h3 className={styles.optionTitle}>{option.event.title}</h3>
              {option.event.description && (
                <p className={styles.optionDescription}>{option.event.description}</p>
              )}
              <div className={styles.optionDetails}>
                {option.event.location && (
                  <div className={styles.detail}>
                    <span className={styles.detailIcon}>📍</span>
                    <span>{option.event.location}</span>
                  </div>
                )}
                {option.event.startTime && (
                  <div className={styles.detail}>
                    <span className={styles.detailIcon}>🕐</span>
                    <span>{option.event.startTime}</span>
                  </div>
                )}
                {option.event.duration && (
                  <div className={styles.detail}>
                    <span className={styles.detailIcon}>⏱️</span>
                    <span>{option.event.duration} min</span>
                  </div>
                )}
              </div>
              <div className={styles.placement}>
                <em>{option.placement.explanation}</em>
              </div>
              <button
                onClick={() => onSelect(option)}
                className={styles.selectButton}
                aria-label={`Select ${option.event.title}`}
              >
                Select This Option
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
