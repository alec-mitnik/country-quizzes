import type { Capital, Cca3Code } from "@yusifaliyevpro/countries/types";

// Typing this as StoredCountry makes optional fields for the type require checking
export const countryData = {
  cca3: "TTO" as Cca3Code,
  name: "Trinidad and Tobago",
  flag: "https://flagcdn.com/tt.svg",
  flagDescription: `The flag of this country has a red field with \
a white-edged black diagonal band that extends from the upper \
hoist-side corner to the lower fly-side corner of the field.`,
  currencies: [
    "$ (dollar)"
  ],
  capitals: [
    "Port of Spain" as Capital
  ],
  languages: [
    "English"
  ],
  area: 5130,
  areaLabel: "1,981 sq mi (5,130 sq km) — 165th largest",
  population: 1399491,
  populationLabel: "1,399,491 people — 151st largest",
  continents: [
    "North America"
  ],
};
