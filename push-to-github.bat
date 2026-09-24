@echo off
REM Push repository to GitHub (Windows batch helper)
cd /d %~dp0
nset REMOTE_URL=https://github.com/harishyuvaraj641-pixel/SUIGRAPH-AI.git
nset BRANCH=main
if not exist README.md (
  echo # SUIGRAPH-AI>README.md
)
ngit --version >nul 2>nul || (
  echo Git is not installed or not in PATH. Install Git from https://git-scm.com
n  exit /b 1
)
if not exist .git (
  git init
)
git add README.md .gitignore
ngit commit -m "first commit" --allow-empty
git branch -M %BRANCH%
for /f "delims=" %%i in ('git remote') do set hasremote=%%i
if "%hasremote%"=="" (
  git remote add origin %REMOTE_URL%
) else (
  git remote set-url origin %REMOTE_URL%
)
git push -u origin %BRANCH%
