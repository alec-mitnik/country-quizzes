import type { Cca3Code, Country } from "@yusifaliyevpro/countries/types";
import fs from 'fs/promises';
import path from 'path';
import type { StoredCountry } from "../types/commonTypes";

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

const RATE_LIMIT_DELAY = 100; // ms between requests to stay under 200/sec
const DATA_DIR = 'src/supplementalData';
const OUTPUT_FILE = path.join(DATA_DIR, 'countryPageviews.json');

interface DateRange {
  start: string;
  end: string;
}

interface WikipediaResponse {
  query: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pages: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    redirects?: any;
  };
}

interface PageviewsResponse {
  items: {
    views: number;
  }[];
}

interface CountryPageviewsEntry {
  rank?: number;
  cca3: Cca3Code;
  name: string;
  pageviews: number;
}

interface OutputData {
  metadata: {
    lastUpdated: string;
    dateRange: DateRange;
    totalCountries: number;
    description: string;
  };
  data: CountryPageviewsEntry[];
}

// Helper function to delay execution
const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

// Get date strings for 5 years ago and today
function getDateRange(): DateRange {
  const today = new Date();
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(today.getFullYear() - 5);

  // Format as YYYYMMDD
  const formatDate = (date: Date): string => {
    return date.getFullYear().toString() +
           (date.getMonth() + 1).toString().padStart(2, '0') +
           date.getDate().toString().padStart(2, '0');
  };

  return {
    start: formatDate(fiveYearsAgo),
    end: formatDate(today)
  };
}

// Fetch countries from REST Countries API
async function fetchCountries(): Promise<Partial<StoredCountry>[]> {
  console.log('Fetching countries from REST Countries API...');
  const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca3');

  if (!response.ok) {
    throw new Error(`REST Countries API error: ${response.status}`);
  }

  const countries = await response.json() as Partial<Country>[];
  return countries
    .map(country => ({
      name: country?.name?.common,
      cca3: country.cca3,
    }))
    .sort((a, b) => (a?.name ?? "").localeCompare(b?.name ?? ""));
}

// Check if a page is a disambiguation page
async function isDisambiguationPage(pageTitle: string): Promise<boolean> {
  const categoriesUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(pageTitle)}&prop=categories&origin=*`;

  try {
    const response = await fetch(categoriesUrl);
    const data = await response.json() as WikipediaResponse;

    const pages = data.query?.pages;
    if (!pages) return false;

    const pageId = Object.keys(pages)[0];
    if (pageId === '-1') return false;

    const categories: { title: string }[] = Array.isArray(pages[pageId].categories) ?
        pages[pageId].categories : [];

    // Check if page is in "All disambiguation pages" category
    return categories.some((cat: { title: string }) =>
      cat.title === 'Category:All disambiguation pages' ||
      cat.title === 'Category:Disambiguation pages'
    );
  } catch {
    console.warn(`Could not check disambiguation status for ${pageTitle}`);
    return false;
  }
}

// Resolve country name to canonical Wikipedia page title
async function resolveCanonicalCountryPageTitle(countryName: string): Promise<string> {
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${
      encodeURIComponent(countryName)}&redirects=1&origin=*`;

  try {
    const response = await fetch(searchUrl);
    const data = await response.json() as WikipediaResponse;

    // If there's a redirect, use the target title
    if (data.query?.redirects && data.query.redirects.length > 0) {
      return data.query.redirects[0].to;
    }

    // Otherwise, use the original title (check if page exists)
    const pages = data.query?.pages;
    if (pages) {
      const pageId = Object.keys(pages)[0];
      if (pageId !== '-1') { // -1 means page doesn't exist
        return pages[pageId].title;
      }
    }

    // Fallback to original name
    console.warn(`Could not resolve canonical country page for ${countryName}, using original name`);
    return countryName;
  } catch {
    console.warn(`Could not resolve canonical country page title for ${countryName}, using original name`);
    return countryName;
  }
}

