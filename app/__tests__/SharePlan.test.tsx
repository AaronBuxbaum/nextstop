import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SharePlan } from '@/components/SharePlan';

describe('SharePlan Component', () => {
  it('renders public toggle button', () => {
    render(<SharePlan planId="plan-1" isPublic={false} onTogglePublic={() => {}} />);
    expect(screen.getByRole('button', { name: /make plan public/i })).toBeInTheDocument();
  });

  it('shows private state when isPublic is false', () => {
    render(<SharePlan planId="plan-1" isPublic={false} onTogglePublic={() => {}} />);
    expect(screen.getByText('🔒 Private')).toBeInTheDocument();
  });

  it('shows public state when isPublic is true', () => {
    render(<SharePlan planId="plan-1" isPublic={true} onTogglePublic={() => {}} />);
    expect(screen.getByText('🌍 Public')).toBeInTheDocument();
  });

  it('shows copy link button when public', () => {
    render(<SharePlan planId="plan-1" isPublic={true} onTogglePublic={() => {}} />);
    expect(screen.getByRole('button', { name: /copy share link/i })).toBeInTheDocument();
  });

  it('does not show copy link button when private', () => {
    render(<SharePlan planId="plan-1" isPublic={false} onTogglePublic={() => {}} />);
    expect(screen.queryByRole('button', { name: /copy share link/i })).not.toBeInTheDocument();
  });

  it('calls onTogglePublic when toggle is clicked', async () => {
    const onTogglePublic = vi.fn();
    const user = userEvent.setup();
    render(<SharePlan planId="plan-1" isPublic={false} onTogglePublic={onTogglePublic} />);
    await user.click(screen.getByRole('button', { name: /make plan public/i }));
    expect(onTogglePublic).toHaveBeenCalledWith(true);
  });

  it('calls onTogglePublic with false when already public', async () => {
    const onTogglePublic = vi.fn();
    const user = userEvent.setup();
    render(<SharePlan planId="plan-1" isPublic={true} onTogglePublic={onTogglePublic} />);
    await user.click(screen.getByRole('button', { name: /make plan private/i }));
    expect(onTogglePublic).toHaveBeenCalledWith(false);
  });
});
