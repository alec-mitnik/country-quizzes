import type { Cca3Code } from '@yusifaliyevpro/countries/types';
import { promises as fs } from 'fs';
import { dirname } from 'path';
import type { StoredCountryWrapper } from '../src/CountriesProvider';
import { convertCsvTextToObjectArray } from './csvToJson';

/**
 * Converts data from supplementalCountryData.csv and countryFunFacts.csv into
 * structured country data in supplementalCountryData.json
 */
async function convertSupplementalCountryData() {
  try {
    const filePath = "src/supplementalData/";
    const countryFunFactsCsv = "countryFunFacts.csv";
    const supplementalCountryDataCsv = "supplementalCountryData.csv";
    const supplementalCountryDataJson = "supplementalCountryData.json";

    const countryFunFactsCsvPath = filePath + countryFunFactsCsv;
    const supplementalCountryDataCsvPath = filePath + supplementalCountryDataCsv;
    const outputPath = filePath + supplementalCountryDataJson;

    console.log(`Converting CSV country data to JSON...`);

    // Supplemental Country Data
    const supplementalCountryDataCsvText = await fs.readFile(supplementalCountryDataCsvPath, 'utf-8');
    const supplementalCountryDataArray = convertCsvTextToObjectArray(supplementalCountryDataCsvText);

    if (!supplementalCountryDataArray.length) {
      console.error("No country data extracted from", supplementalCountryDataCsvPath);
      return;
    }

    const supplementalCountryData: Partial<Record<Cca3Code, StoredCountryWrapper>> = {};

    for (const countryData of supplementalCountryDataArray) {
      const cca3 = countryData.cca3 as Cca3Code;
      const name = countryData.name as string;

      if (cca3 && name) {
        supplementalCountryData[cca3] = {
          data: {
            ...countryData,
            cca3,
            name
          },
        };
      } else {
        console.error(`Invalid country data: ${JSON.stringify(countryData)}`);
      }
    }

    console.log("Country data extracted");

    // Country Fun Facts
    const countryFunFactsCsvText = await fs.readFile(countryFunFactsCsvPath, 'utf-8');
    const countryFunFactsArray = convertCsvTextToObjectArray(countryFunFactsCsvText);

    for (const funFactData of countryFunFactsArray) {
      const cca3 = funFactData.cca3 as Cca3Code;
      const funFact = funFactData.funFact as string;

      if (cca3 && funFact) {
        if (!supplementalCountryData[cca3]?.data) {
          console.error("Unrecognized country code:", cca3);
          continue;
        }

        // Initialize array if not defined
        supplementalCountryData[cca3].data.funFacts ??= [];
        supplementalCountryData[cca3].data.funFacts.push(funFact);
      }
    }

    console.log("Country fun facts extracted");

    const jsonString = JSON.stringify(supplementalCountryData, null, 2);

    // Ensure output directory exists
    await fs.mkdir(dirname(outputPath), { recursive: true });

    // Write JSON file
    await fs.writeFile(outputPath, jsonString);

    console.log(`JSON saved to: ${outputPath}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Data conversion failed: ${message}`);
    throw error;
  }
}

// Run the conversion
void convertSupplementalCountryData();
