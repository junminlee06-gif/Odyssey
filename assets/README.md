# Asset Pipeline

This directory contains the first asset-driven graphics pass for the Troy Station prototype.

Current files are SVG pixel-art placeholders because they can be committed as text through the GitHub connector and loaded directly by the browser.

The intended final replacement format is PNG.

Recommended future file replacements:

- backgrounds/station_far.svg -> backgrounds/station_far.png
- backgrounds/train_long.svg -> backgrounds/train_long.png
- tiles/platform.svg -> tiles/platform.png
- characters/odysseus_idle.svg -> characters/odysseus_idle.png
- characters/odysseus_walk_a.svg -> characters/odysseus_walk_a.png
- characters/odysseus_walk_b.svg -> characters/odysseus_walk_b.png
- characters/npc_propagandist.svg -> characters/npc_propagandist.png
- characters/npc_survivor.svg -> characters/npc_survivor.png
- characters/npc_inspector.svg -> characters/npc_inspector.png

Keep the same dimensions when replacing with PNG so game.js does not need coordinate changes.
