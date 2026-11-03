import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockTrust } from '@/mocks/trust';
import { renderPage } from '@/test/utils';
import TrustBreakdown from './TrustBreakdown';

const veteran = {
  id: 13,
  completed_jobs_count: 42,
  verified_jobs_count: 40,
  avg_rating: 4.8,
  review_count: 36,
  identity_verified: true,
  years_experience: 15,
};

const newcomer = {
  id: 20,
  completed_jobs_count: 0,
  verified_jobs_count: 0,
  avg_rating: 0,
  review_count: 0,
  identity_verified: false,
  years_experience: 1,
};

describe('mockTrust', () => {
  it('sums factor points into a 0 to 100 score', () => {
    const { score, breakdown } = mockTrust(veteran);
    const total = breakdown.reduce((sum, item) => sum + item.points, 0);

    expect(breakdown.map((item) => item.weight).reduce((a, b) => a + b)).toBe(100);
    expect(score).toBe(Math.round(total));
    expect(score).toBeGreaterThan(mockTrust(newcomer).score);
  });
});

describe('TrustBreakdown', () => {
  it('lists every factor with its points and explains fair starting values', () => {
    renderPage(<TrustBreakdown breakdown={mockTrust(newcomer).breakdown} />);

    expect(screen.getAllByRole('progressbar')).toHaveLength(7);
    expect(screen.getByText('Finishes accepted jobs')).toBeInTheDocument();
    expect(screen.getByText('Identity not checked yet')).toBeInTheDocument();
    expect(screen.getByText('17.5 / 25')).toBeInTheDocument();
    expect(
      screen.getAllByText('Not enough jobs yet, so a fair starting value is used.').length,
    ).toBeGreaterThan(0);
  });
});
