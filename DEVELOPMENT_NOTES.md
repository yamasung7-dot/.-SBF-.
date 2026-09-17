# SBF — System Forge Development Notes

## Purpose

This file is the permanent development record for SBF (System Forge).

It records:
- What the code is supposed to do.
- What feature is being added.
- Why architectural decisions were made.
- Important constraints and compatibility requirements.
- What each major component is responsible for.
- What each component explicitly does not do.
- Integration points for future systems.
- Release/version history.
- Testing and verification status.

The notes stay with the source so development can continue from the established architecture instead of repeatedly rebuilding the foundation.

---

## Project Rules

### Canonical executable file

SBF has one canonical executable plugin file:

- `sbf.js`

Older executable versions must never be copied into the repository, nested inside folders, or selected dynamically at runtime.

### Versioning

SBF uses whole-number release progression:

`1.0.0 -> 2.0.0 -> 3.0.0`

Patch/minor release progression is not part of the project's release convention.

### General-purpose architecture

SBF is not a bone-only framework.

The word "Forge" describes the project identity, not a restriction on the kind of feature SBF can host.

A future system may work with bones, animation, geometry, exporters, generators, analysis, utilities, workflow tools, or another Blockbench capability without requiring the core foundation to be rewritten around that domain.

### Mobile

SBF is not the mobile-optimization plugin. Mobile optimization belongs to the separate MOB project unless explicitly changed later.

---

# Release 1.0.0

## Canonical Loader + Core Foundation

### File

`sbf.js`

### Purpose

SBF 1.0.0 contained the canonical loader and the first general-purpose core foundation.

The foundation was intentionally domain-neutral. It provided infrastructure for future systems instead of implementing a particular modeling feature itself.

### Blockbench integration

The plugin uses Blockbench's `Plugin.register` lifecycle and supports the `both` variant. Current Blockbench plugin documentation specifies that the plugin ID should match the JavaScript filename without its extension and that `onload` and `onunload` are lifecycle hooks. citeturn0search1

### Current identity at 1.0.0

- Plugin ID: `sbf`
- Plugin title: `SBF — System Forge`
- Version: `1.0.0`
- Executable file: `sbf.js`

### Load confirmation

At 1.0.0 the loader displayed:

`SBF — System Forge v1.0.0 has been loaded.`

---

# Core Foundation

## 1. Private Runtime

### Purpose

Provides one controlled runtime for SBF.

### Responsibilities

- Tracks whether SBF is loaded.
- Owns registered systems.
- Owns registered UI actions.
- Owns temporary runtime state.
- Owns cleanup functions.

### Boundary

The runtime is kept inside the plugin's isolated execution context. It is not placed on the global object.

---

## 2. System Registry

### Purpose

Provides a universal registration mechanism for SBF systems.

### Responsibilities

- Register systems by unique ID.
- Prevent duplicate system IDs.
- Store system metadata.
- Enable/disable a system at registration time.
- Run system load/unload lifecycle hooks.
- Expose a controlled system API.
- List currently registered systems.
- Remove systems cleanly.

### Important design decision

A system represents a feature domain, not a specific object type.

Therefore the foundation does not assume:
- Every system is a bone system.
- Every system modifies geometry.
- Every system creates objects.
- Every system belongs in the animation editor.
- Every system is Minecraft-specific.

This keeps the foundation usable for future features that deviate completely from bone building.

---

## 3. Lifecycle and Cleanup

### Purpose

Prevent systems from leaving behind actions, listeners, or other runtime resources after unloading.

### Responsibilities

- Register cleanup functions.
- Execute cleanup in reverse registration order.
- Allow individual cleanup functions to be released early.
- Run system-specific unload hooks.
- Clear runtime state during plugin unload.

### Boundary

The foundation manages lifecycle ownership. Individual systems remain responsible for correctly describing their own resources.

---

## 4. Event Adapter

### Purpose

Provide one controlled path for Blockbench event listeners.

### Responsibilities

- Register Blockbench event callbacks.
- Return cleanup handles.
- Automatically remove listeners during SBF unload.

### Boundary

The event adapter does not decide which events a system should listen for.

---

## 5. UI Action Adapter

### Purpose

Provide a consistent way for future systems to create Blockbench actions.

### Responsibilities

