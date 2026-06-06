# Android SDK Setup and Build Automation Script for ByteBite

$ErrorActionPreference = "Stop"

$workspaceRoot = "D:\SEMESTER 5\ByteBite"
$sdkRoot = "$workspaceRoot\android-sdk"
$frontendDir = "$workspaceRoot\frontend"
$buildsDir = "$workspaceRoot\builds"

# Create builds directory
if (!(Test-Path $buildsDir)) {
    New-Item -ItemType Directory -Path $buildsDir | Out-Null
    Write-Host "Created builds directory: $buildsDir"
}

# 1. Download & Setup Android SDK Command Line Tools
if (!(Test-Path "$sdkRoot\cmdline-tools\latest\bin\sdkmanager.bat")) {
    Write-Host "Android SDK cmdline-tools not found. Initiating download..."
    
    if (!(Test-Path $sdkRoot)) {
        New-Item -ItemType Directory -Path $sdkRoot | Out-Null
    }
    
    $tempDir = "$sdkRoot\temp"
    if (!(Test-Path $tempDir)) {
        New-Item -ItemType Directory -Path $tempDir | Out-Null
    }
    
    $zipPath = "$sdkRoot\cmdline-tools.zip"
    $downloadUrl = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
    
    Write-Host "Downloading command line tools..."
    # Download using curl.exe for speed and progress bar rendering
    curl.exe -L -o $zipPath $downloadUrl
    
    Write-Host "Extracting command line tools..."
    Expand-Archive -Path $zipPath -DestinationPath $tempDir -Force
    
    # Create the correct directory structure: sdkRoot/cmdline-tools/latest
    $latestDir = "$sdkRoot\cmdline-tools\latest"
    if (!(Test-Path $latestDir)) {
        New-Item -ItemType Directory -Path $latestDir -Force | Out-Null
    }
    
    # Move items
    Move-Item -Path "$tempDir\cmdline-tools\*" -Destination $latestDir -Force
    
    # Cleanup temp folders
    Remove-Item -Path $tempDir -Recurse -Force
    Remove-Item -Path $zipPath -Force
    Write-Host "Android SDK command line tools successfully configured!"
} else {
    Write-Host "Android SDK command line tools are already present."
}

$sdkManager = "$sdkRoot\cmdline-tools\latest\bin\sdkmanager.bat"

# 2. Accept SDK Licenses automatically
Write-Host "Accepting Android SDK licenses..."
$licenseFile = "$sdkRoot\licenses"
if (!(Test-Path $licenseFile)) {
    # Pipe "y" to accept all licenses
    $yesArray = @("y", "y", "y", "y", "y", "y", "y", "y", "y", "y")
    $yesArray | & "$sdkManager" --licenses --sdk_root="$sdkRoot"
}

# 3. Install required Platforms, Platform Tools, and Build Tools
Write-Host "Installing Android platforms and build tools (API 34)..."
& "$sdkManager" "platforms;android-34" "build-tools;34.0.0" "platform-tools" --sdk_root="$sdkRoot"

# 4. Configure local.properties for the Android Project
$localPropertiesPath = "$frontendDir\android\local.properties"
Write-Host "Configuring local.properties at $localPropertiesPath"
$normalizedSdkPath = $sdkRoot.Replace("\", "/")
[System.IO.File]::WriteAllText($localPropertiesPath, "sdk.dir=$normalizedSdkPath")

# 5. Build React Web Application
Write-Host "Building React Web App (Vite)..."
Set-Location -Path $frontendDir
npm run build

# 6. Synchronize assets to Capacitor Android project
Write-Host "Syncing web assets to Capacitor Android project..."
npx cap sync

# 6.5. Generate Release Keystore if missing
$keystorePath = "$frontendDir\android\app\release.keystore"
if (!(Test-Path $keystorePath)) {
    Write-Host "Release keystore not found. Generating a new one..."
    $keytoolPath = "keytool"
    if (!(Get-Command $keytoolPath -ErrorAction SilentlyContinue)) {
        if ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\keytool.exe")) {
            $keytoolPath = "$env:JAVA_HOME\bin\keytool.exe"
        } elseif (Test-Path "C:\Program Files\Java\jdk-23\bin\keytool.exe") {
            $keytoolPath = "C:\Program Files\Java\jdk-23\bin\keytool.exe"
        } else {
            $discoveredJdk = Get-ChildItem -Path "C:\Program Files\Java" -Filter "jdk-*" -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($discoveredJdk -and (Test-Path "$($discoveredJdk.FullName)\bin\keytool.exe")) {
                $keytoolPath = "$($discoveredJdk.FullName)\bin\keytool.exe"
            } else {
                Write-Error "keytool.exe could not be located. Please set JAVA_HOME or ensure keytool is in your PATH."
            }
        }
    }
    & $keytoolPath -genkey -v -keystore $keystorePath -alias bytebite -keyalg RSA -keysize 2048 -validity 10000 -storepass bytebite123 -keypass bytebite123 -dname "CN=ByteBite, OU=ByteBite, O=ByteBite, L=City, S=State, C=US"
    Write-Host "Successfully generated new release keystore at: $keystorePath"
} else {
    Write-Host "Release keystore already present at: $keystorePath"
}

# 7. Compile Release APK and Play Store Ready AAB
Write-Host "Compiling Release APK..."
Set-Location -Path "$frontendDir\android"
& ".\gradlew.bat" assembleRelease

Write-Host "Compiling Play Store AAB..."
& ".\gradlew.bat" bundleRelease

# 8. Copy final builds to the builds/ directory
Write-Host "Copying build outputs to builds/ folder..."
$apkSource = "$frontendDir\android\app\build\outputs\apk\release\app-release.apk"
$aabSource = "$frontendDir\android\app\build\outputs\bundle\release\app-release.aab"

# Fallback check for build file names
if (!(Test-Path $apkSource)) {
    $apkSource = Get-ChildItem -Path "$frontendDir\android\app\build\outputs\apk" -Filter "*.apk" -Recurse | Select-Object -First 1 | % { $_.FullName }
}
if (!(Test-Path $aabSource)) {
    $aabSource = Get-ChildItem -Path "$frontendDir\android\app\build\outputs\bundle" -Filter "*.aab" -Recurse | Select-Object -First 1 | % { $_.FullName }
}

if ($apkSource -and (Test-Path $apkSource)) {
    Copy-Item -Path $apkSource -Destination "$buildsDir\ByteBite-release.apk" -Force
    Write-Host "SUCCESS: Release APK created at: $buildsDir\ByteBite-release.apk"
} else {
    Write-Warning "Could not locate final Release APK!"
}

if ($aabSource -and (Test-Path $aabSource)) {
    Copy-Item -Path $aabSource -Destination "$buildsDir\ByteBite-release.aab" -Force
    Write-Host "SUCCESS: Play Store AAB created at: $buildsDir\ByteBite-release.aab"
} else {
    Write-Warning "Could not locate final AAB bundle!"
}

Write-Host "Android setup and build process successfully completed!"
