{
  "audit_report": {
    "title": "Imperio Store → null hex Complete Migration Audit",
    "repository": "spiritstore/ios-proxy",
    "date_range": "2026-09-22 to 2026-09-23",
    "total_commits": 30,
    "builds_successful": 2,
    "builds_failed": 11,
    "services": {
      "ios_app": {
        "name": "null hex",
        "previous_name": "Imperio Store",
        "theme": "gray (#888888)",
        "previous_theme": "blue (#007AFF)",
        "scheme": "Cryptroic",
        "ipa": "nullhex.ipa (11.2 MB)",
        "build_status": "SUCCESS",
        "last_success_run": 30
      },
      "license_server": {
        "type": "Node.js Express API",
        "platform": "Railway",
        "url": "https://ios-proxy.up.railway.app",
        "previous_url": "https://trustworthy-creativity-production-2876.up.railway.app",
        "port": 8080,
        "features": [
          "POST /api/generate-key",
          "POST /api/verify",
          "GET /api/keys",
          "GET /api/status",
          "GET / (login page)",
          "POST /api/login",
          "POST /api/logout"
        ],
        "security": {
          "login_system": "HMAC-signed session cookies",
          "admin_password_env": "ADMIN_PASSWORD",
          "session_secret_env": "SESSION_SECRET",
          "http_only_cookies": true,
          "samesite_strict": true
        }
      },
      "github_actions": {
        "workflows": [
          {
            "file": ".github/workflows/build.yml",
            "name": "Build iOS App",
            "runs_on": "macos-latest",
            "steps": ["checkout", "chmod", "build", "upload-artifact"]
          },
          {
            "file": ".github/workflows/build-ios-ipa.yml",
            "name": "Build iOS IPA",
            "runs_on": "macos-latest",
            "steps": ["checkout", "build_unsigned.sh", "upload-artifact"]
          }
        ]
      },
      "docker": {
        "file": "api-server/Dockerfile",
        "base_image": "node:20-alpine",
        "build_method": "Dockerfile (Railway auto-deploy)",
        "no_deps": true
      }
    },
    "files_changed": {
      "swift_project": [
        "ThreeOneOSFive/Info.plist",
        "ThreeOneOSFive/views/DesignSystem.swift",
        "ThreeOneOSFive/App.swift",
        "ThreeOneOSFive/ContentView.swift",
        "ThreeOneOSFive/views/SettingsView.swift",
        "ThreeOneOSFive/helpers/LicenseActivationView.swift",
        "ThreeOneOSFive/helpers/Utils.swift",
        "ThreeOneOSFive/helpers/LicenseManager.swift",
        "ThreeOneOSFive/helpers/DisplayIdentityAttribution.swift",
        "ThreeOneOSFive/views/LogView.swift",
        "ThreeOneOSFive/views/AppDataBrowserView.swift",
        "ThreeOneOSFive/views/FileBrowserView.swift",
        "ThreeOneOSFive/views/WallpaperLabView.swift",
        "ThreeOneOSFive/pt-BR.lproj/Localizable.strings",
        "ThreeOneOSFive/en.lproj/Localizable.strings",
        "ThreeOneOSFive/es.lproj/Localizable.strings",
        "ThreeOneOSFive/vi.lproj/Localizable.strings",
        "ThreeOneOSFive/zh-Hans.lproj/Localizable.strings"
      ],
      "build_scripts": [
        "build_unsigned.sh",
        "build_esign_ready_ipa.sh",
        ".github/workflows/build.yml",
        ".github/workflows/build-ios-ipa.yml"
      ],
      "api_server": [
        "api-server/server.js",
        "api-server/package.json",
        "api-server/Dockerfile",
        "api-server/public/index.html",
        "api-server/keys.json",
        "api-server/render.yaml"
      ]
    },
    "key_decisions": [
      "Removed express and cors dependencies (server crash issue)",
      "Changed from Render to Railway hosting",
      "Implemented HMAC session-based authentication instead of password in client-side JS",
      "Used inline HTML to avoid path issues in Docker",
      "Kept Cryptroic as Xcode scheme name (product name stays Cryptroic binary)",
      "Changed CFBundleDisplayName/CFBundleName to 'null hex' (user-facing name)",
      "Fixed Railway target port from 214 to 8080"
    ],
    "build_history_summary": {
      "total_builds": 15,
      "successful": 2,
      "failed": 13,
      "first_success": "Run 27 (Build iOS App)",
      "second_success": "Run 30 (Build iOS IPA)",
      "common_failure_reasons": [
        "Wrong target port (214 vs 8080)",
        "express.static crash in Docker",
        "Missing keys.json in Docker image",
        "Hardcoded Cryptroic names in build-ios-ipa.yml",
        "Wrong app directory name (nullhex.app vs Cryptroic.app)"
      ]
    }
  }
}
