/**
 * @license
 * ©2018-2019 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 */
import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';
import { Debouncer } from '@polymer/polymer/lib/utils/debounce.js';
import { timeOut, microTask } from '@polymer/polymer/lib/utils/async.js';

/**
 * `OECommonMixin`
 * This is the Mixin that contains functions commonly used among elements,
 * They contain Polymer legacy functions and oecloud specific functions
 * 
 * @polymer
 * @mixinFunction
 */
const CommonMixin = function (BaseClass) {

    /**
     * @polymer
     * @mixinClass
     */
    return class extends BaseClass {

        /**
         * Get the value from the 'obj' based on the 'path'.
         * @param {Object} obj object to navigate
         * @param {string} path path for navigation
         * @return {Any} value present in the given path of the obj.
         */
        _deepValue(obj, path) {
            path = path.split('.');
            for (var i = 0, len = path.length; obj && i < len; i++) {
                obj = obj[path[i]];
            }
            return obj;
        }

        /**
         * Call `debounce` to collapse multiple requests for a named task into
         * one invocation which is made after the wait time has elapsed with
         * no new request.  If no wait time is given, the callback will be called
         * at microtask timing (guaranteed before paint).
         *
         *     debouncedClickAction(e) {
         *       // will not call `processClick` more than once per 100ms
         *       this.debounce('click', function() {
         *        this.processClick();
         *       } 100);
         *     }
         *
         * @param {string} jobName String to identify the debounce job.
         * @param {function():void} callback Function that is called (with `this`
         *   context) when the wait time elapses.
         * @param {number} wait Optional wait time in milliseconds (ms) after the
         *   last signal that must elapse before invoking `callback`
         * @return {!Object} Returns a debouncer object on which exists the
         * following methods: `isActive()` returns true if the debouncer is
         * active; `cancel()` cancels the debouncer if it is active;
         * `flush()` immediately invokes the debounced callback if the debouncer
         * is active.
         */
        debounce(jobName, callback, wait) {
            this._debouncers = this._debouncers || {};
            return this._debouncers[jobName] = Debouncer.debounce(
                this._debouncers[jobName]
                , wait > 0 ? timeOut.after(wait) : microTask
                , callback.bind(this));
        }

        /**
         * Runs a callback function asynchronously.
         *
         * By default (if no waitTime is specified), async callbacks are run at
         * microtask timing, which will occur before paint.
         *
         * @param {!Function} callback The callback function to run, bound to `this`.
         * @param {number=} waitTime Time to wait before calling the
         *   `callback`.  If unspecified or 0, the callback will be run at microtask
         *   timing (before paint).
         * @return {number} Handle that may be used to cancel the async job.
         */
        async(callback, waitTime) {
            return waitTime > 0 ? timeOut.run(callback.bind(this), waitTime) :
                ~microTask.run(callback.bind(this));
        }


        /**
         * Cancels an async operation started with `async`.
         *
         * @param {number} handle Handle returned from original `async` call to
         *   cancel.
         * @return {void}
         */

        cancelAsync(handle) {
            handle < 0 ? microTask.cancel(~handle) : timeOut.cancel(handle);
        }

        /**
         * Polymer fire function used to dispatch custom events
         * @param {string} type event name
         * @param {Object} detail data to be sent in the event
         * @param {Object} options optionals options for the event {bubbles:Boolean,cancelable:Boolean,composed:Boolean,node:HTML Element}
         * @return {Event} Custom event created based on the parameters
         */
        fire(type, detail, options) {
            options = options || {};
            detail = (detail === null || detail === undefined) ? {} : detail;
            let event = new Event(type, {
                bubbles: options.bubbles === undefined ? true : options.bubbles,
                cancelable: Boolean(options.cancelable),
                composed: options.composed === undefined ? true : options.composed
            });
            event.detail = detail;
            let node = options.node || this;
            node.dispatchEvent(event);
            return event;
        }
    };
};

export const OECommonMixin = dedupingMixin(CommonMixin);
