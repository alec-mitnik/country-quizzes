import type { Handler } from "@netlify/functions";
import { RestCountries } from "@yusifaliyevpro/countries";
import { fullFields, shallowFields } from "../../types/commonTypes";

// 500 for paid plains (which I have), 100 for free plans
const API_LIMIT = 500;

const client = new RestCountries({ apiKey: process.env.REST_COUNTRIES_KEY! });

const handler: Handler = async (event) => {
  const params = event.queryStringParameters ?? {};

  try {
    if (params.all === "1") {
      const limit = API_LIMIT;
      const firstResult = await client.getCountries({ fields: shallowFields, limit, offset: 0 });

      if (!firstResult.success) {
        return {
          statusCode: 502,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: firstResult.error.message }),
        };
      }

      let countries = [...firstResult.countries];

      if (firstResult.meta.more) {
        const remainingOffsets: number[] = [];
        for (
          let offset = limit;
          offset < firstResult.meta.total;
          offset += limit
        ) {
          remainingOffsets.push(offset);
        }

        const remainingResults = await Promise.all(
          remainingOffsets.map((offset) =>
            client.getCountries({ fields: shallowFields, limit, offset }),
          ),
        );

        const failed = remainingResults.find((r) => !r.success);
        if (failed && !failed.success) throw failed.error;

        countries = [
          ...countries,
          ...remainingResults.flatMap((r) => r.success ? r.countries : []),
        ];
      }

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(countries),
      };
    }

    if (params.codes) {
      const codes = params.codes.split(",").filter(Boolean);
      const results = await Promise.all(
        codes.map((code) => client.getCountryByCode({ alpha_3: code, fields: fullFields })),
      );
      const failed = results.find((r) => !r.success);

      if (failed && !failed.success) {
        return {
          statusCode: 502,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: failed.error.message }),
        };
      }

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(results.flatMap((r) => r.success ? [r.country] : [])),
      };
    }

    return { statusCode: 400, body: JSON.stringify({ error: "Invalid Request" }) };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: String(error) }),
    };
  }
};

export { handler };
