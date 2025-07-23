# Country Quizzes
#### A single-page React/TypeScript app using the REST Countries API to generate fun quizzes.

A deploy of this code is available at https://alec-mitnik-country-quizzes.netlify.app/

Has a simple landing page, a Countries directory page with links to detail pages for each country,
and a Quiz page, though that still needs more time to get the actual mechanics fully implemented.
The groundwork is there at least, and I plan to see this project through to completion.

Supports light and dark color schemes, applying the preference detected by the browser.
Works across different browsers and viewport sizes, and adheres to accessible practices, such as:
* Keyboard and screen reader support
* Semantic HTML and appropriate aria attributes
* Supporting high zoom or text magnification without content getting cut off
* Maintaining sufficient color contrast
* Honoring a reduced motion preference
* Supporting a high-contrast mode (on Windows this mode can be toggled with Alt+Shift+Printscreen)

Includes automated unit tests and a few integration tests using vitest and testing-library.
Tests favor detecting elements by role and accessible name where possible.

To run this project locally, clone the repository, run `npm install`,
then use the configured script commands in package.json to build or test the code.
Use `npm run` and then the script command key.  For example, to run a dev build,
use `npm run dev`. To run tests, use `npm run test`, or `npm run test:ui`
to get a webpage interface along with it.


REST Countries API: https://restcountries.com/

Uses the related `@yusifaliyevpro/countries` package purely for typing the data:
https://github.com/yusifaliyevpro/countries
