# Android App Signing Setup

To enable updatable release builds, you need a signing key. Without this,
users must uninstall and reinstall the app for each new version.

## 1. Generate a Keystore (one-time)

```bash
keytool -genkey -v \
  -keystore android/release-key.jks \
  -keyalg RSA -keysize 2048 \
  -validity 10000 \
  -alias groceryrecipe
```

You will be prompted for passwords and identity info. **Save the passwords** -
you will need them in the next step and for all future builds.

## 2. Create `android/key.properties`

```properties
storeFile=release-key.jks
storePassword=YOUR_STORE_PASSWORD
keyAlias=groceryrecipe
keyPassword=YOUR_KEY_PASSWORD
```

## 3. Build a Signed Release APK

```bash
./build.sh --apk
```

The build script will automatically detect `key.properties` and produce a
signed release APK instead of a debug APK.

## Important Notes

- **Never lose your keystore file or passwords.** If you sign an APK with a
  different key, users will have to uninstall the old version first.
- The `.jks` file and `key.properties` are git-ignored to keep secrets out of
  version control. Back them up securely.
- The build script auto-increments `versionCode` on each build (stored in
  `.version_code`), which is required for Android to accept updates.