// Fetch pageviews for a single country.  This approach has a known limitation of
// inaccuracy regarding countries often grouped differently, such as Svalbard and Jan Mayen (often separate),
// South Georgia (often grouped with the South Sandwich Islands), Caribbean Netherlands
// (often separate), United States Minor Outlying Islands (often separate), Palestine (often separate), etc.
async function fetchCountryPageviews(
  countryName: string,
  cca3: string,
  dateRange: DateRange
): Promise<number> {
  const knownOverrides: Partial<Record<Cca3Code, string>> = {
    GEO: 'Georgia (country)',
    MAF: 'Collectivity of Saint Martin',
  }

  try {
    let canonicalTitle = countryName;
    console.log(`Fetching pageviews for: ${countryName} (${cca3})`);

    // Check known overrides
    if (knownOverrides[cca3]) {
      canonicalTitle = knownOverrides[cca3];
      console.log(`  → using known override: ${canonicalTitle}`);
    } else {
      // Resolve to canonical title
      canonicalTitle = await resolveCanonicalCountryPageTitle(countryName);

      if (canonicalTitle !== countryName) {
        console.log(`  → canonical page title resolved to: ${canonicalTitle}`);
      }

      if (await isDisambiguationPage(canonicalTitle)) {
        canonicalTitle = `${canonicalTitle} (country)`;
        console.log(`  → result is a disambiguation page, instead will try: ${canonicalTitle}`);
        canonicalTitle = await resolveCanonicalCountryPageTitle(canonicalTitle);
      }
    }

    // Replace spaces with underscores
    const articleName = encodeURIComponent(canonicalTitle.replace(/ /g, '_'));
    const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${
        articleName}/monthly/${dateRange.start}/${dateRange.end}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`Warning: Failed to fetch data for ${canonicalTitle} (${response.status})`);
      return 0;
    }

    const data = await response.json() as PageviewsResponse;

    if (!data.items || data.items.length === 0) {
      console.warn(`Warning: No pageview data found for ${canonicalTitle}`);
      return 0;
    }

    // Calculate total views over the 5-year period
    const totalViews = data.items.reduce((sum, item) => sum + (item.views || 0), 0);

    return totalViews;
  } catch (error) {
    console.error(`Error fetching pageviews for ${countryName} (${cca3}):`,
      error instanceof Error ? error.message : String(error));
    return 0;
  }
}

/**
 * Fetches pageviews for all countries and writes them to
 * a countryPageviews.json file at the configured directory.
 * Run this by calling `npx tsx ./scripts/fetchPageviews.ts`.
 */
async function fetchAllCountryPageviews(): Promise<void> {
  try {
    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Get date range for last 5 years
    const dateRange = getDateRange();
    console.log(`Starting fetch for all country pageviews from ${dateRange.start} to ${dateRange.end}...\n`);

    // Fetch all countries
    const originalCountries = await fetchCountries();
    console.log(`Found ${originalCountries.length} countries\n`);

    const countries = originalCountries.filter(
        country => country.name && country.cca3) as { name: string, cca3: Cca3Code }[];

    if (countries.length !== originalCountries.length) {
      console.warn(`Warning: ${originalCountries.length - countries.length} countries had missing data`);
    }

    // Fetch pageviews for each country with rate limiting
    const pageviewsEntries: CountryPageviewsEntry[] = [];
    let processedCount = 0;

    for (const country of countries) {
      const pageviews = await fetchCountryPageviews(country.name, country.cca3, dateRange);
      pageviewsEntries.push({
        cca3: country.cca3,
        name: country.name,
        pageviews: pageviews
      });

      processedCount++;

      if (processedCount % 10 === 0) {
        console.log(`Progress: ${processedCount}/${countries.length} (${
            Math.round(processedCount/countries.length*100)}%)\n`);
      }

      // Rate limiting (extra delay for the additional API calls)
      if (processedCount < countries.length) {
        await delay(RATE_LIMIT_DELAY * 3);
      }
    }

    // Sort countries by pageviews (descending) and add rank value
    const sortedData = pageviewsEntries.sort((a, b) => b.pageviews - a.pageviews).map((country, index) => ({
      ...country,
      rank: index + 1,
    }));

    // Add metadata
    const output: OutputData = {
      metadata: {
        lastUpdated: new Date().toISOString(),
        dateRange: dateRange,
        totalCountries: countries.length,
        description: "Total Wikipedia pageviews over the last 5 years for each country, sorted by pageviews descending"
      },
      data: sortedData
    };

    // Write to file
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2));

    console.log(`\n✅ Successfully fetched pageviews data for all countries!`);
    console.log(`📝 Data saved to: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('❌ Error updating country pageviews:',
      error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the update
void fetchAllCountryPageviews();
