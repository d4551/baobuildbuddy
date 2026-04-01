# BaoBuildBuddy - Automated setup for Windows (PowerShell)
# Usage: powershell -ExecutionPolicy Bypass -File scripts\setup.ps1 [-SkipChecks] [-SkipBrowserInstall] [-IncludeBuild] [-IncludeDesktopBuild]
param(
    [switch]$SkipChecks,
    [switch]$SkipBrowserInstall,
    [switch]$IncludeBuild,
    [switch]$IncludeDesktopBuild,
    [switch]$Help
)

$ErrorActionPreference = "Continue"
$script:Errors = 0
$script:Warnings = 0

function Step($msg)  { Write-Host "`n>>> $msg" -ForegroundColor Cyan }
function Ok($msg)    { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Warn($msg)  { Write-Host "  [WARN] $msg" -ForegroundColor Yellow; $script:Warnings++ }
function Fail($msg)  { Write-Host "  [FAIL] $msg" -ForegroundColor Red; $script:Errors++ }
function Die($msg)   { Write-Host "`n  [FATAL] $msg" -ForegroundColor Red; exit 1 }

if ($Help) {
    Write-Host "Usage: powershell -ExecutionPolicy Bypass -File scripts\setup.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -SkipChecks   Skip typecheck, lint, and test verification"
    Write-Host "  -SkipBrowserInstall Skip Playwright browser installation"
    Write-Host "  -IncludeBuild Run bun run build after checks"
    Write-Host "  -IncludeDesktopBuild Run bun run build:desktop after checks/build"
    Write-Host "  -Help         Show this help message"
    exit 0
}

$packageManifestPath = Join-Path $PSScriptRoot ".." "package.json"
$packageManifest = Get-Content -Raw $packageManifestPath 2>$null
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($packageManifest)) {
    Die "Unable to read root package.json at $packageManifestPath"
}

$bunRequirementMatch = [regex]::Match($packageManifest, '"packageManager"\s*:\s*"bun@([0-9]+)\.([0-9]+)\.([0-9]+)"')
if (-not $bunRequirementMatch.Success) {
    Die "Unable to resolve required Bun version from package.json packageManager field."
}
$requiredBunMajor = [int]$bunRequirementMatch.Groups[1].Value
$requiredBunMinor = [int]$bunRequirementMatch.Groups[2].Value

Write-Host @"

   ____              ____        _ _     _ ____            _     _
  | __ )  __ _  ___ | __ ) _   _(_) | __| | __ ) _   _  __| | __| |_   _
  |  _ \ / _` |/ _ \|  _ \| | | | | |/ _` |  _ \| | | |/ _` |/ _` | | | |
  | |_) | (_| | (_) | |_) | |_| | | | (_| | |_) | |_| | (_| | (_| | |_| |
  |____/ \__,_|\___/|____/ \__,_|_|_|\__,_|____/ \__,_|\__,_|\__,_|\__, |
                                                                     |___/

"@ -ForegroundColor White

$osInfo = [System.Environment]::OSVersion
Write-Host "  Platform: Windows $($osInfo.Version)" -ForegroundColor DarkGray
Write-Host "  Script:   setup.ps1" -ForegroundColor DarkGray
Write-Host ""

# -- 1. Check prerequisites ----------------------------------------------------

Step "Checking prerequisites..."

$bunVer = & bun --version 2>$null
if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($bunVer)) {
    Ok "Bun $bunVer"
} else {
    Die "Bun is not installed or not available in PATH. Install from https://bun.sh"
}

if ($bunVer -match "^(\d+)\.(\d+)\.(\d+)") {
    $bunMajor = [int]$Matches[1]
    $bunMinor = [int]$Matches[2]
    if ($bunMajor -ne $requiredBunMajor -or $bunMinor -ne $requiredBunMinor) {
        Die "Bun $bunVer detected. Workspace requires Bun $($requiredBunMajor).$($requiredBunMinor).x."
    }
} else {
    Die "Unable to parse Bun version: $bunVer"
}

$gitVer = & git --version 2>$null
if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($gitVer)) {
    Ok $gitVer
} else {
    Die "Git is not installed or not available in PATH."
}

$chromeFound = $false
$chromePaths = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)
foreach ($p in $chromePaths) {
    if (Test-Path $p) {
        Ok "Chrome found: $p"
        $chromeFound = $true
        break
    }
}
if (-not $chromeFound) {
    Warn "Chrome not detected -- RPA browser automation requires it"
}

# Playwright bundles its own Chromium — system Chrome remains optional.

# -- 2. Install Bun dependencies -----------------------------------------------

Step "Installing Bun dependencies..."
& bun install
if ($LASTEXITCODE -eq 0) { Ok "bun install complete" }
else { Fail "bun install failed with exit code $LASTEXITCODE" }

Step "Preparing Nuxt types..."
Push-Location packages/client
& bun --bun run nuxt prepare 2>&1
if ($LASTEXITCODE -eq 0) { Ok "Nuxt types generated" }
else { Warn "Nuxt prepare failed -- client typecheck/lint may fail" }
Pop-Location

