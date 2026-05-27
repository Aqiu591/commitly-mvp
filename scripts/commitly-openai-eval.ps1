param(
  [string[]]$SampleId = @(),
  [int]$Limit = 0
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($env:OPENAI_API_KEY)) {
  Write-Host "[MISSING] process env OPENAI_API_KEY"
  Write-Host "Set OPENAI_API_KEY in this PowerShell session, then run npm run eval:openai again. This script does not read .env.local."
  exit 1
}

$env:RUN_OPENAI_EVAL = "1"
if ($SampleId.Count -gt 0) {
  $env:OPENAI_EVAL_SAMPLE_IDS = $SampleId -join ","
}

if ($Limit -gt 0) {
  $env:OPENAI_EVAL_LIMIT = "$Limit"
}

npm exec vitest -- run tests/evals/openai-live.test.ts
