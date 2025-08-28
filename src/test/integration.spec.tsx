import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppWithoutRouter } from '../App';
import useCountries from '../hooks/useCountries';
import {
  APP_TITLE, BACK_TO_COUNTRIES_LINK_TEXT, COUNTRIES_NAV_TEXT, COUNTRIES_TITLE,
  QUIZ_NAV_TEXT, QUIZ_TITLE
} from '../utils/consts';
import { testCountry, testShallowStoredCountryData } from './data';

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

describe(APP_TITLE, () => {
  it('handles navigation to each main page', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AppWithoutRouter />
      </MemoryRouter>
    );

    // Check for app title displayed as a header for the home page
    expect(screen.getByRole('heading', { name: APP_TITLE })).toBeInTheDocument();

    // Navigate to the Quiz page
    const quizLink = screen.getByRole('link', { name: QUIZ_NAV_TEXT });
    await user.click(quizLink);

    // Check for Quiz page title displayed as a header
    expect(screen.getByRole('heading', { name: QUIZ_TITLE })).toBeInTheDocument();

    // Navigate to the Countries page
    const countriesLink = screen.getByRole('link', { name: COUNTRIES_NAV_TEXT });
    await user.click(countriesLink);

    // Check for Countries page title displayed as a header
    expect(screen.getByRole('heading', { name: COUNTRIES_TITLE })).toBeInTheDocument();
  });

  it('handles navigation to a country page and back', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={[`/countries`]}>
        <AppWithoutRouter />
      </MemoryRouter>
    );

    // Check for Countries page title displayed as a header
    expect(screen.getByRole('heading', { name: COUNTRIES_TITLE })).toBeInTheDocument();

    // Navigate to a Country page
    const countryLink = screen.getByRole('link', { name: testCountry.name });
    await user.click(countryLink);

    // Check for Country page title displayed as a header
    expect(screen.getByRole('heading', { name: testCountry.name })).toBeInTheDocument();

    // Check for the flag image with alt text TODO
    // expect(screen.getByRole('img', { name: testCountry.flagDescription })).toBeInTheDocument();

    // Navigate back to the Countries page using the back link
    const backLink = screen.getByRole('link', { name: BACK_TO_COUNTRIES_LINK_TEXT });
    await user.click(backLink);

    // Check for Countries page title displayed as a header
    expect(screen.getByRole('heading', { name: COUNTRIES_TITLE })).toBeInTheDocument();
  });

  // TODO - more to come (quiz functionality, etc.).
  // Test that data is not missing and has no unexpected duplicates.
});


/*
TODO - use logic like this to test all the loaded data

const countryData = Object.values(storedCountryData.countries).map(country => country?.data);
for (const code of countryCodes) {
  const country = storedCountryData.countries[code]?.data;

  if (country) {
    if (!country.location) {
      console.log(`${country.name} has no location!`);
    }

    if (!country.flagDescription) {
      console.log(`${country.name} has no flag description!`);
    }

    for (const otherCountry of countryData) {
      if (!otherCountry || otherCountry.cca3 === country.cca3) {
        continue;
      }

      if (otherCountry.location === country.location) {
        console.log(`${country.name} has the same location as ${otherCountry.name}!`);
      }

      // Note expected duplicates and exclude them from this check
      // if (otherCountry.flagDescription === country.flagDescription) {
      //   console.log(`${country.name} has the same flag description as ${otherCountry.name}!`);
      // }
    }
  }
}
*/
