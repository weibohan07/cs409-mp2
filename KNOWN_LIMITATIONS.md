# Implementation notes and limitations

## Museum API endpoint: resolved browser CORS issue

Use the canonical `https://openaccess-api.clevelandart.org/api/artworks` endpoint without a trailing slash. Integration testing found that `/artworks/` did not return the browser CORS header, while `/artworks` returned `Access-Control-Allow-Origin: *`. The application now uses the canonical endpoint. The real-browser integration test requires the live API connection to succeed; it does not accept the fallback as a successful live connection.

The 72-record genuine API snapshot remains for initial rendering and temporary API outages. Runtime updates use Axios, with one-hour caching; failures explicitly identify the saved/cached data source. The outage behavior has a separate browser test. Images are the museum's actual CC0 image URLs, not unrelated placeholders. The snapshot covers metadata only; offline images are not guaranteed.

The original Art Institute of Chicago image host returned HTTP 403 during testing, so the final product uses Cleveland Museum of Art, an alternate public API allowed by the supplied README.

## GitHub Pages detail URLs

The build copies index.html to 404.html so BrowserRouter can display directly opened detail routes on GitHub Pages. The initial document's HTTP status may remain 404 even though the application renders. This is not a server-side 200 rewrite.

## Student submission

The student still must record and share the deployed demo, export full AI chatlogs, complete the LLM survey, and submit the grading form. ai-logs/README.md is a disclosure, not a complete chatlog. Automated test results are not a guarantee of the instructor's grade.
