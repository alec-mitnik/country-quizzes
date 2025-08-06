import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RenderWithLoading from './RenderWithLoading';
import { LOADING_MESSAGE } from './utils/consts';

const noDataMessage = "No data";
const contentText = "Test";
const renderedContent: React.ReactNode = <p>{contentText}</p>;
const errorMessage = "Error";

describe('RenderWithLoading', () => {
  it('renders the loading message when not loaded', () => {
    render(
      <MemoryRouter>
        <RenderWithLoading loaded={false} error={null} dataExists={false}
            noDataMessage={noDataMessage}>
          {renderedContent}
        </RenderWithLoading>
      </MemoryRouter>
    );

    // Check for the loading message
    expect(screen.getByText(LOADING_MESSAGE)).toBeInTheDocument();
  });

  it('renders the error message when loaded with an error', () => {
    render(
      <MemoryRouter>
        <RenderWithLoading loaded={true} error={errorMessage} dataExists={false}
            noDataMessage={noDataMessage}>
          {renderedContent}
        </RenderWithLoading>
      </MemoryRouter>
    );

    // Check for the loading message's absence
    expect(screen.queryByText(LOADING_MESSAGE)).not.toBeInTheDocument();

    // Check for the error message
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('renders the error message when not loaded with an error', () => {
    render(
      <MemoryRouter>
        <RenderWithLoading loaded={false} error={errorMessage} dataExists={false}
            noDataMessage={noDataMessage}>
          {renderedContent}
        </RenderWithLoading>
      </MemoryRouter>
    );

    // Check for the loading message's absence
    expect(screen.queryByText(LOADING_MESSAGE)).not.toBeInTheDocument();

    // Check for the error message
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('renders the no data message when loaded but no data exists', () => {
    render(
      <MemoryRouter>
        <RenderWithLoading loaded={true} error={null} dataExists={false}
            noDataMessage={noDataMessage}>
          {renderedContent}
        </RenderWithLoading>
      </MemoryRouter>
    );

    // Check for the loading message's absence
    expect(screen.queryByText(LOADING_MESSAGE)).not.toBeInTheDocument();

    // Check for the no data message
    expect(screen.getByText(noDataMessage)).toBeInTheDocument();
  });

  it('renders the children content when loaded with data and no error', () => {
    render(
      <MemoryRouter>
        <RenderWithLoading loaded={true} error={null} dataExists={true}
            noDataMessage={noDataMessage}>
          {renderedContent}
        </RenderWithLoading>
      </MemoryRouter>
    );

    // Check for the loading message's absence
    expect(screen.queryByText(LOADING_MESSAGE)).not.toBeInTheDocument();

    // Check for the children content
    expect(screen.getByText(contentText)).toBeInTheDocument();
  });
});

// TODO - test focusOnLoad...
