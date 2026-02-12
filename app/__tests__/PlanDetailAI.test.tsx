import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useParams } from 'next/navigation';
import PlanDetailPage from '@/app/plans/[id]/page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
}));

describe('PlanDetailPage - AI Generation', () => {
  beforeEach(() => {
    vi.mocked(useParams).mockReturnValue({ id: 'plan-1' });
  });

  it('should show AI Generate button', async () => {
    render(<PlanDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Weekend Adventure')).toBeInTheDocument();
    });

    // Check for AI Generate button
    const aiGenerateButton = screen.getByText('✨ AI Generate');
    expect(aiGenerateButton).toBeInTheDocument();
  });

  it('should show AI generation form when button is clicked', async () => {
    render(<PlanDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Weekend Adventure')).toBeInTheDocument();
    });

    const aiGenerateButton = screen.getByText('✨ AI Generate');
    fireEvent.click(aiGenerateButton);

    // Check for form elements
    await waitFor(() => {
      expect(screen.getByText('✨ AI Event Generator')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Add a coffee break/)).toBeInTheDocument();
      expect(screen.getByText('✨ Generate Event')).toBeInTheDocument();
    });
  });

  it('should hide Add Event button when AI generator is shown', async () => {
    render(<PlanDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Weekend Adventure')).toBeInTheDocument();
    });

    const addEventButton = screen.getByText('+ Add Event');
    expect(addEventButton).toBeInTheDocument();

    const aiGenerateButton = screen.getByText('✨ AI Generate');
    fireEvent.click(aiGenerateButton);

    // Add Event button should be hidden
    await waitFor(() => {
      expect(screen.queryByText('+ Add Event')).not.toBeInTheDocument();
    });
  });

  it('should enable generate button only when input has text', async () => {
    render(<PlanDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Weekend Adventure')).toBeInTheDocument();
    });

    const aiGenerateButton = screen.getByText('✨ AI Generate');
    fireEvent.click(aiGenerateButton);

    await waitFor(() => {
      expect(screen.getByText('✨ AI Event Generator')).toBeInTheDocument();
    });

    const generateButton = screen.getByText('✨ Generate Event');
    const textarea = screen.getByPlaceholderText(/Add a coffee break/);

    // Type in the textarea
    fireEvent.change(textarea, { target: { value: 'I want to go to dinner at Eataly' } });

    // Button should be enabled (not disabled)
    expect(generateButton).not.toBeDisabled();
  });
});
