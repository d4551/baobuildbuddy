# BaoBuildBuddy - Automated setup for Windows (PowerShell)
# Usage: powershell -ExecutionPolicy Bypass -File scripts\setup.ps1 [-SkipChecks] [-SkipPython]
param(
    [switch]$SkipChecks,
    [switch]$SkipPython,
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
    Write-Host "  -SkipPython   Skip Python venv setup (Bun-only install)"
    Write-Host "  -Help         Show this help message"
    exit 0
}

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
Write-Host "  Script:   setup.ps1 v1.0" -ForegroundColor DarkGray
Write-Host ""

# -- 1. Check prerequisites ----------------------------------------------------

Step "Checking prerequisites..."

try {
    $bunVer = & bun --version 2>$null
    if ($LASTEXITCODE -eq 0) { Ok "Bun $bunVer" }
    else { Die "Bun returned exit code $LASTEXITCODE" }
} catch {
    Die "Bun is not installed. Install from https://bun.sh"
}

try {
    $gitVer = & git --version 2>$null
    Ok $gitVer
} catch {
    Die "Git is not installed."
}

$pythonAvailable = $false
if (-not $SkipPython) {
    try {
        $pyOutput = & python --version 2>&1
        if ($pyOutput -match "(\d+)\.(\d+)\.(\d+)") {
            $major = [int]$Matches[1]
            $minor = [int]$Matches[2]
            if ($major -ge 3 -and $minor -ge 10) {
                Ok "Python $($Matches[0])"
                $pythonAvailable = $true
            } else {
                Warn "Python $($Matches[0]) found but 3.10+ required for RPA scripts"
            }
        }
    } catch {
        Warn "Python not found -- RPA/scraper features will be unavailable"
    }
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

# -- 2. Install Bun dependencies -----------------------------------------------

Step "Installing Bun dependencies..."
& bun install
if ($LASTEXITCODE -eq 0) { Ok "bun install complete" }
else { Fail "bun install failed with exit code $LASTEXITCODE" }

# -- 3. Python virtual environment ----------------------------------------------

if (-not $SkipPython -and $pythonAvailable) {
    Step "Setting up Python virtual environment..."

    if (Test-Path ".venv") {
        Ok "Virtual environment already exists at .venv\"
    } else {
        & python -m venv .venv
        if ($LASTEXITCODE -eq 0) { Ok "Created .venv\" }
        else { Fail "Failed to create Python venv" }
    }

    try {
        & .venv\Scripts\Activate.ps1
        & python -m pip install --upgrade pip --quiet 2>$null
        & python -m pip install -r packages\scraper\requirements.txt --quiet 2>$null
        Ok "Python dependencies installed"

        # Verify rpa is importable
        & python -c "import rpa" 2>$null
        if ($LASTEXITCODE -eq 0) { Ok "rpa module verified" }
        else { Warn "rpa module could not be imported -- check requirements.txt" }
    } catch {
        Fail "Python dependency installation failed: $_"
    }
} elseif ($SkipPython) {
    Write-Host "`n  Skipping Python setup (-SkipPython)" -ForegroundColor DarkGray
}

# -- 4. Environment file -------------------------------------------------------

Step "Checking environment configuration..."

if (Test-Path ".env") {
    Ok ".env exists"
} else {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
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
    if ($LASTEXITCODE -eq 0) { Ok "Lint passed" }
    else { Fail "Lint failed -- run 'bun run lint' for details" }

    & bun run test 2>&1
    if ($LASTEXITCODE -eq 0) { Ok "Tests passed" }
    else { Fail "Tests failed -- run 'bun run test' for details" }
} else {
    Write-Host "`n  Skipping verification (-SkipChecks)" -ForegroundColor DarkGray
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
Write-Host "    3. Open the UI:           http://localhost:3001"
Write-Host "    4. Verify the API:        curl http://localhost:3000/api/health"
Write-Host ""
Write-Host '  "It''s dangerous to go alone! Take this."' -ForegroundColor DarkGray
Write-Host ""