- Validate action IDs.
- Prevent duplicate action IDs.
- Create or accept Blockbench Action instances.
- Track actions for cleanup.

### Boundary

The foundation does not decide where an action belongs in Blockbench's menus or toolbars. The feature system decides its own UI placement.

---

## 6. Runtime State

### Purpose

Provide generic temporary state for SBF systems.

### Responsibilities

- Store arbitrary runtime values.
- Retrieve values with optional fallbacks.
- Delete values.

### Boundary

This is deliberately ephemeral runtime state.

It is not currently:
- A replacement for Blockbench project properties.
- A persistent settings system.
- A model serialization system.

Blockbench's Property system is specifically designed for undo-aware and project-stored properties, so persistent feature data should be designed separately when needed. citeturn0search2

---

## 7. Controlled Public API

Future SBF systems receive a controlled API containing:

- Identity information.
- System registration and lookup.
- UI action registration.
- Event registration.
- Lifecycle cleanup.
- Runtime state.
- Logging/warnings.

Internal runtime maps and implementation details remain private.

### Goal

Future systems should depend on stable SBF contracts rather than reaching into internal implementation details.

---

# Release 2.0.0

## Bone Rig System — Initial Build

### Purpose

SBF 2.0.0 introduces the first real feature system: a native Blockbench bone-rig foundation.

The system is designed around Blockbench's existing group/outliner architecture rather than creating a parallel custom bone object model. Blockbench's current reference documentation describes `Group` as a rotatable outliner type and documents group options including name, origin, and rotation. citeturn1search0turn1search1

Blockbench's documentation also describes bones as groups in formats that support group rotation, and identifies parenting and pivot placement as core parts of rig construction. citeturn1search3turn1search8

### Current system ID

`bone_rig`

### Current responsibilities

- Create root bones.
- Create child bones.
- Establish parent/child hierarchy through Blockbench's native outliner.
- Set initial bone pivot/origin.
- Normalize bone names toward `snake_case`.
- Create unique names where necessary.
- Use Blockbench's Undo system for bone creation.
- Register lightweight SBF rig metadata properties when the Property API is available.
- Provide a controlled Bone Rig API to future SBF systems.

### Current UI

Two actions are added to the Blockbench Tools menu:

- `SBF: Create Root Bone`
- `SBF: Create Child Bone`

Root creation prompts for a name and creates the bone at `[0, 0, 0]`.

Child creation requires a selected group/bone, prompts for a name, and creates the child at the selected parent's current origin.

Blockbench's current plugin documentation demonstrates using `Action` objects and adding them to menus, while the Undo API requires edits to be wrapped in `Undo.initEdit` and `Undo.finishEdit`. citeturn0search1turn0search0

### Metadata properties

When Blockbench's `Property` API is available, SBF registers two Group properties:

- `sbf_rig_id`
- `sbf_bone_role`

The properties are intended for persistent SBF metadata rather than replacing Blockbench's own bone/group data.

Blockbench's Property API supports undo-aware and project-stored properties, and its current reference documentation exposes configurable defaults and descriptions for properties. citeturn0search2turn3search0

### Naming

SBF normalizes requested bone names by:
- Trimming whitespace.
- Lowercasing.
- Replacing unsupported characters with underscores.
- Removing leading/trailing underscores.
- Prefixing names that do not begin with a letter.
- Avoiding duplicate names where possible.

The system does not force a particular model type such as Minecraft. The native Blockbench format determines how the created groups behave as bones.

### Undo and performance

Bone creation is intentionally lightweight:
- No geometry reconstruction.
- No procedural mesh generation.
- No rendering engine.
- No texture processing.
- No large per-frame computation.

This is important for the user's mobile Blockbench workflow.

The current implementation uses Blockbench's native Undo system and outliner objects rather than maintaining a second heavy scene representation. citeturn0search0

---

# Bone Rig API

The registered `bone_rig` system exposes:

- `createBone(name, parent, origin)`
- `getSelectedGroups()`
- `getActiveParent()`
- `getStatus()`

This API is intentionally small. Future rig features should build on these operations rather than directly modifying the system's internal implementation.

---

# Current Bone Rig Boundaries

The 2.0.0 initial Bone Rig system does NOT yet implement:

