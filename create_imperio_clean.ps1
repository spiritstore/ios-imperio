# Clean up the Imperio Store repo
$projDir = "C:\Users\jhz\Desktop\azzzzzzzzzzzzzzzz\project_imperio"

# Delete everything and start fresh
Remove-Item $projDir -Recurse -Force
New-Item -ItemType Directory -Path $projDir | Out-Null

# Copy from project_updated (clean version)
Copy-Item -Path "C:\Users\jhz\Desktop\azzzzzzzzzzzzzzzz\project_updated\*" -Destination $projDir -Recurse -Force

# Define replacements for reverting nullhex -> Imperio Store
$replacements = @{
    "null hex" = "Imperio Store"
    "nullhex" = "ImperioStore"
    "com.nullhex.external-ios" = "com.imperio.external-ios"
    "Color(red: 0.55, green: 0.55, blue: 0.58)" = "Color(red: 0.0, green: 0.478, blue: 1.0)"
    "// Gray palette" = "// #007AFF blue palette"
    "nullhex.xcarchive" = "ImperioStore.xcarchive"
    "nullhex.ipa" = "ImperioStore.ipa"
    "nullhex-esign" = "ImperioStore-esign"
    "FDEcfOiXxAsC57nQzVW4210gKmGoNBjh" = "IMPERIO_ADMIN_2024"
}

# Apply replacements
$filesToProcess = @(
    "ThreeOneOSFive\Info.plist",
    "ThreeOneOSFive\views\DesignSystem.swift",
    "ThreeOneOSFive\helpers\LicenseManager.swift",
    "ThreeOneOSFive\helpers\LicenseActivationView.swift",
    "ThreeOneOSFive\helpers\Utils.swift",
    "ThreeOneOSFive\App.swift",
    "ThreeOneOSFive\ContentView.swift",
    "ThreeOneOSFive\views\SettingsView.swift",
    "ThreeOneOSFive\views\LogView.swift",
    "ThreeOneOSFive\views\AppDataBrowserView.swift",
    "ThreeOneOSFive\views\FileBrowserView.swift",
    "ThreeOneOSFive\views\WallpaperLabView.swift",
    "ThreeOneOSFive\helpers\DisplayIdentityAttribution.swift",
    "ThreeOneOSFive\helpers\PatchProjectLibrary.swift",
    "ThreeOneOSFive\views\PatchProjectsView.swift",
    "build_unsigned.sh",
    "build_esign_ready_ipa.sh",
    ".github\workflows\build.yml",
    ".github\workflows\build-ios-ipa.yml",
    ".github\workflows\build-unsigned-ipa.yml"
)

foreach($file in $filesToProcess) {
    $fullPath = Join-Path $projDir $file
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        foreach($old in $replacements.Keys) {
            $new = $replacements[$old]
            $content = $content -replace [regex]::Escape($old), $new
        }
        Set-Content $fullPath $content -NoNewline
    }
}

# Initialize fresh git
Set-Location $projDir
Remove-Item .git -Recurse -Force -ErrorAction SilentlyContinue
git init
git remote add origin "https://github.com/spiritstore/ios-imperio.git"
git add -A
git commit -m "Imperio Store - blue theme"
git branch -M main
git push -f origin main

Write-Host "Done! Repo: https://github.com/spiritstore/ios-imperio"
