import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AIGenerateModal } from '@/components/AIGenerateModal';

describe('AIGenerateModal Component', () => {
  const mockOptions = [
    {
      event: {
        title: 'Cozy Coffee Corner',
        description: 'A quiet café with rustic charm',
        location: '123 Main St',
        startTime: '10:30',
        duration: 30,
        notes: null,
      },
      placement: {
        strategy: 'after',
        referenceEvent: 'Museum Visit',
        explanation: 'Placed after the museum visit for a relaxing break',
      },
      style: 'Cozy & Intimate',
    },
    {
      event: {
        title: 'Urban Brew Lab',
        description: 'Trendy specialty coffee spot',
        location: '456 Broadway',
        startTime: '11:00',
        duration: 45,
        notes: null,
      },
      placement: {
        strategy: 'after',
        referenceEvent: 'Museum Visit',
        explanation: 'Placed after the museum for a premium coffee experience',
      },
      style: 'Trendy & Upscale',
    },
    {
      event: {
        title: 'Quick Coffee Stop',
        description: 'Fast grab-and-go coffee',
        location: '789 Park Ave',
        startTime: '10:15',
        duration: 15,
        notes: null,
      },
      placement: {
        strategy: 'after',
        referenceEvent: 'Museum Visit',
        explanation: 'Quick stop after the museum',
      },
      style: 'Quick & Casual',
    },
  ];

  const mockOnSelect = vi.fn();
  const mockOnClose = vi.fn();

  it('renders all 3 options', () => {
    render(
      <AIGenerateModal
        options={mockOptions}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Cozy Coffee Corner')).toBeInTheDocument();
    expect(screen.getByText('Urban Brew Lab')).toBeInTheDocument();
    expect(screen.getByText('Quick Coffee Stop')).toBeInTheDocument();
  });

  it('renders the modal header', () => {
    render(
      <AIGenerateModal
        options={mockOptions}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('✨ Choose an Option')).toBeInTheDocument();
    expect(screen.getByText(/We generated 3 options/)).toBeInTheDocument();
  });

  it('displays style badges', () => {
    render(
      <AIGenerateModal
        options={mockOptions}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Cozy & Intimate')).toBeInTheDocument();
    expect(screen.getByText('Trendy & Upscale')).toBeInTheDocument();
    expect(screen.getByText('Quick & Casual')).toBeInTheDocument();
  });

  it('displays event details (location, time, duration)', () => {
    render(
      <AIGenerateModal
        options={mockOptions}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByText('10:30')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
  });

  it('displays placement explanations', () => {
    render(
      <AIGenerateModal
        options={mockOptions}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Placed after the museum visit for a relaxing break')).toBeInTheDocument();
  });

  it('calls onSelect with the correct option when select button is clicked', () => {
    render(
      <AIGenerateModal
        options={mockOptions}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    const selectButtons = screen.getAllByText('Select This Option');
    expect(selectButtons).toHaveLength(3);

    fireEvent.click(selectButtons[1]); // Click second option
    expect(mockOnSelect).toHaveBeenCalledWith(mockOptions[1]);
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <AIGenerateModal
        options={mockOptions}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close modal/i });
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('has proper ARIA attributes for modal', () => {
    render(
      <AIGenerateModal
        options={mockOptions}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-label', 'Select AI generated event');
  });

  it('renders select buttons with accessible labels', () => {
    render(
      <AIGenerateModal
        options={mockOptions}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByRole('button', { name: /select cozy coffee corner/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /select urban brew lab/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /select quick coffee stop/i })).toBeInTheDocument();
  });

  it('handles options without optional fields gracefully', () => {
    const minimalOptions = [
      {
        event: {
          title: 'Simple Event',
          description: undefined,
          location: undefined,
          startTime: null,
          duration: null,
          notes: null,
        },
        placement: {
          strategy: 'end',
          referenceEvent: null,
          explanation: 'Added at the end',
        },
        style: 'Basic',
      },
    ];

    render(
      <AIGenerateModal
        options={minimalOptions}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Simple Event')).toBeInTheDocument();
    expect(screen.getByText('Basic')).toBeInTheDocument();
    // Should not render location, time, or duration details
    expect(screen.queryByText('📍')).not.toBeInTheDocument();
  });
});
