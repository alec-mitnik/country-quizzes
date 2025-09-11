import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import React from "react";
import { Link } from "react-router-dom";
import useCountries from "./hooks/useCountries";

/**
 * Renders an array of country codes as links
 * @param props.value Array of country codes to render as links
 * @returns A comma-separated rendering of country links
 */
function CountryLinksValue({value}: {value: Cca3Code[] | undefined}) {
  const { storedCountryData } = useCountries();

  return value?.length ? (
    <span>
      {value.map((code, index) => (
        <React.Fragment key={code}>
          {index > 0 ? ", " : ""}
          <Link to={`/countries/${code}`}>
            {storedCountryData.countries[code]?.data?.name ?? code}
          </Link>
        </React.Fragment>
      ))}
    </span>
  ) : "None";
}

export default CountryLinksValue;
