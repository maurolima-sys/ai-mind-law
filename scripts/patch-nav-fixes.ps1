$file = "src\components\pocketmind\PocketMindApp.tsx"

# Fix 1: Remove NAVIGATION_IDS
$lines = Get-Content $file
$start = -1; $end = -1
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match 'const NAVIGATION_IDS') { $start = $i }
    if ($start -ge 0 -and $lines[$i] -match '^\];' -and $i -gt $start) { $end = $i; break }
}
if ($start -ge 0) {
    $lines = $lines[0..($start - 1)] + $lines[($end + 1)..($lines.Length - 1)]
    $lines | Set-Content $file -Encoding UTF8
    Write-Host "Fix1 done: $($lines.Length) lines"
} else {
    Write-Host "Fix1: already removed"
}

# Fix 2: Replace sidebar extra buttons using external file
$lines = Get-Content $file
$risksLine = -1
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match 'sidebar_nav_risks') { $risksLine = $i; break }
}
$btnStart = -1
for ($j = $risksLine; $j -ge ([Math]::Max(0, $risksLine - 8)); $j--) {
    if ($lines[$j] -match '^\s+<button') { $btnStart = $j; break }
}
$navClose = -1
for ($i = $risksLine; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match '^\s+</nav>') { $navClose = $i; break }
}
Write-Host "Fix2: replacing lines $($btnStart+1) to $($navClose+1)"
$newButtons = Get-Content "scripts\_nav_buttons.txt"
$lines = $lines[0..($btnStart - 1)] + $newButtons + $lines[($navClose + 1)..($lines.Length - 1)]
$lines | Set-Content $file -Encoding UTF8
Write-Host "Fix2 done: $($lines.Length) lines"

# Fix 3: Remove duplicate pm-page-heading in pre-analysis branch
$lines = Get-Content $file
$titleLine = -1
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match 'pre_analysis_title') { $titleLine = $i; break }
}
$headingStart = -1
for ($j = $titleLine; $j -ge ([Math]::Max(0, $titleLine - 6)); $j--) {
    if ($lines[$j] -match 'pm-page-heading') { $headingStart = $j; break }
}
$depth = 0; $headingEnd = -1
for ($i = $headingStart; $i -lt $lines.Length; $i++) {
    $depth += ([regex]::Matches($lines[$i], '<div')).Count
    $depth -= ([regex]::Matches($lines[$i], '</div>')).Count
    if ($depth -le 0 -and $i -gt $headingStart) { $headingEnd = $i; break }
}
Write-Host "Fix3: removing heading lines $($headingStart+1) to $($headingEnd+1)"
$lines = $lines[0..($headingStart - 1)] + $lines[($headingEnd + 1)..($lines.Length - 1)]
$lines | Set-Content $file -Encoding UTF8
Write-Host "Fix3 done. Final: $($lines.Length) lines"
