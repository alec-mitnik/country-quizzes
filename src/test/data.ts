import type { Capital, Cca3Code } from "@yusifaliyevpro/countries/types";

// Typing this as StoredCountry makes optional fields for the type require checking
export const testCountry = {
  cca3: "TTO" as Cca3Code,
  name: "Trinidad and Tobago",
  worldFactbookCountryKey: "TD",
  location: "Caribbean, islands between the Caribbean Sea and the North Atlantic Ocean, northeast of Venezuela, south of Grenada",
  independent: true,
  flag: "https://flagcdn.com/tt.svg",
  flagDescription: `The flag of this country has a red field with \
a white-edged black diagonal band that extends from the upper \
hoist-side corner to the lower fly-side corner of the field.`,
  currencies: {
    label: "Currency",
    rawValue: [
      "$ (dollar)"
    ],
    formattedValue: "$ (dollar)",
    markupValue: "$ (dollar) markup",
  },
  capitals: {
    label: "Capital",
    rawValue: [
      "Port of Spain" as Capital
    ],
    formattedValue: "Port of Spain"
  },
  languages: {
    label: "Language",
    rawValue: [
      "English"
    ],
    formattedValue: "English"
  },
  area: {
    rawValue: 5130,
    formattedValueForIndependentOnly: "1,981 sq mi (5,130 sq km) — 165th largest",
    formattedValueForAll: "1,981 sq mi (5,130 sq km) — 176th largest",
  },
  population: {
    rawValue: 1399491,
    formattedValueForIndependentOnly: "1,399,491 people — 151st largest",
    formattedValueForAll: "1,399,491 people — 155th largest",
  },
  populationDensity: {
    rawValue: 27,
    formattedValueForIndependentOnly: "105 people per sq mi (273 people per sq km) — 33rd largest",
    formattedValueForAll: "105 people per sq mi (273 people per sq km) — 52nd largest",
  },
  continents: {
    label: "Continent",
    rawValue: [
      "North America"
    ],
    formattedValue: "North America"
  },
  borders: [],
};

export const testStoredCountryData = {
  countries: {
    [testCountry.cca3]: {
      data: testCountry,
      fullyLoaded: true,
      requested: true,
    },
  },
  shallowDataLoaded: true,
  shallowDataRequested: true,
  rankings: {
    independentOnly: {
      byArea: [],
      byPopulation: [],
      byPopulationDensity: [],
      byFamiliarity: [],
    },
    all: {
      byArea: [],
      byPopulation: [],
      byPopulationDensity: [],
      byFamiliarity: [],
    },
  },
};

export const testShallowStoredCountryData = {
  countries: {
    [testCountry.cca3]: {
      data: testCountry,
      fullyLoaded: true,
      requested: true,
    },
    TCA: {
      data: {
        cca3: "TCA",
        name: "Test Country A",
        worldFactbookCountryKey: "TEST_A",
        location: "Test location A",
        independent: false,
        flag: "Flag_URL_A",
        flagDescription: "Flag description A",
        area: {
          rawValue: 10,
          formattedValueForIndependentOnly: "Test area A for independent only",
          formattedValueForAll: "Test area A for all",
        },
        population: {
          rawValue: 20,
          formattedValueForIndependentOnly: "Test population A for independent only",
          formattedValueForAll: "Test population A for all",
        },
        populationDensity: {
          rawValue: 30,
          formattedValueForIndependentOnly: "Test population density A for independent only",
          formattedValueForAll: "Test population density A for all",
        }
      },
      fullyLoaded: false,
      requested: false,
    },
    TCB: {
      data: {
        cca3: "TCB",
        name: "Test Country B",
        worldFactbookCountryKey: "TEST_B",
        location: "Test location B",
        independent: true,
        flag: "Flag_URL_B",
        flagDescription: "Flag description B",
        area: {
          rawValue: 30,
          formattedValueForIndependentOnly: "Test area B for independent only",
          formattedValueForAll: "Test area B for all",
        },
        population: {
          rawValue: 40,
          formattedValueForIndependentOnly: "Test population B for independent only",
          formattedValueForAll: "Test population B for all",
        },
        populationDensity: {
          rawValue: 50,
          formattedValueForIndependentOnly: "Test population density B for independent only",
          formattedValueForAll: "Test population density B for all",
        }
      },
      fullyLoaded: false,
      requested: false,
    }
  },
  shallowDataLoaded: true,
  shallowDataRequested: true,
  rankings: {
    independentOnly: {
      byArea: [testCountry.cca3, "TCB"],
      byPopulation: [testCountry.cca3, "TCB"],
      byPopulationDensity: [testCountry.cca3, "TCB"],
      byFamiliarity: [testCountry.cca3, "TCB"],
    },
    all: {
      byArea: [testCountry.cca3, "TCB", "TCA"],
      byPopulation: [testCountry.cca3, "TCB", "TCA"],
      byPopulationDensity: [testCountry.cca3, "TCA", "TCB"],
      byFamiliarity: [testCountry.cca3, "TCA", "TCB"],
    },
  },
};
