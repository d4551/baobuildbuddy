# BaoBuildBuddy - Setup script for Windows (PowerShell)
# Usage: powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
$ErrorActionPreference = "Stop"

function Step($msg) { Write-Host "`n[SETUP] $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "  OK $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "  WARN $msg" -ForegroundColor Yellow }
function Fail($msg) { Write-Host "  FAIL $msg" -ForegroundColor Red; exit 1 }

Write-Host @"

  ____              ____        _ _     _ ____            _     _
 | __ )  __ _  ___ | __ ) _   _(_) | __| | __ ) _   _  __| | __| |_   _
 |  _ \ / _` |/ _ \|  _ \| | | | | |/ _` |  _ \| | | |/ _` |/ _` | | | |
 | |_) | (_| | (_) | |_) | |_| | | | (_| | |_) | |_| | (_| | (_| | |_| |
 |____/ \__,_|\___/|____/ \__,_|_|_|\__,_|____/ \__,_|\__,_|\__,_|\__, |
                                                                    |___/

"@ -ForegroundColor White

Write-Host "  Setup script for Windows (PowerShell)"
Write-Host ""

# -- Check prerequisites -------------------------------------------------------

Step "Checking prerequisites..."

try {
    $bunVer = & bun --version 2>$null
    Ok "Bun $bunVer"
} catch {
    Fail "Bun is not installed. Install from https://bun.sh"
}

try {
    $gitVer = & git --version 2>$null
    Ok "$gitVer"
} catch {
    Fail "Git is not installed."
}

try {
    $pyVer = & python --version 2>$null
    if ($pyVer -match "(\d+)\.(\d+)\.(\d+)") {
        $major = [int]$Matches[1]
        $minor = [int]$Matches[2]
        if ($major -ge 3 -and $minor -ge 10) {
            Ok "Python $($Matches[0])"
        } else {
            Warn "Python $($Matches[0]) detected but 3.10+ is required for RPA"
        }
    }
} catch {
    Warn "Python not found. RPA features will not work."
}

$chromePaths = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "${env:LOCALAPPDATA}\Google\Chrome\Application\chrome.exe"
)
$chromeFound = $false
foreach ($p in $chromePaths) {
    if (Test-Path $p) {
        Ok "Chrome found at $p"
        $chromeFound = $true
        break
    }
}
if (-not $chromeFound) {
    Warn "Chrome not found in standard locations. RPA browser automation requires it."
}

# -- Install Bun dependencies --------------------------------------------------

Step "Installing Bun dependencies..."
& bun install
Ok "bun install complete"

# -- Python virtual environment -------------------------------------------------

Step "Setting up Python virtual environment..."
if (Test-Path ".venv") {
    Ok "Virtual environment already exists at .venv\"
} else {
    & python -m venv .venv
    Ok "Created .venv\"
}

& .venv\Scripts\Activate.ps1
& python -m pip install --upgrade pip --quiet
& python -m pip install -r packages\scraper\requirements.txt --quiet
Ok "Python dependencies installed"

# -- Environment file -----------------------------------------------------------

Step "Checking .env file..."
if (Test-Path ".env") {
    Ok ".env already exists"
} else {
    Copy-Item ".env.example" ".env"
    Ok "Created .env from .env.example -- edit it with your values"
}

# -- Database setup -------------------------------------------------------------

Step "Setting up database..."
& bun run db:generate
& bun run db:push
Ok "Database schema pushed"

# -- Typecheck and lint ---------------------------------------------------------

Step "Running typecheck..."
try {
    & bun run typecheck
    Ok "Typecheck passed"
} catch {
    Warn "Typecheck had issues -- check output above"
}

Step "Running lint..."
try {
    & bun run lint
    Ok "Lint passed"
} catch {
    Warn "Lint had issues -- check output above"
}

# -- Done -----------------------------------------------------------------------

Write-Host ""
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "  Next steps:"
Write-Host "    1. Edit .env with your environment-specific values"
Write-Host "    2. Run: bun run dev"
Write-Host "    3. Open http://localhost:3001 in your browser"
Write-Host ""
Write-Host '  "It''s dangerous to go alone! Take this."'
Write-Host ""
