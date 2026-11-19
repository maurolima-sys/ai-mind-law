# set-vercel-vars.ps1
$envFile = Join-Path $PSScriptRoot '..\.env.local'
if (-not (Test-Path $envFile)) { Write-Error '.env.local not found'; exit 1 }

$envVars = @{}
foreach ($line in Get-Content $envFile) {
  if ($line -match '^([^#=\s]+)\s*=\s*"?([^"#]*)"?\s*$') {
    $envVars[$Matches[1]] = $Matches[2].Trim()
  }
}

$vars = @(
  @{ Key='VITE_FIREBASE_API_KEY';                     Envs=@('production','preview','development') },
  @{ Key='VITE_FIREBASE_AUTH_DOMAIN';                 Envs=@('production','preview','development') },
  @{ Key='VITE_FIREBASE_PROJECT_ID';                  Envs=@('production','preview','development') },
  @{ Key='VITE_FIREBASE_STORAGE_BUCKET';              Envs=@('production','preview','development') },
  @{ Key='VITE_FIREBASE_MESSAGING_SENDER_ID';         Envs=@('production','preview','development') },
  @{ Key='VITE_FIREBASE_APP_ID';                      Envs=@('production','preview','development') },
  @{ Key='VITE_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY'; Envs=@('production','preview','development') },
  @{ Key='VITE_FIREBASE_APPCHECK_DEBUG_TOKEN';        Envs=@('development') },
  @{ Key='SITE_KEY';                                  Envs=@('production','preview','development') },
  @{ Key='SECRET_KEY';                                Envs=@('production','preview') },
  @{ Key='VITE_SUPABASE_URL';                         Envs=@('production','preview','development') },
  @{ Key='VITE_SUPABASE_KEY';                         Envs=@('production','preview','development') },
  @{ Key='FIRECRAWL_API_KEY';                         Envs=@('production','preview') },
  @{ Key='ELEVENLABS_API_KEY';                        Envs=@('production','preview') },
  @{ Key='LLAMA_CLOUD_API_KEY';                       Envs=@('production','preview') },
  @{ Key='VERCEL_AI_GATEWAY_API_KEY';                 Envs=@('production','preview') }
)

$ok = 0; $skipped = 0
foreach ($var in $vars) {
  $key   = $var.Key
  $value = $envVars[$key]
  if (-not $value) { Write-Warning "SKIP $key"; $skipped++; continue }

  $tmp = [System.IO.Path]::GetTempFileName()
  [System.IO.File]::WriteAllText($tmp, $value, [System.Text.Encoding]::UTF8)
  foreach ($env in $var.Envs) {
    vercel env rm $key $env --yes 2>$null | Out-Null
    Get-Content $tmp | vercel env add $key --environment $env | Out-Null
  }
  Remove-Item $tmp -ErrorAction SilentlyContinue
  Write-Host "OK  $key  [$($var.Envs -join ',')]"
  $ok++
}

Write-Host ''
Write-Host "Done: $ok synced, $skipped skipped."
Write-Host 'Next: vercel --prod --force'
