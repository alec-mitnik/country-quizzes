import { BrowserRouter, Route, Routes } from "react-router-dom";
import CountriesProvider from "./CountriesProvider";
import Countries from "./pages/Countries";
import Country from "./pages/Country";
import Home from "./pages/Home";
import Layout from "./pages/Layout";
import NoPage from "./pages/NoPage";
import Quiz from "./pages/Quiz";

// Extracted for testing with MemoryRouter
export function AppWithoutRouter() {
  return (
    <CountriesProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />

          <Route path="countries" element={<Countries />} />
          <Route path="countries/:country" element={<Country />} />

          <Route path="quiz" element={<Quiz />} />

          {/* 404 page for unrecognized URLs */}
          <Route path="*" element={<NoPage />} />
        </Route>
      </Routes>
    </CountriesProvider>
  );
}

/**
 * Top level app component containing the router
 * and countries context provider
 */
function App() {
  return (
    <BrowserRouter>
      <AppWithoutRouter />
    </BrowserRouter>
  );
}

export default App;
