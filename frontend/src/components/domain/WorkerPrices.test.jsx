import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PriceList from '@/features/public/components/PriceList';
import { pricingPayload } from '@/lib/pricing';
import { workers } from '@/mocks/workers';
import { renderPage } from '@/test/utils';
import WorkerCard from './WorkerCard';

const rahim = workers.find((w) => w.id === 2);
const freeVisit = workers.find((w) => w.id === 15);
const noPrices = workers.find((w) => w.id === 19);

describe('worker prices', () => {
  it('shows the visit charge on the worker card', () => {
    renderPage(<WorkerCard worker={rahim} />);
    expect(screen.getByText(/Visit charge/)).toHaveTextContent('300');
  });

  it('says the visit is free when the charge is zero', () => {
    renderPage(<WorkerCard worker={freeVisit} />);
    expect(screen.getByText('No visit charge')).toBeInTheDocument();
  });

  it('lists starting prices per skill on the profile', () => {
    renderPage(<PriceList worker={rahim} />);
    expect(screen.getByText('AC servicing')).toBeInTheDocument();
    expect(screen.getAllByText(/from/)).toHaveLength(3);
  });

  it('tells customers when no prices are set', () => {
    renderPage(<PriceList worker={noPrices} />);
    expect(screen.getByText('This worker has not added prices yet.')).toBeInTheDocument();
  });

  it('turns empty inputs into null and clamps the rest', () => {
    const payload = pricingPayload(
      { visitCharge: '', skills: { 1: '450', 2: '-5', 3: '' } },
      [1, 2, 3],
    );
    expect(payload).toEqual({
      visitCharge: null,
      skillPrices: [
        { skill: 1, price: 450 },
        { skill: 2, price: 0 },
        { skill: 3, price: null },
      ],
    });
  });
});
