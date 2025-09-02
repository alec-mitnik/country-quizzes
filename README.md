# Country Quizzes
#### A single-page React/TypeScript app using the REST Countries API to generate fun quizzes.

A deploy of this code is available at https://alec-mitnik-country-quizzes.netlify.app/

Has a simple landing page, a Countries directory page with links to detail pages for each country,
and a Quiz page.  Additional quiz types and other features are still in the works.

Supports light and dark color schemes, applying the preference detected by the browser.
Works across different browsers and viewport sizes, and adheres to accessible practices, such as:
* Providing alt text or captions for images, including flag and location map descriptions
* Graceful handling for when images fail to load or are disabled by the browser
* Keyboard and screen reader support, including alternatives to drag-and-drop
* Semantic HTML and appropriate aria attributes
* Announcing for screen readers the results of special actions by using aria-live regions
* Supporting high zoom or text magnification without content getting cut off
* Maintaining sufficient color contrast
* Honoring a reduced motion preference
* Supporting a high-contrast mode (on Windows this mode can be toggled with Alt+Shift+Printscreen)

Includes automated unit tests and a few integration tests using vitest and testing-library.
Tests favor detecting elements by role and accessible name where possible.
This testing continues to be worked on in aims to reach a more comprehensive coverage.

To run this project locally, clone the repository, run `npm install`,
then use the configured script commands in package.json to build or test the code.
Use `npm run` and then the script command key.  For example, to run a dev build,
use `npm run dev`. To run tests, use `npm run test`, or `npm run test:ui`
to get a webpage interface along with it.


REST Countries API: https://restcountries.com/

Uses the related `@yusifaliyevpro/countries` package purely for typing the data:
https://github.com/yusifaliyevpro/countries

Location descriptions, maps, and some flag descriptions are derived from the CIA World Factbook:
https://www.cia.gov/the-world-factbook/countries/

Any remaining flag descriptions or other missing info is derived from Wikipedia.
I also use pageview counts for the countries, available through their APIs, as a way to gauge
general country familiarity for the purposes of controlling the difficulty of quizzes.
