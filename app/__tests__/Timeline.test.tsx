import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Timeline } from '@/components/Timeline';
import type { Event } from '@/types';

// Mock WeatherInfo and TravelTime to avoid external API calls
vi.mock('@/components/WeatherInfo', () => ({
  WeatherInfo: () => (
    <span data-testid="weather-info">Weather</span>
  ),
}));

vi.mock('@/components/TravelTime', () => ({
  TravelTime: ({ timeBetween }: { 
    fromLocation: string; 
    toLocation: string;
    timeBetween?: number;
  }) => (
    <span data-testid="travel-time">Travel time{timeBetween ? ` (${timeBetween}min)` : ''}</span>
  ),
}));

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

  it('passes planDate to weather component', () => {
    const planDate = '2024-07-15';
    render(<Timeline events={mockEvents} planDate={planDate} />);
    // WeatherInfo should be rendered (mocked)
    expect(screen.getAllByTestId('weather-info').length).toBeGreaterThan(0);
  });

  it('shows travel time between consecutive events with locations', () => {
    render(<Timeline events={mockEvents} />);
    // Should show travel times between events (mocked)
    const travelTimes = screen.getAllByTestId('travel-time');
    expect(travelTimes.length).toBeGreaterThan(0);
  });

  it('calculates time between events when times are available', () => {
    const eventsWithTimes: Event[] = [
      {
        id: '1',
        title: 'Event 1',
        description: 'First event',
        location: 'Location 1',
        startTime: '09:00',
        endTime: '10:00',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        title: 'Event 2',
        description: 'Second event',
        location: 'Location 2',
        startTime: '10:30',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    render(<Timeline events={eventsWithTimes} />);
    // Check that travel time component is rendered with time between
    const travelTime = screen.getByTestId('travel-time');
    expect(travelTime).toHaveTextContent('30min'); // 30 minutes between 10:00 and 10:30
  });

  it('derives duration from start and end time in timeline', () => {
    const eventsWithDerivedDuration: Event[] = [
      {
        id: '1',
        title: 'Event With Derivable Duration',
        description: '',
        location: '',
        startTime: '09:00',
        endTime: '10:30',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    render(<Timeline events={eventsWithDerivedDuration} />);
    expect(screen.getByText(/90 min/)).toBeInTheDocument();
  });

  it('derives end time from start time and duration in timeline', () => {
    const eventsWithDerivedEnd: Event[] = [
      {
        id: '1',
        title: 'Event With Derivable End',
        description: '',
        location: '',
        startTime: '14:00',
        duration: 120,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    render(<Timeline events={eventsWithDerivedEnd} />);
    expect(screen.getByText(/14:00.*16:00/)).toBeInTheDocument();
    expect(screen.getByText(/120 min/)).toBeInTheDocument();
  });
});
