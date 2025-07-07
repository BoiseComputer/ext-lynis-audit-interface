# PowerShell script to package Plesk extension correctly
# Run this from the project root directory

# Go to the src directory
Set-Location src

# Verify the structure exists
Write-Host "Verifying structure..."
if (Test-Path "plib\controllers\ApiController.php") {
    Write-Host "✓ plib/controllers/ApiController.php exists"
} else {
    Write-Host "✗ plib/controllers/ApiController.php missing"
}

if (Test-Path "plib\library\Helper.php") {
    Write-Host "✓ plib/library/Helper.php exists"
} else {
    Write-Host "✗ plib/library/Helper.php missing"
}

if (Test-Path "plib\resources\locales\en-US.php") {
    Write-Host "✓ plib/resources/locales/en-US.php exists"
} else {
    Write-Host "✗ plib/resources/locales/en-US.php missing"
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
Compress-Archive -Path plib,htdocs,_meta,meta.xml -DestinationPath ..\lynis-audit-interface.zip

Write-Host ""
Write-Host "✓ Packaging complete! Archive is at lynis-audit-interface.zip"
Write-Host ""
Write-Host "The ZIP contains:"
Write-Host "  plib/controllers/ApiController.php"
Write-Host "  plib/library/Helper.php"
Write-Host "  plib/resources/locales/en-US.php"
Write-Host "  htdocs/index.php"
Write-Host "  _meta/"
Write-Host "  meta.xml"
Write-Host ""
Write-Host "Upload this ZIP to Plesk and remove any old/broken installs first."
