import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import * as localStorageModule from '../hooks/useLocalStorageState';
import { expectNotToBeVisibleInDocument } from '../test/testUtils';
import {
  COLLAPSE_SETTINGS_BAR_BUTTON_ACCESSIBLE_NAME,
  COLOR_SCHEME_SELECT_ACCESSIBLE_NAME,
  COUNTRIES_NAV_TEXT, DISMISS_LOCAL_STORAGE_WARNING_BUTTON_ACCESSIBLE_NAME, EXPAND_SETTINGS_BAR_BUTTON_ACCESSIBLE_NAME, HOME_NAV_TEXT, INDEPENDENT_COUNTRIES_CHECKBOX_LABEL,
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

    // Check that the local storage warning is not shown via its dismiss button
    expectNotToBeVisibleInDocument(screen.queryByRole('button',
        { name: DISMISS_LOCAL_STORAGE_WARNING_BUTTON_ACCESSIBLE_NAME }));

    // Check for the Settings Bar region
    const settingsBar = screen.getByRole('region', { name: SETTINGS_BAR_ACCESSIBLE_NAME });
    expect(settingsBar).toBeInTheDocument();

    // Check for the Color Scheme select
    expect(within(settingsBar).getByRole('combobox', { name: COLOR_SCHEME_SELECT_ACCESSIBLE_NAME }))
        .toBeInTheDocument();

    // Check for the Independent Countries Only checkbox
    expect(within(settingsBar).getByRole('checkbox',
        { name: INDEPENDENT_COUNTRIES_CHECKBOX_LABEL })).toBeInTheDocument();

    // Check for the nav element
    expect(screen.getByRole('navigation')).toBeInTheDocument();

    // Check for the Settings Bar Toggle button
    expect(screen.getByRole('button', { name: COLLAPSE_SETTINGS_BAR_BUTTON_ACCESSIBLE_NAME }))
        .toBeInTheDocument();

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

  it('allows the settings bar to be collapsed and expanded', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    // Check for the Settings Bar region
    const settingsBar = screen.getByRole('region', { name: SETTINGS_BAR_ACCESSIBLE_NAME });
    expect(settingsBar).toBeInTheDocument();

    // Check that the Independent Countries Only checkbox is visible
    expect(within(settingsBar).getByRole('checkbox',
        { name: INDEPENDENT_COUNTRIES_CHECKBOX_LABEL })).toBeVisible();

    // Find and click the Settings Bar Toggle button
    const collapseSettingsBarButton = screen.getByRole('button',
        { name: COLLAPSE_SETTINGS_BAR_BUTTON_ACCESSIBLE_NAME });
    expect(collapseSettingsBarButton).toBeInTheDocument();

    await user.click(collapseSettingsBarButton);

    // Check that the Independent Countries Only checkbox is now hidden
    expectNotToBeVisibleInDocument(screen.queryByRole('checkbox',
        { name: INDEPENDENT_COUNTRIES_CHECKBOX_LABEL }));

    // Check for the Settings Bar Toggle button by its new expected state
    const expandSettingsBarButton = screen.getByRole('button',
        { name: EXPAND_SETTINGS_BAR_BUTTON_ACCESSIBLE_NAME });
    expect(expandSettingsBarButton).toBeInTheDocument();

    await user.click(expandSettingsBarButton);

    // Check that the Independent Countries Only checkbox is visible again
    expect(within(settingsBar).getByRole('checkbox',
        { name: INDEPENDENT_COUNTRIES_CHECKBOX_LABEL })).toBeVisible();
  });

  it('renders the local storage warning when appropriate and allows its dismissal', async () => {
    // Mock the call to isLocalStorageAvailable to return false
    vi.spyOn(localStorageModule, 'isLocalStorageAvailable').mockReturnValue(false);

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    // Check that the local storage warning is shown via its dismiss button
    const dismissButton = screen.getByRole('button',
      { name: DISMISS_LOCAL_STORAGE_WARNING_BUTTON_ACCESSIBLE_NAME });
    expect(dismissButton).toBeVisible();

    // Dismiss the warning
    await user.click(dismissButton);

    // Check that the local storage warning is no longer shown via its dismiss button
    expectNotToBeVisibleInDocument(screen.queryByRole('button',
        { name: DISMISS_LOCAL_STORAGE_WARNING_BUTTON_ACCESSIBLE_NAME }));
  });
});
