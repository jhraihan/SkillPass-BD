// Reference test — copy this pattern to test a page.
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderPage } from '@/test/utils';
import ExampleFormPage from './ExampleFormPage';

describe('ExampleFormPage', () => {
  it('shows validation errors when submitted empty', async () => {
    const user = userEvent.setup();
    renderPage(<ExampleFormPage />);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Title must be at least 3 characters.')).toBeInTheDocument();
    expect(screen.getByText('Choose at least 1 star.')).toBeInTheDocument();
  });

  it('saves a valid form and shows a success message', async () => {
    const user = userEvent.setup();
    renderPage(<ExampleFormPage />);

    await user.type(screen.getByLabelText(/Job title/), 'Fix kitchen tap');
    await user.selectOptions(screen.getByLabelText(/Category/), 'plumbing');
    await user.click(screen.getByRole('radio', { name: 'Today' }));
    await user.click(screen.getByRole('radio', { name: '4 stars' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Saved successfully.')).toBeInTheDocument();
  });
});
