# sync-vercel-prod.ps1
# Reads values from .env.local and pushes only production-safe Firebase variables to Vercel.
# Never sends VITE_FIREBASE_APPCHECK_DEBUG_TOKEN to production.

$envFile = Join-Path $PSScriptRoot "..\.env.local"
$envVars = @{}
foreach ($line in Get-Content $envFile) {
  if ($line -match '^\s*([^#=\s]+)\s*=\s*(.*)$') {
    $envVars[$Matches[1]] = $Matches[2].Trim().Trim('"')
  }
}

# Production-only variables — debug token deliberately excluded
$prodKeys = @(
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
  "VITE_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY"
)

foreach ($key in $prodKeys) {
  $value = $envVars[$key]
  if (-not $value) { Write-Warning "SKIP $key (not found in .env.local)"; continue }

  vercel env rm $key production --yes 2>$null
  $tmpFile = [System.IO.Path]::GetTempFileName()
  [System.IO.File]::WriteAllText($tmpFile, $value, [System.Text.Encoding]::UTF8)
  Get-Content $tmpFile | vercel env add $key --environment production
  Remove-Item $tmpFile
  Write-Host "OK $key"
}

Write-Host "`nDone. Run: vercel --prod --force"
