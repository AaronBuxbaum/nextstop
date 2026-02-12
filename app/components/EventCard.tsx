'use client';

import { Event } from '@/types';
import styles from './EventCard.module.css';
import React from 'react';

interface DragHandleProps {
  onDragStart: (e: React.DragEvent) => void;
}

interface EventCardProps {
  event: Event;
  onEdit?: (event: Event) => void;
  onDelete?: (eventId: string) => void;
  isEditing?: boolean;
  isDragging?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  dragHandleProps?: DragHandleProps;
}

export function EventCard({
  event,
  onEdit,
  onDelete,
  isEditing,
  isDragging,
  onDragOver,
  onDrop,
  onDragEnd,
  dragHandleProps,
}: EventCardProps) {
  return (
    <div
      className={`${styles.card} ${isEditing ? styles.editing : ''} ${isDragging ? styles.dragging : ''}`}
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
        </div>
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
