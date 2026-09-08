import type { Alpha_3Code as Cca3Code } from "@yusifaliyevpro/countries/types";
import React, { useCallback, useMemo, useState } from "react";
import type { FullCountry, ShallowCountry, StoredCountry, StoredCountryWrapper } from "../types/commonTypes";
import { CountriesContext } from "./CountriesContext";
import { useLocalStorageStateBoolean } from "./hooks/useLocalStorageState";
import countryPageviews from "./supplementalData/countryPageviews.json";
import { DEFAULT_COUNTRY_STORAGE, SQUARE_KM_PER_SQUARE_MILE } from "./utils/consts";
import {
  extractAlphabeticalStringArray, extractCurrencies, extractFlagAltDescription,
  extractLanguages, formatCountryDataArray, getPopulationDensityValue, setAreaLabels,
  setPopulationDensityLabels, setPopulationLabels, sortCountryCodesByName,
  type CurrenciesData
} from "./utils/countryUtils";

interface CountryPageviewData {
  cca3: Cca3Code;
  pageviews: number;
  name: string;
  rank: number;
}

export interface CountryStorage {
  countries: Partial<Record<Cca3Code, StoredCountryWrapper>>,
  rankings: {
    independentOnly: {
      byArea: Cca3Code[],
      byPopulation: Cca3Code[],
      byPopulationDensity: Cca3Code[],
      byFamiliarity: Cca3Code[],
    },
    all: {
      byArea: Cca3Code[],
      byPopulation: Cca3Code[],
      byPopulationDensity: Cca3Code[],
      byFamiliarity: Cca3Code[],
    }
  },
  shallowDataRequested: boolean,
  shallowDataLoaded: boolean,
}

function formatCurrenciesMarkup(currencies: CurrenciesData): React.ReactNode {
  const currencyEntries = Object.entries(currencies);

  if (!currencyEntries.length) {
    return "None";
  }

  // Wrap everything in a span so that spaces after the commas
  // aren't collapsed by the flex display of the parent
  return <span>
    {currencyEntries.flatMap(([formattedCurrency, currencyData], index) => [
      <React.Fragment key={formattedCurrency}>
        <span aria-hidden="true">{currencyData.symbol} </span>
        ({currencyData.term}){index < currencyEntries.length - 1 && ', '}
      </React.Fragment>
    ])}
  </span>;
}

/**
 * Handles the restructuring and storage of accumulated countries data
 * @param [props.children] content to pass the countries context to
 */
