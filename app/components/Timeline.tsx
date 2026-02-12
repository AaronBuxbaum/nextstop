'use client';

import { Event } from '@/types';
import styles from './Timeline.module.css';

interface TimelineProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
}

export function Timeline({ events, onEventClick }: TimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No events to display on the timeline.</p>
      </div>
    );
  }

  return (
    <div className={styles.container} role="list" aria-label="Event timeline">
      {events.map((event, index) => (
        <div
          key={event.id}
          className={`${styles.item} ${event.isOptional ? styles.optional : ''}`}
          role="listitem"
          onClick={() => onEventClick?.(event)}
          tabIndex={onEventClick ? 0 : undefined}
          onKeyDown={(e) => {
            if (onEventClick && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onEventClick(event);
            }
          }}
        >
          <div className={styles.marker}>
            <div className={styles.dot}>
              <span className={styles.number}>{index + 1}</span>
            </div>
            {index < events.length - 1 && <div className={styles.line} />}
          </div>
          <div className={styles.content}>
            <div className={styles.header}>
              <h4 className={styles.title}>{event.title}</h4>
              {event.isOptional && (
                <span className={styles.optionalBadge}>Optional</span>
              )}
            </div>
            {event.startTime && (
              <span className={styles.time}>
                🕐 {event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}
              </span>
            )}
            {event.duration && (
              <span className={styles.duration}>⏱️ {event.duration} min</span>
            )}
            {event.location && (
              <span className={styles.location}>📍 {event.location}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
