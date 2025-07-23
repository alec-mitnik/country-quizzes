import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NO_COUNTRIES_LOADED_MESSAGE, QUIZ_INSTRUCTIONS_SUBHEADER } from '../consts';
import useCountries from '../hooks/useCountries';
import useInitialized from '../hooks/useInitialized';
import Quiz from './Quiz';

// Mock the hooks
vi.mock('../hooks/useCountries');
vi.mock('../hooks/useInitialized');

beforeEach(() => {
  vi.clearAllMocks();

  // Default tests to mock having countries loaded
  vi.mocked(useCountries).mockReturnValue({
    storedCountries: {
      CAN: {cca3: "CAN", name: "Canada"},
      GBR: {cca3: "GBR", name: "United Kingdom"},
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

describe('Quiz', () => {
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
      <Quiz />
    );

    // Check for the no countries message
    expect(screen.getByText(NO_COUNTRIES_LOADED_MESSAGE)).toBeInTheDocument();
  });

  it('renders the play instructions, collapsed by default', async () => {
    const user = userEvent.setup();

    render(
      <Quiz />
    );

    // Check for the play instructions subheader
    const subheader = screen.getByRole('heading', { name: QUIZ_INSTRUCTIONS_SUBHEADER });
    expect(subheader).toBeInTheDocument();

    // Check that the instructions list is collapsed by default
    const instructionsList = screen.getByRole('list', { name: QUIZ_INSTRUCTIONS_SUBHEADER });
    expect(instructionsList).not.toBeVisible();

    // Click the subheader (which should be in a details summary element)
    // to expand the instructions
    await user.click(subheader);

    // Check that the instructions list is now expanded
    expect(instructionsList).toBeVisible();
  });

  // TODO - More to come...
});
