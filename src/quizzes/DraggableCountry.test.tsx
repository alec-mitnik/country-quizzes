import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import useCountries from "../hooks/useCountries";
import { testCountry, testStoredCountryData } from "../test/data";
import { expectNotToBeVisibleInDocument } from "../test/testUtils";
import DraggableCountry from "./DraggableCountry";

// Apply the expected styles from the parent component
import "../pages/Quiz.css";

// Mock the hook
vi.mock('../hooks/useCountries');

beforeAll(() => {
  // Nested selectors are not supported in happy-dom,
  // so have to recreate relevant styles manually
  const style = document.createElement('style');
  style.textContent = `
    .draggable-country.locked-in .grip {
      display: none;
    }

    .draggable-country:not(.locked-in) .check-mark {
      visibility: hidden;
    }
  `;
  document.head.appendChild(style);
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
});

describe('DraggableCountry', () => {
  it('renders as expected while not locked in and the quiz and round are active', () => {
    render(
      <div className="quiz-component component-wrapper">
        <DraggableCountry cca3={testCountry.cca3} isSelected={false} isDragged={false}
            isLockedIn={false} roundActive={true} quizActive={true} rankIndex={0}
            quizTypeKey={"ORDER_BY_SIZE"} onDragStart={vi.fn()} onDragEnd={vi.fn()}
            revealedValueLabel={testCountry.area.formattedValueForIndependentOnly} />
      </div>
    );

    // Check that the name is displayed, but not as a link
    expect(screen.queryByRole('link', { name: testCountry.name })).not.toBeInTheDocument();
    expect(screen.getByText(testCountry.name, { exact: false })).toBeInTheDocument();

    // Check for the grip
    expect(screen.getByText('⋮⋮', { exact: false })).toBeVisible();
    expectNotToBeVisibleInDocument(screen.queryByText('✗', { exact: false }));
    expectNotToBeVisibleInDocument(screen.queryByText('✓', { exact: false }));

    // Check for the rank
    expect(screen.getByText('1.', { exact: false })).toBeInTheDocument();

    // Check that the revealed value is not displayed
    expect(screen.queryByText(testCountry.area.formattedValueForIndependentOnly,
        { exact: false })).not.toBeInTheDocument();

    // Check that the continent is not displayed
    expect(screen.queryByText(testCountry.continents.formattedValue, { exact: false }))
        .not.toBeInTheDocument();

    // Check that the button to view location is not displayed
    expect(screen.queryByRole('button', { name: 'View Country Location' })).not.toBeInTheDocument();
  });

  it('renders as expected while locked in and the quiz and round are active', () => {
    render(
      <div className="quiz-component component-wrapper">
        <DraggableCountry cca3={testCountry.cca3} isSelected={false} isDragged={false}
            isLockedIn={true} roundActive={true} quizActive={true} rankIndex={0}
            quizTypeKey={"ORDER_BY_SIZE"} onDragStart={vi.fn()} onDragEnd={vi.fn()}
            revealedValueLabel={testCountry.area.formattedValueForIndependentOnly} />
      </div>
    );

    // Check that the name is displayed, but not as a link
    expect(screen.queryByRole('link', { name: testCountry.name })).not.toBeInTheDocument();
    expect(screen.getByText(testCountry.name, { exact: false })).toBeInTheDocument();

    // Check for the checkmark
    expect(screen.getByText('✓', { exact: false })).toBeVisible();
    expectNotToBeVisibleInDocument(screen.queryByText('⋮⋮', { exact: false }));
    expectNotToBeVisibleInDocument(screen.queryByText('✗', { exact: false }));

    // Check for the rank
    expect(screen.getByText('1.', { exact: false })).toBeInTheDocument();

    // Check that the revealed value is displayed
    expect(screen.getByText(testCountry.area.formattedValueForIndependentOnly,
        { exact: false })).toBeInTheDocument();

    // Check that the continent is not displayed
    expect(screen.queryByText(testCountry.continents.formattedValue, { exact: false }))
        .not.toBeInTheDocument();

    // Check that the button to view location is not displayed
    expect(screen.queryByRole('button', { name: 'View Country Location' })).not.toBeInTheDocument();
  });

  it('renders as expected while locked in and round is not active', () => {
    render(
      <div className="quiz-component component-wrapper">
        <DraggableCountry cca3={testCountry.cca3} isSelected={false} isDragged={false}
            isLockedIn={true} roundActive={false} quizActive={true} rankIndex={0}
            quizTypeKey={"ORDER_BY_SIZE"} onDragStart={vi.fn()} onDragEnd={vi.fn()}
            revealedValueLabel={testCountry.area.formattedValueForIndependentOnly} />
      </div>
    );

    // Check that the name is displayed, but not as a link
    expect(screen.queryByRole('link', { name: testCountry.name })).not.toBeInTheDocument();
    expect(screen.getByText(testCountry.name, { exact: false })).toBeInTheDocument();

    // Check for the checkmark
    expect(screen.getByText('✓', { exact: false })).toBeVisible();
    expectNotToBeVisibleInDocument(screen.queryByText('⋮⋮', { exact: false }));
    expectNotToBeVisibleInDocument(screen.queryByText('✗', { exact: false }));

    // Check for the rank
    expect(screen.getByText('1.', { exact: false })).toBeInTheDocument();

    // Check that the revealed value is displayed
    expect(screen.getByText(testCountry.area.formattedValueForIndependentOnly,
        { exact: false })).toBeInTheDocument();

    // Check that the continent is displayed
    expect(screen.getByText(testCountry.continents.formattedValue, { exact: false }))
        .toBeInTheDocument();

    // Check that the button to view location is displayed
    expect(screen.getByRole('button', { name: 'View Country Location' })).toBeInTheDocument();
  });

  it('renders as expected while unranked, not locked in, and quiz is not active', () => {
    render(
      // MemoryRouter required when possibly rendering Link components
      <MemoryRouter>
        <div className="quiz-component component-wrapper">
          <DraggableCountry cca3={testCountry.cca3} isSelected={false} isDragged={false}
              isLockedIn={false} roundActive={false} quizActive={false}
              quizTypeKey={"ORDER_BY_SIZE"} onDragStart={vi.fn()} onDragEnd={vi.fn()}
              revealedValueLabel={testCountry.area.formattedValueForIndependentOnly} />
        </div>
      </MemoryRouter>
    );

    // Check that the name is displayed as a link
    expect(screen.getByRole('link', { name: testCountry.name })).toBeInTheDocument();

    // Check for the X
    expect(screen.getByText('✗', { exact: false })).toBeVisible();
    expectNotToBeVisibleInDocument(screen.queryByText('⋮⋮', { exact: false }));
    expectNotToBeVisibleInDocument(screen.queryByText('✓', { exact: false }));

    // Check that the rank is not displayed
    expectNotToBeVisibleInDocument(screen.queryByText('.', { exact: false }));

    // Check that the revealed value is displayed
    expect(screen.getByText(testCountry.area.formattedValueForIndependentOnly,
        { exact: false })).toBeInTheDocument();

    // Check that the continent is displayed
    expect(screen.getByText(testCountry.continents.formattedValue, { exact: false }))
        .toBeInTheDocument();

    // Check that the button to view location is displayed
    expect(screen.getByRole('button', { name: 'View Country Location' })).toBeInTheDocument();
  });
});