function CountriesProvider({ children }: { children: React.ReactNode }) {
  const [storedCountryData, setStoredCountryData] =
      useState<CountryStorage>(DEFAULT_COUNTRY_STORAGE);

  // Load from and save to local storage
  const [independentOnly, setIndependentOnly] = useLocalStorageStateBoolean("independentOnly");

  const markShallowDataAsRequested = useCallback(() => {
    setStoredCountryData(prev => {
      return {
        ...prev,
        shallowDataRequested: true
      };
    })
  }, [setStoredCountryData]);

  const markCountriesAsRequested = useCallback((countryCodes: Cca3Code[]) => {
    setStoredCountryData(prev => {
      const newData = {...prev};

      for (const cca3 of countryCodes) {
        newData.countries[cca3] ??= {};
        newData.countries[cca3].requested = true;
      }

      return newData;
    })
  }, [setStoredCountryData]);

  const updateStoredCountriesFromData = useCallback((data: (ShallowCountry | FullCountry)[],
      shallowData = false) => {
    if (data?.length) {
      setStoredCountryData(prev => {
        const newData = {...prev};
        const countryDataMap: Partial<Record<Cca3Code, ShallowCountry>> = {};

        for (const country of data) {
          if (!country.codes?.alpha_3) {
            const knownCountriesWithoutCodes = ["Abkhazia", "Northern Cyprus", "Somaliland", "South Ossetia"];

            if (!knownCountriesWithoutCodes.includes(country.names?.common ?? "")) {
              console.error("Country data is missing its code:", country);
            }

            continue;
          }
          if (!country.names?.common) {
            console.error("Country data is missing its name:", country);
            continue;
          }

          if (shallowData) {
            const shallowCountry = country as ShallowCountry;

            if (shallowCountry.classification?.sovereign == null) {
              console.error("Country data is missing its independence status:", shallowCountry);
              continue;
            }

            countryDataMap[shallowCountry.codes.alpha_3] = shallowCountry;

            // Log errors for these but allow the country data to be kept
            if (shallowCountry.area == null || isNaN(shallowCountry.area.kilometers)) {
              console.error("Country data is missing its area:", shallowCountry);
            }
            if (shallowCountry.population == null || isNaN(shallowCountry.population)) {
              console.error("Country data is missing its population:", shallowCountry);
            }
          }

          // Country name and code are always requested for any fetch
          const cca3 = country.codes.alpha_3;
          const countryName = country.names.common;

          if (shallowData) {
            // Update of all country shallow data:
            // name, code, independence status, parent, flags, borders, continents, areas, and populations only

            const shallowCountry = country as ShallowCountry;
            const independent = !!shallowCountry.classification?.sovereign;
            const independenceDisputed = !!shallowCountry.classification?.disputed;
            const parentCountryCca3 = shallowCountry.parent?.alpha_3 ? shallowCountry.parent.alpha_3 : undefined;
            const borders = shallowCountry.borders;
            const continents = extractAlphabeticalStringArray(shallowCountry.continents);

            const area = shallowCountry.area != null && !isNaN(shallowCountry.area.kilometers) ? shallowCountry.area.kilometers : undefined;
            const population = shallowCountry.population != null && !isNaN(shallowCountry.population) ?
                shallowCountry.population : undefined;

            // Use the pre-loaded supplemental description if provided, indicating a need to override.
            // Non-overridden values get set later, once all data is loaded.
            const flagDescription = newData.countries[cca3]?.data?.flagDescription;
            const flag = shallowCountry.flag?.url_svg;

            const newCountryData: StoredCountry = {
              ...newData.countries[cca3]?.data,
              cca3,
              name: countryName,
              independent,
              independenceDisputed,
              parentCountryCca3,
              borders,
              continents: {
                label: continents?.length === 1 ? "Continent" : "Continents",
                rawValue: continents,
                formattedValue: formatCountryDataArray(continents),
              },
              area: {
                ...newData.countries[cca3]?.data?.area,
                rawValue: area,
              },
              population: {
                ...newData.countries[cca3]?.data?.population,
                rawValue: population,
              },
              populationDensity: {
                ...newData.countries[cca3]?.data?.populationDensity,
                rawValue: getPopulationDensityValue(shallowCountry.population, shallowCountry.area?.kilometers),
              },
              flag,
              flagDescription,
            };

            if (!newData.countries[cca3]) {
              newData.countries[cca3] = {
                data: newCountryData,
                fullyLoaded: false,
              };
            } else {
              newData.countries[cca3].data = newCountryData;
            }
          } else {
            // Update of a single country's non-shallow data that will be used:
            // name, code, currencies, capital, languages

            const fullCountry = country as FullCountry;
            const currencies = extractCurrencies(fullCountry);
            const formattedCurrencies = Object.keys(currencies);
            const capitals = extractAlphabeticalStringArray(fullCountry.capitals?.map(cap => cap.name));
            const languages = extractLanguages(fullCountry);

            // Shallow data may not have been fetched yet
            newData.countries[cca3] = {
              ...newData.countries[cca3],
              data: {
                ...newData.countries[cca3]?.data,
                cca3,
                name: countryName,
                currencies: {
                  label: formattedCurrencies.length === 1 ? "Currency" : "Currencies",
                  rawValue: formattedCurrencies,
                  formattedValue: formatCountryDataArray(formattedCurrencies),
                  markupValue: formatCurrenciesMarkup(currencies),
                  pureTextValue: formatCountryDataArray(Object.values(currencies).map(currency => currency.term)),
                },
                capitals: {
                  label: capitals?.length === 1 ? "Capital" : "Capitals",
                  rawValue: capitals,
                  formattedValue: formatCountryDataArray(capitals),
                },
                languages: {
                  label: languages.length === 1 ? "Language" : "Languages",
                  rawValue: languages,
                  formattedValue: formatCountryDataArray(languages),
                },
              },
              fullyLoaded: true,
            };
          }
        }

        if (shallowData) {
          newData.shallowDataLoaded = true;

          const areaValueFunction =
              (cca3: Cca3Code) => newData.countries[cca3]?.data?.area?.rawValue ?? 0;
          const populationValueFunction =
              (cca3: Cca3Code) => newData.countries[cca3]?.data?.population?.rawValue ?? 0;
          const populationDensityValueFunction = (cca3: Cca3Code) => {
            return getPopulationDensityValue(populationValueFunction(cca3), areaValueFunction(cca3));
          }

          // Calculate and set the area and population ranks
          const countryCodesSortedByArea = Object.keys(newData.countries).sort((a, b) => {
            return areaValueFunction(b) - areaValueFunction(a);
          });
          const countryCodesSortedByPopulation = Object.keys(newData.countries).sort((a, b) => {
            return populationValueFunction(b) - populationValueFunction(a);
          });
          const countryCodesSortedByPopulationDensity = Object.keys(newData.countries).sort((a, b) => {
            return populationDensityValueFunction(b) - populationDensityValueFunction(a);
          })
          const countryCodesSortedByFamiliarity = countryPageviews.data.map(
              (country: CountryPageviewData) => country.cca3);

          newData.rankings = {
            all: {
              byArea: countryCodesSortedByArea.filter(cca3 => newData.countries?.[cca3]?.data?.area),
              byPopulation: countryCodesSortedByPopulation
                  .filter(cca3 => newData.countries?.[cca3]?.data?.population),
              byPopulationDensity: countryCodesSortedByPopulationDensity
                  .filter(cca3 => newData.countries?.[cca3]?.data?.area
                      && newData.countries?.[cca3]?.data.population),
              byFamiliarity: countryCodesSortedByFamiliarity,
            },
            independentOnly: {
              byArea: countryCodesSortedByArea.filter(cca3 => newData.countries?.[cca3]?.data?.area
                  && newData.countries?.[cca3]?.data.independent),
              byPopulation: countryCodesSortedByPopulation
                  .filter(cca3 => newData.countries?.[cca3]?.data?.population
                  && newData.countries?.[cca3]?.data.independent),
              byPopulationDensity: countryCodesSortedByPopulationDensity
                  .filter(cca3 => newData.countries?.[cca3]?.data?.area
                      && newData.countries?.[cca3]?.data.population
                      && newData.countries?.[cca3]?.data.independent),
              byFamiliarity: countryCodesSortedByFamiliarity
                  .filter(cca3 => newData.countries?.[cca3]?.data?.independent),
            }
          };

          for (const cca3 of Object.keys(newData.countries)) {
            const country = newData.countries[cca3]?.data;

            if (!country) {
              console.error("Missing country data for", cca3, "during processing.");
              continue;
            }

            // Construct and set the area and population formatted values
            setAreaLabels(country, areaValueFunction, newData.rankings.all.byArea,
                newData.rankings.independentOnly.byArea);
            setPopulationLabels(country, populationValueFunction, newData.rankings.all.byPopulation,
                newData.rankings.independentOnly.byPopulation);
            setPopulationDensityLabels(country, populationDensityValueFunction,
                newData.rankings.all.byPopulationDensity,
                newData.rankings.independentOnly.byPopulationDensity);

            // Sort the borders by country name
            if (country.borders) {
              sortCountryCodesByName(country.borders, newData.countries);
            }

            // If not already overridden, obfuscate the country name from flag descriptions.
            // Have to account for parent country in case it just uses that flag.
            if (!country.flagDescription) {
              const apiCountry = countryDataMap[country.cca3];

              if (!apiCountry) {
                console.warn("Unable to find corresponding API country data for",
                    country.cca3, "-", country.name,
                    "for setting flag descriptions.");
                continue;
              }

              if (apiCountry.parent?.alpha_3) {
                const parentCountry = newData.countries[apiCountry.parent.alpha_3]?.data;
                const parentApiCountry = countryDataMap[apiCountry.parent.alpha_3];

                if (!parentCountry || !parentApiCountry) {
                  console.warn("Unable to find corresponding parent country data for",
                      country.cca3, "-", country.name,
                      `(${apiCountry.parent?.alpha_3})`, "for setting flag descriptions.");
                } else if (parentApiCountry.flag?.description
                    && parentApiCountry.flag.description === apiCountry.flag?.description) {
                  // If using the parent flag (with matching description),
                  // then use the overridden or extracted version of that
                  if (parentCountry.flagDescription) {
                    country.flagDescription = parentCountry.flagDescription;
                  } else {
                    country.flagDescription = extractFlagAltDescription(parentApiCountry);
                  }
                }
              }

              country.flagDescription ??= extractFlagAltDescription(apiCountry);
            }
          }

          // For the dev build, do some checks on the real, processed shallow + supplemental data
          if (import.meta.env.DEV) {
            console.log("Testing data...");

            const countryCodes = Object.keys(newData.countries);
            const countryData = Object.values(newData.countries)
                .map(country => country?.data).filter(Boolean);

            if (countryCodes.length !== 250) {
              console.warn("There are", countryCodes.length, "country codes, not the expected 250!");
            }

            if (countryCodes.length !== countryData.length) {
              console.warn("There are", countryCodes.length, "country codes, but only",
                  countryData.length, "have data!");
            }

            for (const code of countryCodes) {
              const country = newData.countries[code]?.data;
              const apiCountry = countryDataMap[code];

              if (country) {
                if (!country.location) {
                  console.warn(`${country.cca3} - ${country.name} has no location!`);
                }

                if (!country.flagDescription) {
                  console.warn(`${country.cca3} - ${country.name} has no flag description!`);
                } else {
                  if (country.flagDescription.includes('  ')) {
                    console.warn(`${country.cca3} - ${country.name} flag description contains double spaces!`);
                  }

                  // Check with regex that the flagDescription ends in punctuation
                  // (., !, ?, and optionally escaped quotes after)
                  const endsWithPunctuationRegex = new RegExp(`[.!?](\\")?$`);

                  if (!endsWithPunctuationRegex.test(country.flagDescription)) {
                    console.warn(`${country.cca3} - ${country.name} flag description does not end with punctuation!`);
                  }
                }

                if (apiCountry) {
                  if (apiCountry.area) {
                    const sqMi = apiCountry.area.kilometers / SQUARE_KM_PER_SQUARE_MILE;
                    if (Math.abs(apiCountry.area.miles - sqMi) > 5) {
                      console.warn(`${country.cca3} - ${country.name} has imperial area value mismatch (${
                          apiCountry.area.miles} provided vs ${sqMi} calculated)`);
                    }
                  }
                } else {
                  console.warn(`${country.cca3} - ${country.name} has no API country data!`);
                }

                for (const otherCountry of countryData) {
                  if (!otherCountry || otherCountry.cca3 === country.cca3) {
                    continue;
                  }

                  if (otherCountry.location === country.location) {
                    console.warn(`${country.cca3} - ${country.name} has the same location as ${
                        otherCountry.cca3} - ${otherCountry.name}!`);
                  }

                  const EXPECTED_DUPLICATE_FLAG_GROUPS = [
                    ["AUS", "HMD"],
                    ["NOR", "BVT", "SJM"],
                    ["FRA", "MAF"],
                    ["USA", "UMI"],
                  ];

                  if (otherCountry.flagDescription && otherCountry.flagDescription === country.flagDescription) {
                    // Check if that this is not an expected duplicate flag
                    if (!EXPECTED_DUPLICATE_FLAG_GROUPS.some(group =>
                        group.includes(country.cca3) && group.includes(otherCountry.cca3))) {
                      console.log(`${country.cca3} - ${country.name} has the same flag description as ${
                          otherCountry.cca3} - ${otherCountry.name}!\n"${country.flagDescription}"`);
                    }
                  }
                }
              } else {
                console.warn(`Country ${code} has no data!`);
              }
            }

            console.log("Done testing data.");
          }
        }

        return newData;
      });
    }
  }, [setStoredCountryData]);

  // For any requests that failed, allow them to be retried
  const resetNonLoadedRequestStates = useCallback(() => {
    setStoredCountryData(prev => {
      return {
        ...prev,
        shallowDataRequested: !prev.shallowDataLoaded ? false : prev.shallowDataRequested,
        countries: {
          ...Object.fromEntries(Object.keys(prev.countries).map(cca3 => {
            return [cca3, {
              ...prev.countries[cca3],
              requested: !prev.countries[cca3]!.fullyLoaded ? false : prev.countries[cca3]!.requested,
            }];
          }))
        }
      };
    });
  }, [setStoredCountryData]);

  const contextValue = useMemo(() => {
    return {
      independentOnly,
      setIndependentOnly,
      storedCountryData,
      markShallowDataAsRequested,
      markCountriesAsRequested,
      updateStoredCountriesFromData,
      resetNonLoadedRequestStates,
    };
  }, [independentOnly, storedCountryData, setIndependentOnly,
      markShallowDataAsRequested, markCountriesAsRequested,
      updateStoredCountriesFromData, resetNonLoadedRequestStates]);

  return (
    <CountriesContext value={contextValue}>
      {children}
    </CountriesContext>
  );
}

export default CountriesProvider;
