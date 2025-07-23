import { render, screen } from '@testing-library/react';
import { HOME_SUBHEADER, PORTFOLIO_LINK_ACCESSIBLE_NAME, PORTFOLIO_URL } from '../consts';
import Home from './Home';

describe('Home', () => {
  it('renders the expected subheader', () => {
    render(
      <Home />
    );

    // Check for the subheader element
    expect(screen.getByRole('heading', { name: HOME_SUBHEADER })).toBeInTheDocument();
  });

  it('renders the portfolio link', () => {
    render(
      <Home />
    );

    // Check for the portfolio link
    const portfolioLink = screen.getByRole('link', { name: PORTFOLIO_LINK_ACCESSIBLE_NAME });
    expect(portfolioLink).toBeInTheDocument();
    expect(portfolioLink).toHaveAttribute('href', PORTFOLIO_URL);
  });
});
