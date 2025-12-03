import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  COUNTRIES_NAV_TEXT, HOME_NAV_TEXT, INDEPENDENT_COUNTRIES_CHECKBOX_LABEL,
  QUIZ_NAV_TEXT, SETTINGS_BAR_ACCESSIBLE_NAME
} from '../utils/consts';
import Layout from './Layout';

describe('Layout', () => {
  it('renders the expected landmark elements', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    // Check for the Settings Bar region
    const settingsBar = screen.getByRole('region', { name: SETTINGS_BAR_ACCESSIBLE_NAME });
    expect(settingsBar).toBeInTheDocument();

    // Check for the Color Scheme select
    // expect(within(settingsBar).getByRole('combobox', { name: 'Color Scheme:' })).toBeInTheDocument();

    // Check for the Independent Countries Only checkbox
    expect(within(settingsBar).getByRole('checkbox',
        { name: INDEPENDENT_COUNTRIES_CHECKBOX_LABEL })).toBeInTheDocument();

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

// TODO - Test the local storage warning
