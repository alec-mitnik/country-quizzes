import { parse } from 'csv-parse/sync';

// Parse CSV using csv-parse library (handles quotes, commas, and all edge cases)
function parseCsv(csvText: string): (string | number | boolean)[][] {
  return parse(csvText, {
    // Skip empty lines
    skipEmptyLines: true,
    // Trim whitespace from non-quoted fields
    trim: true,
    // Automatically convert types (numbers, booleans, etc.)
    cast: true,
    // Don't convert date strings to Date objects
    castDate: false
  });
}

function convertCsvDataToObjectArray(csvData: (string | number | boolean)[][]) {
  const headers = csvData[0];
  const rows = csvData.slice(1);

  const jsonData: Record<string, string | number | boolean>[] = [];

  for (const row of rows) {
    // Skip empty rows
    if (row.every(cell => cell == null || cell === '')) {
      continue;
    }

    const obj: Record<string, string | number | boolean> = {};

    headers.forEach((header, index) => {
      const value = row[index];
      if (value != null && value !== '') {
        // Convert header to string for object key
        obj[String(header)] = value;
      }
    });

    jsonData.push(obj);
  }

  return jsonData;
}

/**
 * Converts raw CSV text into an object array
 * @param csvText Raw CSV text
 * @returns Object array, taking the first row as headers to use as object keys
 */
export function convertCsvTextToObjectArray(csvText: string) {
  const csvData = parseCsv(csvText);
  return convertCsvDataToObjectArray(csvData);
}
