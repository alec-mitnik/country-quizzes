import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import { Link } from "react-router-dom";
import useSmoothLoadingImageRef from "./hooks/useSmoothLoadingImageRef";

interface CountryDirectoryLinkProps {
  cca3: Cca3Code;
  countryName: string;
  flag?: string;
}

function CountryDirectoryLink({ cca3, countryName, flag }: CountryDirectoryLinkProps) {
  const { imgCallbackRef, doneLoadingClassName, loadFailedClassName } = useSmoothLoadingImageRef();

  return <li>
    <Link to={`/countries/${cca3}`}>
      <img ref={imgCallbackRef} alt="" loading="lazy" src={flag}
          className={`flag smooth-loading${doneLoadingClassName}${loadFailedClassName}`} />
      {countryName}
    </Link>
  </li>;
}

export default CountryDirectoryLink;
