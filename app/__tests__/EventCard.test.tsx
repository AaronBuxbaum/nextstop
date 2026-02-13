import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EventCard } from '@/components/EventCard';
import type { Event } from '@/types';

describe('EventCard Component', () => {
  const mockEvent: Event = {
    id: '1',
    title: 'Morning Coffee',
    description: 'Start the day at a cozy cafe',
    location: 'Corner Cafe',
    startTime: '09:00',
    endTime: '10:00',
    duration: 60,
    notes: 'Try their specialty blend',
    tags: ['coffee', 'morning'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('renders event title', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('Morning Coffee')).toBeInTheDocument();
  });

  it('renders event description', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('Start the day at a cozy cafe')).toBeInTheDocument();
  });

  it('renders event location', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('Corner Cafe')).toBeInTheDocument();
  });

  it('renders event time', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText(/09:00.*10:00/)).toBeInTheDocument();
  });

  it('renders event duration', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('60 minutes')).toBeInTheDocument();
  });

  it('renders event notes', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText(/Try their specialty blend/)).toBeInTheDocument();
  });

  it('renders event tags', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('coffee')).toBeInTheDocument();
    expect(screen.getByText('morning')).toBeInTheDocument();
  });

  it('shows edit button when onEdit prop is provided', () => {
    const onEdit = () => {};
    render(<EventCard event={mockEvent} onEdit={onEdit} />);
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  it('shows delete button when onDelete prop is provided', () => {
    const onDelete = () => {};
    render(<EventCard event={mockEvent} onDelete={onDelete} />);
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('does not show action buttons when no handlers provided', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('applies editing class when isEditing is true', () => {
    const { container } = render(<EventCard event={mockEvent} isEditing={true} />);
    const card = container.querySelector('[class*="card"]');
    expect(card?.className).toMatch(/editing/);
  });

  it('handles minimal event data', () => {
    const minimalEvent: Event = {
      id: '2',
      title: 'Simple Event',
      description: '',
      location: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    render(<EventCard event={minimalEvent} />);
    expect(screen.getByText('Simple Event')).toBeInTheDocument();
  });

  it('derives duration from start and end time when duration is missing', () => {
    const eventWithoutDuration: Event = {
      id: '3',
      title: 'Derived Duration',
      description: '',
      location: '',
      startTime: '09:00',
      endTime: '10:30',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    render(<EventCard event={eventWithoutDuration} />);
    expect(screen.getByText('90 minutes')).toBeInTheDocument();
  });

  it('derives end time from start time and duration when end time is missing', () => {
    const eventWithoutEndTime: Event = {
      id: '4',
      title: 'Derived End Time',
      description: '',
      location: '',
      startTime: '14:00',
      duration: 120,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    render(<EventCard event={eventWithoutEndTime} />);
    expect(screen.getByText(/14:00.*16:00/)).toBeInTheDocument();
    expect(screen.getByText('120 minutes')).toBeInTheDocument();
  });
});
