# Sources and acknowledgments

- Original course MP2 specification: README.md, retained unchanged.
- Cleveland Museum of Art API: https://openaccess-api.clevelandart.org/ — final collection, query parameters, record schema and image URLs.
- Cleveland Museum of Art Open Access: https://www.clevelandart.org/open-access — CC0 metadata and image reuse.
- React: https://react.dev/learn — components, effects and context.
- React Router: https://reactrouter.com/ — BrowserRouter, Link, Routes and URL state.
- Axios: https://axios-http.com/docs/intro and https://axios-http.com/docs/cancellation — requests, errors, timeouts and cancellation.
- TypeScript: https://www.typescriptlang.org/docs/ — compiler configuration and strict types.
- Vite: https://vite.dev/guide/ and https://vite.dev/guide/static-deploy — build tooling and repository base paths.
- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site — custom 404 document.
- Playwright: https://playwright.dev/docs/intro — browser tests, network fixtures and screenshots.
- Node.js: https://nodejs.org/api/test.html — built-in unit test runner.

Earlier provider investigation: https://api.artic.edu/docs/ and https://github.com/art-institute-of-chicago/data-aggregator/issues/151 . The Art Institute of Chicago image endpoint returned a Cloudflare HTTP 403 during integration testing, so it was not retained as the final data source.

Baseline application code, styles, tests, Actions changes and project documentation were generated with ChatGPT assistance. No third-party completed MP was used. The starting deployment workflow came from the course template. Dependencies retain their own licenses.

All production artwork records and images are from Cleveland Museum of Art, using records marked CC0. Museum and artist credits are preserved. This is an independent student project, not a museum-affiliated site.

This disclosure does NOT replace the required complete chatlogs and LLM survey. Add references and logs for all subsequent edits.
