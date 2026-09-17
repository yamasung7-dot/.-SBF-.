/*
 * SBF — System Forge
 * Core Foundation + Bone Rig System
 *
 * Release: 2.0.0
 *
 * SBF is a general-purpose Blockbench system framework.
 * "Forge" is the project name, not a restriction on the feature domain.
 */

(() => {
    'use strict';

    const VERSION = '2.0.0';
    const PLUGIN_ID = 'sbf';
    const TITLE = 'SBF — System Forge';

    const IDENTITY = Object.freeze({
        id: PLUGIN_ID,
        version: VERSION,
        title: TITLE
    });

    const runtime = {
        loaded: false,
        systems: new Map(),
        actions: new Map(),
        state: new Map(),
        cleanups: []
    };

    function assert(condition, message) {
        if (!condition) throw new Error('[SBF] ' + message);
    }

    function validateRuntime() {
        assert(
            typeof Plugin !== 'undefined' &&
            typeof Plugin.register === 'function',
            'Blockbench Plugin.register is unavailable.'
        );
        assert(typeof Blockbench !== 'undefined', 'The Blockbench API is unavailable.');
    }

    function validateId(id, type) {
        assert(
            typeof id === 'string' && /^[a-z][a-z0-9_]*$/.test(id),
            type + ' must use lowercase letters, numbers, and underscores, and start with a letter.'
        );
    }

    function log(message, ...data) {
        if (typeof console !== 'undefined' && console.info) {
            console.info('[SBF] ' + message, ...data);
        }
    }

    function warn(message, ...data) {
        if (typeof console !== 'undefined' && console.warn) {
            console.warn('[SBF] ' + message, ...data);
        }
    }

    function showMessage(message, title = 'SBF') {
        if (typeof Blockbench.showMessageBox === 'function') {
            Blockbench.showMessageBox({
                title,
                message,
                icon: 'info'
            });
        } else if (typeof Blockbench.showQuickMessage === 'function') {
            Blockbench.showQuickMessage(message, 3000);
        } else if (typeof Blockbench.showStatusMessage === 'function') {
            Blockbench.showStatusMessage(message, 3000);
        }
    }

    function showLoadConfirmation() {
        const message = TITLE + ' v' + VERSION + ' has been loaded.';
        if (typeof Blockbench.showMessageBox === 'function') {
            Blockbench.showMessageBox({
                title: 'SBF Loader',
                message,
                icon: 'check'
            });
        } else if (typeof Blockbench.showQuickMessage === 'function') {
            Blockbench.showQuickMessage(message, 2500);
        } else if (typeof Blockbench.showStatusMessage === 'function') {
            Blockbench.showStatusMessage(message, 2500);
        }
    }

    function addCleanup(cleanup) {
        assert(typeof cleanup === 'function', 'Cleanup must be a function.');
        runtime.cleanups.push(cleanup);

        let active = true;
        return () => {
            if (!active) return;
            active = false;

            const index = runtime.cleanups.indexOf(cleanup);
            if (index !== -1) runtime.cleanups.splice(index, 1);

            try {
                cleanup();
            } catch (error) {
                warn('Cleanup failed.', error);
            }
        };
    }

    function listen(eventId, callback) {
        assert(typeof Blockbench.on === 'function', 'Blockbench event API is unavailable.');
        assert(typeof callback === 'function', 'Event callback must be a function.');

        Blockbench.on(eventId, callback);

        return addCleanup(() => {
            if (typeof Blockbench.removeListener === 'function') {
                Blockbench.removeListener(eventId, callback);
            }
        });
    }

    function registerSystem(id, definition = {}) {
        validateId(id, 'System ID');
        assert(!runtime.systems.has(id), 'System "' + id + '" is already registered.');

        const system = {
            id,
            title: definition.title || id,
            version: definition.version || VERSION,
            enabled: definition.enabled !== false,
            api: Object.freeze(definition.api || {}),
            onload: typeof definition.onload === 'function' ? definition.onload : null,
            onunload: typeof definition.onunload === 'function' ? definition.onunload : null
        };

        runtime.systems.set(id, system);

        if (system.enabled && system.onload) {
            try {
                const cleanup = system.onload({
                    sbf: publicAPI,
                    identity: IDENTITY,
                    system
                });

                if (typeof cleanup === 'function') system._cleanup = cleanup;
            } catch (error) {
                runtime.systems.delete(id);
                throw new Error(
                    '[SBF] Failed to load system "' +
                    id +
                    '": ' +
                    (error && error.message ? error.message : error)
                );
            }
        }

        return getSystemInfo(id);
    }

    function unregisterSystem(id) {
        const system = runtime.systems.get(id);
        if (!system) return false;

        if (typeof system._cleanup === 'function') {
            try {
                system._cleanup();
            } catch (error) {
                warn('System cleanup failed for "' + id + '".', error);
            }
        }

        if (system.onunload) {
            try {
                system.onunload({
                    sbf: publicAPI,
                    identity: IDENTITY,
                    system
                });
            } catch (error) {
                warn('System unload failed for "' + id + '".', error);
            }
        }

        runtime.systems.delete(id);
        return true;
    }

    function getSystemInfo(id) {
        const system = runtime.systems.get(id);
        if (!system) return null;

        return Object.freeze({
            id: system.id,
            title: system.title,
            version: system.version,
            enabled: system.enabled,
            api: system.api
        });
    }

    function listSystems() {
        return Array.from(runtime.systems.keys()).map(getSystemInfo);
    }

    function registerAction(id, options) {
        validateId(id, 'Action ID');
        assert(typeof Action === 'function', 'Blockbench Action API is unavailable.');
        assert(!runtime.actions.has(id), 'Action "' + id + '" is already registered.');

        const action = options instanceof Action ? options : new Action(id, options);
        runtime.actions.set(id, action);

        addCleanup(() => {
            if (action && typeof action.delete === 'function') action.delete();
            runtime.actions.delete(id);
        });

        return action;
    }

    function setState(key, value) {
        assert(typeof key === 'string' && key.length > 0, 'State key must not be empty.');
        runtime.state.set(key, value);
        return value;
    }

    function getState(key, fallback) {
        return runtime.state.has(key) ? runtime.state.get(key) : fallback;
    }

    function deleteState(key) {
        return runtime.state.delete(key);
    }

    const publicAPI = Object.freeze({
        identity: IDENTITY,

        get loaded() {
            return runtime.loaded;
        },

        systems: Object.freeze({
            register: registerSystem,
            unregister: unregisterSystem,
            get: getSystemInfo,
            has: id => runtime.systems.has(id),
            list: listSystems
        }),

        ui: Object.freeze({
            registerAction
        }),

        events: Object.freeze({
            listen
        }),

        lifecycle: Object.freeze({
            addCleanup
        }),

        state: Object.freeze({
            get: getState,
            set: setState,
            delete: deleteState
        }),

        log,
        warn
    });

    /*
     * Bone Rig System
     *
     * Blockbench represents bones as groups in formats that support bone
     * rigging. SBF therefore builds on the native Group/outliner system
     * instead of creating a second custom bone representation.
     *
     * Current scope:
     * - Create root bones.
     * - Create child bones.
     * - Store lightweight SBF rig metadata on groups when Property is available.
     * - Use Blockbench Undo for outliner/selection changes.
     *
     * Deliberately deferred:
     * - IK.
     * - Constraints.
     * - Automatic geometry reconstruction.
     * - Heavy procedural rig generation.
     */
    function createBoneRigSystem() {
        assert(typeof Group === 'function', 'Blockbench Group API is unavailable.');

        const actions = [];
        let propertyRegistered = false;

        function ensureProperties() {
            if (propertyRegistered) return;

            if (typeof Property === 'function') {
                new Property(Group, 'string', 'sbf_rig_id', {
                    default: '',
                    label: 'SBF Rig ID',
                    description: 'Internal SBF rig identifier for this bone.'
                });

                new Property(Group, 'string', 'sbf_bone_role', {
                    default: 'bone',
                    label: 'SBF Bone Role',
                    description: 'Internal SBF role for this group.'
                });

                propertyRegistered = true;
            } else {
                warn('Blockbench Property API is unavailable; rig metadata properties were not added.');
            }
        }

        function getSelectedGroups() {
            if (!Array.isArray(Group.selected)) return [];
            return Group.selected.filter(group => group && typeof group.addTo === 'function');
        }

        function getActiveParent() {
            const groups = getSelectedGroups();
            return groups.length ? groups[groups.length - 1] : null;
        }

        function normalizeBoneName(name, fallback) {
            let result = String(name || fallback)
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9_]+/g, '_')
                .replace(/^_+|_+$/g, '');

            if (!result) result = fallback;

            if (!/^[a-z]/.test(result)) result = 'bone_' + result;

            return result;
        }

        function makeUniqueBoneName(name, parent) {
            const bone = new Group({name});
            if (typeof bone.createUniqueName === 'function') {
                const unique = bone.createUniqueName();
                if (unique) return unique;
            }

            if (parent && Array.isArray(parent.children)) {
                const names = new Set(
                    parent.children
                        .filter(child => child && child.name)
                        .map(child => child.name)
                );

                if (!names.has(name)) return name;

                let i = 2;
                while (names.has(name + '_' + i)) i++;
                return name + '_' + i;
            }

            return name;
        }

        function createBone(name, parent = null, origin = null) {
            const normalized = normalizeBoneName(name, parent ? 'child_bone' : 'root');
            const uniqueName = makeUniqueBoneName(normalized, parent);

            const bone = new Group({
                name: uniqueName,
                origin: origin ? origin.slice() : [0, 0, 0],
                rotation: [0, 0, 0],
                selected: true,
                isOpen: true
            });

            bone.init();
            bone.addTo(parent || 'root');

            if ('sbf_bone_role' in bone) bone.sbf_bone_role = 'bone';
            if ('sbf_rig_id' in bone && typeof Blockbench.bbuid === 'function') {
                bone.sbf_rig_id = Blockbench.bbuid(10);
            }

            if (typeof bone.markAsSelected === 'function') {
                bone.markAsSelected();
            }

            return bone;
        }

        function withUndo(label, callback) {
            assert(typeof Undo !== 'undefined', 'Blockbench Undo API is unavailable.');

            Undo.initEdit({
                outliner: true,
                selection: true
            });

            try {
                const result = callback();

                Undo.finishEdit(label, {
                    outliner: true,
                    selection: true
                });

                if (typeof Canvas !== 'undefined' && typeof Canvas.updateView === 'function') {
                    Canvas.updateView({
                        selection: true
                    });
                }

                return result;
            } catch (error) {
                warn('Bone operation failed.', error);
                throw error;
            }
        }

        function promptForName(title, defaultName, callback) {
            if (typeof Blockbench.textPrompt !== 'function') {
                callback(defaultName);
                return;
            }

            Blockbench.textPrompt(title, defaultName, text => {
                if (typeof text === 'string' && text.trim()) callback(text);
            });
        }

        function createRootBone() {
            promptForName('Create Root Bone', 'root', name => {
                try {
                    const bone = withUndo('SBF: Create Root Bone', () =>
                        createBone(name, null, [0, 0, 0])
                    );

                    showMessage('Created root bone "' + bone.name + '".', 'SBF Bone Rig');
                } catch (error) {
                    showMessage(
                        'Could not create the root bone.\n\n' +
                        (error && error.message ? error.message : error),
                        'SBF Bone Rig Error'
                    );
                }
            });
        }

        function createChildBone() {
            const parent = getActiveParent();

            if (!parent) {
                showMessage(
                    'Select a bone/group first. SBF will use the selected group as the parent.',
                    'SBF Bone Rig'
                );
                return;
            }

            const origin = Array.isArray(parent.origin)
                ? parent.origin.slice()
                : [0, 0, 0];

            promptForName('Create Child Bone', 'child_bone', name => {
                try {
                    const bone = withUndo('SBF: Create Child Bone', () =>
                        createBone(name, parent, origin)
                    );

                    showMessage(
                        'Created "' + bone.name + '" under "' + parent.name + '".',
                        'SBF Bone Rig'
                    );
                } catch (error) {
                    showMessage(
                        'Could not create the child bone.\n\n' +
                        (error && error.message ? error.message : error),
                        'SBF Bone Rig Error'
                    );
                }
            });
        }

        function getSystemStatus() {
            return Object.freeze({
                id: 'bone_rig',
                title: 'Bone Rig',
                version: VERSION,
                group_api: true,
                property_api: propertyRegistered,
                mobile_safe_design: true
            });
        }

        function onload() {
            ensureProperties();

            const rootAction = registerAction('sbf_create_root_bone', {
                name: 'SBF: Create Root Bone',
                description: 'Create a new root bone at the model origin.',
                icon: 'account_tree',
                click: createRootBone
            });

            const childAction = registerAction('sbf_create_child_bone', {
                name: 'SBF: Create Child Bone',
                description: 'Create a child bone under the selected bone/group.',
                icon: 'subdirectory_arrow_right',
                condition: () => true,
                click: createChildBone
            });

            actions.push(rootAction, childAction);

            if (typeof MenuBar !== 'undefined' &&
                MenuBar.menus &&
                MenuBar.menus.tools &&
                typeof MenuBar.menus.tools.addAction === 'function') {
                MenuBar.menus.tools.addAction(rootAction);
                MenuBar.menus.tools.addAction(childAction);
            } else {
                warn('Tools menu is unavailable; Bone Rig actions were registered but not attached to the Tools menu.');
            }

            setState('bone_rig.status', getSystemStatus());
            log('Bone Rig system loaded.');
        }

        function onunload() {
            actions.length = 0;
            deleteState('bone_rig.status');
            log('Bone Rig system unloaded.');
        }

        return {
            id: 'bone_rig',
            title: 'Bone Rig',
            version: VERSION,
            api: Object.freeze({
                createBone,
                getSelectedGroups,
                getActiveParent,
                getStatus: getSystemStatus
            }),
            onload,
            onunload
        };
    }

    function clearRuntime() {
        for (let i = runtime.cleanups.length - 1; i >= 0; i--) {
            try {
                runtime.cleanups[i]();
            } catch (error) {
                warn('Runtime cleanup failed.', error);
            }
        }

        runtime.cleanups.length = 0;

        for (const id of Array.from(runtime.systems.keys()).reverse()) {
            unregisterSystem(id);
        }

        runtime.actions.clear();
        runtime.state.clear();
        runtime.loaded = false;
    }

    validateRuntime();

    Plugin.register(PLUGIN_ID, {
        title: TITLE,
        author: 'yamasung7-dot',
        description: 'A general-purpose, extensible foundation for Blockbench systems.',
        icon: 'build',
        version: VERSION,
        variant: 'both',

        onload() {
            runtime.loaded = true;
            showLoadConfirmation();

            registerSystem('bone_rig', createBoneRigSystem());

            log('Core foundation + Bone Rig system loaded: v' + VERSION);
        },

        onunload() {
            clearRuntime();
        }
    });
})();
