import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { COUNTRIES_NAV_TEXT, HOME_NAV_TEXT, QUIZ_NAV_TEXT } from '../utils/consts';
import Layout from './Layout';

describe('Layout', () => {
  it('renders the expected landmark elements', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    // Check for the nav element
    expect(screen.getByRole('navigation')).toBeInTheDocument();

    // Check for the main element
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders the expected nav links', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    const nav = screen.getByRole('navigation');

    // Check for the expected nav links
    expect(within(nav).getAllByRole('link')).toHaveLength(3);

    expect(within(nav).getByRole('link', { name: HOME_NAV_TEXT })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: COUNTRIES_NAV_TEXT })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: QUIZ_NAV_TEXT })).toBeInTheDocument();
  });
});
