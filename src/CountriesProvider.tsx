import type { Capital, Cca3Code, Country } from "@yusifaliyevpro/countries/types";
import { useCallback, useMemo, useState } from "react";
import { CountriesContext } from "./CountriesContext";

/*
For reference, partial data info for Country from the API:

type Country = {
  code: Cca3Code;                        // e.g. "USA"
  currencies?: Record<string, {          // e.g. { USD: { name: "United States dollar", symbol: "$" } }
    name: string;
    symbol: string;
  }>;
  capital?: Capital[];                   // e.g. ["Washington, D.C."]
  languages?: Record<string, string>;    // e.g. { eng: "English" }
  borders?: Cca3Code[];                  // e.g. ["CAN", "MEX"]
  area: number;                          // e.g. 9372610 (square km)
  population: number;                    // e.g. 329484123
  continents: string[];                  // e.g. ["North America"]
  flags: {
    png: string;                         // URL
    svg: string;                         // URL
    alt?: string;                        // Description of flag, typically starting like:
                                         // "The flag of the United States of America is composed of..."
  };
}
*/

const SQUARE_KM_PER_SQUARE_MILE = 2.58998811;

/**
 * Restructured country data for use in quizzes and display
 */
export interface StoredCountry {
  cca3: Cca3Code;
  name: string;
  flag?: string;            // SVG URL
  flagDescription?: string; // Descriptive for accessibility, but obfuscating the country name for quizzing
  // borders?: Cca3Code[];  // TODO
  continents?: string[];
  capitals?: Capital[];
  languages?: string[];
  currencies?: string[];
  area?: number;            // TODO - store overall rank?
  areaLabel?: string;
  population?: number;      // TODO - store overall rank?
  populationLabel?: string;
};

/**
 * Handles the restructuring and storage of accumulated countries data
 * @param child content to pass the countries context to
 */
function CountriesProvider({ children }: { children: React.ReactNode }) {
  const [storedCountries, setStoredCountries] = useState<Record<string, StoredCountry>>({});
  const [namesAndCodesLoaded, setNamesAndCodesLoaded] = useState(false);

  function extractCurrencies(country: Partial<Country>) {
    let currencies: string[] = [];

    if (country?.currencies) {
      // Extract currencies using just the last word ("dollar" vs. "United States dollar")
      // For the purpose of quizzing on
      currencies = Object.values({...country?.currencies})
          .map((valueEntry) => {
            let currency: string | undefined = undefined;

            if (valueEntry?.symbol && valueEntry?.name) {
              const nameArray = valueEntry.name.split(" ");
              currency = `${valueEntry.symbol} (${nameArray[nameArray.length - 1]})`;
            }

            return currency;
          }).filter(currency => currency) as string[];

      // Remove duplicates (in the case of e.g. multiple types of $ dollar)
      currencies = [...new Set(currencies)];
    }

    return currencies;
  }

  function extractLanguages(country: Partial<Country>) {
    let languages: string[] = [];

    if (country?.languages) {
      languages = Object.values({...country?.languages})
          .filter(language => language);
    }

    return languages;
  }

  const updateStoredCountriesFromData = useCallback((data: Partial<Country>[],
      onlyNamesAndCodes = false) => {
    if (data?.length) {
      setStoredCountries(prev => {
        const newData = {...prev};

        for (const country of data) {
          if (!country?.cca3) {
            console.error("Country data is missing its code:", country);
            continue;
          }

          if (!country?.name?.common) {
            console.error("Country data is missing its name:", country);
            continue;
          }

          const cca3 = country.cca3;
          const countryName = country.name.common;

          if (onlyNamesAndCodes) {
            // Update of all country names and codes only
            newData[cca3] = {
              ...newData[cca3],
              cca3,
              name: countryName,
            };

            setNamesAndCodesLoaded(true);
          } else {
            // Update of a single country's data
            if (!newData[cca3]) {
              // Names and codes haven't been fetched yet, which can occur
              // if (re)loading a country's page directly
              newData[cca3] = {
                cca3,
                name: countryName,
              };
            }

            const flagAlt = country.flags?.alt;
            let flagDescription = flagAlt;

            if (flagDescription) {
              const countryNames = [countryName, `the ${countryName}`];

              if (country.name.official) {
                countryNames.push(country.name.official, `the ${country.name.official}`);
              }

              // Sort names by length, longest first
              countryNames.sort((a, b) => b.length - a.length);

              for (const name of countryNames) {
                // Replace the country name (case insensitive) with "this country" to obfuscate it,
                // enabling quizzing while remaining accessible
                flagDescription = flagDescription?.replace(new RegExp(name, "gi"), "this country");
              }
            }

            const flag = flagDescription && country.flags?.svg ? country.flags.svg : undefined;
            // TODO - borders
            const currencies = extractCurrencies(country);
            const capitals = country.capital;
            const languages = extractLanguages(country);
            const area = country.area && !isNaN(country.area) ? country.area : undefined;
            const areaLabel = area ?
                `${Math.round(area / SQUARE_KM_PER_SQUARE_MILE).toLocaleString()
                } sq mi (${area.toLocaleString()} sq km)` : undefined;
            const population = country.population && !isNaN(country.population) ?
                country.population : undefined;
            const populationLabel = population ?
                `${population.toLocaleString()} people` : undefined;
            const continents = country.continents;

            newData[cca3] = {
              ...newData[cca3],
              flag,
              flagDescription,
              currencies,
              capitals,
              languages,
              area,
              areaLabel,
              population,
              populationLabel,
              continents,
            };
          }
        }

        return newData;
      });
    }
  }, [setStoredCountries, setNamesAndCodesLoaded]);

  const contextValue = useMemo(() => {
    return { storedCountries, updateStoredCountriesFromData, namesAndCodesLoaded };
  }, [storedCountries, updateStoredCountriesFromData, namesAndCodesLoaded]);

  return (
    <CountriesContext value={contextValue}>
      {children}
    </CountriesContext>
  );
}

export default CountriesProvider;
