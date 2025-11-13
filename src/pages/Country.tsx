import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import CaptionedImageDialogButton from "../CaptionedImageDialogButton";
import CountryLinksValue from "../CountryLinksValue";
import useCountries from "../hooks/useCountries";
import useSmoothLoadingImageRef from "../hooks/useSmoothLoadingImageRef";
import RenderWithLoading from "../RenderWithLoading";
import { BACK_TO_COUNTRIES_LINK_TEXT, LOADING_IMAGE_MESSAGE, NO_COUNTRY_DATA_MESSAGE } from "../utils/consts";
import { getLocatorMapSrc } from "../utils/utils";
import "./Country.css";
import Page from "./Page";

function renderCountryDataValue(key = "Unknown", value: React.ReactNode = "Unknown") {
  return (
    <div>
      <dt>{key}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function renderCountryFunFacts(funFacts: string[]) {
  if (funFacts.length === 0) {
    return null;
  }

  if (funFacts.length > 1) {
    return (
      <div>
        <dt>Fun Facts</dt>
        <dd>
          <ul>
            {funFacts.map((funFact) => <li key={funFact}>{funFact}</li>)}
          </ul>
        </dd>
      </div>
    );
  } else {
    return (
      <div>
        <dt>Fun Fact</dt>
        <dd>{funFacts[0]}</dd>
      </div>
    );
  }
}

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
      area, population, populationDensity, continents, funFacts } = country ?? {};

  const locatorMapSrc = worldFactbookCountryKey ? getLocatorMapSrc(worldFactbookCountryKey) : undefined;

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

                      <figure>
                        {!!worldFactbookCountryKey &&
                            <div className={`smooth-loading with-max-height${combinedLoadingClassName}${loadMapFailedClassName}`}>
                          <CaptionedImageDialogButton imageDescription="Country Location"
                            src={locatorMapSrc} caption={location ??
                                "The location of this country. No additional description available."}>
                            <img ref={mapImgCallbackRef} className="flag" src={locatorMapSrc}
                                alt="Country Location" draggable={false} />
                          </CaptionedImageDialogButton>
                        </div>}

                        <figcaption>
                          <details name="location">
                            <summary>
                              Location Description
                            </summary>
                            <p>
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
                  <CountryLinksValue value={borders} />)}
              {renderCountryDataValue("Independent", independent ? "Yes" : "No")}
              {!independent && parentCountryCca3 && renderCountryDataValue("Parent Country",
                  <CountryLinksValue value={[parentCountryCca3]} />)}
            </div>

            <div className="country-data-wrapper">
              <div>
                <dt>Flag</dt>
                <dd>
                  {flag || flagDescription ?
                    <>
                      {!combinedLoadingClassName && LOADING_IMAGE_MESSAGE}
                      <figure>
                        <div className={`smooth-loading with-max-height${combinedLoadingClassName}${loadFlagFailedClassName}`}>
                          <CaptionedImageDialogButton imageDescription="Country Flag"
                            src={flag} caption={flagDescription ??
                                "The flag of this country. No additional description available."}>
                            <img ref={flagImgCallbackRef} className="flag" src={flag}
                                alt="Country Flag" draggable={false} />
                          </CaptionedImageDialogButton>
                        </div>

                        <figcaption>
                          <details name="flag">
                            <summary>
                              Flag Description
                            </summary>
                            <p>
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
              {renderCountryDataValue("Total Population", independentOnly ?
                  population?.formattedValueForIndependentOnly : population?.formattedValueForAll)}
              {renderCountryDataValue("Population Density", independentOnly ?
                  populationDensity?.formattedValueForIndependentOnly
                  : populationDensity?.formattedValueForAll)}
              {!!funFacts?.length && renderCountryFunFacts(funFacts)}
            </div>
          </dl>
        </RenderWithLoading>
      </Page>
    </div>
  );
}

export default Country;
