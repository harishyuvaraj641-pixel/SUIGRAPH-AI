param(
  [string]$RemoteUrl = 'https://github.com/harishyuvaraj641-pixel/SUIGRAPH-AI.git',
  [string]$Branch = 'main'
)

# Creates README if missing, initializes git, and pushes to remote.
Set-Location -Path $PSScriptRoot
if (!(Test-Path README.md)) { "# SUIGRAPH-AI" | Out-File -Encoding utf8 README.md }

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Error "Git is not installed or not in PATH. Install Git and re-run this script."
  exit 1
}

if (!(Test-Path .git)) {
  git init
}

git add README.md .gitignore
git commit -m "first commit" --allow-empty

git branch -M $Branch

# Add or update remote
$existing = git remote | Select-String -Pattern '^origin$' -Quiet
if (-not $existing) { git remote add origin $RemoteUrl } else { git remote set-url origin $RemoteUrl }

git push -u origin $Branch