- Automatic IK.
- Constraints.
- Automatic weight painting.
- Skin deformation.
- Procedural weapon generation.
- Automatic geometry reconstruction.
- Animation keyframe generation.
- Advanced rig controls.
- Automatic conversion of arbitrary geometry into a complete rig.

Those are separate future layers.

---

# What the Foundation Still Does NOT Do

SBF remains domain-neutral outside the Bone Rig system.

The core foundation still does not:

- Assume every future feature is a bone feature.
- Implement mobile optimization.
- Implement PBR.
- Implement rendering.
- Generate height maps.
- Reconstruct models from textures.
- Force all future systems into the Bone Rig architecture.

The Bone Rig system is a consumer of the foundation, not a replacement for it.

---

# Development Log

## 2026-09-17 — Initial Loader

### Feature added

SBF 1.0.0 canonical loader.

### Implementation

Created `sbf.js` as the single executable plugin entry point.

### Reason

Establish a clean, version-controlled entry point before implementing the larger SBF architecture.

### Verification

Code structure was reviewed against current Blockbench plugin registration/lifecycle documentation. Runtime execution in Blockbench was not performed at that stage.

---

## 2026-09-17 — Core Foundation

### Feature added

General-purpose SBF core foundation.

### Implementation

Expanded `sbf.js` with:
- Private runtime state.
- Domain-neutral system registry.
- System lifecycle hooks.
- Cleanup/disposable management.
- Blockbench event adapter.
- UI action adapter.
- Generic runtime state.
- Controlled public API.
- Runtime validation.
- Centralized unload cleanup.

### Purpose

Create a strong base that can support Bone Builder as well as future systems that have nothing to do with bones.

### Verification

The updated source was committed to GitHub and later loaded successfully by the user in Blockbench. This confirms the user's reported runtime load test for the 1.0.0 foundation.

---

## 2026-09-17 — Bone Rig System 2.0.0

### Feature added

Initial native Bone Rig system.

### Implementation

Expanded `sbf.js` with:
- Bone Rig system registration.
- Native `Group`-based bone creation.
- Root bone creation.
- Child bone creation.
- Parent-child hierarchy through `Group.addTo`.
- Pivot/origin initialization.
- Name normalization and uniqueness handling.
- Optional Group Property metadata.
- Undo-wrapped creation operations.
- Tools menu actions.
- Controlled Bone Rig API.
- Status reporting.

### Architectural decision

The system uses Blockbench's native groups as the bone representation. Blockbench's current reference docs expose `Group` construction, initialization, parenting with `addTo`, origin/rotation data, and group behavior relevant to rigging. citeturn1search0turn1search1turn2search0

This avoids creating a parallel bone engine that would have to be synchronized with Blockbench.

### Constraints

- Must remain lightweight enough for mobile use.
- Must use native Blockbench data structures.
- Must remain generic rather than Minecraft-only.
- Must not introduce a custom renderer.
- Must keep advanced rigging features modular.

### Verification

The code was reviewed against current Blockbench reference documentation. The 2.0.0 Bone Rig implementation has NOT yet been runtime-tested by the user in Blockbench.

---

# Next Planned Bone Rig Layers

After the initial creation layer is verified, the next layers can be added incrementally:

1. Bone selection/active-rig management.
2. Bind selected model groups/elements to a bone.
3. Re-parenting tools.
4. Pivot editing helpers.
5. Bone transform utilities.
6. Animation integration.
7. Rig presets.
8. Constraints.
9. IK.

Each layer should be tested before the next layer is added.

---

# Change Log Format

Every future meaningful feature or architectural change should add an entry containing:

## [Date] — [Feature name]

### Feature added
What was added.

### Purpose
Why the feature exists.

### Code/components changed
Which files, systems, or functions changed.

### Expected behavior
What the code should do.

### Constraints
Compatibility, performance, safety, or architectural limits.

### What it does NOT do
Explicit boundaries that prevent unrelated responsibilities from being added accidentally.

### Integration
How the feature connects to the SBF foundation and future systems.

### Testing/verification
What was checked and whether verification was static/code-based or performed in a real Blockbench runtime.

---

# Maintenance Rule

Update this document whenever a meaningful SBF feature, architectural change, or release is added.

Do not claim runtime testing unless SBF has actually been executed in Blockbench.

These notes document the intended and implemented architecture; they are not a substitute for runtime verification.
