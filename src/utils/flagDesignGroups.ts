import type { Cca3Code } from "@yusifaliyevpro/countries/types";

interface FlagDesignGroup {
  name: string,
  countryCodes: Cca3Code[],
  stretchCountryCodes: Cca3Code[],
}

interface FlagDesignGroupSet {
  name: string,
  flagDesignGroups: FlagDesignGroup[],
}

// NI for not independent, for reference (will be verified at runtime)
export const FLAG_DESIGN_GROUPS: (FlagDesignGroup | FlagDesignGroupSet)[] = [
  {
    name: "Bands of Yellow, Blue, and Red",
    flagDesignGroups: [
      {
        name: "Horizontal Bands of Yellow, Blue, and Red",
        // Colombia, Ecuador, Venezuela, Armenia, (Mauritius)
        countryCodes: ["COL", "ECU", "VEN", "ARM"],
        stretchCountryCodes: ["MUS"],
      },
      {
        name: "Vertical Bands of Blue, Yellow, and Red",
        // Andorra, Moldova, Romania, Chad
        countryCodes: ["AND", "MDA", "ROU", "TCD"],
        stretchCountryCodes: [],
      },
    ],
  },
  {
    name: "Bands of Red, Yellow, plus Black and/or Green",
    flagDesignGroups: [
      {
        name: "Bands of Red, Yellow, and Black",
        // Germany, Belgium, Uganda
        countryCodes: ["DEU", "BEL", "UGA"],
        stretchCountryCodes: [],
      },
      {
        name: "Bands of Red, Yellow, and Green",
        // Mali, Guinea, Senegal, Cameroon, Myanmar, Ghana, Lithuania, Bolivia, Ethiopia, Guinea-Bissau
        // (Burkina Faso, French Guiana, Mauritania, Mauritius,
        //     Republic of the Congo, Togo, Guyana, São Tomé and Príncipe)
        countryCodes: ["MLI", "GIN", "SEN", "CMR", "MMR", "GHA", "LTU", "BOL", "ETH", "GNB"],
        stretchCountryCodes: ["BFA", "GUF" /* NI */, "MRT", "MUS", "COG", "TGO", "GUY", "STP"],
      },
      {
        name: "Bands of Red, Yellow, Black, and Green",
        // Zimbabwe, (Zambia, Dominica, Saint Kitts and Nevis, Vanuatu, Mozambique)
        countryCodes: ["ZWE"],
        stretchCountryCodes: ["ZMB", "DMA", "KNA", "VUT", "MOZ"],
      },
    ],
  },
  {
    name: "UK Canton on Blue",
    flagDesignGroups: [
      {
        name: "UK Canton on Blue with Stars",
        // Australia/Heard Island and McDonald Islands, New Zealand, Cook Islands,
        // (Tuvalu, similar to below group)
        countryCodes: ["AUS", "HMD" /* NI */, "NZL", "COK" /* NI */],
        stretchCountryCodes: ["TUV"],
      },
      {
        name: "UK Canton on Blue with Coat of Arms",
        // Anguilla, British Virgin Islands, Cayman Islands, Falkland Islands, Montserrat, Pitcairn Islands,
        // "Saint Helena, Ascension, and Tristan da Cunha", South Georgia, Turks and Caicos Islands, (Fiji)
        countryCodes: ["AIA" /* NI */, "VGB" /* NI */, "CYM" /* NI */, "FLK" /* NI */,
            "MSR" /* NI */, "PCN" /* NI */, "SHN" /* NI */, "SGS" /* NI */, "TCA" /* NI */],
        stretchCountryCodes: ["FJI"],
      },
    ],
  },
  {
    name: "Crosses",
    flagDesignGroups: [
      {
        name: "Nordic Crosses",
        // Norway/Bouvet Island/Svalbard and Jan Mayen, Iceland, Finland, Denmark,
        // Åland Islands, Sweden, Faroe Islands
        countryCodes: ["NOR", "BVT" /* NI */, "SJM" /* NI */, "ISL", "FIN", "DNK",
            "ALA" /* NI */, "SWE", "FRO" /* NI */],
        stretchCountryCodes: [],
      },
      {
        name: "Symmetrical Crosses",
        // Georgia, United Kingdom, Dominican Republic, Dominica, Guernsey,
        // (Switzerland, Jersey, Jamaica, Burundi)
        countryCodes: ["GEO", "GBR", "DOM", "DMA", "GGY" /* NI */],
        stretchCountryCodes: ["CHE", "JEY" /* NI */, "JAM", "BDI"],
      },
    ],
  },
  {
    name: "Bands of Black and White/Red/Green",
    flagDesignGroups: [
      {
        name: "Bands and Hoist Element of Black and White/Red/Green",
        // Palestine, Jordan, Sudan, Kuwait, UAE, Western Sahara,
        // (South Sudan, Martinique, Zimbabwe, Vanuatu)
        countryCodes: ["PSE" /* NI */, "JOR", "SDN", "KWT", "ARE", "ESH" /* NI */],
        stretchCountryCodes: ["SSD", "MTQ" /* NI */, "ZWE", "VUT"],
      },
      {
        name: "Three Bands of Black and White/Red/Green",
        // Yemen, Iraq, Syria, Egypt, (Libya, Malawi, "Kenya")
        countryCodes: ["YEM", "IRQ", "SYR", "EGY"],
        stretchCountryCodes: ["LBY", "MWI", "KEN"],
      },
    ],
  },
  {
    name: "Bands of Green, White, and Orange/Red",
    flagDesignGroups: [
      {
        name: "Bands of Green, White, and Orange",
        // Ireland, Ivory Coast, India, Niger
        countryCodes: ["IRL", "CIV", "IND", "NER"],
        stretchCountryCodes: [],
      },
      {
        name: "Bands of Green, White, and Red",
        // Italy, Mexico, Hungary, Bulgaria, Iran, Tajikistan,
        // (Equatorial Guinea, Kuwait, Madagascar, Oman, Suriname)
        countryCodes: ["ITA", "MEX", "HUN", "BGR", "IRN", "TJK"],
        stretchCountryCodes: ["GNQ", "KWT", "MDG", "OMN", "SUR"],
      },
    ],
  },
  {
    name: "Red Fields",
    flagDesignGroups: [
      {
        name: "Symbol on a Red Field",
        // Vietnam, Morocco, Hong Kong, Isle of Man, Tunisia, Kyrgyzstan, Albania, Turkey, China,
        // (Montenegro, Maldives)
        countryCodes: ["VNM", "HKG" /* NI */, "IMN" /* NI */, "TUN", "KGZ", "MAR", "ALB", "TUR", "CHN"],
        stretchCountryCodes: ["MNE", "MDV"],
      },
      {
        name: "Canton on a Red Field",
        // Taiwan, Samoa, Tonga, China, (Wallis and Futuna)
        countryCodes: ["TWN" /* NI */, "WSM", "TON", "CHN"],
        stretchCountryCodes: ["WLF" /* NI */],
      },
    ],
  },
  {
    name: "Bands of Red plus White and/or Blue",
    flagDesignGroups: [
      {
        name: "Bands of Red, White, and Blue",
        // Netherlands, Paraguay, Russia, Slovenia, Slovakia, Croatia,
        // (Costa Rica, Thailand, Luxembourg, France/Saint Martin)
        countryCodes: ["NLD", "PRY", "RUS", "SVN", "SVK", "HRV"],
        stretchCountryCodes: ["CRI", "THA", "LUX", "FRA", "MAF" /* NI */],
      },
      {
        name: "Bands of Red and White",
        // Indonesia, Monaco, Poland, Singapore, Greenland,
        // (Austria, Peru, Latvia, Lebanon, Malta, Gibraltar, Bahrain, Qatar, Canada, Chile, Czechia)
        countryCodes: ["IDN", "MCO", "POL", "SGP", "GRL" /* NI */],
        stretchCountryCodes: ["AUT", "PER", "LVA", "LBN", "MLT", "GIB" /* NI */,
            "BHR", "QAT", "CAN", "CHL", "CZE"],
      },
      {
        name: "Bands of Red and Blue",
        // Sint Maarten, Philippines, (Haiti, Lichtenstein, Panama, Laos, Cambodia)
        countryCodes: ["HTI", "LIE", "SXM" /* NI */, "PHL"],
        stretchCountryCodes: ["PAN", "LAO", "KHM"],
      },
      {
        name: "Bands of Red and White with Stars on Blue",
        // United States/United States Minor Outlying Islands, Liberia, Puerto Rico, Chile, Malaysia, (Cuba)
        countryCodes: ["USA", "UMI" /* NI */, "LBR", "PRI" /* NI */, "CHL", "MYS"],
        stretchCountryCodes: ["CUB"],
      }
    ],
  },
  {
    name: "Bands of Blue, White, and Blue",
    // Argentina, Nicaragua, Honduras, El Salvador, (Guatemala)
    countryCodes: ["ARG", "NIC", "HND", "SLV"],
    stretchCountryCodes: ["GTM"],
  },
  {
    name: "Diagonal Bands",
    // Saint Kitts and Nevis, Namibia, DR Congo, Trinidad and Tobago, Tanzania,
    // (Republic of the Congo, Brunei, Solomon Islands, Marshall Islands)
    countryCodes: ["KNA", "NAM", "COD", "TTO", "TZA"],
    stretchCountryCodes: ["COG", "BRN", "SLB", "MHL"],
  },
];

// Maps and also flattens by one level, so wrap top level groups in an array
const FLAG_DESIGN_GROUPS_FLAT = FLAG_DESIGN_GROUPS.flatMap(item =>
  'flagDesignGroups' in item ? [item, ...item.flagDesignGroups] : [item]
);

// Get any flag design group or set by name
export const FLAG_DESIGN_GROUPS_BY_NAME = new Map(
  FLAG_DESIGN_GROUPS_FLAT.map(group => [group.name, group])
);
