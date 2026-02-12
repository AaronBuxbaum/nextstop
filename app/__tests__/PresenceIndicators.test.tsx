import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PresenceIndicators } from '@/components/PresenceIndicators';

describe('PresenceIndicators Component', () => {
  const mockUsers = [
    { userId: 'user-1', userName: 'Alice Smith', lastActive: Date.now() },
    { userId: 'user-2', userName: 'Bob Jones', lastActive: Date.now() },
    { userId: 'user-3', userName: 'Charlie Brown', lastActive: Date.now() },
  ];

  it('renders nothing when no active users', () => {
    const { container } = render(
      <PresenceIndicators activeUsers={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when only current user is active', () => {
    const { container } = render(
      <PresenceIndicators
        activeUsers={[mockUsers[0]]}
        currentUserId="user-1"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders other collaborators excluding current user', () => {
    render(
      <PresenceIndicators
        activeUsers={mockUsers}
        currentUserId="user-1"
      />
    );
    expect(screen.getByText('2 collaborators online')).toBeInTheDocument();
  });

  it('renders singular label for one collaborator', () => {
    render(
      <PresenceIndicators
        activeUsers={[mockUsers[0], mockUsers[1]]}
        currentUserId="user-1"
      />
    );
    expect(screen.getByText('1 collaborator online')).toBeInTheDocument();
  });

  it('shows user initials', () => {
    render(
      <PresenceIndicators
        activeUsers={mockUsers}
        currentUserId="user-1"
      />
    );
    expect(screen.getByText('BJ')).toBeInTheDocument();
    expect(screen.getByText('CB')).toBeInTheDocument();
  });

  it('has accessible label', () => {
    render(
      <PresenceIndicators
        activeUsers={mockUsers}
        currentUserId="user-1"
      />
    );
    expect(screen.getByLabelText('Active collaborators')).toBeInTheDocument();
  });

  it('shows tooltip with user name', () => {
    render(
      <PresenceIndicators
        activeUsers={mockUsers}
        currentUserId="user-1"
      />
    );
    expect(screen.getByTitle('Bob Jones')).toBeInTheDocument();
    expect(screen.getByTitle('Charlie Brown')).toBeInTheDocument();
  });
});
