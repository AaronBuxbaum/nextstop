import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Timeline } from '@/components/Timeline';
import type { Event } from '@/types';

describe('Timeline Component', () => {
  const mockEvents: Event[] = [
    {
      id: '1',
      title: 'Morning Coffee',
      description: 'Start the day at a cafe',
      location: 'Corner Cafe',
      startTime: '09:00',
      endTime: '10:00',
      duration: 60,
      notes: 'Try their specialty blend',
      tags: ['coffee', 'morning'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      title: 'Museum Visit',
      description: 'Visit the art museum',
      location: 'City Museum',
      startTime: '10:30',
      duration: 120,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      title: 'Lunch',
      description: 'Optional lunch',
      location: 'Restaurant',
      isOptional: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it('renders all events in the timeline', () => {
    render(<Timeline events={mockEvents} />);
    expect(screen.getByText('Morning Coffee')).toBeInTheDocument();
    expect(screen.getByText('Museum Visit')).toBeInTheDocument();
    expect(screen.getByText('Lunch')).toBeInTheDocument();
  });

  it('renders event numbers', () => {
    render(<Timeline events={mockEvents} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows time information when available', () => {
    render(<Timeline events={mockEvents} />);
    expect(screen.getByText(/09:00.*10:00/)).toBeInTheDocument();
    expect(screen.getByText(/10:30/)).toBeInTheDocument();
  });

  it('shows location information when available', () => {
    render(<Timeline events={mockEvents} />);
    expect(screen.getByText(/Corner Cafe/)).toBeInTheDocument();
    expect(screen.getByText(/City Museum/)).toBeInTheDocument();
  });

  it('shows duration when available', () => {
    render(<Timeline events={mockEvents} />);
    expect(screen.getByText(/60 min/)).toBeInTheDocument();
    expect(screen.getByText(/120 min/)).toBeInTheDocument();
  });

  it('shows optional badge for optional events', () => {
    render(<Timeline events={mockEvents} />);
    expect(screen.getByText('Optional')).toBeInTheDocument();
  });

  it('renders empty state when no events', () => {
    render(<Timeline events={[]} />);
    expect(screen.getByText('No events to display on the timeline.')).toBeInTheDocument();
  });

  it('has proper ARIA attributes', () => {
    render(<Timeline events={mockEvents} />);
    expect(screen.getByRole('list', { name: /event timeline/i })).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
  });

  it('applies optional class to optional events', () => {
    const { container } = render(<Timeline events={mockEvents} />);
    const optionalItems = container.querySelectorAll('[class*="optional"]');
    expect(optionalItems.length).toBeGreaterThan(0);
  });

  it('shows event description', () => {
    render(<Timeline events={mockEvents} />);
    expect(screen.getByText('Start the day at a cafe')).toBeInTheDocument();
    expect(screen.getByText('Visit the art museum')).toBeInTheDocument();
  });

  it('shows event notes when available', () => {
    render(<Timeline events={mockEvents} />);
    expect(screen.getByText(/Try their specialty blend/)).toBeInTheDocument();
  });

  it('shows event tags when available', () => {
    render(<Timeline events={mockEvents} />);
    expect(screen.getByText('coffee')).toBeInTheDocument();
    expect(screen.getByText('morning')).toBeInTheDocument();
  });

  it('shows edit button when onEdit prop is provided', () => {
    const onEdit = vi.fn();
    render(<Timeline events={mockEvents} onEdit={onEdit} />);
    const editButtons = screen.getAllByRole('button', { name: /edit event/i });
    expect(editButtons.length).toBe(3);
  });

  it('shows delete button when onDelete prop is provided', () => {
    const onDelete = vi.fn();
    render(<Timeline events={mockEvents} onDelete={onDelete} />);
    const deleteButtons = screen.getAllByRole('button', { name: /delete event/i });
    expect(deleteButtons.length).toBe(3);
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<Timeline events={mockEvents} onEdit={onEdit} />);
    const editButtons = screen.getAllByRole('button', { name: /edit event/i });
    fireEvent.click(editButtons[0]);
    expect(onEdit).toHaveBeenCalledWith(mockEvents[0]);
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(<Timeline events={mockEvents} onDelete={onDelete} />);
    const deleteButtons = screen.getAllByRole('button', { name: /delete event/i });
    fireEvent.click(deleteButtons[0]);
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('shows optional toggle button when onToggleOptional is provided', () => {
    const onToggleOptional = vi.fn();
    render(<Timeline events={mockEvents} onToggleOptional={onToggleOptional} />);
    const optionalButtons = screen.getAllByRole('button', { name: /mark as/i });
    expect(optionalButtons.length).toBe(3);
  });

  it('shows drag handle when onDragStart is provided', () => {
    const onDragStart = vi.fn();
    render(<Timeline events={mockEvents} onDragStart={onDragStart} />);
    const dragHandles = screen.getAllByLabelText('Drag handle');
    expect(dragHandles.length).toBe(3);
  });

  it('shows map link for events with locations', () => {
    render(<Timeline events={mockEvents} />);
    const mapLinks = screen.getAllByLabelText(/view .* on google maps/i);
    expect(mapLinks.length).toBe(3);
  });
});
