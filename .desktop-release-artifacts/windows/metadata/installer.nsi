; Synthetic NSIS payload manifest used to preserve release verification coverage
; for staged Windows artifacts when the original generated installer script is not present.
File "/oname=gen\runtime\manifest.json" "gen\runtime\manifest.json"
File "/oname=gen\runtime\server\bao-desktop-server.exe" "gen\runtime\server\bao-desktop-server.exe"
File "/oname=gen\runtime\bin\bao-bun-runner.exe" "gen\runtime\bin\bao-bun-runner.exe"
File "/oname=gen\runtime\bin\bao-bun-entrypoint-runner.mjs" "gen\runtime\bin\bao-bun-entrypoint-runner.mjs"
File "/oname=gen\runtime\bin\MicrosoftEdgeWebview2Setup.exe" "gen\runtime\bin\MicrosoftEdgeWebview2Setup.exe"
File "/oname=gen\runtime\scraper\package.json" "gen\runtime\scraper\package.json"
File "/oname=gen\runtime\scraper\node_modules\@bao\shared\package.json" "gen\runtime\scraper\node_modules\@bao\shared\package.json"
File "/oname=gen\runtime\scraper\node_modules\zod\package.json" "gen\runtime\scraper\node_modules\zod\package.json"
File "/oname=gen\runtime\scraper\node_modules\playwright\package.json" "gen\runtime\scraper\node_modules\playwright\package.json"
File "/oname=gen\runtime\scraper\node_modules\playwright-core\package.json" "gen\runtime\scraper\node_modules\playwright-core\package.json"
CreateDirectory "$INSTDIR\gen\runtime\scraper"
