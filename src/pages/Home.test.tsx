import { render, screen } from '@testing-library/react';
import { CIA_WORLD_FACTBOOK_LINK_TEXT, CIA_WORLD_FACTBOOK_LINK_URL, HOME_SUBHEADER, PORTFOLIO_LINK_ACCESSIBLE_NAME, PORTFOLIO_URL, REST_COUNTRIES_API_LINK_TEXT, REST_COUNTRIES_API_LINK_URL } from '../utils/consts';
import Home from './Home';

describe('Home', () => {
  it('renders the expected subheader', () => {
    render(
      <Home />
    );

    // Check for the subheader element
    expect(screen.getByRole('heading', { name: HOME_SUBHEADER })).toBeInTheDocument();
  });

  it('renders the data source links', () => {
    render(
      <Home />
    );

    // Check for the REST Countries API link
    const apiLink = screen.getByRole('link', { name: REST_COUNTRIES_API_LINK_TEXT });
    expect(apiLink).toBeInTheDocument();
    expect(apiLink).toHaveAttribute('href', REST_COUNTRIES_API_LINK_URL);

    // Check for the CIA World Factbook link
    const factbookLink = screen.getByRole('link', { name: CIA_WORLD_FACTBOOK_LINK_TEXT });
    expect(factbookLink).toBeInTheDocument();
    expect(factbookLink).toHaveAttribute('href', CIA_WORLD_FACTBOOK_LINK_URL);
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
