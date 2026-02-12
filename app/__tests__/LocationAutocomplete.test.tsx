import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';

describe('LocationAutocomplete Component', () => {
  it('renders input with placeholder', () => {
    render(
      <LocationAutocomplete
        value=""
        onChange={() => {}}
        onSelect={() => {}}
        placeholder="Search location..."
      />
    );
    expect(screen.getByPlaceholderText('Search location...')).toBeInTheDocument();
  });

  it('renders with initial value', () => {
    render(
      <LocationAutocomplete
        value="New York"
        onChange={() => {}}
        onSelect={() => {}}
      />
    );
    expect(screen.getByDisplayValue('New York')).toBeInTheDocument();
  });

  it('calls onChange when typing', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <LocationAutocomplete
        value=""
        onChange={onChange}
        onSelect={() => {}}
      />
    );
    const input = screen.getByRole('combobox');
    await user.type(input, 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('has proper ARIA attributes', () => {
    render(
      <LocationAutocomplete
        value=""
        onChange={() => {}}
        onSelect={() => {}}
      />
    );
    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('aria-label', 'Location search');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders with custom className', () => {
    render(
      <LocationAutocomplete
        value=""
        onChange={() => {}}
        onSelect={() => {}}
        className="custom-class"
      />
    );
    const input = screen.getByRole('combobox');
    expect(input.className).toContain('custom-class');
  });
});
