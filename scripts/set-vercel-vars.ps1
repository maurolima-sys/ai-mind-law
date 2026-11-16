param(
  [Parameter(Mandatory)][string]$Token,
  [Parameter(Mandatory)][string]$ProjectId,
  [Parameter(Mandatory)][string]$TeamId
)

$envFile = Join-Path $PSScriptRoot "..\.env"
$envVars = @{}
foreach ($line in Get-Content $envFile) {
  if ($line -match '^\s*([^#=]+)=(.*)$') {
    $envVars[$Matches[1].Trim()] = $Matches[2].Trim().Trim('"')
  }
}

$targets = @("production", "preview", "development")
$keys = @(
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
  "VITE_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY"
)

$headers = @{
  Authorization  = "Bearer $Token"
  "Content-Type" = "application/json"
}

$baseUrl = "https://api.vercel.com/v10/projects/$ProjectId/env?teamId=$TeamId"

$existing = (Invoke-RestMethod -Uri $baseUrl -Headers $headers -Method Get).envs

foreach ($key in $keys) {
  $value = $envVars[$key]
  if (-not $value) { Write-Warning "Key $key not found in .env — skipping"; continue }

  foreach ($e in ($existing | Where-Object { $_.key -eq $key })) {
    $delUrl = "https://api.vercel.com/v10/projects/$ProjectId/env/$($e.id)?teamId=$TeamId"
    Invoke-RestMethod -Uri $delUrl -Headers $headers -Method Delete | Out-Null
    Write-Host "Deleted existing $key ($($e.id))"
  }

  $body = @{
    key    = $key
    value  = $value
    type   = "plain"
    target = $targets
  } | ConvertTo-Json

  $result = Invoke-RestMethod -Uri $baseUrl -Headers $headers -Method Post -Body $body
  Write-Host "Added $key → id=$($result.id) type=$($result.type)"
}

Write-Host "`nDone. Run: vercel --prod --force"
