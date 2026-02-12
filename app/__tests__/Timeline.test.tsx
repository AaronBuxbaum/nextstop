import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
