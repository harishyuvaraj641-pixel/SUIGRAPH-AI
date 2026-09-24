Run the helper script to initialize and push the repo to GitHub.

PowerShell (recommended):

```powershell
cd H:\suigraph-twin
pwsh ./push-to-github.ps1
```

Windows CMD (if PowerShell is not available):

```cmd
cd /d H:\suigraph-twin
push-to-github.bat
```

Notes:
- Ensure `git` is installed and configured with your GitHub credentials.
- If you prefer SSH, edit `push-to-github.ps1` and `push-to-github.bat` to use your SSH remote URL.
