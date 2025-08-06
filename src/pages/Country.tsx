import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import useCountries from "../hooks/useCountries";
import useSmoothLoadingImageRef from "../hooks/useSmoothLoadingImageRef";
import RenderWithLoading from "../RenderWithLoading";
import { BACK_TO_COUNTRIES_LINK_TEXT, NO_COUNTRY_DATA_MESSAGE } from "../utils/consts";
import "./Country.css";
import Page from "./Page";

/**
 * Displays a country's details and a link to navigate back to the Countries page
 */
function Country() {
  // This component can't be reached without a country in the route,
  // so the `country` param can be safely assumed to exist
  const countryCode = useParams<{ country: string }>().country!.toUpperCase();

  const { independentOnly, storedCountryData, error,
      fetchShallowDataForAllCountries, fetchCountry } = useCountries();

  const countryWrapper = storedCountryData.countries[countryCode];
  const country = countryWrapper?.data;

  useEffect(() => {
    if (!error) {
      if (!storedCountryData.shallowDataRequested) {
        // Needed in order to display size and population rankings
        fetchShallowDataForAllCountries();
      }

      if (!countryWrapper?.requested) {
        fetchCountry(countryCode);
      }
    }
  }, [countryCode, error, storedCountryData, countryWrapper,
      fetchShallowDataForAllCountries, fetchCountry]);

  const { name, independent, borders, flag, flagDescription, currencies, capitals,
      languages, area, population, continents } = country ?? {};

  const { imgRef, doneLoadingClassName, loadFailedClassName } =
      useSmoothLoadingImageRef(flag, flagDescription);

  function renderCountryDataValue(key = "Unknown", value: React.ReactNode = "Unknown") {
    return (
      <div>
        <dt>{key}</dt>
        <dd>{value}</dd>
      </div>
    );
  }

  function renderBordersValue(value: Cca3Code[] = []) {
    if (value.length === 0) {
      return "None";
    } else {
      return (
        <span>
          {value.map((code, index) => (
            <React.Fragment key={code}>
              {index > 0 ? ", " : ""}
              <Link to={`/countries/${code}`}>
                {storedCountryData.countries[code]?.data?.name ?? "ERROR"}
              </Link>
            </React.Fragment>
          ))}
        </span>
      );
    }
  }

  return (
    <>
      <Link to="/countries">
        <span aria-hidden="true" className="symbol-font">🡐 </span>
        {BACK_TO_COUNTRIES_LINK_TEXT}
      </Link>

      <Page pageTitle={name ?? ""}>
        <RenderWithLoading loaded={!!countryWrapper?.fullyLoaded}
            error={error} dataExists={!!country} noDataMessage={NO_COUNTRY_DATA_MESSAGE}>
          <dl className={`country-data-list smooth-loading${doneLoadingClassName}${loadFailedClassName}`}>
            <div className="country-data-wrapper">
              <div>
                <dt>Flag</dt>
                <dd>
                  {flag || flagDescription ?
                      <img ref={imgRef} className="flag" src={flag} alt={flagDescription ??
                          "The flag of this country. No additional description available."} />
                      : "Unavailable"}
                </dd>
              </div>
              {renderCountryDataValue(continents?.label, continents?.formattedValue)}
              {renderCountryDataValue(borders?.length === 1 ? "Bordering Country" : "Bordering Countries",
                  renderBordersValue(borders))}
            </div>

            <div className="country-data-wrapper">
              {renderCountryDataValue(capitals?.label, capitals?.formattedValue)}
              {renderCountryDataValue(languages?.label, languages?.formattedValue)}
              {renderCountryDataValue(currencies?.label, currencies?.formattedValue)}
              {renderCountryDataValue("Independent", independent ? "Yes" : "No")}
              {renderCountryDataValue("Size", independentOnly ?
                  area?.formattedValueForIndependentOnly : area?.formattedValueForAll)}
              {renderCountryDataValue("Population", independentOnly ?
                  population?.formattedValueForIndependentOnly : population?.formattedValueForAll)}
            </div>
          </dl>
        </RenderWithLoading>
      </Page>
    </>
  );
}

export default Country;
