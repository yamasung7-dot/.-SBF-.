/*
 * SBF — System Forge
 * Loader Foundation
 *
 * Release: 1.0.0
 * Plugin ID: sbf
 *
 * IMPORTANT:
 * - This repository intentionally contains one executable plugin file.
 * - Older releases are never embedded, nested, or selected at runtime.
 * - The canonical plugin identity is the fixed ID "sbf".
 * - The canonical release version is the single VERSION constant below.
 * - Future systems must extend this loader instead of creating alternate loaders.
 */

(() => {
    'use strict';

    const VERSION = '1.0.0';
    const PLUGIN_ID = 'sbf';
    const TITLE = 'SBF — System Forge';

    /*
     * Keep all loader identity in one place.
     * Blockbench uses Plugin.register metadata when installing/loading a plugin.
     * The file name must remain sbf.js so the plugin ID and file identity stay aligned.
     */
    const LOADER_IDENTITY = Object.freeze({
        id: PLUGIN_ID,
        version: VERSION,
        title: TITLE
    });

    function showLoadConfirmation() {
        const message = `${TITLE} v${VERSION} has been loaded.`;

        if (typeof Blockbench.showMessageBox === 'function') {
            Blockbench.showMessageBox({
                title: 'SBF Loader',
                message,
                icon: 'check'
            });
            return;
        }

        if (typeof Blockbench.showQuickMessage === 'function') {
            Blockbench.showQuickMessage(message, 2500);
        } else if (typeof Blockbench.showStatusMessage === 'function') {
            Blockbench.showStatusMessage(message, 2500);
        }
    }

    function validateRuntime() {
        if (typeof Plugin === 'undefined' || typeof Plugin.register !== 'function') {
            throw new Error('SBF loader requires Blockbench Plugin.register.');
        }

        if (typeof Blockbench === 'undefined') {
            throw new Error('SBF loader requires the Blockbench API.');
        }

        if (!VERSION || !PLUGIN_ID) {
            throw new Error('SBF loader identity is incomplete.');
        }
    }

    validateRuntime();

    Plugin.register(PLUGIN_ID, {
        title: TITLE,
        author: 'yamasung7-dot',
        description: 'SBF System Forge loader foundation.',
        icon: 'build',
        version: VERSION,
        variant: 'both',

        /*
         * onload is the authoritative runtime entry point.
         * No legacy release is imported, searched for, or executed.
         */
        onload() {
            showLoadConfirmation();
        },

        /*
         * The loader currently owns no persistent UI/actions, so there is
         * nothing to remove here. Future systems must register their cleanup
         * through this lifecycle.
         */
        onunload() {
        }
    });

    /*
     * Expose only immutable diagnostic identity if a future SBF subsystem
     * needs to inspect the current release. No older implementation is kept.
     */
    Object.freeze(LOADER_IDENTITY);
})();
