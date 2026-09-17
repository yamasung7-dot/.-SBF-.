/*
 * SBF — System Forge
 * Core Foundation
 *
 * Release: 1.0.0
 *
 * SBF is a general-purpose Blockbench system framework.
 * "Forge" is the project name, not a restriction on the feature domain.
 *
 * The foundation does not know what a future system is supposed to build.
 * Bones are one possible system. Exporters, generators, animation tools,
 * analysis tools, utilities, and other systems can use the same foundation.
 */

(() => {
    'use strict';

    const VERSION = '1.0.0';
    const PLUGIN_ID = 'sbf';
    const TITLE = 'SBF — System Forge';

    const IDENTITY = Object.freeze({
        id: PLUGIN_ID,
        version: VERSION,
        title: TITLE
    });

    /*
     * Private runtime.
     *
     * Nothing is placed on window/globalThis. This keeps SBF isolated from
     * other plugins and makes lifecycle ownership explicit.
     */
    const runtime = {
        loaded: false,
        systems: new Map(),
        actions: new Map(),
        state: new Map(),
        cleanups: []
    };

    function assert(condition, message) {
        if (!condition) {
            throw new Error('[SBF] ' + message);
        }
    }

    function validateRuntime() {
        assert(
            typeof Plugin !== 'undefined' &&
            typeof Plugin.register === 'function',
            'Blockbench Plugin.register is unavailable.'
        );
        assert(
            typeof Blockbench !== 'undefined',
            'The Blockbench API is unavailable.'
        );
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

    /*
     * Lifecycle ownership
     *
     * Systems can register cleanup functions here. SBF owns their final
     * execution when the plugin unloads.
     */
    function addCleanup(cleanup) {
        assert(typeof cleanup === 'function', 'Cleanup must be a function.');
        runtime.cleanups.push(cleanup);

        let active = true;
        return () => {
            if (!active) return;
            active = false;

            const index = runtime.cleanups.indexOf(cleanup);
            if (index !== -1) {
                runtime.cleanups.splice(index, 1);
            }

            try {
                cleanup();
            } catch (error) {
                warn('Cleanup failed.', error);
            }
        };
    }

    /*
     * Central event adapter.
     *
     * Future systems should use this instead of directly registering
     * Blockbench listeners so unload cleanup remains automatic.
     */
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

    /*
     * System registry
     *
     * A system is a feature domain, not a specific kind of object.
     * The foundation deliberately does not assume that systems are bones.
     */
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

                if (typeof cleanup === 'function') {
                    system._cleanup = cleanup;
                }
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

    /*
     * UI action adapter
     *
     * This creates one consistent registration path for future tools.
     * The foundation does not decide which menu or toolbar a system uses.
     */
    function registerAction(id, options) {
        validateId(id, 'Action ID');
        assert(typeof Action === 'function', 'Blockbench Action API is unavailable.');
        assert(!runtime.actions.has(id), 'Action "' + id + '" is already registered.');

        const action = options instanceof Action
            ? options
            : new Action(id, options);

        runtime.actions.set(id, action);

        addCleanup(() => {
            if (action && typeof action.delete === 'function') {
                action.delete();
            }
            runtime.actions.delete(id);
        });

        return action;
    }

    /*
     * Generic runtime state.
     *
     * This is intentionally ephemeral. Persistent Blockbench project data
     * and user settings should be implemented through dedicated systems so
     * the foundation does not impose a storage model on every feature.
     */
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

    /*
     * Controlled public API.
     *
     * This is the contract future SBF systems build against. Internal maps,
     * cleanup arrays, and implementation details stay private.
     */
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

    function clearRuntime() {
        /*
         * Actions/listeners/other generic resources are released through
         * their registered cleanup functions.
         */
        for (let i = runtime.cleanups.length - 1; i >= 0; i--) {
            try {
                runtime.cleanups[i]();
            } catch (error) {
                warn('Runtime cleanup failed.', error);
            }
        }

        runtime.cleanups.length = 0;

        /*
         * Systems get an explicit unload lifecycle as well.
         */
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
            log('Core foundation loaded: v' + VERSION);
        },

        onunload() {
            clearRuntime();
        }
    });
})();
