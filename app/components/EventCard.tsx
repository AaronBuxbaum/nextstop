'use client';

import { Event } from '@/types';
import { calculateDuration, calculateEndTime } from '@/lib/timeUtils';
import { simplifyAddress } from '@/lib/addressUtils';
import styles from './EventCard.module.css';
import React from 'react';
import { WeatherInfo } from './WeatherInfo';

interface DragHandleProps {
  onDragStart: (e: React.DragEvent) => void;
}

interface EventCardProps {
  event: Event;
  planDate?: string; // Plan date in YYYY-MM-DD format
  onEdit?: (event: Event) => void;
  onDelete?: (eventId: string) => void;
  onToggleOptional?: (eventId: string, isOptional: boolean) => void;
  isEditing?: boolean;
  isDragging?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  dragHandleProps?: DragHandleProps;
}

export function EventCard({
  event,
  planDate,
  onEdit,
  onDelete,
  onToggleOptional,
  isEditing,
  isDragging,
  onDragOver,
  onDrop,
  onDragEnd,
  dragHandleProps,
}: EventCardProps) {
  const mapsUrl = event.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
    : null;

  // Derive missing time fields for display
  let displayEndTime = event.endTime;
  let displayDuration = event.duration;

  if (event.startTime && event.endTime && !displayDuration) {
    const derived = calculateDuration(event.startTime, event.endTime);
    if (derived !== null) displayDuration = derived;
  }
  if (event.startTime && displayDuration && !displayEndTime) {
    displayEndTime = calculateEndTime(event.startTime, displayDuration) ?? undefined;
  }

  return (
    <div
      className={`${styles.card} ${isEditing ? styles.editing : ''} ${isDragging ? styles.dragging : ''} ${event.isOptional ? styles.optional : ''}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {dragHandleProps && (
            <span
              className={styles.dragHandle}
              draggable="true"
              onDragStart={dragHandleProps.onDragStart}
              title="Drag to reorder"
              aria-label="Drag handle"
            >
              ⠿
            </span>
          )}
          <h3 className={styles.title}>{event.title}</h3>
          {event.isOptional && (
            <span className={styles.optionalBadge}>Optional</span>
          )}
        </div>
        {(onEdit || onDelete || onToggleOptional) && (
          <div className={styles.actions}>
            {onToggleOptional && (
              <button
                onClick={() => onToggleOptional(event.id, !event.isOptional)}
                className={styles.optionalButton}
                aria-label={event.isOptional ? 'Mark as required' : 'Mark as optional'}
              >
                {event.isOptional ? '★ Required' : '☆ Optional'}
              </button>
            )}
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
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.addressLink}
                title={event.location}
                aria-label={`View ${event.location} on Google Maps`}
              >
                {simplifyAddress(event.location)}
              </a>
            ) : (
              <span title={event.location}>{simplifyAddress(event.location)}</span>
            )}
          </div>
        )}

        {(event.startTime || displayEndTime) && (
          <div className={styles.detail}>
            <span className={styles.icon}>🕐</span>
            <span>
              {event.startTime} {displayEndTime && `- ${displayEndTime}`}
            </span>
          </div>
        )}

        {displayDuration && (
          <div className={styles.detail}>
            <span className={styles.icon}>⏱️</span>
            <span>{displayDuration} minutes</span>
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
