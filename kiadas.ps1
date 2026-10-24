# =====================================================================
#  CSSOS kiadás: új verzió feltöltése a GitHubra, hogy a telefonok megkapják
#
#  Használat (a „Telefonos cég” mappában, PowerShellben):
#    .\kiadas.ps1              csak a CSSOS változott (a telefon telepítés nélkül frissül)
#    .\kiadas.ps1 -UjApp       az Android-rész (android mappa) is változott: új app kell
#
#  Előtte írd át a verziót az os.js elején (pl. version: '2.2'), különben a telefon nem
#  veszi észre, hogy van újabb.
# =====================================================================
param([switch]$UjApp)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

# 1. Verzió az os.js-ből: „2.1” → 201
$m = [regex]::Match((Get-Content os.js -Raw -Encoding utf8), "version:\s*'([0-9]+)\.([0-9]+)'")
if (-not $m.Success) { throw 'Nem találom a verziót az os.js-ben.' }
$version = "$($m.Groups[1].Value).$($m.Groups[2].Value)"
$code = [int]$m.Groups[1].Value * 100 + [int]$m.Groups[2].Value

# 2. Melyik az a legkisebb app-verzió, amin ez a CSSOS még fut?
$minApk = $code
if (-not $UjApp -and (Test-Path update.json)) {
  $old = Get-Content update.json -Raw | ConvertFrom-Json
  if ($old.code -ge $code) { throw "A verzió ($version) nem nagyobb, mint a legutóbb kiadott ($($old.version)). Írd át az os.js-ben!" }
  $minApk = [int]$old.minApk
}

# 3. Az Android-app megépítése (mindig, hogy a CSSOS.apk is naprakész legyen)
Write-Host "CSSOS $version építése..." -ForegroundColor Cyan
Push-Location android
& .\gradlew.bat assembleDebug --console=plain -q
if ($LASTEXITCODE -ne 0) { Pop-Location; throw 'Az Android-app építése nem sikerült.' }
Pop-Location
Copy-Item android\app\build\outputs\apk\debug\app-debug.apk CSSOS.apk -Force

# 4. update.json: ezt nézi a telefon
$files = Get-ChildItem -File | Where-Object { $_.Extension -in '.html', '.css', '.js' } | ForEach-Object Name
$json = [ordered]@{ version = $version; code = $code; minApk = $minApk; files = @($files) } | ConvertTo-Json
# BOM (láthatatlan jel a fájl elején) nélkül írjuk, mert azt a telefon nem tudja beolvasni
[IO.File]::WriteAllText((Join-Path $PSScriptRoot 'update.json'), $json, (New-Object Text.UTF8Encoding $false))

# 5. Feltöltés
git add -A
git commit -q -m "CSSOS $version"
git push -q -u origin main
Write-Host "Kész: CSSOS $version feltöltve. A telefonok néhány percen belül megkapják." -ForegroundColor Green
if ($minApk -eq $code) { Write-Host 'Ehhez a verzióhoz új app kell: a telefon felajánlja a CSSOS.apk letöltését.' -ForegroundColor Yellow }
