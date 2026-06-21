# Odyssey Troy Prototype — Pixel Art Direction

## Target

The current prototype should move away from procedural rectangle drawing and toward an asset-driven 2D pixel pipeline.

Target composition:

- Internal resolution: 768 x 432
- Player height: 36-44 px on screen
- NPC height: 42-52 px on screen
- Train height: 84-110 px
- Station roof / arch: upper 45 percent of frame
- Platform and rail: lower 18 percent of frame

## Visual Reference Direction

Use these references only as broad visual language, not as direct copying:

- Hollow Knight: small readable player silhouette against a large atmospheric environment
- SANABI: industrial side-scrolling readability, layered city/rail structures, strong silhouettes
- Diesel-punk railway: brass, soot, iron, brown leather, fogged glass

## Palette

Use a restrained palette so the game does not become muddy.

### Base

- Ink black: #050403
- Warm void: #101013
- Deep brown: #1b1209
- Station brown: #2c2924
- Iron gray brown: #524b3f

### Highlights

- Antique gold: #d7b35d
- Pale gold: #f0d281
- Brass: #9d7a3a
- Paper: #d1b875

### Accents

- Troy red: #9f3426
- Signal red: #dd5b3c
- Faded glass gray-blue: #5c6b6c
- Smoke gray: #635c53

## Layer Plan

1. Far background
   - dark upper air
   - dust bands
   - ruined station silhouette

2. Station architecture
   - high glass roof
   - arches
   - platform columns
   - hanging signs

3. Train layer
   - long Ithaca-bound train across the lower middle
   - windows, doors, panels
   - no text on train body

4. Foreground platform
   - platform edge
   - rails
   - debris
   - ticket gate
   - posters and return list

5. Characters
   - player always in front of structures
   - NPCs behind player but above objects

6. UI
   - top HUD
   - controls hint top-right
   - dialogue/ticket/name panels

## Character Sprite Targets

### Odysseus / OUTIS

- 32 x 42 or 36 x 48 source sprite
- dark officer coat
- short wet cloak silhouette
- gold ticket point near chest/waist
- small red accent on one side
- head should be smaller than torso
- posture slightly forward, tired but alert

### Propagandist

- upright posture
- paper or proclamation board
- gold trim
- clean silhouette

### Trojan Survivor

- hunched posture
- torn cloth / bundled luggage
- asymmetric silhouette
- dull brown and rust accents

### Inspector

- strict vertical shape
- cap or helmet
- gold baton / checkpoint light
- angular shoulders

## Next Production Step

The proper next step is to create actual PNG sprite sheets and background layers:

- assets/characters/odysseus.png
- assets/characters/npcs.png
- assets/backgrounds/troy_station_far.png
- assets/backgrounds/troy_station_train.png
- assets/tiles/platform_tiles.png
- assets/objects/station_objects.png

The current canvas renderer should then load images and draw them with imageSmoothingEnabled=false.
