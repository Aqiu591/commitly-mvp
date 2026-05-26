param(
  [string]$Message = "",
  [switch]$Full,
  [switch]$SkipChecks,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
Set-Location $ProjectRoot

function Invoke-Git($Arguments) {
  & git @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "git $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
  }
}

function Assert-GhReady() {
  $gh = Get-Command gh -ErrorAction SilentlyContinue
  if (-not $gh) {
    throw "GitHub CLI gh is not available in PATH."
  }

  & gh auth status | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw "GitHub CLI is not logged in. Run gh auth login first."
  }
}

function Assert-NoSensitiveTrackedFiles {
  $tracked = git ls-files
  $blocked = $tracked | Where-Object {
    $_ -eq ".env.local" -or $_ -like "node_modules/*" -or $_ -like ".next/*" -or $_ -like "*.tsbuildinfo"
  }

  if ($blocked) {
    throw "Sensitive/generated files are tracked: $($blocked -join ', ')"
  }
}

Assert-GhReady
Assert-NoSensitiveTrackedFiles

if (-not $SkipChecks) {
  if ($Full) {
    npm run doctor:full
  } else {
    npm run doctor
  }

  if ($LASTEXITCODE -ne 0) {
    throw "Checks failed; not syncing to GitHub."
  }
}

$statusBefore = git status --porcelain
if (-not $statusBefore) {
  Write-Output "No local changes to sync."
  exit 0
}

if (-not $Message.Trim()) {
  $Message = "Update Commitly progress"
}

Write-Output "Preparing GitHub sync with commit message: $Message"
Write-Output "Changed files:"
git status --short

if ($DryRun) {
  Write-Output "Dry run only. No files were staged, committed, or pushed."
  exit 0
}

Invoke-Git @("add", "-A")

$stagedBlocked = git diff --cached --name-only | Where-Object {
  $_ -eq ".env.local" -or $_ -like "node_modules/*" -or $_ -like ".next/*" -or $_ -like "*.tsbuildinfo"
}

if ($stagedBlocked) {
  Invoke-Git @("restore", "--staged", "--", ".")
  throw "Blocked sensitive/generated files from being staged: $($stagedBlocked -join ', ')"
}

$staged = git diff --cached --name-only
if (-not $staged) {
  Write-Output "No staged changes after applying ignore rules."
  exit 0
}

Invoke-Git @("commit", "-m", $Message)

$branch = git branch --show-current
if (-not $branch) {
  throw "Could not determine current branch."
}

$remote = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0 -or -not $remote) {
  throw "No origin remote configured. Create or attach a GitHub repository first."
}

Invoke-Git @("push", "-u", "origin", $branch)

Write-Output "Synced to GitHub on branch $branch."
