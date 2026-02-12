import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TravelTime } from '@/components/TravelTime';

describe('TravelTime Component', () => {
  it('shows loading state initially', () => {
    render(<TravelTime fromLocation="New York" toLocation="Boston" />);
    expect(screen.getByText('Calculating travel time...')).toBeInTheDocument();
  });

  it('renders without crashing', () => {
    const { container } = render(
      <TravelTime fromLocation="Central Park, New York" toLocation="Times Square, New York" />
    );
    expect(container).toBeTruthy();
  });
});
