import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppWithoutRouter } from '../App';
import {
  APP_TITLE, BACK_TO_COUNTRIES_LINK_TEXT, COUNTRIES_NAV_TEXT, COUNTRIES_TITLE,
  QUIZ_NAV_TEXT, QUIZ_TITLE
} from '../consts';
import useCountries from '../hooks/useCountries';
import { countryData } from './data';

vi.mock('../hooks/useCountries');

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
    const countryLink = screen.getByRole('link', { name: countryData.name });
    await user.click(countryLink);

    // Check for Country page title displayed as a header
    expect(screen.getByRole('heading', { name: countryData.name })).toBeInTheDocument();

    // Check for the flag image with alt text
    expect(screen.getByRole('img', { name: countryData.flagDescription })).toBeInTheDocument();

    // Navigate back to the Countries page using the back link
    const backLink = screen.getByRole('link', { name: BACK_TO_COUNTRIES_LINK_TEXT });
    await user.click(backLink);

    // Check for Countries page title displayed as a header
    expect(screen.getByRole('heading', { name: COUNTRIES_TITLE })).toBeInTheDocument();
  });

  // TODO - more to come
});
