import { render, screen } from '@testing-library/react';
import { MemoryRouter, useParams } from 'react-router-dom';
import useCountries from '../hooks/useCountries';
import { testCountry, testStoredCountryData } from '../test/data';
import { BACK_TO_COUNTRIES_LINK_TEXT, DEFAULT_COUNTRY_STORAGE, NO_COUNTRY_DATA_MESSAGE } from '../utils/consts';
import Country from './Country';

// Mock the hook
vi.mock('../hooks/useCountries');

// Mock useParams so that the correct country can be identified from the URL path
// without the presence of the router structure
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();

  return {
    ...actual,
    useParams: vi.fn(),
  };
});

beforeEach(() => {
  vi.clearAllMocks();

  // Default tests to mock having a country loaded
  vi.mocked(useCountries).mockReturnValue({
    storedCountryData: testStoredCountryData,
    loading: false,
    error: null,
    independentOnly: true,
    setIndependentOnly: vi.fn(),
    fetchCountry: vi.fn(),
    fetchCountries: vi.fn(),
    fetchShallowDataForAllCountries: vi.fn(),
  });

  // Mock useParams so that the correct country is identified from the URL path
  vi.mocked(useParams).mockReturnValue({ country: testCountry.cca3 });
});

afterEach(() => {
  vi.resetAllMocks();
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('Country', () => {
  it('renders the corresponding message when there is no country data', () => {
    vi.mocked(useCountries).mockReturnValue({
      storedCountryData: {
        ...DEFAULT_COUNTRY_STORAGE,
        shallowDataRequested: true,
        shallowDataLoaded: true,
        countries: {
          [testCountry.cca3]: {
            fullyLoaded: true,
            requested: true,
          },
        },
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
        <Country />
      </MemoryRouter>
    );

    // Check for the no county data message
    expect(screen.getByText(NO_COUNTRY_DATA_MESSAGE)).toBeInTheDocument();
  });

  it('renders the link to go back to the Countries page', () => {
    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Country />
      </MemoryRouter>
    );

    // Check for the link
    const link = screen.getByRole('link', { name: BACK_TO_COUNTRIES_LINK_TEXT });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/countries');
  });

  it('renders the expected amount of country data', () => {
    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Country />
      </MemoryRouter>
    );

    // Location, Flag, Continent, Bordering Countries, Capital, Language,
    // Currency, Independent, Parent Country (only when applicable), Size, Population
    expect(screen.getAllByRole('term')).toHaveLength(10);
    expect(screen.getAllByRole('definition')).toHaveLength(10);
  });
});

describe('Country rendered data', () => {
  it('includes the flag', () => {
    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Country />
      </MemoryRouter>
    );

    // Check for the flag data term

    // Testing library doesn't see its accessible name...
    // const flagDataTerm = screen.getByRole('term', { name: "Flag" });

    const flagDataTerm = screen.getByText("Flag");
    expect(flagDataTerm).toBeInTheDocument();
    expect(flagDataTerm).toHaveRole('term');

    // Check for the flag data description
    const flagDataDescription = flagDataTerm.nextElementSibling as HTMLElement;
    expect(flagDataDescription).toBeInTheDocument();
    expect(flagDataDescription).toHaveRole('definition');

    // Check for the flag image with alt text TODO
    // expect(within(flagDataDescription).getByRole('img',
    //     { name: testCountry.flagDescription })).toBeInTheDocument();
  });

  it('includes the continent', () => {
    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Country />
      </MemoryRouter>
    );

    // Check for the continent data term

    // Testing library doesn't see its accessible name...
    // const continentDataTerm = screen.getByRole('term', { name: testCountry.continents.label });

    const continentDataTerm = screen.getByText(testCountry.continents.label);
    expect(continentDataTerm).toHaveRole('term');
    expect(continentDataTerm).toBeInTheDocument();

    // Check for the continent data description
    const continentDataDescription = continentDataTerm.nextElementSibling as HTMLElement;
    expect(continentDataDescription).toBeInTheDocument();
    expect(continentDataDescription).toHaveRole('definition');
    expect(continentDataDescription).toHaveTextContent(testCountry.continents.formattedValue);
  });

  it('includes the bordering countries', () => {
    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Country />
      </MemoryRouter>
    );

    // Check for the bordering countries data term

    // Testing library doesn't see its accessible name...
    // const bordersDataTerm = screen.getByRole('term', { name: "Bordering Countries" });

    const bordersDataTerm = screen.getByText("Bordering Countries");
    expect(bordersDataTerm).toHaveRole('term');
    expect(bordersDataTerm).toBeInTheDocument();

    // Check for the bordering countries data description
    const bordersDataDescription = bordersDataTerm.nextElementSibling as HTMLElement;
    expect(bordersDataDescription).toBeInTheDocument();
    expect(bordersDataDescription).toHaveRole('definition');
    expect(bordersDataDescription).toHaveTextContent("None");

    // TODO - test with non-empty bordering countries list
  });

  it('includes the capital', () => {
    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Country />
      </MemoryRouter>
    );

    // Check for the capital data term

    // Testing library doesn't see its accessible name...
    // const capitalDataTerm = screen.getByRole('term', { name: testCountry.capitals.label });

    const capitalDataTerm = screen.getByText(testCountry.capitals.label);
    expect(capitalDataTerm).toBeInTheDocument();
    expect(capitalDataTerm).toHaveRole('term');

    // Check for the capital data description
    const capitalDataDescription = capitalDataTerm.nextElementSibling as HTMLElement;
    expect(capitalDataDescription).toBeInTheDocument();
    expect(capitalDataDescription).toHaveRole('definition');
    expect(capitalDataDescription).toHaveTextContent(testCountry.capitals.formattedValue);
  });

  it('includes the language', () => {
    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Country />
      </MemoryRouter>
    );

    // Check for the language data term

    // Testing library doesn't see its accessible name...
    // const languageDataTerm = screen.getByRole('term', { name: testCountry.languages.label });

    const languageDataTerm = screen.getByText(testCountry.languages.label);
    expect(languageDataTerm).toBeInTheDocument();
    expect(languageDataTerm).toHaveRole('term');

    // Check for the language data description
    const languageDataDescription = languageDataTerm.nextElementSibling as HTMLElement;
    expect(languageDataDescription).toBeInTheDocument();
    expect(languageDataDescription).toHaveRole('definition');
    expect(languageDataDescription).toHaveTextContent(testCountry.languages.formattedValue);
  });

  it('includes the currency', () => {
    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Country />
      </MemoryRouter>
    );

    // Check for the currency data term

    // Testing library doesn't see its accessible name...
    // const currencyDataTerm = screen.getByRole('term', { name: testCountry.currencies.label });

    const currencyDataTerm = screen.getByText(testCountry.currencies.label);
    expect(currencyDataTerm).toBeInTheDocument();
    expect(currencyDataTerm).toHaveRole('term');

    // Check for the currency data description
    const currencyDataDescription = currencyDataTerm.nextElementSibling as HTMLElement;
    expect(currencyDataDescription).toBeInTheDocument();
    expect(currencyDataDescription).toHaveRole('definition');
    expect(currencyDataDescription).toHaveTextContent(testCountry.currencies.markupValue);
  });

  it('includes the independence', () => {
    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Country />
      </MemoryRouter>
    );

    // Check for the independence data term

    // Testing library doesn't see its accessible name...
    // const independenceDataTerm = screen.getByRole('term', { name: "Independent" });

    const independenceDataTerm = screen.getByText("Independent");
    expect(independenceDataTerm).toBeInTheDocument();
    expect(independenceDataTerm).toHaveRole('term');

    // Check for the independence data description
    const independenceDataDescription = independenceDataTerm.nextElementSibling as HTMLElement;
    expect(independenceDataDescription).toBeInTheDocument();
    expect(independenceDataDescription).toHaveRole('definition');
    expect(independenceDataDescription).toHaveTextContent("Yes");
  });

  it('includes the size', () => {
    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Country />
      </MemoryRouter>
    );

    // Check for the size data term

    // Testing library doesn't see its accessible name...
    // const sizeDataTerm = screen.getByRole('term', { name: "Size" });

    const sizeDataTerm = screen.getByText("Size");
    expect(sizeDataTerm).toBeInTheDocument();
    expect(sizeDataTerm).toHaveRole('term');

    // Check for the size data description
    const sizeDataDescription = sizeDataTerm.nextElementSibling as HTMLElement;
    expect(sizeDataDescription).toBeInTheDocument();
    expect(sizeDataDescription).toHaveRole('definition');
    expect(sizeDataDescription).toHaveTextContent(testCountry.area.formattedValueForIndependentOnly);
  });

  it('includes the population', () => {
    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Country />
      </MemoryRouter>
    );

    // Check for the population data term

    // Testing library doesn't see its accessible name...
    // const populationDataTerm = screen.getByRole('term', { name: "Population" });

    const populationDataTerm = screen.getByText("Population");
    expect(populationDataTerm).toBeInTheDocument();
    expect(populationDataTerm).toHaveRole('term');

    // Check for the population data description
    const populationDataDescription = populationDataTerm.nextElementSibling as HTMLElement;
    expect(populationDataDescription).toBeInTheDocument();
    expect(populationDataDescription).toHaveRole('definition');
    expect(populationDataDescription).toHaveTextContent(testCountry.population.formattedValueForIndependentOnly);
  });
});

// TODO - test for singular, plural, and missing data
// TODO - test parent country
