import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { COUNTRIES_SEARCH_ACCESSIBLE_NAME, COUNTRIES_TITLE, NO_COUNTRIES_LOADED_MESSAGE, NO_COUNTRIES_MATCHED_MESSAGE } from '../consts';
import useCountries from '../hooks/useCountries';
import useInitialized from '../hooks/useInitialized';
import Countries from './Countries';

// Mock the hooks
vi.mock('../hooks/useCountries');
vi.mock('../hooks/useInitialized');

beforeEach(() => {
  vi.clearAllMocks();

  // Default tests to mock having countries loaded
  vi.mocked(useCountries).mockReturnValue({
    storedCountries: {
      CAN: {cca3: "CAN", name: "Canada"},
      GBR: {cca3: "GBR", name: "United Kingdom"}
    },
    loading: false,
    error: null,
    fetchCountry: vi.fn().mockReturnValue(true),
    fetchCountries: vi.fn().mockReturnValue(true),
    fetchCountryNamesAndCodes: vi.fn().mockReturnValue(true),
  });
  vi.mocked(useInitialized).mockReturnValue(true);
});

afterEach(() => {
  vi.resetAllMocks();
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('Countries', () => {
  it('renders the corresponding message when there are no countries', () => {
    vi.mocked(useCountries).mockReturnValue({
      storedCountries: {},
      loading: false,
      error: null,
      fetchCountry: vi.fn().mockReturnValue(true),
      fetchCountries: vi.fn().mockReturnValue(true),
      fetchCountryNamesAndCodes: vi.fn().mockReturnValue(true),
    });

    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Countries />
      </MemoryRouter>
    );

    // Check for the no countries message
    expect(screen.getByText(NO_COUNTRIES_LOADED_MESSAGE)).toBeInTheDocument();

    // Check for the search input being absent
    expect(screen.queryByRole('searchbox', { name: COUNTRIES_SEARCH_ACCESSIBLE_NAME }))
        .not.toBeInTheDocument();
  });

  it('renders the search input', () => {
    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Countries />
      </MemoryRouter>
    );

    // Check for the search input
    expect(screen.getByRole('searchbox', { name: COUNTRIES_SEARCH_ACCESSIBLE_NAME }))
        .toBeInTheDocument();
  });

  it('renders country links', () => {
    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Countries />
      </MemoryRouter>
    );

    // Check for the nav element
    const nav = screen.getByRole('navigation', { name: COUNTRIES_TITLE });
    expect(nav).toBeInTheDocument();

    // Check links
    expect(within(nav).getAllByRole('link')).toHaveLength(2);

    const canadaLink = within(nav).getByRole('link', { name: 'Canada' });
    expect(canadaLink).toBeInTheDocument();
    expect(canadaLink).toHaveAttribute('href', '/countries/CAN');

    const unitedKingdomLink = within(nav).getByRole('link', { name: 'United Kingdom' });
    expect(unitedKingdomLink).toBeInTheDocument();
    expect(unitedKingdomLink).toHaveAttribute('href', '/countries/GBR');
  });
});

describe('Countries search input filters correctly', () => {
  it('when there is one match', async () => {
    const user = userEvent.setup();

    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Countries />
      </MemoryRouter>
    );

    // Simulate filter input
    const searchInput = screen.getByRole('searchbox', { name: COUNTRIES_SEARCH_ACCESSIBLE_NAME });
    await user.type(searchInput, 'k');
    expect(searchInput).toHaveValue('k');

    // Only United Kingdom should remain, with Canada filtered out
    expect(screen.queryByRole('link', { name: 'Canada' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'United Kingdom' })).toBeInTheDocument();
  });

  it('when there are multiple matches', async () => {
    const user = userEvent.setup();

    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Countries />
      </MemoryRouter>
    );

    // Simulate filter input
    const searchInput = screen.getByRole('searchbox', { name: COUNTRIES_SEARCH_ACCESSIBLE_NAME });
    await user.type(searchInput, 'n');
    expect(searchInput).toHaveValue('n');

    // Both countries should remain
    expect(screen.getByRole('link', { name: 'Canada' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'United Kingdom' })).toBeInTheDocument();
  });

  it('when there are no matches', async () => {
    const user = userEvent.setup();

    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Countries />
      </MemoryRouter>
    );

    // Simulate filter input
    const searchInput = screen.getByRole('searchbox', { name: COUNTRIES_SEARCH_ACCESSIBLE_NAME });
    await user.type(searchInput, 'z');
    expect(searchInput).toHaveValue('z');

    // Both countries should be filtered out
    expect(screen.queryByRole('link', { name: 'Canada' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'United Kingdom' })).not.toBeInTheDocument();

    // Check for the no countries matched message
    expect(screen.getByText(NO_COUNTRIES_MATCHED_MESSAGE)).toBeInTheDocument();
  });
});
