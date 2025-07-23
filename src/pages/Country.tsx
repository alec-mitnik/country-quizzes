import { useCallback } from "react";
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
  const { storedCountries, error, loading, fetchCountry } = useCountries();
  const country: StoredCountry | undefined = storedCountries[countryCode];

  const fetchOnLoadFunction = useCallback(() => {
    return fetchCountry(countryCode);
  }, [fetchCountry, countryCode]);

  const loaded = useInitialized(loading, fetchOnLoadFunction);

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

  return (
    <>
      <Link to="/countries"><span aria-hidden="true">← </span>{BACK_TO_COUNTRIES_LINK_TEXT}</Link>
      <Page pageTitle={name}>
        <RenderWithLoading loaded={loaded} error={error} dataExists={!!country}
            noDataMessage={NO_COUNTRY_DATA_MESSAGE}>
          <dl className="country-data-list">
            <div>
              <dt>Flag</dt>
              <dd>
                {/* TODO - smoother image loading */}
                {flagDescription ? <img className="flag" src={flag} alt={flagDescription} /> : "Unavailable"}
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
