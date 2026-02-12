import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventCard } from '@/components/EventCard';
import type { Event } from '@/types';

describe('EventCard Drag and Edit Features', () => {
  const mockEvent: Event = {
    id: 'event-1',
    title: 'Morning Coffee',
    description: 'Start the day at a cozy cafe',
    location: 'Corner Cafe',
    startTime: '09:00',
    endTime: '10:00',
    duration: 60,
    notes: 'Try their specialty blend',
    tags: ['coffee', 'morning'],
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('renders drag handle when dragHandleProps is provided', () => {
    const onDragStart = vi.fn();
    render(
      <EventCard
        event={mockEvent}
        dragHandleProps={{ onDragStart }}
      />
    );
    expect(screen.getByTitle('Drag to reorder')).toBeInTheDocument();
  });

  it('does not render drag handle when dragHandleProps is not provided', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.queryByTitle('Drag to reorder')).not.toBeInTheDocument();
  });

  it('applies dragging class when isDragging is true', () => {
    const { container } = render(<EventCard event={mockEvent} isDragging={true} />);
    const card = container.querySelector('[class*="card"]');
    expect(card?.className).toMatch(/dragging/);
  });

  it('does not apply dragging class when isDragging is false', () => {
    const { container } = render(<EventCard event={mockEvent} isDragging={false} />);
    const card = container.querySelector('[class*="card"]');
    expect(card?.className).not.toMatch(/dragging/);
  });

  it('calls onDragOver handler', () => {
    const onDragOver = vi.fn();
    const { container } = render(
      <EventCard event={mockEvent} onDragOver={onDragOver} />
    );
    const card = container.querySelector('[class*="card"]');
    fireEvent.dragOver(card!);
    expect(onDragOver).toHaveBeenCalled();
  });

  it('calls onDrop handler', () => {
    const onDrop = vi.fn();
    const { container } = render(
      <EventCard event={mockEvent} onDrop={onDrop} />
    );
    const card = container.querySelector('[class*="card"]');
    fireEvent.drop(card!);
    expect(onDrop).toHaveBeenCalled();
  });

  it('calls onDragEnd handler', () => {
    const onDragEnd = vi.fn();
    const { container } = render(
      <EventCard event={mockEvent} onDragEnd={onDragEnd} />
    );
    const card = container.querySelector('[class*="card"]');
    fireEvent.dragEnd(card!);
    expect(onDragEnd).toHaveBeenCalled();
  });

  it('calls onEdit when edit button is clicked', async () => {
    const onEdit = vi.fn();
    render(<EventCard event={mockEvent} onEdit={onEdit} />);
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith(mockEvent);
  });
});
