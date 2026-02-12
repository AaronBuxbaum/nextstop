'use client';

import { Branch, BranchOption, Event } from '@/types';
import styles from './BranchCard.module.css';

interface BranchCardProps {
  branch: Branch;
  events: Event[];
  onAddOption?: (branchId: string) => void;
  onDeleteBranch?: (branchId: string) => void;
}

function getEventTitle(events: Event[], eventId?: string): string {
  if (!eventId) return 'None';
  const event = events.find((e) => e.id === eventId);
  return event ? event.title : 'Unknown';
}

export function BranchCard({ branch, events, onAddOption, onDeleteBranch }: BranchCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{branch.title}</h3>
        {onDeleteBranch && (
          <button
            onClick={() => onDeleteBranch(branch.id)}
            className={styles.deleteButton}
            aria-label="Delete branch"
          >
            Delete
          </button>
        )}
      </div>

      {branch.description && (
        <p className={styles.description}>{branch.description}</p>
      )}

      <div className={styles.connections}>
        <div className={styles.connection}>
          <span className={styles.connectionLabel}>From:</span>
          <span className={styles.connectionValue}>
            {getEventTitle(events, branch.previousEventId)}
          </span>
        </div>
        <span className={styles.arrow}>→</span>
        <div className={styles.connection}>
          <span className={styles.connectionLabel}>To:</span>
          <span className={styles.connectionValue}>
            {getEventTitle(events, branch.nextEventId)}
          </span>
        </div>
      </div>

      <div className={styles.options}>
        <h4 className={styles.optionsTitle}>Options</h4>
        {branch.options && branch.options.length > 0 ? (
          branch.options.map((option: BranchOption) => (
            <div key={option.id} className={styles.optionCard}>
              <div className={styles.optionHeader}>
                <strong>{option.label}</strong>
              </div>
              {option.description && (
                <p className={styles.optionDescription}>{option.description}</p>
              )}
              {option.decisionLogic && (
                <div className={styles.decisionLogic}>
                  <span className={styles.logicType}>{option.decisionLogic.type}</span>
                  {option.decisionLogic.condition && (
                    <span className={styles.logicCondition}>{option.decisionLogic.condition}</span>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className={styles.noOptions}>No options yet</p>
        )}
        {onAddOption && (
          <button
            onClick={() => onAddOption(branch.id)}
            className={styles.addOptionButton}
          >
            + Add Option
          </button>
        )}
      </div>
    </div>
  );
}
