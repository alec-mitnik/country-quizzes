import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import { localeIncludes } from "locale-includes";
import { useEffect, useMemo, useState } from "react";
import Button from "../Button";
import CountryDirectoryLink from "../CountryDirectoryLink";
import useCountries from "../hooks/useCountries";
import { useLocalStorageStateBoolean, useLocalStorageStateString } from "../hooks/useLocalStorageState";
import RenderWithLoading from "../RenderWithLoading";
import {
  COUNTRIES_FLAG_DESIGN_FILTER_NONE,
  COUNTRIES_FLAG_DESIGN_FILTER_SUMMARY,
  COUNTRIES_SEARCH_ACCESSIBLE_NAME, COUNTRIES_SORT_BY_ACCESSIBLE_NAME, COUNTRIES_TITLE, NO_COUNTRIES_LOADED_MESSAGE,
  NO_COUNTRIES_MATCHED_MESSAGE
} from "../utils/consts";
import { sortCountryCodesByName } from "../utils/countryUtils";
import { FLAG_DESIGN_GROUPS, FLAG_DESIGN_GROUPS_BY_NAME } from "../utils/flagDesignGroups";
import "./Countries.css";
import Page from "./Page";

type SortBy = "name" | "size" | "population" | "populationDensity";

/**
 * Displays all the independent countries supplied by the REST Countries API
 * as links to their own respective pages, along with a search input for filtering
 */
