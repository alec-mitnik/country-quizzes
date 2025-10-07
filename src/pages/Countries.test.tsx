import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import useCountries from '../hooks/useCountries';
import { testCountry, testShallowStoredCountryData } from '../test/data';
import { expectNotToBeVisibleInDocument } from '../test/testUtils';
import { COUNTRIES_CONTINENT_FILTER_ALL, COUNTRIES_CONTINENT_FILTER_SUMMARY, COUNTRIES_FLAG_DESIGN_FILTER_NONE, COUNTRIES_FLAG_DESIGN_FILTER_SUMMARY, COUNTRIES_SEARCH_ACCESSIBLE_NAME, COUNTRIES_SORT_BY_ACCESSIBLE_NAME, COUNTRIES_TITLE, DEFAULT_COUNTRY_STORAGE, NO_COUNTRIES_LOADED_MESSAGE, NO_COUNTRIES_MATCHED_MESSAGE } from '../utils/consts';
import Countries from './Countries';

// Mock the hooks
vi.mock('../hooks/useCountries');

beforeEach(() => {
  vi.clearAllMocks();

  // Default tests to mock having countries loaded
  vi.mocked(useCountries).mockReturnValue({
    storedCountryData: testShallowStoredCountryData,
    loading: false,
    error: null,
    independentOnly: true,
    setIndependentOnly: vi.fn(),
    fetchCountry: vi.fn(),
    fetchCountries: vi.fn(),
    fetchShallowDataForAllCountries: vi.fn(),
  });
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
      storedCountryData: {
        ...DEFAULT_COUNTRY_STORAGE,
        shallowDataRequested: true,
        shallowDataLoaded: true,
      },
      loading: false,
      error: null,
      independentOnly: true,
      setIndependentOnly: vi.fn(),
      fetchCountry: vi.fn(),
      fetchCountries: vi.fn(),
      fetchShallowDataForAllCountries: vi.fn(),
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

  it('renders the reset filters button', () => {
    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Countries />
      </MemoryRouter>
    );

    // Check for the reset button
    expect(screen.getByRole('button', { name: "Reset Filters" })).toBeInTheDocument();
  });

  it('renders the sort by inputs', () => {
    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Countries />
      </MemoryRouter>
    );

    // Check for the fieldset
    const fieldset = screen.getByRole('group', { name: COUNTRIES_SORT_BY_ACCESSIBLE_NAME });
    expect(fieldset).toBeInTheDocument();

    // Check for the radio buttons
    expect(within(fieldset).getAllByRole('radio')).toHaveLength(4);

    expect(within(fieldset).getByRole('radio', { name: "Name", checked: true })).toBeInTheDocument();
    expect(within(fieldset).getByRole('radio', { name: "Size", checked: false })).toBeInTheDocument();
    expect(within(fieldset).getByRole('radio', { name: "Total Population", checked: false })).toBeInTheDocument();
    expect(within(fieldset).getByRole('radio', { name: "Population Density", checked: false })).toBeInTheDocument();

    expect(within(fieldset).getByRole('checkbox', { name: "Reversed", checked: false })).toBeInTheDocument();
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

  it('renders the continent filter inputs', () => {
    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Countries />
      </MemoryRouter>
    );

    // Check for the fieldset
    const fieldset = screen.getByRole('group', { name: COUNTRIES_CONTINENT_FILTER_SUMMARY });
    expect(fieldset).toBeInTheDocument();

    // Check for the radio buttons ("All" + each continent, determined from data set)
    expect(within(fieldset).getAllByRole('radio')).toHaveLength(4);

    expect(within(fieldset).getByRole('radio', { name: COUNTRIES_CONTINENT_FILTER_ALL,
        checked: true })).toBeInTheDocument();
    expect(within(fieldset).getByRole('radio', { name: testCountry.continents.rawValue[0],
        checked: false })).toBeInTheDocument();
    expect(within(fieldset).getByRole('radio', { name: testShallowStoredCountryData.countries.TCA
        .data.continents.rawValue[1], checked: false })).toBeInTheDocument();
    expect(within(fieldset).getByRole('radio', { name: testShallowStoredCountryData.countries.TCB
        .data.continents.rawValue[0], checked: false })).toBeInTheDocument();
  });

  it('renders the flag design filter, collapsed by default', async () => {
    const user = userEvent.setup();

    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Countries />
      </MemoryRouter>
    );

    // Check for the flag design filter details element

    // Testing library can't find summary elements by role
    const flagDesignFilterSummaryButton = screen.getByText(COUNTRIES_FLAG_DESIGN_FILTER_SUMMARY);
    expect(flagDesignFilterSummaryButton).toBeInTheDocument();

    // Check that the details is not expanded by default
    expectNotToBeVisibleInDocument(screen.queryByRole('radio', { name: COUNTRIES_FLAG_DESIGN_FILTER_NONE }));

    // Expand the filter
    await user.click(flagDesignFilterSummaryButton);

    // Check that the details is now expanded with the None filter selected
    const flagDesignFilterNone = screen.getByRole('radio', { name: COUNTRIES_FLAG_DESIGN_FILTER_NONE });
    expect(flagDesignFilterNone).toBeVisible();
    expect(flagDesignFilterNone).toBeChecked();
  });

  it('renders independent only country links', () => {
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

    const testCountryLink = within(nav).getByRole('link', { name: testCountry.name });
    expect(testCountryLink).toBeInTheDocument();
    expect(testCountryLink).toHaveAttribute('href', `/countries/${testCountry.cca3}`);

    // A country that isn't independent shouldn't appear while independentOnly is true
    const nonIndependentCountryLink = within(nav).queryByRole('link', { name: 'Test Country A' });
    expect(nonIndependentCountryLink).not.toBeInTheDocument();

    const independentCountryLink = within(nav).getByRole('link', { name: 'Test Country B' });
    expect(independentCountryLink).toBeInTheDocument();
    expect(independentCountryLink).toHaveAttribute('href', '/countries/TCB');
  });

  it('reverses sorting and resets filters correctly', async () => {
    const user = userEvent.setup();

    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Countries />
      </MemoryRouter>
    );

    // Check for the sort fieldset
    const fieldset = screen.getByRole('group', { name: COUNTRIES_SORT_BY_ACCESSIBLE_NAME });
    expect(fieldset).toBeInTheDocument();

    // Check for the sort radio buttons
    const nameRadio = within(fieldset).getByRole('radio', { name: "Name", checked: true });
    expect(nameRadio).toBeInTheDocument();
    const sizeRadio = within(fieldset).getByRole('radio', { name: "Size", checked: false });
    expect(sizeRadio).toBeInTheDocument();

    // Check for the continent filter fieldset
    const continentFilterFieldset = screen.getByRole('group', { name: COUNTRIES_CONTINENT_FILTER_SUMMARY });
    expect(continentFilterFieldset).toBeInTheDocument();

    // Check for the continent filter radio buttons
    const allRadio = within(continentFilterFieldset).getByRole('radio',
        { name: COUNTRIES_CONTINENT_FILTER_ALL, checked: true });
    expect(allRadio).toBeInTheDocument();
    const northAmericaRadio = within(continentFilterFieldset).getByRole('radio',
        { name: testCountry.continents.rawValue[0], checked: false });
    expect(northAmericaRadio).toBeInTheDocument();

    // Check for the Reversed sorting checkbox
    const reversedCheckbox = within(fieldset).getByRole('checkbox', { name: "Reversed", checked: false });
    expect(reversedCheckbox).toBeInTheDocument();

    // Check for the nav element
    const nav = screen.getByRole('navigation', { name: COUNTRIES_TITLE });
    expect(nav).toBeInTheDocument();

    // Check links
    let countryLinks = within(nav).getAllByRole('link');
    expect(countryLinks).toHaveLength(2);

    // Both countries should be listed in order by name (test country is "Trinidad and Tobago")
    let testCountryLink = within(nav).getByRole('link', { name: testCountry.name });
    expect(testCountryLink).toBeInTheDocument();
    expect(countryLinks[1]).toBe(testCountryLink);
    let independentCountryLink = within(nav).getByRole('link', { name: 'Test Country B' });
    expect(independentCountryLink).toBeInTheDocument();
    expect(countryLinks[0]).toBe(independentCountryLink);

    // Reverse the order
    await user.click(reversedCheckbox);
    expect(reversedCheckbox).toBeChecked();

    // Check links
    countryLinks = within(nav).getAllByRole('link');
    expect(countryLinks).toHaveLength(2);

    // Both countries should now be listed in reverse order by name
    testCountryLink = within(nav).getByRole('link', { name: testCountry.name });
    expect(testCountryLink).toBeInTheDocument();
    expect(countryLinks[0]).toBe(testCountryLink);
    independentCountryLink = within(nav).getByRole('link', { name: 'Test Country B' });
    expect(independentCountryLink).toBeInTheDocument();
    expect(countryLinks[1]).toBe(independentCountryLink);

    // Change the sort type
    await user.click(sizeRadio);
    expect(sizeRadio).toBeChecked();
    expect(nameRadio).not.toBeChecked();

    // Simulate name filter input
    const searchInput = screen.getByRole('searchbox', { name: COUNTRIES_SEARCH_ACCESSIBLE_NAME });
    expect(searchInput).toBeInTheDocument();
    await user.type(searchInput, 'b');
    expect(searchInput).toHaveValue('b');

    // Simulate continent filter input
    await user.click(northAmericaRadio);
    expect(northAmericaRadio).toBeChecked();
    expect(allRadio).not.toBeChecked();

    // Reset filters
    const resetButton = screen.getByRole('button', { name: "Reset Filters" });
    expect(resetButton).toBeInTheDocument();
    await user.click(resetButton);

    // Check that filters are reset
    expect(searchInput).toHaveValue('');
    expect(reversedCheckbox).not.toBeChecked();
    expect(sizeRadio).not.toBeChecked();
    expect(nameRadio).toBeChecked();
    expect(allRadio).toBeChecked();
    expect(northAmericaRadio).not.toBeChecked();

    // Check that sort order is no longer reversed
    countryLinks = within(nav).getAllByRole('link');
    expect(countryLinks).toHaveLength(2);

    testCountryLink = within(nav).getByRole('link', { name: testCountry.name });
    expect(testCountryLink).toBeInTheDocument();
    expect(countryLinks[1]).toBe(testCountryLink);
    independentCountryLink = within(nav).getByRole('link', { name: 'Test Country B' });
    expect(independentCountryLink).toBeInTheDocument();
    expect(countryLinks[0]).toBe(independentCountryLink);
  });
});

