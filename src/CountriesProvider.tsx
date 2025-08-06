import type { Capital, Cca3Code, Country } from "@yusifaliyevpro/countries/types";
import { useCallback, useMemo, useState } from "react";
import { CountriesContext } from "./CountriesContext";
import { DEFAULT_COUNTRY_STORAGE } from "./utils/consts";
import { extractCurrencies, extractFlagAltDescription, extractLanguages, formatCountryDataArray, setAreaLabels, setPopulationLabels } from "./utils/countryUtils";

interface FormattedCountryField<T> {
  label: string,
  rawValue?: T,
  formattedValue?: string,
}

interface IndependenceDependentFormattedCountryField<T> {
  rawValue?: T,
  formattedValueForAll?: string,
  formattedValueForIndependentOnly?: string,
}

/**
 * Restructured country data for use in quizzes and display
 */
export interface StoredCountry {
  cca3: Cca3Code;
  name: string;
  independent: boolean;
  flag?: string;                                // SVG URL
  flagDescription?: string;                     // Descriptive for accessibility,
                                                // but obfuscating the country name for quizzing
  borders?: Cca3Code[];                         // Might reference non-independent countries
  continents?: FormattedCountryField<string[]>;
  capitals?: FormattedCountryField<Capital[]>;
  languages?: FormattedCountryField<string[]>;
  currencies?: FormattedCountryField<string[]>;
  area?: Partial<IndependenceDependentFormattedCountryField<number>>;         // Includes calculated rank
  population?: Partial<IndependenceDependentFormattedCountryField<number>>;   // Includes calculated rank
}

export interface StoredCountryWrapper {
  data?: StoredCountry,
  requested?: boolean,
  fullyLoaded?: boolean,
}

export interface CountryStorage {
  countries: Partial<Record<Cca3Code, StoredCountryWrapper>>,
  rankings: {
    independentOnly: {
      byArea: Cca3Code[],
      byPopulation: Cca3Code[],
    },
    all: {
      byArea: Cca3Code[],
      byPopulation: Cca3Code[],
    }
  },
  shallowDataRequested: boolean,
  shallowDataLoaded: boolean,
}

/**
 * Handles the restructuring and storage of accumulated countries data
 * @param [props.children] content to pass the countries context to
 */
function CountriesProvider({ children }: { children: React.ReactNode }) {
  const [storedCountryData, setStoredCountryData] =
      useState<CountryStorage>(DEFAULT_COUNTRY_STORAGE);

  // Load from and save to local storage
  const [independentOnly, setIndependentOnlyInternal] = useState(
      localStorage.getItem("independentOnly") === "true");

  const setIndependentOnly = useCallback((independentOnly: boolean) => {
    setIndependentOnlyInternal(independentOnly);
    localStorage.setItem("independentOnly", independentOnly.toString());
  }, [setIndependentOnlyInternal]);

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

          const cca3 = country.cca3;
          const countryName = country.name.common;
          const independent = country.independent;

          const area = country.area != null && !isNaN(country.area) ? country.area : undefined;
          const population = country.population != null && !isNaN(country.population) ?
              country.population : undefined;

          if (shallowData) {
            // Update of all country names, codes, independence status,
            // areas, and populations only
            const newCountryData: StoredCountry = {
              ...newData.countries[cca3]?.data,
              cca3,
              name: countryName,
              independent,
              area: {
                ...newData.countries[cca3]?.data?.area,
                rawValue: area,
              },
              population: {
                ...newData.countries[cca3]?.data?.population,
                rawValue: population,
              },
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
            // Update of a single country's data
            const flag = country.flags?.svg;
            const flagDescription = extractFlagAltDescription(country);
            const borders = country.borders;
            const currencies = extractCurrencies(country);
            const capitals = country.capital;
            const languages = extractLanguages(country);
            const continents = country.continents;

            // Shallow data may not have been fetched yet
            newData.countries[cca3] = {
              ...newData.countries[cca3],
              data: {
                ...newData.countries[cca3]?.data,
                cca3,
                name: countryName,
                independent,
                area: {
                  ...newData.countries[cca3]?.data?.area,
                  rawValue: area,
                },
                population: {
                  ...newData.countries[cca3]?.data?.population,
                  rawValue: population,
                },
                flag,
                flagDescription,
                borders,
                currencies: {
                  label: currencies.length === 1 ? "Currency" : "Currencies",
                  rawValue: currencies,
                  formattedValue: formatCountryDataArray(currencies),
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
                continents: {
                  label: continents?.length === 1 ? "Continent" : "Continents",
                  rawValue: continents,
                  formattedValue: formatCountryDataArray(continents),
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

          // Calculate and set the area and population ranks
          const countryCodesSortedByArea = Object.keys(newData.countries).sort((a, b) => {
            return areaValueFunction(b) - (areaValueFunction(a));
          });
          const countryCodesSortedByPopulation = Object.keys(newData.countries).sort((a, b) => {
            return populationValueFunction(b) - (populationValueFunction(a));
          });

          newData.rankings = {
            all: {
              byArea: countryCodesSortedByArea.filter(cca3 => newData.countries?.[cca3]?.data?.area),
              byPopulation: countryCodesSortedByPopulation
                  .filter(cca3 => newData.countries?.[cca3]?.data?.population),
            },
            independentOnly: {
              byArea: countryCodesSortedByArea.filter(cca3 => newData.countries?.[cca3]?.data?.area
                  && newData.countries?.[cca3]?.data.independent),
              byPopulation: countryCodesSortedByPopulation
                  .filter(cca3 => newData.countries?.[cca3]?.data?.population
                  && newData.countries?.[cca3]?.data.independent),
            }
          };

          // Construct and set the area and population formatted values
          for (const cca3 of Object.keys(newData.countries)) {
            const country = newData.countries[cca3]?.data;

            setAreaLabels(country, areaValueFunction, newData.rankings.all.byArea,
                newData.rankings.independentOnly.byArea);
            setPopulationLabels(country, populationValueFunction, newData.rankings.all.byPopulation,
                newData.rankings.independentOnly.byPopulation);
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
