import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BACK_TO_COUNTRIES_LINK_TEXT, NO_COUNTRY_DATA_MESSAGE } from "../consts";
import type { StoredCountry } from "../CountriesProvider";
import useCountries from "../hooks/useCountries";
import useInitialized from "../hooks/useInitialized";
import RenderWithLoading from "../RenderWithLoading";
import Page from "./Page";

/**
 * Displays a country's details and a link to navigate back to the Countries page
 */
function Country() {
  // This component can't be reached without a country in the route,
  // so the `country` param can be safely assumed to exist
  const countryCode = useParams<{ country: string }>().country!;
  const [ranksLoaded, setRanksLoaded] = useState(false);
  const [countryLoaded, setCountryLoaded] = useState(false);
  const [loadingCountry, setLoadingCountry] = useState(false);
  const [flagImageLoaded, setFlagImageLoaded] = useState(false);
  const { storedCountries, error, loading, fetchCountry, fetchCountryNamesAndCodes } = useCountries();
  const country: StoredCountry | undefined = storedCountries[countryCode];

  // Needed in order to display size and population rankings
  const loaded = useInitialized(loading, fetchCountryNamesAndCodes);

  // My networking needs have evolved beyond what I had originally designed the handling for.
  // It definitely needs an overhaul when I have time.

  useEffect(() => {
    if (ranksLoaded && !countryLoaded && !loading && !error && !loadingCountry) {
      // Ranks are loaded, so ready to load data for this page's country
      if (fetchCountry(countryCode)) {
        // Country data had already been loaded
        setCountryLoaded(true);
      }
    }
  }, [ranksLoaded, countryLoaded, loading, error, countryCode, loadingCountry, fetchCountry]);

  useEffect(() => {
    if (loading) {
      if (ranksLoaded && !countryLoaded) {
        // Ranks are already loaded, so the loading state must be for the country
        setLoadingCountry(true);
      }
    } else {
      if (loaded && !ranksLoaded) {
        // Ranks have been loaded
        setRanksLoaded(true);
      } else if (loadingCountry) {
        // Country data has been loaded
        setCountryLoaded(true);
        setLoadingCountry(false);
      }
    }
  }, [loading, loadingCountry, loaded, ranksLoaded, countryLoaded, setCountryLoaded, setLoadingCountry]);

  const { name, flag, flagDescription, currencies, capitals,
      languages, areaLabel, populationLabel, continents } = country ?? {};

  function renderCountryDataArray(key: string, value: string[] | undefined) {
    return (
      <div>
        <dt>{key}</dt>
        <dd>{value?.length ? value.join(", ") : "None"}</dd>
      </div>
    );
  }

  function renderCountryDataValue(key: string, value = "Unknown") {
    return (
      <div>
        <dt>{key}</dt>
        <dd>{value}</dd>
      </div>
    );
  }

  function onFlagLoaded() {
    setFlagImageLoaded(true);
  }

  return (
    <>
      <Link to="/countries"><span aria-hidden="true">← </span>{BACK_TO_COUNTRIES_LINK_TEXT}</Link>
      <Page pageTitle={name ?? ""}>
        <RenderWithLoading loaded={(ranksLoaded && !!error) || countryLoaded}
            error={error} dataExists={!!country} noDataMessage={NO_COUNTRY_DATA_MESSAGE}>
          <dl className="country-data-list">
            <div>
              <dt>Flag</dt>
              <dd>
                {flagDescription ?
                    <img className={`flag smooth-loading ${flagImageLoaded ? "loaded" : ""}`}
                    onLoad={onFlagLoaded} onError={onFlagLoaded} src={flag} alt={flagDescription} />
                    : "Unavailable"}
              </dd>
            </div>

            <div className="country-data-wrapper">
              {renderCountryDataArray(continents?.length === 1 ? "Continent" : "Continents", continents)}
              {/* TODO - borders */}
              {renderCountryDataArray(capitals?.length === 1 ? "Capital" : "Capitals", capitals)}
              {renderCountryDataArray(languages?.length === 1 ? "Language" : "Languages", languages)}
              {renderCountryDataArray(currencies?.length === 1 ? "Currency" : "Currencies", currencies)}
              {renderCountryDataValue("Size", areaLabel)}
              {renderCountryDataValue("Population", populationLabel)}
            </div>
          </dl>
        </RenderWithLoading>
      </Page>
    </>
  );
}

export default Country;
