# Lumina Choreographer 💃✨

**Lumina Choreographer** is a professional browser-based application designed for programming complex light shows for WS2812B (NeoPixel) LED suits. 

It features a timeline-based non-linear editing interface, a real-time 3D-mapped visualizer for 5 dancers, and a powerful export engine that generates optimized C++ code for Arduino/ESP32 controllers using the FastLED library.

## 🌟 Features

### 🎨 Visualizer & Design
- **Real-time Preview:** visualizing 5 dancers simultaneously.
- **Anatomy Mapping:** 541 LEDs per suit mapped to specific body parts (Arms, Legs, Torso, Face, Pockets).
- **Spatial Effects:** Effects can be applied based on physical space (e.g., "Body Fill" from feet to head) rather than just strip index order.
- **Reference Video:** Import an MP4/MOV of your choreography to display behind the dancers for perfect synchronization.

### ⏱️ Timeline Editor
- **Multi-Track System:** Manage cues for individual dancers.
- **Layering:** multiple effects can overlap on the same dancer; the engine handles additive color blending automatically.
- **Drag & Drop:** Easy timeline scrubbing and zooming.
- **Precise Control:** Edit start times and durations down to the millisecond.

### 💡 Effect Engine
Includes a variety of procedural effects:
- **Basics:** Solid, Fade, Blend, Gradient.
- **Motion:** Chase, Wipe, Fill.
- **Spatial:** Body Wipe (Top-to-Bottom), Body Fill, Horizontal Wipes.
- **Generative:** Sparkle (twinkle), Strobe, Wave, Random Noise.
- **Direction Control:** Forward, Backward, Hands-Up vs. Hands-Down poses.

### 🛠️ Hardware Export
- **One-Click Export:** Generates a ready-to-flash `.ino` file.
- **Project Recovery:** The raw project data (JSON) is embedded inside the exported C++ file. You can restore your entire save state by importing the `.ino` file back into the web app.
- **Memory Optimized:** Uses delta-compression in the generated C++ code to fit long choreographies onto microcontrollers.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd lumina-choreographer
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. Open your browser to the URL shown (usually `http://localhost:5173`).

---

## 📖 User Guide

### 1. Navigation
- **Play/Pause:** Spacebar or click the Play button in the toolbar.
- **Scrub:** Click anywhere on the timeline ruler to jump to a timestamp.
- **Zoom:** (Currently set to fixed zoom in this version, adjustable in code).

### 2. Creating Effects
1. **Select a Track:** Locate the dancer (Suit 0-4) you want to edit.
2. **Add Cue:** 
   - **Double Click** inside a track to add a cue at that position.
   - Or **Shift + Click** on the ruler/track.
3. **Select Cue:** Click a cue block to select it. It will highlight with a cyan border.

### 3. Editing Properties
When a cue is selected, the **Right Panel** becomes active:
- **Effect Type:** Choose the animation logic (e.g., Chase, Body Fill).
- **Colors:** Set Primary and Secondary colors.
- **Timing:** Fine-tune Start Time and Duration.
- **LED Range:** Restrict the effect to specific LEDs (e.g., only the mask or only the legs).
- **Modifiers:** Adjust speed, brightness, and direction.

### 4. Video Sync
1. Click **"Import Video"** in the top right.
2. Select a video file of your dance rehearsal.
3. The video will appear in the background of the Visualizer.
4. The timeline will automatically sync with the video playback.

---

## 🔌 Hardware Setup & Exporting

### The Suit Layout
The default configuration assumes **541 LEDs** per suit. You can modify the `DEFAULT_SUITS` constant in `src/constants.ts` to match your specific hardware strip lengths.

### Flashing to Controller
1. Click **"Export Arduino"** in the app header.
2. A file named `choreography.ino` will download.
3. Open this file in the **Arduino IDE**.
4. **Library Requirement:** Ensure you have the [FastLED](https://github.com/FastLED/FastLED) library installed.
5. **Hardware:**
   - **Recommended:** ESP32 (due to high memory requirements for animation data).
   - **Wiring:** Connect Data Pin of the LED strip to the pin defined in the generated code (Defaults: Pins 4, 16, 17, 18, 19 for suits 0-4).
6. Upload the sketch to your board.

### Saving Your Work
Lumina does not use a database. To save your work:
1. **Export** the Arduino file.
2. To load it later, click **"Import Project"** and select that same `.ino` file. The app reads the hidden JSON data inside the C++ comments.

---

## 🛠️ Tech Stack
- **Framework:** React 18
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
