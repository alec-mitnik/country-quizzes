import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, useParams } from 'react-router-dom';
import { BACK_TO_COUNTRIES_LINK_TEXT, NO_COUNTRY_DATA_MESSAGE } from '../consts';
import useCountries from '../hooks/useCountries';
import useInitialized from '../hooks/useInitialized';
import { countryData } from '../test/data';
import Country from './Country';

// Mock the hooks
vi.mock('../hooks/useCountries');
vi.mock('../hooks/useInitialized');

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
    storedCountries: { [countryData.cca3]: countryData },
    loading: false,
    error: null,
    fetchCountry: vi.fn().mockReturnValue(true),
    fetchCountries: vi.fn().mockReturnValue(true),
    fetchCountryNamesAndCodes: vi.fn().mockReturnValue(true),
  });
  vi.mocked(useInitialized).mockReturnValue(true);

  // Mock useParams so that the correct country is identified from the URL path
  vi.mocked(useParams).mockReturnValue({ country: countryData.cca3 });
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

    // Flag, Continent, Capital, Language, Currency, Size, Population
    expect(screen.getAllByRole('term')).toHaveLength(7);
    expect(screen.getAllByRole('definition')).toHaveLength(7);
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

    // Check for the flag image with alt text
    expect(within(flagDataDescription).getByRole('img',
        { name: countryData.flagDescription })).toBeInTheDocument();
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
    // const continentDataTerm = screen.getByRole('term', { name: "Continent" });

    const continentDataTerm = screen.getByText("Continent");
    expect(continentDataTerm).toHaveRole('term');
    expect(continentDataTerm).toBeInTheDocument();

    // Check for the continent data description
    const continentDataDescription = continentDataTerm.nextElementSibling as HTMLElement;
    expect(continentDataDescription).toBeInTheDocument();
    expect(continentDataDescription).toHaveRole('definition');
    expect(continentDataDescription).toHaveTextContent(countryData.continents[0]);
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
    // const capitalDataTerm = screen.getByRole('term', { name: "Capital" });

    const capitalDataTerm = screen.getByText("Capital");
    expect(capitalDataTerm).toBeInTheDocument();
    expect(capitalDataTerm).toHaveRole('term');

    // Check for the capital data description
    const capitalDataDescription = capitalDataTerm.nextElementSibling as HTMLElement;
    expect(capitalDataDescription).toBeInTheDocument();
    expect(capitalDataDescription).toHaveRole('definition');
    expect(capitalDataDescription).toHaveTextContent(countryData.capitals[0]);
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
    // const languageDataTerm = screen.getByRole('term', { name: "Language" });

    const languageDataTerm = screen.getByText("Language");
    expect(languageDataTerm).toBeInTheDocument();
    expect(languageDataTerm).toHaveRole('term');

    // Check for the language data description
    const languageDataDescription = languageDataTerm.nextElementSibling as HTMLElement;
    expect(languageDataDescription).toBeInTheDocument();
    expect(languageDataDescription).toHaveRole('definition');
    expect(languageDataDescription).toHaveTextContent(countryData.languages[0]);
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
    // const currencyDataTerm = screen.getByRole('term', { name: "Currency" });

    const currencyDataTerm = screen.getByText("Currency");
    expect(currencyDataTerm).toBeInTheDocument();
    expect(currencyDataTerm).toHaveRole('term');

    // Check for the currency data description
    const currencyDataDescription = currencyDataTerm.nextElementSibling as HTMLElement;
    expect(currencyDataDescription).toBeInTheDocument();
    expect(currencyDataDescription).toHaveRole('definition');
    expect(currencyDataDescription).toHaveTextContent(countryData.currencies[0]);
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
    expect(sizeDataDescription).toHaveTextContent(countryData.areaLabel);
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
    expect(populationDataDescription).toHaveTextContent(countryData.populationLabel);
  });
});
