import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CollaborationPanel } from '@/components/CollaborationPanel';

describe('CollaborationPanel', () => {
  const mockOnChange = vi.fn();

  it('renders with no collaborators', () => {
    render(
      <CollaborationPanel
        planId="plan-1"
        collaborators={[]}
        onCollaboratorsChange={mockOnChange}
      />
    );

    expect(screen.getByText('👥 Collaborators')).toBeInTheDocument();
    expect(screen.getByText('+ Invite')).toBeInTheDocument();
    expect(screen.getByText('No collaborators yet. Invite someone to collaborate!')).toBeInTheDocument();
  });

  it('renders with collaborators', () => {
    render(
      <CollaborationPanel
        planId="plan-1"
        collaborators={[
          { id: 'user-2', name: 'Alice', email: 'alice@test.com', role: 'editor' },
          { id: 'user-3', name: 'Bob', email: 'bob@test.com', role: 'viewer' },
        ]}
        onCollaboratorsChange={mockOnChange}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('editor')).toBeInTheDocument();
    expect(screen.getByText('viewer')).toBeInTheDocument();
  });

  it('shows invite form when clicking invite', () => {
    render(
      <CollaborationPanel
        planId="plan-1"
        collaborators={[]}
        onCollaboratorsChange={mockOnChange}
      />
    );

    fireEvent.click(screen.getByText('+ Invite'));

    expect(screen.getByPlaceholderText('Enter email address')).toBeInTheDocument();
    expect(screen.getByText('Add')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('hides invite form when clicking cancel', () => {
    render(
      <CollaborationPanel
        planId="plan-1"
        collaborators={[]}
        onCollaboratorsChange={mockOnChange}
      />
    );

    fireEvent.click(screen.getByText('+ Invite'));
    expect(screen.getByPlaceholderText('Enter email address')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByPlaceholderText('Enter email address')).not.toBeInTheDocument();
  });

  it('submits invite form and calls onCollaboratorsChange', async () => {
    render(
      <CollaborationPanel
        planId="plan-1"
        collaborators={[]}
        onCollaboratorsChange={mockOnChange}
      />
    );

    fireEvent.click(screen.getByText('+ Invite'));

    const emailInput = screen.getByPlaceholderText('Enter email address');
    fireEvent.change(emailInput, { target: { value: 'new@test.com' } });

    fireEvent.click(screen.getByText('Add'));

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  it('shows remove buttons for each collaborator', () => {
    render(
      <CollaborationPanel
        planId="plan-1"
        collaborators={[
          { id: 'user-2', name: 'Alice', email: 'alice@test.com', role: 'editor' },
        ]}
        onCollaboratorsChange={mockOnChange}
      />
    );

    expect(screen.getByLabelText('Remove Alice')).toBeInTheDocument();
  });

  it('shows avatar initial for collaborators', () => {
    render(
      <CollaborationPanel
        planId="plan-1"
        collaborators={[
          { id: 'user-2', name: 'Alice', email: 'alice@test.com', role: 'editor' },
        ]}
        onCollaboratorsChange={mockOnChange}
      />
    );

    expect(screen.getByText('A')).toBeInTheDocument();
  });
});
