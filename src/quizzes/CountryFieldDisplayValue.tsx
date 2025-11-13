import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import type { FormattedCountryField, StoredCountry } from "../../types/commonTypes";
import useCountries from "../hooks/useCountries";
import { getLocatorMapSrc, getReactNodeString } from "../utils/utils";
import CaptionedImageForMatching from "./CaptionedImageForMatching";

interface CountryFieldDisplayValueProps {
  cca3: Cca3Code;
  field: keyof StoredCountry;
}

function CountryFieldDisplayValue({ cca3, field }: CountryFieldDisplayValueProps) {
  const { storedCountryData } = useCountries();

  const value = storedCountryData.countries[cca3]?.data?.[field];
  let display: React.ReactNode;

  switch (field) {
    case "location": {
      const key = storedCountryData.countries[cca3]?.data?.worldFactbookCountryKey;

      display = <CaptionedImageForMatching
          src={key ? getLocatorMapSrc(key) : undefined}
          imageTerm="Location"
          caption={getReactNodeString(value as string ?? "Unknown",
              "The location of this country. No additional description available.")} />
      break;
    }
    case "flagDescription": {
      display = <CaptionedImageForMatching
          src={storedCountryData.countries[cca3]?.data?.flag}
          imageTerm="Flag"
          caption={getReactNodeString(value as string,
              "The flag of this country. No additional description available.")} />
      break;
    }
    default: {
      display = (value as FormattedCountryField<string[]>).markupValue ??
          (value as FormattedCountryField<string>).formattedValue ?? "Unknown";
    }
  }

  return display;
}

export default CountryFieldDisplayValue;