function Countries() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFlagDesignGroup, setSelectedFlagDesignGroup] = useState("");
  const [useStricterFlagDesignFiltering, setUseStricterFlagDesignFiltering] = useState(false);
  const [flagDesignFiltersOpen, setFlagDesignFiltersOpen] = useState(false);

  const { independentOnly, storedCountryData, error,
      fetchShallowDataForAllCountries } = useCountries();

  const [sortCountriesBy, setSortCountriesBy] =
      useLocalStorageStateString("sortCountriesBy", "name");
  const [sortCountriesReversed, setSortCountriesReversed] =
      useLocalStorageStateBoolean("sortCountriesReversed");

  useEffect(() => {
    if (!error && !storedCountryData.shallowDataRequested) {
      fetchShallowDataForAllCountries();
    }
  }, [error, storedCountryData.shallowDataRequested, fetchShallowDataForAllCountries]);

  // Sort countries
  const countryCodesFilteredByIndependence: Cca3Code[] = useMemo(() => {
    if (!error && storedCountryData.shallowDataLoaded
        && Object.keys(storedCountryData.countries).length) {
      let countriesArray: Cca3Code[];

      switch (sortCountriesBy) {
        case "size":
          countriesArray = [...storedCountryData.rankings[independentOnly ?
              "independentOnly" : "all"].byArea];
          break;
        case "population":
          countriesArray = [...storedCountryData.rankings[independentOnly ?
              "independentOnly" : "all"].byPopulation];
          break;
        case "populationDensity":
          countriesArray = [...storedCountryData.rankings[independentOnly ?
              "independentOnly" : "all"].byPopulationDensity];
          break;
        default: {
          let countriesByName = Object.keys(storedCountryData.countries) as Cca3Code[];
          sortCountryCodesByName(countriesByName, storedCountryData.countries);

          // Filter by independence
          if (independentOnly) {
            countriesByName = countriesByName.filter(countryCode =>
                storedCountryData.countries[countryCode]?.data?.independent);
          }

          countriesArray = countriesByName;
        }
      }

      if (sortCountriesReversed) {
        countriesArray.reverse();
      }

      return countriesArray;
    } else {
      return [];
    }
  }, [storedCountryData, error, sortCountriesBy, sortCountriesReversed, independentOnly]);

  // Filter countries
  const countryCodesFilteredBySearch = useMemo(() => {
    // Filter by name
    let filteredCountryCodes = countryCodesFilteredByIndependence.filter(countryCode => {
      return !searchTerm
          || localeIncludes(storedCountryData.countries[countryCode]?.data?.name ?? "",
          searchTerm, {
            usage: "search",    // Optimize for filtering
            sensitivity: "base" // Ignore case and diacritics
          });
    });

    // Filter by flag design
    if (selectedFlagDesignGroup) {
      const flagDesignGroupOrSet = FLAG_DESIGN_GROUPS_BY_NAME.get(selectedFlagDesignGroup);

      if (flagDesignGroupOrSet) {
        if ("flagDesignGroups" in flagDesignGroupOrSet) {
          filteredCountryCodes = filteredCountryCodes.filter(countryCode => {
            return flagDesignGroupOrSet.flagDesignGroups.some(group => {
                return group.countryCodes.includes(countryCode)
                    || (!useStricterFlagDesignFiltering
                        && group.stretchCountryCodes.includes(countryCode));
            });
          });
        } else {
          filteredCountryCodes = filteredCountryCodes.filter(countryCode => {
            return flagDesignGroupOrSet.countryCodes.includes(countryCode)
                || (!useStricterFlagDesignFiltering
                    && flagDesignGroupOrSet.stretchCountryCodes.includes(countryCode));
          });
        }
      }
    }

    return filteredCountryCodes;
  }, [countryCodesFilteredByIndependence, searchTerm, storedCountryData,
      useStricterFlagDesignFiltering, selectedFlagDesignGroup]);

  function resetFilters() {
    setSortCountriesBy("name");
    setSortCountriesReversed(false);
    setSearchTerm("");
    setSelectedFlagDesignGroup("");
  }

  return (
    <Page pageTitle={COUNTRIES_TITLE}>
      <RenderWithLoading loaded={storedCountryData.shallowDataLoaded} error={error}
          dataExists={countryCodesFilteredByIndependence.length > 0}
          noDataMessage={NO_COUNTRIES_LOADED_MESSAGE}>
        <div className="countries-component component-wrapper">
          <Button id="reset-filters-button" type="button" className="small" onClick={() => resetFilters()}>
            Reset Filters
          </Button>

          <fieldset>
            <legend>{COUNTRIES_SORT_BY_ACCESSIBLE_NAME}</legend>

            <label>
              <input type="radio" name="sort" value="name" checked={sortCountriesBy === "name"}
                  onChange={(e) => setSortCountriesBy(e.currentTarget.value as SortBy)} />
              Name
            </label>

            <label>
              <input type="radio" name="sort" value="size" checked={sortCountriesBy === "size"}
                  onChange={(e) => setSortCountriesBy(e.currentTarget.value as SortBy)} />
              Size
            </label>

            <label>
              <input type="radio" name="sort" value="population" checked={sortCountriesBy === "population"}
                  onChange={(e) => setSortCountriesBy(e.currentTarget.value as SortBy)} />
              Total Population
            </label>

            <label>
              <input type="radio" name="sort" value="populationDensity"
                  checked={sortCountriesBy === "populationDensity"}
                  onChange={(e) => setSortCountriesBy(e.currentTarget.value as SortBy)} />
              Population Density
            </label>

            <div>
              <label>
                <input type="checkbox" name="sortReversed"
                    checked={sortCountriesReversed}
                    onChange={(e) => setSortCountriesReversed(e.currentTarget.checked)} />
                Reversed
              </label>
            </div>
          </fieldset>

          <label>
            {COUNTRIES_SEARCH_ACCESSIBLE_NAME}
            <input type="search" id="countries-filter" placeholder="🔍︎ Start typing to filter..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.currentTarget.value)} />
          </label>

          <details open={flagDesignFiltersOpen} onToggle={(e) => setFlagDesignFiltersOpen(e.currentTarget.open)}>
            <summary>
              {COUNTRIES_FLAG_DESIGN_FILTER_SUMMARY}{selectedFlagDesignGroup
                  && !flagDesignFiltersOpen ? `: ${selectedFlagDesignGroup}` : ""}
            </summary>

            <label>
              <input type="radio" name="flagDesign" value=""
                  checked={!selectedFlagDesignGroup}
                  onChange={(e) => setSelectedFlagDesignGroup(e.currentTarget.value)} />
              {COUNTRIES_FLAG_DESIGN_FILTER_NONE}
            </label>

            {FLAG_DESIGN_GROUPS.map((flagDesignGroupOrSet) => {
              if ("flagDesignGroups" in flagDesignGroupOrSet) {
                return (
                  <fieldset key={flagDesignGroupOrSet.name}>
                    <legend>
                      <label>
                        <input type="radio" name="flagDesign" value={flagDesignGroupOrSet.name}
                            checked={selectedFlagDesignGroup === flagDesignGroupOrSet.name}
                            onChange={(e) => setSelectedFlagDesignGroup(e.currentTarget.value)} />
                        {flagDesignGroupOrSet.name}
                      </label>
                    </legend>

                    {flagDesignGroupOrSet.flagDesignGroups.map((flagDesignGroup) => {
                      return (
                        <label key={flagDesignGroup.name}>
                          <input type="radio" name="flagDesign" value={flagDesignGroup.name}
                              checked={selectedFlagDesignGroup === flagDesignGroup.name}
                              onChange={(e) => setSelectedFlagDesignGroup(e.currentTarget.value)} />
                          {flagDesignGroup.name}
                        </label>
                      );
                    })}
                  </fieldset>
                );
              } else {
                return (
                  <label key={flagDesignGroupOrSet.name}>
                    <input type="radio" name="flagDesign" value={flagDesignGroupOrSet.name}
                        checked={selectedFlagDesignGroup === flagDesignGroupOrSet.name}
                        onChange={(e) => setSelectedFlagDesignGroup(e.currentTarget.value)} />
                    {flagDesignGroupOrSet.name}
                  </label>
                );
              }
            })}

            <div>
              <label>
                <input type="checkbox" name="useStricterFiltering"
                    checked={useStricterFlagDesignFiltering}
                    onChange={(e) => setUseStricterFlagDesignFiltering(e.currentTarget.checked)} />
                Use Stricter Design Filtering
              </label>
            </div>
          </details>

          {!countryCodesFilteredBySearch.length && <p>{NO_COUNTRIES_MATCHED_MESSAGE}</p>}

          {!!countryCodesFilteredBySearch.length && <nav className="directory" aria-labelledby="page-title">
            <ul>
              {countryCodesFilteredBySearch.map((countryCode) => {
                const countryName = storedCountryData.countries[countryCode]?.data?.name ?? "ERROR";
                const flag = storedCountryData.countries[countryCode]?.data?.flag;

                return (
                  <CountryDirectoryLink key={countryName} cca3={countryCode}
                      countryName={countryName} flag={flag} />
                );
              })}
            </ul>
          </nav>}
        </div>
      </RenderWithLoading>
    </Page>
  );
}

export default Countries;
