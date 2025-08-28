import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useCountries from '../hooks/useCountries';
import { testShallowStoredCountryData } from '../test/data';
import { QUIZ_INSTRUCTIONS_SUBHEADER } from '../utils/consts';
import Quiz from './Quiz';

// Mock the hook
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

describe('Quiz', () => {
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
