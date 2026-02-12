'use client';

import React from 'react';
import { Event } from '@/types';
import { parseTimeString } from '@/lib/timeUtils';
import { WeatherInfo } from './WeatherInfo';
import { TravelTime } from './TravelTime';
import styles from './Timeline.module.css';

interface TimelineProps {
  events: Event[];
  planDate?: string; // Plan date in YYYY-MM-DD format
  onEventClick?: (event: Event) => void;
  onEdit?: (event: Event) => void;
  onDelete?: (eventId: string) => void;
  onToggleOptional?: (eventId: string, isOptional: boolean) => void;
  onDragStart?: (eventId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (eventId: string) => void;
  onDragEnd?: () => void;
  draggedEventId?: string | null;
  editingEventId?: string | null;
}

// Calculate time between two consecutive events
function calculateTimeBetween(currentEvent: Event, nextEvent: Event): number | undefined {
  // Calculate time between events if both have times
  if (currentEvent.endTime && nextEvent.startTime) {
    const endMinutes = parseTimeString(currentEvent.endTime);
    const startMinutes = parseTimeString(nextEvent.startTime);
    
    if (endMinutes !== null && startMinutes !== null) {
      const timeBetween = startMinutes - endMinutes;
      // Note: Negative values indicate next-day events, which we don't currently support
      // For multi-day plans, consider using full date-time values instead of just times
      if (timeBetween >= 0) return timeBetween;
    }
  } else if (currentEvent.startTime && currentEvent.duration && nextEvent.startTime) {
    // Calculate using start time + duration
    const startMinutes = parseTimeString(currentEvent.startTime);
    const nextStartMinutes = parseTimeString(nextEvent.startTime);
    
    if (startMinutes !== null && nextStartMinutes !== null) {
      const endMinutes = startMinutes + currentEvent.duration;
      const timeBetween = nextStartMinutes - endMinutes;
      
      if (timeBetween >= 0) return timeBetween;
    }
  }
  
  return undefined;
}

export function Timeline({
  events,
  planDate,
  onEventClick,
  onEdit,
  onDelete,
  onToggleOptional,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  draggedEventId,
  editingEventId,
}: TimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No events to display on the timeline.</p>
      </div>
    );
  }

  return (
    <div className={styles.container} role="list" aria-label="Event timeline">
      {events.map((event, index) => {
        const mapsUrl = event.location
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
          : null;

        return (
          <React.Fragment key={event.id}>
            <div
              className={`${styles.item} ${event.isOptional ? styles.optional : ''} ${draggedEventId === event.id ? styles.dragging : ''} ${editingEventId === event.id ? styles.editing : ''}`}
              role="listitem"
              onClick={() => onEventClick?.(event)}
              tabIndex={onEventClick ? 0 : undefined}
              onKeyDown={(e) => {
                if (onEventClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onEventClick(event);
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                onDragOver?.(e);
              }}
              onDrop={() => onDrop?.(event.id)}
              onDragEnd={onDragEnd}
            >
              <div className={styles.marker}>
                <div className={styles.dot}>
                  <span className={styles.number}>{index + 1}</span>
                </div>
                {index < events.length - 1 && <div className={styles.line} />}
              </div>
              <div className={styles.content}>
                <div className={styles.header}>
                  <div className={styles.headerLeft}>
                    {onDragStart && (
                      <span
                        className={styles.dragHandle}
                        draggable="true"
                        onDragStart={() => onDragStart(event.id)}
                        title="Drag to reorder"
                        aria-label="Drag handle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        ⠿
                      </span>
                    )}
                    <h4 className={styles.title}>{event.title}</h4>
                    {event.isOptional && (
                      <span className={styles.optionalBadge}>Optional</span>
                    )}
                  </div>
                  {(onEdit || onDelete || onToggleOptional) && (
                    <div className={styles.actions}>
                      {onToggleOptional && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleOptional(event.id, !event.isOptional);
                          }}
                          className={styles.optionalButton}
                          aria-label={event.isOptional ? 'Mark as required' : 'Mark as optional'}
                        >
                          {event.isOptional ? '★ Required' : '☆ Optional'}
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(event);
                          }}
                          className={styles.editButton}
                          aria-label="Edit event"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(event.id);
                          }}
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
                      <span className={styles.detailIcon}>📍</span>
                      <span>{event.location}</span>
                      {mapsUrl && (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.mapLink}
                          aria-label={`View ${event.location} on Google Maps`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          🗺️ Map
                        </a>
                      )}
                    </div>
                  )}
                  {(event.startTime || event.endTime) && (
                    <div className={styles.detail}>
                      <span className={styles.detailIcon}>🕐</span>
                      <span>
                        {event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}
                      </span>
                    </div>
                  )}
                  {event.duration && (
                    <div className={styles.detail}>
                      <span className={styles.detailIcon}>⏱️</span>
                      <span>{event.duration} min</span>
                    </div>
                  )}
                  {event.location && (
                    <div className={styles.detail}>
                      <WeatherInfo 
                        location={event.location}
                        date={planDate}
                        time={event.startTime}
                      />
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
                    {event.tags.map((tag, tagIndex) => (
                      <span key={tagIndex} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Travel time between consecutive events with locations */}
            {index < events.length - 1 &&
              event.location &&
              events[index + 1].location && (
                <div className={styles.travelTimeRow}>
                  <div className={styles.travelTimeMarker} />
                  <TravelTime
                    fromLocation={event.location}
                    toLocation={events[index + 1].location}
                    timeBetween={calculateTimeBetween(event, events[index + 1])}
                  />
                </div>
              )
            }
          </React.Fragment>
        );
      })}
    </div>
  );
}
