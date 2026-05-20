 # 1. I want to build a mobile app with Expo and React Native. Set up my workspace for me.

Here's what was set up:

Project Structure:
- src/ — Your app source code (TypeScript)
- app.json — Expo configuration
- package.json — Project dependencies and scripts
- tsconfig.json — TypeScript configuration
- assets/ — Images and static files

Key Files:
- CLAUDE.md — Documentation for working with Claude Code
- AGENTS.md — Agent configuration

Available npm commands:
- npm run android — Run on Android emulator
- npm run ios — Run on iOS (requires macOS)
- npm run web — Run on web (Expo web)
- npm start — Start the development server


# With Expo:
npx create-expo-app my-app
    ↓
npm start
    ↓
Scan QR code with phone
    ↓
App runs instantly (5 minutes!)

# Expo + React Native: How They Work Together
You write React Native code (JavaScript)
    ↓
Expo development server
    ↓
Expo Go app (on your phone)
    ↓
App runs on your phone instantly


 # 2. Create a simple demo application, some Habit Tracker for demo purposes, and then let me launch it on my phone.


# Start Expo on Windows 

use Expo package ver 54 

 cd /poroject-dir

 npx expo start --port 8083 --clear
 

 ![1779211422875](image/GUIDE/1779211422875.png)

 #Level up 

 Hey, so I really like the app as it stands, but I'd like to level this up with an app design framework that high-quality app devs and designers use, where essentially every app that I build requires a core function, then a core loop, some accessory features, a surface area check to minimize the number of screens, and then some sort of retention hook.

So the core function for this app is it needs to be able to create and then track habits. The core loop for this app is basically every time a person creates a habit and then tracks it, they need to be rewarded in some way. It needs to be visually stimulating, there needs to be some form of haptic feedback, and then ideally there's some sort of sound like a chime or something.

Also, we need some form of challenge. So if they're embarking on a three-day habit challenge, let's say, which might occur immediately after onboarding, at the end of that three-day challenge, we also need to reward them for the fulfillment of their efforts.

The accessory features for this app are going to be something like logging, so the user should be able to see all of their prior habits tracked, some sort of accountability thing so that they can look back and then maybe see a graph or a chart of just how consistent they've been.

Ideally, we need a way to create multiple types of habits, not just one. Being aware that a habit where you log it once per day is different from a volume-based habit where you need to maybe do it three or four times a day. For surface area check, just make sure that we don't have more than somewhere between 5 to 7 screens in our app. We want it to be as simple as possible. In terms of retention hook, the thing that brings people back to the app. We want to create challenges for the user and basically have some sort of ongoing thing that checks in with them via push notifications, probably once a day or maybe a couple times a day, just consistently knocking on their door, seeing whether or not they've done the habit, whether they're ready to start the habit or hey, don't forget about XYZ habit, whose intention you set earlier today. So I think this just gets people coming back to our app and is ultimately responsible for a fair amount of our usage.

