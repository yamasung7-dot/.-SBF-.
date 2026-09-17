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
SBF 1.0.0 now contains both the canonical loader and the first general-purpose core foundation.

The foundation is intentionally domain-neutral. It provides infrastructure for future systems instead of implementing a particular modeling feature itself.

### Blockbench integration
The plugin uses Blockbench's current `Plugin.register` lifecycle and supports the `both` variant. The current Blockbench plugin documentation specifies that the plugin ID should match the JavaScript filename without its extension and that `onload` and `onunload` are lifecycle hooks. citeturn0search0

### Current identity

- Plugin ID: `sbf`
- Plugin title: `SBF — System Forge`
- Version: `1.0.0`
- Executable file: `sbf.js`

### Load confirmation

When the plugin loads, the user receives:

`SBF — System Forge v1.0.0 has been loaded.`

The loader prefers Blockbench's message-box API and falls back to quick/status messaging when necessary. These message APIs are part of Blockbench's current UI API documentation. citeturn0search2

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
Provides a universal registration mechanism for future SBF systems.

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

Blockbench documents `Blockbench.on` and `Blockbench.removeListener` for event registration/removal; SBF wraps that lifecycle so future systems do not need to reinvent cleanup handling. citeturn0search3

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

Blockbench's plugin documentation uses the Action system for plugin functionality and demonstrates deleting actions during `onunload`. citeturn0search0

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

Blockbench's Property system is specifically designed for undo-aware and project-stored properties, so persistent feature data should be designed separately when needed. citeturn0search4

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

# What the Foundation Does NOT Do

The 1.0.0 foundation intentionally does not:

- Build bones.
- Create rigs.
- Implement IK.
- Modify model geometry.
- Generate weapons.
- Generate PBR maps.
- Perform rendering.
- Implement mobile optimization.
- Assume Minecraft-only workflows.
- Assume every feature is an animation feature.
- Decide what future systems must build.
- Replace Blockbench's own undo/project-data systems.

Those responsibilities belong to future feature systems.

---

# Planned First Feature System: Bone Builder

The first major SBF feature is still planned to be a bone-building/rigging system.

The practical target includes models such as guns, while keeping the implementation generic enough for other models.

Potential responsibilities:
- Bone creation.
- Bone naming.
- Parent/child relationships.
- Bone transforms.
- Pivot handling.
- Binding model parts/groups.
- Animation integration.
- Later constraints and IK.

The Bone Builder must consume the foundation rather than becoming part of the foundation itself.

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
Code structure was reviewed against current Blockbench plugin registration/lifecycle documentation. Runtime execution in Blockbench was not performed.

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

### Architectural rule
The foundation must remain feature-agnostic. New systems should plug into the foundation rather than forcing the foundation to understand their domain.

### Expected behavior
When SBF loads:
1. Blockbench validates and registers the plugin.
2. SBF marks its runtime as loaded.
3. The load confirmation is displayed.
4. Future systems can register through the controlled SBF API.
5. Runtime resources can be cleaned up through the centralized lifecycle.

When SBF unloads:
1. Registered runtime resources are cleaned up.
2. Registered systems receive unload handling.
3. Runtime state is cleared.
4. SBF returns to an unloaded state.

### Verification
The updated source was committed to GitHub. Static code/API review was performed; runtime execution inside Blockbench has not yet been performed.

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
