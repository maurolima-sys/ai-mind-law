$ef=Join-Path $PSScriptRoot ('..\.env.local')
if(-not(Test-Path $ef)){Write-Error 'not found';exit 1}
$ev=@{}
foreach($l in Get-Content $ef){if($l -match '^([^#=\s]+)\s*=\s*"?([^"#]*)"?\s*$'){$ev[$Matches[1]]=$Matches[2].Trim()}}
$vars=@(@{Key='RESEND_API_KEY';Envs=@('production','preview')},@{Key='SMTP_PASSWORD';Envs=@('production','preview')},@{Key='SMTP_HOST';Envs=@('production','preview')},@{Key='SMTP_PORT';Envs=@('production','preview')},@{Key='SMTP_SECURE';Envs=@('production','preview')},@{Key='SMTP_USERNAME';Envs=@('production','preview')},@{Key='SMTP_FROM';Envs=@('production','preview')},@{Key='RESEND_FROM_EMAIL';Envs=@('production','preview')},@{Key='OLLAMA_API_KEY';Envs=@('production','preview')})
$ok=0;$sk=0
foreach($v in $vars){$val=$ev[$v.Key];if(-not $val){Write-Warning('SKIP '+$v.Key);$sk++;continue}$t=[System.IO.Path]::GetTempFileName();[System.IO.File]::WriteAllText($t,$val,[System.Text.Encoding]::UTF8);foreach($e in $v.Envs){vercel env rm $v.Key $e --yes 2>$null|Out-Null;Get-Content $t|vercel env add $v.Key --environment $e|Out-Null};Remove-Item $t -ErrorAction SilentlyContinue;Write-Host('OK '+$v.Key+' ['+($v.Envs -join ',')+']');$ok++}
Write-Host('Done: '+$ok+' synced, '+$sk+' skipped.')