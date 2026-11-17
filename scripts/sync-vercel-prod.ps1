# sync-vercel-prod.ps1
# Reads values from .env and pushes only production-safe Firebase variables to Vercel.
# Uses cmd echo to avoid UTF-8 BOM that PowerShell temp files introduce.
# Never sends VITE_FIREBASE_APPCHECK_DEBUG_TOKEN to production.

$envFile = Join-Path $PSScriptRoot "..\.env"
$envVars = @{}
$raw = [System.IO.File]::ReadAllText($envFile)
foreach ($line in ($raw -split "`n")) {
  $line = $line.Trim()
  if ($line -match '^([^#=\s]+)=(.*)$') {
    $envVars[$Matches[1]] = $Matches[2].Trim().Trim('"')
  }
}

# Production-only variables -- debug token deliberately excluded
$prodKeys = @(
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
  "VITE_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY"
)

foreach ($key in $prodKeys) {
  $value = $envVars[$key]
  if (-not $value) { Write-Warning "SKIP $key (not found in .env)"; continue }

  vercel env rm $key production --yes 2>&1 | Out-Null

  # Use cmd echo -- avoids UTF-8 BOM that PowerShell WriteAllText introduces
  $result = cmd /c "echo $value | vercel env add $key --environment production --type config" 2>&1
  if ($result -match "Added") {
    Write-Host "OK $key"
  } else {
    Write-Warning "FAILED $key -- $result"
  }
}

Write-Host "`nDone. Run: vercel --prod --force"
