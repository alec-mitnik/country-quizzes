import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useParams } from 'react-router-dom';
import type { StoredCountry } from '../../types/commonTypes';
import useCountries from '../hooks/useCountries';
import { testCountry, testStoredCountryData } from '../test/data';
import { copyObjectWithoutReassignment } from '../test/testUtils';
import { BACK_TO_COUNTRIES_LINK_TEXT, DEFAULT_COUNTRY_STORAGE, NO_COUNTRY_DATA_MESSAGE } from '../utils/consts';
import { getLocatorMapSrc } from '../utils/utils';
import Country from './Country';

const NUM_EXPECTED_DATA_TERMS = 11;

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

const originalTestCountry = structuredClone(testCountry);

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
  copyObjectWithoutReassignment(testCountry, originalTestCountry);
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
    // Currency, Independent, Parent Country (only when applicable)
    // Size, Total Population, Population Density, Fun Facts (if any)
    expect(screen.getAllByRole('term')).toHaveLength(NUM_EXPECTED_DATA_TERMS);
    expect(screen.getAllByRole('definition')).toHaveLength(NUM_EXPECTED_DATA_TERMS);
  });
});

describe('Country rendered data', () => {
  it('includes the flag', async () => {
    const user = userEvent.setup();

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

    // Check for the flag image
    const flagImage = within(flagDataDescription).getByRole('img');
    expect(flagImage).toBeInTheDocument();
    expect(flagImage).toHaveAttribute('src', testCountry.flag);

    // Check for the flag description

    // Testing library can't find summary elements by role
    // const flagSummaryButton = within(flagDataDescription).getByRole('DisclosureTriangleGrouped',
    //     { name: 'Flag Description' });
    const flagSummaryButton = flagDataDescription.querySelector('summary');
    expect(flagSummaryButton).toBeInTheDocument();
    assert(flagSummaryButton);

    // Testing library doesn't see its accessible name...
    // const flagDescription = within(flagDataDescription).getByRole('p',
    //     { name: testCountry.flagDescription });
    const flagDetails = flagSummaryButton.closest('details');
    expect(flagDetails).toBeInTheDocument();
    assert(flagDetails);
    const flagDescription = within(flagDetails).getByText(testCountry.flagDescription);
    expect(flagDescription).toBeInTheDocument();

    // Flag description should be collapsed by default
    expect(flagDescription).not.toBeVisible();

    await user.click(flagSummaryButton);

    expect(flagDescription).toBeVisible();
  });

  it('includes the location', async () => {
    const user = userEvent.setup();

    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Country />
      </MemoryRouter>
    );

    // Check for the location data term

    // Testing library doesn't see its accessible name...
    // const locationDataTerm = screen.getByRole('term', { name: "Location" });

    const locationDataTerm = screen.getByText("Location");
    expect(locationDataTerm).toBeInTheDocument();
    expect(locationDataTerm).toHaveRole('term');

    // Check for the location data description
    const locationDataDescription = locationDataTerm.nextElementSibling as HTMLElement;
    expect(locationDataDescription).toBeInTheDocument();
    expect(locationDataDescription).toHaveRole('definition');

    // Check for the location image
    const locationImage = within(locationDataDescription).getByRole('img');
    expect(locationImage).toBeInTheDocument();
    expect(locationImage).toHaveAttribute('src', getLocatorMapSrc(testCountry.worldFactbookCountryKey));

    // Check for the location description

    // Testing library can't find summary elements by role
    // const locationSummaryButton = within(flagDataDescription).getByRole('DisclosureTriangleGrouped',
    //     { name: 'Location Description' });
    const locationSummaryButton = locationDataDescription.querySelector('summary');
    expect(locationSummaryButton).toBeInTheDocument();
    assert(locationSummaryButton);

    // Testing library doesn't see its accessible name...
    // const locationDescription = within(flagDataDescription).getByRole('p',
    //     { name: testCountry.location });
    const locationDetails = locationSummaryButton.closest('details');
    expect(locationDetails).toBeInTheDocument();
    assert(locationDetails);
    const locationDescription = within(locationDetails).getByText(testCountry.location);
    expect(locationDescription).toBeInTheDocument();

    // Location description should be collapsed by default
    expect(locationDescription).not.toBeVisible();

    await user.click(locationSummaryButton);

    expect(locationDescription).toBeVisible();
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

  // Also tests handling empty data
  it('includes the bordering countries when none are specified', () => {
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
  });

  // Also tests singular labeling compared to plural
  it('includes the bordering country when one is specified', () => {
    (testCountry as StoredCountry).borders = [testCountry.cca3];

    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Country />
      </MemoryRouter>
    );

    // Check for the bordering country data term

    // Testing library doesn't see its accessible name...
    // const bordersDataTerm = screen.getByRole('term', { name: "Bordering Countries" });

    const bordersDataTerm = screen.getByText("Bordering Country");
    expect(bordersDataTerm).toHaveRole('term');
    expect(bordersDataTerm).toBeInTheDocument();

    // Check for the bordering country data description link
    const bordersDataDescription = bordersDataTerm.nextElementSibling as HTMLElement;
    expect(bordersDataDescription).toBeInTheDocument();
    expect(bordersDataDescription).toHaveRole('definition');
    expect(within(bordersDataDescription).getByRole('link',
        { name: testCountry.name })).toBeInTheDocument();
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
    expect(sizeDataDescription).toHaveTextContent(
        testCountry.area.formattedValueForIndependentOnly);
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
    // const populationDataTerm = screen.getByRole('term', { name: "Total Population" });

    const populationDataTerm = screen.getByText("Total Population");
    expect(populationDataTerm).toBeInTheDocument();
    expect(populationDataTerm).toHaveRole('term');

    // Check for the population data description
    const populationDataDescription = populationDataTerm.nextElementSibling as HTMLElement;
    expect(populationDataDescription).toBeInTheDocument();
    expect(populationDataDescription).toHaveRole('definition');
    expect(populationDataDescription).toHaveTextContent(
        testCountry.population.formattedValueForIndependentOnly);
  });

  it('includes the population density', () => {
    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Country />
      </MemoryRouter>
    );

    // Check for the population density data term

    // Testing library doesn't see its accessible name...
    // const populationDensityDataTerm = screen.getByRole('term', { name: "Population Density" });

    const populationDensityDataTerm = screen.getByText("Population Density");
    expect(populationDensityDataTerm).toBeInTheDocument();
    expect(populationDensityDataTerm).toHaveRole('term');

    // Check for the population density data description
    const populationDensityDataDescription = populationDensityDataTerm.nextElementSibling as HTMLElement;
    expect(populationDensityDataDescription).toBeInTheDocument();
    expect(populationDensityDataDescription).toHaveRole('definition');
    expect(populationDensityDataDescription).toHaveTextContent(
        testCountry.populationDensity.formattedValueForIndependentOnly);
  });

  it('includes the parent country link when specified and not independent', () => {
    testCountry.independent = false;
    (testCountry as StoredCountry).parentCountryCca3 = testCountry.cca3;

    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Country />
      </MemoryRouter>
    );

    // Check for the parent country data term

    // Testing library doesn't see its accessible name...
    // const parentCountryDataTerm = screen.getByRole('term', { name: "Parent Country" });

    const parentCountryDataTerm = screen.getByText("Parent Country");
    expect(parentCountryDataTerm).toBeInTheDocument();
    expect(parentCountryDataTerm).toHaveRole('term');

    // Check for the parent country data description link
    const parentCountryDataDescription = parentCountryDataTerm.nextElementSibling as HTMLElement;
    expect(parentCountryDataDescription).toBeInTheDocument();
    expect(parentCountryDataDescription).toHaveRole('definition');
    expect(within(parentCountryDataDescription).getByRole('link',
        { name: testCountry.name })).toBeInTheDocument();

    // Check for the expected number of data terms
    expect(screen.getAllByRole('term')).toHaveLength(NUM_EXPECTED_DATA_TERMS + 1);
    expect(screen.getAllByRole('definition')).toHaveLength(NUM_EXPECTED_DATA_TERMS + 1);
  });

  it('does not include the parent country when specified but independent', () => {
    (testCountry as StoredCountry).parentCountryCca3 = testCountry.cca3;

    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Country />
      </MemoryRouter>
    );

    // Check for the parent country data term

    // Testing library doesn't see its accessible name...
    // const parentCountryDataTerm = screen.queryByRole('term', { name: "Parent Country" });

    const parentCountryDataTerm = screen.queryByText("Parent Country");
    expect(parentCountryDataTerm).not.toBeInTheDocument();
  });

  it('does not include the parent country when not independent but not specified', () => {
    testCountry.independent = false;

    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Country />
      </MemoryRouter>
    );

    // Check for the parent country data term

    // Testing library doesn't see its accessible name...
    // const parentCountryDataTerm = screen.queryByRole('term', { name: "Parent Country" });

    const parentCountryDataTerm = screen.queryByText("Parent Country");
    expect(parentCountryDataTerm).not.toBeInTheDocument();
  });

  it('does not include fun facts when not provided', () => {
    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Country />
      </MemoryRouter>
    );

    // Check for the fun fact(s) data term
    const funFactsDataTerm = screen.queryByText("Fun Fact", { exact: false });
    expect(funFactsDataTerm).not.toBeInTheDocument();
  });

  it('includes a single fun fact not as a list when provided', () => {
    const funFactText = "Test fun fact";
    (testCountry as StoredCountry).funFacts = [funFactText];

    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Country />
      </MemoryRouter>
    );

    // Check for the fun fact data term
    const funFactDataTerm = screen.getByText("Fun Fact");
    expect(funFactDataTerm).toBeInTheDocument();
    expect(funFactDataTerm).toHaveRole('term');

    // Check for the fun fact data description
    const funFactDataDescription = funFactDataTerm.nextElementSibling as HTMLElement;
    expect(funFactDataDescription).toBeInTheDocument();
    expect(funFactDataDescription).toHaveRole('definition');
    expect(within(funFactDataDescription).getByText(funFactText)).toBeInTheDocument();

    // Check that it is not a list item or in a list
    expect(within(funFactDataDescription).queryByRole('list')).not.toBeInTheDocument();
    expect(within(funFactDataDescription).queryByRole('listitem')).not.toBeInTheDocument();

    // Check for the expected number of data terms
    expect(screen.getAllByRole('term')).toHaveLength(NUM_EXPECTED_DATA_TERMS + 1);
    expect(screen.getAllByRole('definition')).toHaveLength(NUM_EXPECTED_DATA_TERMS + 1);
  });

  it('includes a multiple fun facts as a list when provided', () => {
    const funFact1Text = "Test fun fact 1";
    const funFact2Text = "Test fun fact 2";
    (testCountry as StoredCountry).funFacts = [funFact1Text, funFact2Text];

    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <Country />
      </MemoryRouter>
    );

    // Check for the fun fact data term
    const funFactsDataTerm = screen.getByText("Fun Facts");
    expect(funFactsDataTerm).toBeInTheDocument();
    expect(funFactsDataTerm).toHaveRole('term');

    // Check for the fun fact data description
    const funFactsDataDescription = funFactsDataTerm.nextElementSibling as HTMLElement;
    expect(funFactsDataDescription).toBeInTheDocument();
    expect(funFactsDataDescription).toHaveRole('definition');

    // Check for the list
    const funFactsList = within(funFactsDataDescription).getByRole('list');
    expect(funFactsList).toBeInTheDocument();
    expect(within(funFactsList).getAllByRole('listitem')).toHaveLength(2);

    // Testing library doesn't see the accessible name of the list items...
    expect(within(funFactsList).getByText(funFact1Text)).toBeInTheDocument();
    expect(within(funFactsList).getByText(funFact2Text)).toBeInTheDocument();

    // Check for the expected number of data terms
    expect(screen.getAllByRole('term')).toHaveLength(NUM_EXPECTED_DATA_TERMS + 1);
    expect(screen.getAllByRole('definition')).toHaveLength(NUM_EXPECTED_DATA_TERMS + 1);
  });
});
