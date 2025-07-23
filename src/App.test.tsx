import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppWithoutRouter } from './App';
import {
  APP_TITLE, COUNTRIES_NAV_TEXT, COUNTRIES_TITLE, HOME_NAV_TEXT,
  NO_PAGE_TITLE, QUIZ_NAV_TEXT, QUIZ_TITLE
} from './consts';
import useCountries from './hooks/useCountries';
import useInitialized from './hooks/useInitialized';
import { countryData } from './test/data';

// Mock the hooks
vi.mock('./hooks/useCountries');
vi.mock('./hooks/useInitialized');

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
});

afterEach(() => {
  vi.resetAllMocks();
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('App', () => {
  it('renders the Home page for the default path', () => {
    render(
      <MemoryRouter>
        <AppWithoutRouter />
      </MemoryRouter>
    );

    // Check for the expected document title
    expect(document.title).toBe(APP_TITLE);

    // Check for the app title displayed as a header
    expect(screen.getByRole('heading', { name: APP_TITLE })).toBeInTheDocument();

    // Check for active nav link
    const homeLink = screen.getByRole('link', { name: HOME_NAV_TEXT });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveClass('active');
    expect(homeLink).toHaveAttribute('aria-current', 'page');
  });

  it('renders the Countries page for the countries path', () => {
    render(
      <MemoryRouter initialEntries={['/countries']}>
        <AppWithoutRouter />
      </MemoryRouter>
    );

    // Check for the expected document title
    expect(document.title).toBe(`${COUNTRIES_TITLE} - ${APP_TITLE}`);

    // Check for page title displayed as a header
    expect(screen.getByRole('heading', { name: COUNTRIES_TITLE })).toBeInTheDocument();

    // Check for active nav link
    const countriesLink = screen.getByRole('link', { name: COUNTRIES_NAV_TEXT });
    expect(countriesLink).toBeInTheDocument();
    expect(countriesLink).toHaveClass('active');
    expect(countriesLink).toHaveAttribute('aria-current', 'page');
  });

  it('renders the country page for a specific country path', () => {
    const slug = encodeURIComponent(countryData.cca3);

    render(
      <MemoryRouter initialEntries={[`/countries/${slug}`]}>
        <AppWithoutRouter />
      </MemoryRouter>
    );

    // Check for the expected document title
    expect(document.title).toBe(`${countryData.name} - ${APP_TITLE}`);

    // Check for page title displayed as a header
    expect(screen.getByRole('heading', { name: countryData.name })).toBeInTheDocument();

    // Check that the countries nav link isn't active
    const quizLink = screen.getByRole('link', { name: COUNTRIES_NAV_TEXT });
    expect(quizLink).not.toHaveClass('active');
    expect(quizLink).not.toHaveAttribute('aria-current', 'page');
  });


  it('renders the Quiz page for the quiz path', () => {
    render(
      <MemoryRouter initialEntries={['/quiz']}>
        <AppWithoutRouter />
      </MemoryRouter>
    );

    // Check for the expected document title
    expect(document.title).toBe(`${QUIZ_TITLE} - ${APP_TITLE}`);

    // Check for page title displayed as a header
    expect(screen.getByRole('heading', { name: QUIZ_TITLE })).toBeInTheDocument();

    // Check for active nav link
    const quizLink = screen.getByRole('link', { name: QUIZ_NAV_TEXT });
    expect(quizLink).toBeInTheDocument();
    expect(quizLink).toHaveClass('active');
    expect(quizLink).toHaveAttribute('aria-current', 'page');
  });

  it('renders the 404 page for an unrecognized path', () => {
    render(
      <MemoryRouter initialEntries={['/foo']}>
        <AppWithoutRouter />
      </MemoryRouter>
    );

    // Check for the expected document title
    expect(document.title).toBe(`${NO_PAGE_TITLE} - ${APP_TITLE}`);

    // Check for page title displayed as a header
    expect(screen.getByRole('heading', { name: NO_PAGE_TITLE })).toBeInTheDocument();
  });
});
