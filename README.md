# Oculus TV Launcher

A simple launcher to start apps directly into Oculus TV on the Oculus Go - even while offline.

## Background
The Oculus TV app on the Oculus Go supports running normal Android apps via a virtual screen. Apps that have an existing Android TV UI (leanback) are displayed in the "Unknown Sources" list at the bottom of the UI.

Other Android applications can be run too, but they need to be launched from another application.

Unfortunately Oculus TV refuses to show the list of "Unknown Sources" when no network connection is available.

This application fakes being a real VR application so the Oculus Go launcher will show it in the "Unknown Sources" list under the main library.

## Usage

## Building and running on Meta Quest / MediQuest

1. Install the Android SDK Platform Tools on your development machine so that the `adb` and `fastboot` utilities are available in your shell.
2. From the project root, build the APK with Gradle:
   ```bash
   ./gradlew assembleDebug
   ```
   The build output will appear at `app/build/outputs/apk/debug/app-debug.apk`.
3. Put your headset into Developer Mode (Meta Quest mobile app → Devices → Developer Mode) and connect the headset to your computer with a USB cable. When the headset prompts for USB debugging permissions, allow the connection.
4. Install the launcher onto the headset:
   ```bash
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```
5. In the headset, open Library → Unknown Sources and launch **QuestGPT Launcher**. The app will start a local WebXR scene, launch the Meta/Oculus Browser to `http://127.0.0.1:8765/`, and present a floating QuestGPT orb you can click to open the Emergent QuestGPT experience from within VR.

## Modifying

To change which application is launched, change the the `target_package` value in `app/src/main/res/values/strings.xml`. This needs to match the package name of the installed application.

To get a list of installed packages:
```
adb shell pm list packages
```
