# sync-vercel-prod.ps1
# Reads values from .env.local and pushes only production-safe Firebase variables to Vercel.
# Never sends VITE_FIREBASE_APPCHECK_DEBUG_TOKEN to production.

$envFile = Join-Path $PSScriptRoot "..\\.env.local"
$envVars = @{}
foreach ($line in Get-Content $envFile) {
  if ($line -match '^\s*([^#=\s]+)\s*=\s*(.*)$') {
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
  if (-not $value) { Write-Warning "SKIP $key (not found in .env.local)"; continue }

  vercel env rm $key production --yes 2>$null | Out-Null

  # Write value to temp file without BOM or trailing newline
  $tmpFile = [System.IO.Path]::GetTempFileName()
  [System.IO.File]::WriteAllText($tmpFile, $value.Trim(), [System.Text.Encoding]::UTF8)

  # --type config required for VITE_* vars in Vercel CLI v65+ to avoid interactive prompt
  $result = cmd /c "type `"$tmpFile`" | vercel env add $key production --type config" 2>&1
  Remove-Item $tmpFile

  if ($LASTEXITCODE -eq 0) {
    Write-Host "OK $key"
  } else {
    Write-Warning "FAILED $key -- $result"
  }
}

Write-Host "`nDone. Run: vercel --prod --force"
