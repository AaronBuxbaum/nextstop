import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventCard } from '@/components/EventCard';
import type { Event } from '@/types';

// Mock WeatherInfo to avoid external API calls in tests
vi.mock('@/components/WeatherInfo', () => ({
  WeatherInfo: ({ location, date, time }: { location: string; date?: string; time?: string }) => (
    <span data-testid="weather-info">
      Weather for {location}
      {date && ` on ${date}`}
      {time && ` at ${time}`}
    </span>
  ),
}));

describe('EventCard - New Features', () => {
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

  it('shows optional badge when event is optional', () => {
    const optionalEvent = { ...mockEvent, isOptional: true };
    render(<EventCard event={optionalEvent} />);
    expect(screen.getByText('Optional')).toBeInTheDocument();
  });

  it('does not show optional badge when event is not optional', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.queryByText('Optional')).not.toBeInTheDocument();
  });

  it('applies optional class when event is optional', () => {
    const optionalEvent = { ...mockEvent, isOptional: true };
    const { container } = render(<EventCard event={optionalEvent} />);
    const card = container.querySelector('[class*="card"]');
    expect(card?.className).toMatch(/optional/);
  });

  it('shows toggle optional button when onToggleOptional is provided', () => {
    const onToggleOptional = vi.fn();
    render(<EventCard event={mockEvent} onToggleOptional={onToggleOptional} />);
    expect(screen.getByRole('button', { name: /mark as optional/i })).toBeInTheDocument();
  });

  it('calls onToggleOptional when toggle button is clicked', async () => {
    const onToggleOptional = vi.fn();
    const user = userEvent.setup();
    render(<EventCard event={mockEvent} onToggleOptional={onToggleOptional} />);
    await user.click(screen.getByRole('button', { name: /mark as optional/i }));
    expect(onToggleOptional).toHaveBeenCalledWith('1', true);
  });

  it('shows "Required" label when event is already optional', () => {
    const optionalEvent = { ...mockEvent, isOptional: true };
    const onToggleOptional = vi.fn();
    render(<EventCard event={optionalEvent} onToggleOptional={onToggleOptional} />);
    expect(screen.getByRole('button', { name: /mark as required/i })).toBeInTheDocument();
  });

  it('renders Google Maps link for events with location', () => {
    render(<EventCard event={mockEvent} />);
    const mapLink = screen.getByRole('link', { name: /view.*on google maps/i });
    expect(mapLink).toBeInTheDocument();
    expect(mapLink).toHaveAttribute('href', expect.stringContaining('google.com/maps'));
    expect(mapLink).toHaveAttribute('target', '_blank');
    expect(mapLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('does not render Google Maps link for events without location', () => {
    const noLocationEvent = { ...mockEvent, location: '' };
    render(<EventCard event={noLocationEvent} />);
    expect(screen.queryByRole('link', { name: /google maps/i })).not.toBeInTheDocument();
  });

  it('renders weather info for events with location', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByTestId('weather-info')).toBeInTheDocument();
  });

  it('passes plan date and event time to weather component', () => {
    const planDate = '2024-07-15';
    render(<EventCard event={mockEvent} planDate={planDate} />);
    const weatherInfo = screen.getByTestId('weather-info');
    expect(weatherInfo).toHaveTextContent('on 2024-07-15');
    expect(weatherInfo).toHaveTextContent('at 09:00');
  });
});
