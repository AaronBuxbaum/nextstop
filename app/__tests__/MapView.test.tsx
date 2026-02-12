import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MapView } from '@/components/MapView';
import type { Event } from '@/types';

describe('MapView Component', () => {
  const mockEvents: Event[] = [
    {
      id: '1',
      title: 'Morning Coffee',
      description: 'Start the day at a cafe',
      location: 'Corner Cafe, Main St',
      startTime: '09:00',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      title: 'Museum Visit',
      description: 'Visit the art museum',
      location: 'City Museum',
      startTime: '10:30',
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
    {
      id: '4',
      title: 'Free Time',
      description: 'No location',
      location: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it('shows empty state when no events have locations', () => {
    const noLocationEvents: Event[] = [
      {
        id: '1',
        title: 'Event',
        description: '',
        location: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    render(<MapView events={noLocationEvents} />);
    expect(screen.getByText('Add locations to your events to see them on the map.')).toBeInTheDocument();
  });

  it('shows empty state when events array is empty', () => {
    render(<MapView events={[]} />);
    expect(screen.getByText('Add locations to your events to see them on the map.')).toBeInTheDocument();
  });

  it('renders legend with numbered markers for events with locations', () => {
    render(<MapView events={mockEvents} />);

    // Should show numbered markers for events with locations (indices 0, 1, 2)
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows event titles and locations in the legend', () => {
    render(<MapView events={mockEvents} />);

    expect(screen.getByText(/Morning Coffee — Corner Cafe, Main St/)).toBeInTheDocument();
    expect(screen.getByText(/Museum Visit — City Museum/)).toBeInTheDocument();
    expect(screen.getByText(/Lunch — Restaurant/)).toBeInTheDocument();
  });

  it('filters out events without locations', () => {
    render(<MapView events={mockEvents} />);

    // "Free Time" has no location, so should not appear in legend
    expect(screen.queryByText(/Free Time/)).not.toBeInTheDocument();
  });

  it('renders map iframe when events have locations', () => {
    render(<MapView events={mockEvents} />);
    const iframe = screen.getByTitle('Itinerary map');
    expect(iframe).toBeInTheDocument();
  });

  it('has accessible labels', () => {
    render(<MapView events={mockEvents} />);
    expect(screen.getByLabelText('Map view of itinerary')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Map locations' })).toBeInTheDocument();
  });

  it('applies optional marker style for optional events', () => {
    const { container } = render(<MapView events={mockEvents} />);
    const optionalMarkers = container.querySelectorAll('[class*="legendMarkerOptional"]');
    expect(optionalMarkers.length).toBe(1);
  });
});