Step "Generating server type declarations..."
& bun run --cwd packages/server build:types 2>&1
if ($LASTEXITCODE -eq 0) { Ok "Server type declarations generated" }
else { Warn "Server build:types failed -- client lint may fail" }

# -- 3. Playwright browsers -----------------------------------------------------

if (-not $SkipBrowserInstall) {
    Step "Installing Playwright Chromium for Bun automation runtime..."
    & bun run automation:browsers:install 2>&1
    if ($LASTEXITCODE -eq 0) { Ok "Playwright Chromium installed" }
    else { Fail "Playwright browser installation failed" }
} else {
    Write-Host "`n  Skipping Playwright browser installation (-SkipBrowserInstall)" -ForegroundColor DarkGray
}

# -- 4. Environment file -------------------------------------------------------

Step "Checking environment configuration..."

if (Test-Path ".env") {
    Ok ".env exists"
} else {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        $envContent = Get-Content ".env" | Where-Object { $_ -notmatch '^NUXT_PUBLIC_I18N_SUPPORTED_LOCALES=' }
        $envContent | Set-Content ".env"
        Add-Content ".env" "AUTOMATION_STDIO_BUFFER_LIMIT=2000"
        Ok "Created .env from .env.example"
        Warn "Edit .env with your environment-specific values before running"
    } else {
        Fail ".env.example not found -- cannot bootstrap environment"
    }
}

# -- 5. Database ---------------------------------------------------------------

Step "Setting up database..."

& bun run db:generate 2>&1
if ($LASTEXITCODE -eq 0) { Ok "Schema generation complete" }
else { Fail "db:generate failed" }

& bun run db:push 2>&1
if ($LASTEXITCODE -eq 0) { Ok "Schema push complete" }
else { Fail "db:push failed" }

# -- 6. Verification -----------------------------------------------------------

if (-not $SkipChecks) {
    Step "Running verification checks..."

    & bun run typecheck 2>&1
    if ($LASTEXITCODE -eq 0) { Ok "Typecheck passed" }
    else { Fail "Typecheck failed -- run 'bun run typecheck' for details" }

    & bun run lint 2>&1
    if ($LASTEXITCODE -eq 0) { Ok "Lint passed (includes WCAG/token validation)" }
    else { Fail "Lint failed -- run 'bun run lint' for details" }

    & bun run test 2>&1
    if ($LASTEXITCODE -eq 0) { Ok "Tests passed" }
    else { Fail "Tests failed -- run 'bun run test' for details" }
} else {
    Write-Host "`n  Skipping verification (-SkipChecks)" -ForegroundColor DarkGray
}

if ($IncludeBuild) {
    Step "Building applications..."
    & bun run build 2>&1
    if ($LASTEXITCODE -eq 0) { Ok "Build passed" }
    else { Fail "Build failed -- run 'bun run build' for details" }
} else {
    Write-Host "`n  Skipping build (-IncludeBuild not set)" -ForegroundColor DarkGray
}

if ($IncludeDesktopBuild) {
    Step "Building desktop application (Tauri)..."
    $rustc = & rustc --version 2>$null
    $cargo = & cargo --version 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($rustc) -or [string]::IsNullOrWhiteSpace($cargo)) {
        Fail "Desktop build requested but Rust toolchain is unavailable (rustc/cargo missing)"
    } else {
        $previousLang = $env:LANG
        $previousLcAll = $env:LC_ALL
        $env:LANG = "en_US.UTF-8"
        $env:LC_ALL = "en_US.UTF-8"
        & bun run build:desktop 2>&1
        if ($LASTEXITCODE -eq 0) { Ok "Desktop build passed" }
        else { Fail "Desktop build failed -- run '$env:LANG=en_US.UTF-8; $env:LC_ALL=en_US.UTF-8; bun run build:desktop' for details" }
        $env:LANG = $previousLang
        $env:LC_ALL = $previousLcAll
    }
} else {
    Write-Host "`n  Skipping desktop build (-IncludeDesktopBuild not set)" -ForegroundColor DarkGray
}

# -- Summary --------------------------------------------------------------------

Write-Host ""
Write-Host ("=" * 48) -ForegroundColor White

if ($script:Errors -eq 0 -and $script:Warnings -eq 0) {
    Write-Host "  Setup complete! No issues found." -ForegroundColor Green
} elseif ($script:Errors -eq 0) {
    Write-Host "  Setup complete with $($script:Warnings) warning(s)." -ForegroundColor Yellow
} else {
    Write-Host "  Setup finished with $($script:Errors) error(s) and $($script:Warnings) warning(s)." -ForegroundColor Red
}

Write-Host ("=" * 48) -ForegroundColor White
Write-Host ""
Write-Host "  Next steps:"
Write-Host "    1. Review .env and set your values (API keys, ports, etc.)"
Write-Host "    2. Start the dev server:  bun run dev"
Write-Host "    3. Open the UI URL shown as 'Local:' in the Nuxt output (usually http://localhost:3001)"
Write-Host "    4. Open health check in browser: http://localhost:3000/api/health"
Write-Host ""
Write-Host '  "It''s dangerous to go alone! Take this."' -ForegroundColor DarkGray
Write-Host ""
