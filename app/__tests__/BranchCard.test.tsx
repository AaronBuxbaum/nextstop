import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BranchCard } from '@/components/BranchCard';
import type { Branch, Event } from '@/types';

describe('BranchCard Component', () => {
  const mockEvents: Event[] = [
    {
      id: 'event-1',
      title: 'Morning Coffee',
      description: 'Start the day',
      location: 'Cafe',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'event-2',
      title: 'Lunch',
      description: 'Eat lunch',
      location: 'Restaurant',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockBranch: Branch = {
    id: 'branch-1',
    title: 'Weather Decision',
    description: 'Choose based on weather',
    options: [
      {
        id: 'option-1',
        label: 'Sunny Path',
        description: 'If the weather is nice',
        events: [],
        decisionLogic: {
          id: 'logic-1',
          type: 'weather',
          condition: 'If sunny',
        },
      },
    ],
    previousEventId: 'event-1',
    nextEventId: 'event-2',
  };

  it('renders branch title', () => {
    render(<BranchCard branch={mockBranch} events={mockEvents} />);
    expect(screen.getByText('Weather Decision')).toBeInTheDocument();
  });

  it('renders branch description', () => {
    render(<BranchCard branch={mockBranch} events={mockEvents} />);
    expect(screen.getByText('Choose based on weather')).toBeInTheDocument();
  });

  it('renders connected events', () => {
    render(<BranchCard branch={mockBranch} events={mockEvents} />);
    expect(screen.getByText('Morning Coffee')).toBeInTheDocument();
    expect(screen.getByText('Lunch')).toBeInTheDocument();
  });

  it('renders branch options', () => {
    render(<BranchCard branch={mockBranch} events={mockEvents} />);
    expect(screen.getByText('Sunny Path')).toBeInTheDocument();
  });

  it('renders decision logic type and condition', () => {
    render(<BranchCard branch={mockBranch} events={mockEvents} />);
    expect(screen.getByText('weather')).toBeInTheDocument();
    expect(screen.getByText('If sunny')).toBeInTheDocument();
  });

  it('shows delete button when onDeleteBranch is provided', () => {
    const onDelete = vi.fn();
    render(<BranchCard branch={mockBranch} events={mockEvents} onDeleteBranch={onDelete} />);
    expect(screen.getByRole('button', { name: /delete branch/i })).toBeInTheDocument();
  });

  it('calls onDeleteBranch when delete is clicked', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(<BranchCard branch={mockBranch} events={mockEvents} onDeleteBranch={onDelete} />);
    await user.click(screen.getByRole('button', { name: /delete branch/i }));
    expect(onDelete).toHaveBeenCalledWith('branch-1');
  });

  it('shows add option button when onAddOption is provided', () => {
    const onAddOption = vi.fn();
    render(<BranchCard branch={mockBranch} events={mockEvents} onAddOption={onAddOption} />);
    expect(screen.getByText('+ Add Option')).toBeInTheDocument();
  });

  it('calls onAddOption when add option is clicked', async () => {
    const onAddOption = vi.fn();
    const user = userEvent.setup();
    render(<BranchCard branch={mockBranch} events={mockEvents} onAddOption={onAddOption} />);
    await user.click(screen.getByText('+ Add Option'));
    expect(onAddOption).toHaveBeenCalledWith('branch-1');
  });

  it('handles branch with no options', () => {
    const branchNoOptions: Branch = {
      ...mockBranch,
      options: [],
    };
    render(<BranchCard branch={branchNoOptions} events={mockEvents} />);
    expect(screen.getByText('No options yet')).toBeInTheDocument();
  });

  it('handles branch with no connected events', () => {
    const branchNoConnections: Branch = {
      ...mockBranch,
      previousEventId: undefined,
      nextEventId: undefined,
    };
    render(<BranchCard branch={branchNoConnections} events={mockEvents} />);
    const noneElements = screen.getAllByText('None');
    expect(noneElements.length).toBe(2);
  });
});
