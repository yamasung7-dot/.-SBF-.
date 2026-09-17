# SBF — System Forge Development Notes

## Purpose

This file is the permanent development record for SBF (System Forge).

It records:
- What the current code is supposed to do.
- What feature or system is being added.
- Why architectural decisions were made.
- Important constraints and compatibility requirements.
- What each major code component is responsible for.
- What a component must NOT do.
- Integration points for future systems.
- Release/version history.

This document is maintained alongside the SBF source so future development can continue from the established architecture instead of repeatedly rebuilding the foundation.

---

## Project Rules

### Canonical executable file
SBF uses one canonical executable plugin file:

- `sbf.js`

Older executable versions must not be copied into the repository, nested inside folders, or selected dynamically at runtime.

### Versioning
SBF uses whole-number release progression:

`1.0.0 -> 2.0.0 -> 3.0.0`

Patch/minor release progression is not part of the project release convention.

### Architecture
Future systems must extend the existing SBF foundation rather than creating separate loaders, duplicate lifecycle systems, or incompatible parallel foundations.

### Mobile
SBF is not the mobile-optimization plugin. Mobile optimization belongs to the separate MOB project unless explicitly changed later.

---

# Release 1.0.0

## Loader

### File
`sbf.js`

### Purpose
The current release provides the initial SBF loader foundation.

### What the loader does

1. Defines the canonical SBF plugin identity.
2. Defines the current release version.
3. Registers SBF with Blockbench through `Plugin.register`.
4. Uses the canonical plugin ID `sbf`.
5. Uses the canonical executable filename `sbf.js`.
6. Supports both Blockbench variants through `variant: 'both'`.
7. Validates that the required Blockbench plugin/runtime APIs exist before registration.
8. Displays a confirmation message when SBF loads.
9. Provides an unload lifecycle entry point for future cleanup.
10. Keeps loader identity centralized so future systems have one authoritative release identity.

### Current identity

- Plugin ID: `sbf`
- Plugin title: `SBF — System Forge`
- Version: `1.0.0`
- Executable file: `sbf.js`

### Load confirmation

When the plugin loads, the user receives:

`SBF — System Forge v1.0.0 has been loaded.`

The loader prefers Blockbench's message-box API and falls back to quick/status messaging when necessary.

### What the loader does NOT do

The loader does not currently:
- Build bones.
- Create rigs.
- Modify model geometry.
- Add animation systems.
- Add IK.
- Add mobile optimization.
- Generate PBR maps.
- Render models.
- Include legacy implementations.
- Dynamically choose between old and new SBF versions.

---

# Planned Foundation

The next major development stage is the SBF core foundation.

The foundation should provide stable infrastructure for future systems such as the Bone Builder without requiring the loader architecture to be rewritten.

Planned responsibilities include:

- Plugin lifecycle management.
- System registration.
- Internal namespaces/registries.
- Shared state/settings management.
- Validation and error handling.
- Cleanup/unload management.
- Blockbench API integration helpers.
- Undo/redo integration where appropriate.
- Selection/outliner helpers where appropriate.
- UI/action registration helpers.
- Controlled extension points for future SBF systems.

The exact implementation should be designed against the current SBF repository and current Blockbench API rather than assuming an older API structure.

---

# Planned First System: Bone Builder

After the foundation is established, the first major SBF system is intended to be a bone-building/rigging system.

The current practical target is to support building rigs for models such as guns while keeping the system generic enough for other models.

Potential responsibilities:

- Bone creation.
- Bone naming.
- Parent/child relationships.
- Bone transforms.
- Pivot handling.
- Binding model parts/groups to bones.
- Animation integration.
- Future support for constraints and IK.

IK and advanced constraints should be added as later systems/features rather than being forced into the initial foundation.

---

# Development Log

## 2026-09-17 — Initial Loader
### Feature added
SBF 1.0.0 canonical loader.

### Implementation
Created `sbf.js` as the single executable plugin entry point.

### Reason
Establish a clean, version-controlled entry point before implementing the larger SBF foundation.

### Repository constraint
No nested executable files or legacy plugin versions are included.

### Next step
Design and implement the SBF core foundation on top of this loader.

---

# Change Log Format

Every future feature should add an entry containing:

## [Date] — [Feature name]

### Feature added
What was added.

### Purpose
Why the feature exists.

### Code/components changed
Which files, systems, or functions were changed.

### Expected behavior
What the code should do when functioning correctly.

### Constraints
Important compatibility, performance, safety, or architectural limits.

### What it does NOT do
Explicit boundaries to prevent unrelated responsibilities from being added accidentally.

### Integration
How the feature connects to the SBF foundation and future systems.

### Testing/verification
What was checked, and whether verification was static/code-based or performed in a real Blockbench runtime.

---

# Maintenance Rule

This document must be updated whenever a meaningful SBF feature, architectural change, or release is added.

Do not claim runtime testing unless SBF has actually been executed in Blockbench.

The notes are documentation of the intended and implemented system, not a substitute for runtime verification.
