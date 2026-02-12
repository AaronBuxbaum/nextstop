'use client';

import { Event } from '@/types';
import styles from './EventCard.module.css';

interface EventCardProps {
  event: Event;
  onEdit?: (event: Event) => void;
  onDelete?: (eventId: string) => void;
  isEditing?: boolean;
}

export function EventCard({ event, onEdit, onDelete, isEditing }: EventCardProps) {
  return (
    <div className={`${styles.card} ${isEditing ? styles.editing : ''}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>{event.title}</h3>
        {(onEdit || onDelete) && (
          <div className={styles.actions}>
            {onEdit && (
              <button 
                onClick={() => onEdit(event)}
                className={styles.editButton}
                aria-label="Edit event"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button 
                onClick={() => onDelete(event.id)}
                className={styles.deleteButton}
                aria-label="Delete event"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {event.description && (
        <p className={styles.description}>{event.description}</p>
      )}

      <div className={styles.details}>
        {event.location && (
          <div className={styles.detail}>
            <span className={styles.icon}>📍</span>
            <span>{event.location}</span>
          </div>
        )}

        {(event.startTime || event.endTime) && (
          <div className={styles.detail}>
            <span className={styles.icon}>🕐</span>
            <span>
              {event.startTime} {event.endTime && `- ${event.endTime}`}
            </span>
          </div>
        )}

        {event.duration && (
          <div className={styles.detail}>
            <span className={styles.icon}>⏱️</span>
            <span>{event.duration} minutes</span>
          </div>
        )}
      </div>

      {event.notes && (
        <div className={styles.notes}>
          <strong>Notes:</strong> {event.notes}
        </div>
      )}

      {event.tags && event.tags.length > 0 && (
        <div className={styles.tags}>
          {event.tags.map((tag, index) => (
            <span key={index} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
