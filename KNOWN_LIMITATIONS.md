# Verified limitations and grading scope

## Museum transport and fallback

The final dataset is 72 genuine Cleveland Museum of Art API records with their corresponding CC0 images. It was fetched with Axios, saved in `public/data/collection.json`, and is fetched by the app through Axios on startup. `npm run data:refresh` deliberately refreshes this dataset using the official API.

During real integration testing, the upstream API returned valid records to Node/Axios, but its browser response did not include the CORS allow-origin header. Direct browser requests therefore failed. The app's live update remains implemented, but currently the browser normally uses the explicitly labeled saved API response. This is not a live connection and is not presented as one. The real-image test accepts this documented fallback only when the UI visibly identifies it; its report records the observed source status. The separate upstream API test verifies Node/Axios connectivity, not browser connectivity.

The supplied course README expressly allows local response substitutes when the API is unavailable, and caching API responses. All required search, sorting, filtering, details and navigation features work with the cached real response. Nevertheless, the instructor determines whether this particular provider limitation is acceptable; this implementation is not a guarantee of 100 points. A rubric requiring successful direct browser-to-provider requests beyond the supplied README would need a CORS-enabled provider or an authorized same-origin proxy.

The saved response includes metadata only; images still load from the museum's public CDN. Image failures receive a visible fallback. Records outside the selected 72 may not be retrievable while browser CORS is unavailable; every linked detail route in the selected collection works without that external request.

## GitHub Pages detail URLs

The build produces a copy of index.html as 404.html so BrowserRouter can display directly opened detail routes on GitHub Pages. The initial document's HTTP status may remain 404 even though the application renders. This is not a server-side 200 rewrite.

## Student submission remains outstanding

Source and tests are not the entire submission. The student still must record and share the deployed demo, export full AI chatlogs, complete the LLM survey, and submit the grading form. ai-logs/README.md is a disclosure, not a complete chatlog.
