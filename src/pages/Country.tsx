import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import useCountries from "../hooks/useCountries";
import useSmoothLoadingImageRef from "../hooks/useSmoothLoadingImageRef";
import RenderWithLoading from "../RenderWithLoading";
import { BACK_TO_COUNTRIES_LINK_TEXT, LOADING_IMAGE_MESSAGE, NO_COUNTRY_DATA_MESSAGE } from "../utils/consts";
import { getLocatorMapSrc } from "../utils/utils";
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

  const { name, worldFactbookCountryKey, location, independent, parentCountryCca3,
      borders, flag, flagDescription, currencies, capitals, languages,
      area, population, continents } = country ?? {};

  const { imgCallbackRef: flagImgCallbackRef,
      imgHasAttached: flagImgHasAttached,
      doneLoadingClassName: doneLoadingFlagClassName,
      loadFailedClassName: loadFlagFailedClassName } = useSmoothLoadingImageRef();

  const { imgCallbackRef: mapImgCallbackRef,
      imgHasAttached: mapImgHasAttached,
      doneLoadingClassName: doneLoadingMapClassName,
      loadFailedClassName: loadMapFailedClassName } = useSmoothLoadingImageRef();

  // It's less jarring if the flag and map loading is synchronized
  const combinedLoadingClassName = (!flagImgHasAttached || doneLoadingFlagClassName)
      && (!mapImgHasAttached || doneLoadingMapClassName) ?
      doneLoadingFlagClassName || doneLoadingMapClassName : "";

  function renderCountryDataValue(key = "Unknown", value: React.ReactNode = "Unknown") {
    return (
      <div>
        <dt>{key}</dt>
        <dd>{value}</dd>
      </div>
    );
  }

  function renderCountryLinksValue(value: Cca3Code[] = []) {
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
    <div className="country-component component-wrapper">
      <Link to="/countries">
        <span aria-hidden="true" className="symbol-font">🡐 </span>
        {BACK_TO_COUNTRIES_LINK_TEXT}
      </Link>

      <Page pageTitle={name ?? ""}>
        <RenderWithLoading loaded={!!countryWrapper?.fullyLoaded}
            error={error} dataExists={!!country} noDataMessage={NO_COUNTRY_DATA_MESSAGE}>
          <dl className={"country-data-list"}>
            <div className="country-data-wrapper">
              <div>
                <dt>Location</dt>
                <dd>
                  {worldFactbookCountryKey || location ?
                    <>
                      {!!worldFactbookCountryKey && !combinedLoadingClassName && LOADING_IMAGE_MESSAGE}
                      <figure aria-describedby={`${countryCode}-location-description`}>
                        {!!worldFactbookCountryKey && <div className={`smooth-loading with-max-height${combinedLoadingClassName}${loadMapFailedClassName}`}>
                          <img ref={mapImgCallbackRef} className="flag" src={getLocatorMapSrc(worldFactbookCountryKey)} alt="" />
                        </div>}

                        <figcaption>
                          <details name="location">
                            <summary>
                              Location Description
                            </summary>
                            <p id={`${countryCode}-location-description`}>
                              {location ?? "The location of this country. No additional description available."}
                            </p>
                          </details>
                        </figcaption>
                      </figure>
                    </> : "Unavailable"}
                </dd>
              </div>

              {renderCountryDataValue(continents?.label, continents?.formattedValue)}
              {renderCountryDataValue(borders?.length === 1 ? "Bordering Country" : "Bordering Countries",
                  renderCountryLinksValue(borders))}
              {renderCountryDataValue("Independent", independent ? "Yes" : "No")}
              {!independent && parentCountryCca3 && renderCountryDataValue("Parent Country",
                  renderCountryLinksValue([parentCountryCca3]))}
            </div>

            <div className="country-data-wrapper">
              <div>
                <dt>Flag</dt>
                <dd>
                  {flag || flagDescription ?
                    <>
                      {!combinedLoadingClassName && LOADING_IMAGE_MESSAGE}
                      {/* TODO - mark up foreign language phrases in flag banners appropriately */}
                      <figure aria-describedby={`${countryCode}-flag-description`}>
                        <div className={`smooth-loading with-max-height${combinedLoadingClassName}${loadFlagFailedClassName}`}>
                          <img ref={flagImgCallbackRef} className="flag" src={flag} alt="" />
                        </div>

                        <figcaption>
                          <details name="flag">
                            <summary>
                              Flag Description
                            </summary>
                            <p id={`${countryCode}-flag-description`}>
                              {flagDescription ??
                                  "The flag of this country. No additional description available."}
                            </p>
                          </details>
                        </figcaption>
                      </figure>
                    </> : "Unavailable"}
                </dd>
              </div>

              {renderCountryDataValue(capitals?.label, capitals?.formattedValue)}
              {renderCountryDataValue(languages?.label, languages?.formattedValue)}
              {renderCountryDataValue(currencies?.label, currencies?.markupValue)}
              {renderCountryDataValue("Size", independentOnly ?
                  area?.formattedValueForIndependentOnly : area?.formattedValueForAll)}
              {renderCountryDataValue("Population", independentOnly ?
                  population?.formattedValueForIndependentOnly : population?.formattedValueForAll)}
            </div>
          </dl>
        </RenderWithLoading>
      </Page>
    </div>
  );
}

export default Country;
