$envContent = Get-Content 'c:\Users\mauro\.copilot\repos\ai-mind-law\.env.local' -Raw
$serviceKey = [regex]::Match($envContent, 'SUPABASE_ROLE_SECRET=([^\r\n]+)').Groups[1].Value.Trim()
$url = [regex]::Match($envContent, 'VITE_SUPABASE_URL=([^\r\n]+)').Groups[1].Value.Trim()

if (-not $url -or -not $serviceKey) { Write-Error "Missing vars"; exit 1 }

$body = '{"prefix":"","limit":100,"offset":0}'
$headers = @{ Authorization = "Bearer $serviceKey"; 'Content-Type' = 'application/json' }

try {
    $response = Invoke-RestMethod -Uri "$url/storage/v1/object/list/pdfs_samples" -Method POST -Headers $headers -Body $body
    if ($response.Count -eq 0) { Write-Output "Bucket is empty." }
    else {
        Write-Output "Files in pdfs_samples ($($response.Count) items):"
        Write-Output "---"
        $response | ForEach-Object {
            $sizeKB = if ($_.metadata.size) { "$([math]::Round($_.metadata.size/1024,1)) KB" } else { "—" }
            "$($_.name) | $sizeKB | $($_.updated_at)"
        }
    }
} catch {
    Write-Output "Error: $($_.Exception.Message)"
}