describe('Countries search input filters on independent countries correctly', () => {
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
    await user.type(searchInput, 'u');
    expect(searchInput).toHaveValue('u');

    // Check for the nav element
    const nav = screen.getByRole('navigation', { name: COUNTRIES_TITLE });
    expect(nav).toBeInTheDocument();

    // Check links
    expect(within(nav).getAllByRole('link')).toHaveLength(1);

    // Only Test Country B should remain, with Trinidad and Tobago filtered out
    expect(screen.queryByRole('link', { name: testCountry.name })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Test Country B' })).toBeInTheDocument();
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
    await user.type(searchInput, 't');
    expect(searchInput).toHaveValue('t');

    // Check for the nav element
    const nav = screen.getByRole('navigation', { name: COUNTRIES_TITLE });
    expect(nav).toBeInTheDocument();

    // Check links
    expect(within(nav).getAllByRole('link')).toHaveLength(2);

    // Both countries should remain
    expect(screen.getByRole('link', { name: testCountry.name })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Test Country B' })).toBeInTheDocument();
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

    // Check that there is no nav element
    const nav = screen.queryByRole('navigation', { name: COUNTRIES_TITLE });
    expect(nav).not.toBeInTheDocument();

    // Both countries should be filtered out
    expect(screen.queryByRole('link', { name: testCountry.name })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Test Country B' })).not.toBeInTheDocument();

    // Check for the no countries matched message
    expect(screen.getByText(NO_COUNTRIES_MATCHED_MESSAGE)).toBeInTheDocument();
  });
});

describe('Countries search input filters on all countries correctly', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set these tests to mock not restricting to independent countries only
    vi.mocked(useCountries).mockReturnValue({
      storedCountryData: testShallowStoredCountryData,
      loading: false,
      error: null,
      independentOnly: false,
      setIndependentOnly: vi.fn(),
      fetchCountry: vi.fn(),
      fetchCountries: vi.fn(),
      fetchShallowDataForAllCountries: vi.fn(),
    });
  });

  it('when there is no filter', async () => {
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
    await user.clear(searchInput);
    expect(searchInput).toHaveValue('');

    // Check for the nav element
    const nav = screen.getByRole('navigation', { name: COUNTRIES_TITLE });
    expect(nav).toBeInTheDocument();

    // Check links
    expect(within(nav).getAllByRole('link')).toHaveLength(3);

    const testCountryLink = within(nav).getByRole('link', { name: testCountry.name });
    expect(testCountryLink).toBeInTheDocument();
    expect(testCountryLink).toHaveAttribute('href', `/countries/${testCountry.cca3}`);

    const nonIndependentCountryLink = within(nav).getByRole('link', { name: 'Test Country A' });
    expect(nonIndependentCountryLink).toBeInTheDocument();
    expect(nonIndependentCountryLink).toHaveAttribute('href', '/countries/TCA');

    const independentCountryLink = within(nav).getByRole('link', { name: 'Test Country B' });
    expect(independentCountryLink).toBeInTheDocument();
    expect(independentCountryLink).toHaveAttribute('href', '/countries/TCB');
  });

  it('when a non-independent country is filtered out', async () => {
    const user = userEvent.setup();

    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Countries />
      </MemoryRouter>
    );

    // Simulate filter input
    const searchInput = screen.getByRole('searchbox', { name: COUNTRIES_SEARCH_ACCESSIBLE_NAME });
    await user.type(searchInput, 'b');
    expect(searchInput).toHaveValue('b');

    // Check for the nav element
    const nav = screen.getByRole('navigation', { name: COUNTRIES_TITLE });
    expect(nav).toBeInTheDocument();

    // Check links
    expect(within(nav).getAllByRole('link')).toHaveLength(2);

    const testCountryLink = within(nav).getByRole('link', { name: testCountry.name });
    expect(testCountryLink).toBeInTheDocument();
    expect(testCountryLink).toHaveAttribute('href', `/countries/${testCountry.cca3}`);

    const nonIndependentCountryLink = within(nav).queryByRole('link', { name: 'Test Country A' });
    expect(nonIndependentCountryLink).not.toBeInTheDocument();

    const independentCountryLink = within(nav).getByRole('link', { name: 'Test Country B' });
    expect(independentCountryLink).toBeInTheDocument();
    expect(independentCountryLink).toHaveAttribute('href', '/countries/TCB');
  });

  it('when an independent country is filtered out', async () => {
    const user = userEvent.setup();

    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Countries />
      </MemoryRouter>
    );

    // Simulate filter input
    const searchInput = screen.getByRole('searchbox', { name: COUNTRIES_SEARCH_ACCESSIBLE_NAME });
    await user.type(searchInput, 'a');
    expect(searchInput).toHaveValue('a');

    // Check for the nav element
    const nav = screen.getByRole('navigation', { name: COUNTRIES_TITLE });
    expect(nav).toBeInTheDocument();

    // Check links
    expect(within(nav).getAllByRole('link')).toHaveLength(2);

    const testCountryLink = within(nav).getByRole('link', { name: testCountry.name });
    expect(testCountryLink).toBeInTheDocument();
    expect(testCountryLink).toHaveAttribute('href', `/countries/${testCountry.cca3}`);

    const nonIndependentCountryLink = within(nav).getByRole('link', { name: 'Test Country A' });
    expect(nonIndependentCountryLink).toBeInTheDocument();
    expect(nonIndependentCountryLink).toHaveAttribute('href', '/countries/TCA');

    const independentCountryLink = within(nav).queryByRole('link', { name: 'Test Country B' });
    expect(independentCountryLink).not.toBeInTheDocument();
  });
});
