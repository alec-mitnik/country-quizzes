import type { Cca3Code, Country } from "@yusifaliyevpro/countries/types";
import React, { useCallback, useMemo, useState } from "react";
import type { StoredCountry, StoredCountryWrapper } from "../types/commonTypes";
import { CountriesContext } from "./CountriesContext";
import { useLocalStorageStateBoolean } from "./hooks/useLocalStorageState";
import countryPageviews from "./supplementalData/countryPageviews.json";
import { DEFAULT_COUNTRY_STORAGE } from "./utils/consts";
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

  const updateStoredCountriesFromData = useCallback((data: Partial<Country>[],
      shallowData = false) => {
    if (data?.length) {
      setStoredCountryData(prev => {
        const newData = {...prev};

        for (const country of data) {
          if (!country.cca3) {
            console.error("Country data is missing its code:", country);
            continue;
          }
          if (!country.name?.common) {
            console.error("Country data is missing its name:", country);
            continue;
          }

          if (shallowData) {
            if (country.independent == null) {
              console.error("Country data is missing its independence status:", country);
              continue;
            }

            // Log errors for these but allow the country data to be kept
            if (country.area == null || isNaN(country.area)) {
              console.error("Country data is missing its area:", country);
            }
            if (country.population == null || isNaN(country.population)) {
              console.error("Country data is missing its population:", country);
            }
          }

          // Country name and code are always requested for any fetch
          const cca3 = country.cca3;
          const countryName = country.name.common;

          if (shallowData) {
            // Update of all country shallow data:
            // name, code, independence status, flags, borders, continents, areas, and populations only

            const independent = country.independent;
            const borders = country.borders;
            const continents = extractAlphabeticalStringArray(country.continents);

            const area = country.area != null && !isNaN(country.area) ? country.area : undefined;
            const population = country.population != null && !isNaN(country.population) ?
                country.population : undefined;

            // Use the pre-loaded supplemental description if provided, indicating a need to override
            const flagDescription =
                newData.countries[cca3]?.data?.flagDescription ?? extractFlagAltDescription(country);
            let flag = country.flags?.svg;

            if (cca3 === "BLZ") {
              // For Belize, the Flagpedia source SVG file has a display error, and they didn't respond
              // when I tried to contact them, so use a local SVG sourced from Wikipedia instead
              flag = "/images/BLZ_flag.svg";
            }

            const newCountryData: StoredCountry = {
              ...newData.countries[cca3]?.data,
              cca3,
              name: countryName,
              independent,
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
                rawValue: getPopulationDensityValue(country.population, country.area),
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

            const currencies = extractCurrencies(country);
            const formattedCurrencies = Object.keys(currencies);
            const capitals = extractAlphabeticalStringArray(country.capital);
            const languages = extractLanguages(country);

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

            // Construct and set the area and population formatted values
            setAreaLabels(country, areaValueFunction, newData.rankings.all.byArea,
                newData.rankings.independentOnly.byArea);
            setPopulationLabels(country, populationValueFunction, newData.rankings.all.byPopulation,
                newData.rankings.independentOnly.byPopulation);
            setPopulationDensityLabels(country, populationDensityValueFunction,
                newData.rankings.all.byPopulationDensity,
                newData.rankings.independentOnly.byPopulationDensity);

            // Sort the borders by country name
            if (country?.borders) {
              sortCountryCodesByName(country.borders, newData.countries);
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

              if (country) {
                if (!country.location) {
                  console.warn(`${country.cca3} - ${country.name} has no location!`);
                }

                if (!country.flagDescription) {
                  console.warn(`${country.cca3} - ${country.name} has no flag description!`);
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

                  if (otherCountry.flagDescription === country.flagDescription) {
                    // Check if that this is not an expected duplicate flag
                    if (!EXPECTED_DUPLICATE_FLAG_GROUPS.some(group =>
                        group.includes(country.cca3) && group.includes(otherCountry.cca3))) {
                      console.log(`${country.cca3} - ${country.name} has the same flag description as ${
                          otherCountry.cca3} - ${otherCountry.name}!`);
                    }
                  }
                }
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
