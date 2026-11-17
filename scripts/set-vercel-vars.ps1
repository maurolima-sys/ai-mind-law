$envFile = Join-Path $PSScriptRoot "..\.env"
$envVars = @{}
foreach ($line in Get-Content $envFile) {
  if ($line -match '^\s*([^#=\s]+)\s*=\s*(.*)$') {
    $envVars[$Matches[1]] = $Matches[2].Trim().Trim('"')
  }
}

$allKeys = @(
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
  "VITE_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY",
  "VITE_FIREBASE_APPCHECK_DEBUG_TOKEN",
  "FIRECRAWL_API_KEY",
  "AI_GATEWAY_API_KEY",
  "HYDROGEN_API_KEY",
  "ELEVENLABS_API_KEY",
  "FIREBASE_PRODUCTION_DEBUG_TOKEN",
  "SITE_KEY",
  "SECRET_KEY"
)

foreach ($key in $allKeys) {
  $value = $envVars[$key]
  if (-not $value) { Write-Warning "SKIP $key (not in .env)"; continue }

  # Remove existing entries for all environments
  vercel env rm $key production --yes 2>$null
  vercel env rm $key preview --yes 2>$null
  vercel env rm $key development --yes 2>$null

  # Add for all three environments via stdin
  $tmpFile = [System.IO.Path]::GetTempFileName()
  [System.IO.File]::WriteAllText($tmpFile, $value, [System.Text.Encoding]::UTF8)
  Get-Content $tmpFile | vercel env add $key --environment production
  Get-Content $tmpFile | vercel env add $key --environment preview
  Get-Content $tmpFile | vercel env add $key --environment development
  Remove-Item $tmpFile

  Write-Host "OK $key"
}

Write-Host "`nDone. Run: vercel --prod --force"
