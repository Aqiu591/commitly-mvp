param(
  [switch]$Full
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")

function Write-Check($Name, $Ok, $Detail = "") {
  $status = if ($Ok) { "OK" } else { "MISSING" }
  $line = "[$status] $Name"
  if ($Detail) { $line = "$line - $Detail" }
  Write-Output $line
}

function Invoke-Step($Name, $ScriptBlock) {
  Write-Output ""
  Write-Output $Name
  & $ScriptBlock
  if ($LASTEXITCODE -ne 0) {
    throw "$Name failed with exit code $LASTEXITCODE"
  }
}

Set-Location $ProjectRoot
Write-Output "Commitly doctor: $ProjectRoot"

$requiredFiles = @(
  "package.json",
  ".gitignore",
  "README.md",
  "vercel.json",
  "supabase\migrations\001_init.sql",
  "src\app\api\analyze\route.ts",
  "src\app\api\reminders\daily-digest\route.ts",
  "src\app\dashboard\page.tsx",
  "tests\evals\zh-commitment-samples.json"
)

foreach ($file in $requiredFiles) {
  Write-Check "file $file" (Test-Path $file)
}

$gitignore = if (Test-Path ".gitignore") { Get-Content ".gitignore" -Raw } else { "" }
Write-Check ".env.local ignored" ($gitignore -match '(?m)^\.env\.local$')
Write-Check "node_modules ignored" ($gitignore -match '(?m)^node_modules/$')
Write-Check ".next ignored" ($gitignore -match '(?m)^\.next/$')

$envNames = @()
if (Test-Path ".env.local") {
  $envNames = Get-Content ".env.local" | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=') { $Matches[1] }
  }
}

$requiredEnv = @(
  "OPENAI_API_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "DAILY_DIGEST_FROM",
  "CRON_SECRET",
  "NEXT_PUBLIC_APP_URL"
)

foreach ($name in $requiredEnv) {
  Write-Check "env $name" ($envNames -contains $name)
}

foreach ($tool in @("node", "npm", "git")) {
  $command = Get-Command $tool -ErrorAction SilentlyContinue
  Write-Check "tool $tool" ([bool]$command) $(if ($command) { $command.Source } else { "" })
}

foreach ($tool in @("supabase", "vercel")) {
  $command = Get-Command $tool -ErrorAction SilentlyContinue
  Write-Check "optional tool $tool" ([bool]$command) $(if ($command) { $command.Source } else { "use npx or install CLI before cloud setup" })
}

Write-Output ""
Invoke-Step "Running typecheck..." { npm run lint }
Invoke-Step "Running tests..." { npm test }

if ($Full) {
  $port3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
  if ($port3000) {
    throw "Port 3000 is in use by process $($port3000.OwningProcess). Stop the dev server before running doctor:full."
  }

  Invoke-Step "Running production build..." { npm run build }
}

Write-Output ""
Write-Output "Doctor complete. MISSING items are setup gaps, not necessarily code failures."
Write-Output "Next setup order: Supabase env -> Resend env -> NEXT_PUBLIC_APP_URL/CRON_SECRET -> Vercel link/deploy."
