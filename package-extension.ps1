# PowerShell script to package Plesk extension correctly
# Run this from the project root directory

# Go to the src directory
Set-Location src

# Copy backend files from plib to src root (overwrite if they exist)
Write-Host "Copying backend files to correct locations..."
Copy-Item -Recurse -Force .\plib\controllers .\
Copy-Item -Recurse -Force .\plib\library .\
Copy-Item -Recurse -Force .\plib\resources .\

# Verify the structure
Write-Host "Verifying structure..."
if (Test-Path "controllers\ApiController.php") {
    Write-Host "✓ controllers/ApiController.php exists"
} else {
    Write-Host "✗ controllers/ApiController.php missing"
}

if (Test-Path "library\Helper.php") {
    Write-Host "✓ library/Helper.php exists"
} else {
    Write-Host "✗ library/Helper.php missing"
}

if (Test-Path "resources\locales\en-US.php") {
    Write-Host "✓ resources/locales/en-US.php exists"
} else {
    Write-Host "✗ resources/locales/en-US.php missing"
}

if (Test-Path "htdocs\index.php") {
    Write-Host "✓ htdocs/index.php exists"
} else {
    Write-Host "✗ htdocs/index.php missing"
}

if (Test-Path "meta.xml") {
    Write-Host "✓ meta.xml exists"
} else {
    Write-Host "✗ meta.xml missing"
}

# Remove any existing ZIP
if (Test-Path "..\lynis-audit-interface.zip") {
    Remove-Item "..\lynis-audit-interface.zip"
    Write-Host "Removed existing ZIP file"
}

# Create the ZIP with the correct structure
Write-Host "Creating ZIP package..."
Compress-Archive -Path controllers,library,resources,htdocs,meta.xml -DestinationPath ..\lynis-audit-interface.zip

Write-Host ""
Write-Host "✓ Packaging complete! Archive is at lynis-audit-interface.zip"
Write-Host ""
Write-Host "The ZIP contains:"
Write-Host "  controllers/ApiController.php"
Write-Host "  library/Helper.php"
Write-Host "  resources/locales/en-US.php"
Write-Host "  htdocs/index.php"
Write-Host "  meta.xml"
Write-Host ""
Write-Host "Upload this ZIP to Plesk and remove any old/broken installs first."
