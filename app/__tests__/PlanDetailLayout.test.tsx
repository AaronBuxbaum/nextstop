import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useParams } from 'next/navigation';
import PlanDetailPage from '@/app/plans/[id]/page';

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  })),
}));

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: { user: { id: 'user-1', name: 'Test User', email: 'test@test.com' } },
    status: 'authenticated',
  })),
}));

describe('PlanDetailPage - Layout Updates', () => {
  beforeEach(() => {
    vi.mocked(useParams).mockReturnValue({ id: 'plan-1' });
  });

  it('should show back arrow instead of "Back to Plans" text', async () => {
    render(<PlanDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Weekend Adventure')).toBeInTheDocument();
    });

    const backButton = screen.getByLabelText('Back to plans');
    expect(backButton).toBeInTheDocument();
    expect(backButton.textContent).toBe('←');
    // Should not have the old "Back to Plans" text
    expect(screen.queryByText('← Back to Plans')).not.toBeInTheDocument();
  });

  it('should show pencil icon instead of "Edit Plan" button', async () => {
    render(<PlanDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Weekend Adventure')).toBeInTheDocument();
    });

    const editButton = screen.getByLabelText('Edit plan details');
    expect(editButton).toBeInTheDocument();
    expect(editButton.textContent?.trim()).toBe('✏️');
    // Should not have the old "Edit Plan" text
    expect(screen.queryByText('✏️ Edit Plan')).not.toBeInTheDocument();
  });

  it('should show AI Insights side panel', async () => {
    render(<PlanDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Weekend Adventure')).toBeInTheDocument();
    });

    const sidePanel = screen.getByLabelText('AI Insights');
    expect(sidePanel).toBeInTheDocument();
    expect(screen.getByText('🤖 AI Insights')).toBeInTheDocument();
    expect(screen.getByText('Analysis')).toBeInTheDocument();
    expect(screen.getByText('Suggestions')).toBeInTheDocument();
  });

  it('should show refresh button for AI insights', async () => {
    render(<PlanDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Weekend Adventure')).toBeInTheDocument();
    });

    const refreshButton = screen.getByLabelText('Refresh AI analysis and suggestions');
    expect(refreshButton).toBeInTheDocument();
  });

  it('should auto-load AI analysis and suggestions', async () => {
    render(<PlanDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Weekend Adventure')).toBeInTheDocument();
    });

    // Wait for AI analysis to load
    await waitFor(() => {
      expect(screen.getByText('Pacing')).toBeInTheDocument();
    });

    expect(screen.getByText('Quality')).toBeInTheDocument();
    expect(screen.getByText('Theme')).toBeInTheDocument();
  });

  it('should not show old AI Analysis and Get Suggestions buttons', async () => {
    render(<PlanDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Weekend Adventure')).toBeInTheDocument();
    });

    expect(screen.queryByText('🤖 AI Analysis')).not.toBeInTheDocument();
    expect(screen.queryByText('💡 Get Suggestions')).not.toBeInTheDocument();
  });

  it('should show collaboration panel', async () => {
    render(<PlanDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Weekend Adventure')).toBeInTheDocument();
    });

    expect(screen.getByText('👥 Collaborators')).toBeInTheDocument();
    expect(screen.getByText('+ Invite')).toBeInTheDocument();
  });

  it('should show collaboration invite form when clicking invite', async () => {
    render(<PlanDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Weekend Adventure')).toBeInTheDocument();
    });

    const inviteButton = screen.getByText('+ Invite');
    fireEvent.click(inviteButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter email address')).toBeInTheDocument();
    });
  });

  it('should open edit plan form from pencil icon', async () => {
    render(<PlanDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Weekend Adventure')).toBeInTheDocument();
    });

    const editButton = screen.getByLabelText('Edit plan details');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Show driving time')).toBeInTheDocument();
    });
  });
});
