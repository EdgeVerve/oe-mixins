/**
 * @license
 * ©2018-2019 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 */
import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';
import { setPassiveTouchGestures } from '@polymer/polymer/lib/utils/settings';
// Resolve warning about scroll performance 
// See https://developers.google.com/web/updates/2016/06/passive-event-listeners
setPassiveTouchGestures(true);

/**
 * This is the Mixin that takes care of default validation of oe-ui input components
 * 
 * @polymer
 * @mixinFunction
 */
const FieldMixin = function (BaseClass) {

    /**
     * @polymer
     * @mixinClass
     */
    return class extends BaseClass {

        static get properties() {
            return {
                /**
                 * i18n placeholders for the error
                 */
                errorPlaceholders: {
                    type: Array
                },

                /** 
                 * User specified Custom error message 
                 * If userErrorMessage is defined, show appropriate user-error-message
                 * which is either an object
                 *    ```{ 
                 *       rangeOverflow:'Date should be prior', 
                 *       default: 'Invalid Value in field'
                 *    }```
                 * or a string, 'Invalid value'
                 * So check if specific error-coode is defined in user-error-message object
                 * If not, see if 'default' error-code is defined 
                 * otherwise if user-error-message is string, show that error-message,
                 * if not, then resort to incoming-error-message.
                 */
                userErrorMessage: {
                    type: Object
                },

                /** Error message displayed */
                errorMessage: {
                    type: String,
                    notify: true
                },

                /** Flag for Custom error message/code*/
                _hasCustomMessage: {
                    type: Boolean,
                    value: false
                },

                hidden: {
                    type: Boolean,
                    reflectToAttribute: true,
                    value: false
                },

                /** Custom validation function */
                validationFunction: {
                    type: String
                },

                validateOnInput: {
                    type: Boolean
                },

                /** binding to property */
                fieldId: String

                /**
                 * Fired when the field is valid
                 *  
                 * @event oe-field-ok
                 * @param {Object} detail contains the fieldId of the element
                 */

                /**
                 * Fired when the field is invalid
                 * 
                 * @event oe-field-error
                 * @param {Object} detail contains the fieldId of the element and the errorMessage
                 */

                /**
                 * Fired when the element is attached to DOM to register the element
                 * 
                 * @event register-field
                 * @param {Object} detail contains the fieldId of the element
                 */
            }
        }

        /**
         * Sets the vality and errorMessage based on the input parameters and 
         * the `userErrorMessage`
         * @param {Boolean} isValid boolean flag for validation
         * @param {String} errorMessage error message from the input element
         * @param {Array} errorPlaceholders placeholders for errors
         */
        setValidity(isValid, errorMessage, errorPlaceholders) {

            if (!isValid && this.userErrorMessage) {
                //If field is invalid and userErrorMessage is defined show appropriate user-error-message
                //which is either an object 
                //    { 'rangeOverflow':'Date should be prior', 
                //       default: 'Invalid Value in field'
                //    }
                //or a string, 'Invalid value'
                // So we check if specific error-coode is defined in user-error-message object
                // If not, see if 'default' error-code is defined 
                // otherwise if user-error-message is string, show that error-message,
                // if not, then resort to incoming-error-message.
                errorMessage = this.userErrorMessage[errorMessage]
                    || this.userErrorMessage.default
                    || ((typeof this.userErrorMessage === 'string') ? this.userErrorMessage : errorMessage);
            }
            this._setValidity(isValid, errorMessage, errorPlaceholders);

            if (this.fieldId) {
                if (isValid) {
                    this.fire('oe-field-ok', {
                        fieldId: this.fieldId
                    });
                } else {
                    this.fire('oe-field-error', {
                        fieldId: this.fieldId,
                        errorMessage: errorMessage
                    });
                }
            }
        }

        /**
         * Sets the 'invalid' flag and 'errorMessage'
         * @param {Boolean} isValid boolean flag for validation
         * @param {String} errorMessage error message from the input element
         * @param {Array} errorPlaceholders placeholders for errors
         */
        _setValidity(isValid, errorMessage, errorPlaceholders) {
            this.set('invalid', !isValid);
            this.set('errorMessage', errorMessage);
            if (!isValid) {
                errorPlaceholders = errorPlaceholders || this;
                this.set('errorPlaceholders', errorPlaceholders);
            }
        }

        /** 
         * Override in individual elements to return element specific validity.
         * @returns {!Boolean} validity of specific element
         */
        _validate() {
            if (typeof super._validate === "function") {
                return super._validate();
            }
            return true;
        }

        /**
         * Get the value from the 'obj' based on the 'path'.
         * @param {Object} obj object to navigate
         * @param {String} path path for navigation
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
         * Validate, overrides Paper-Input-Behavior's validate method
         * Used to set the validity based on core input element's validity 
         * @return {Boolean} validity of core input element.
         */
        validate() {

            var key;
            var coreElem = this.inputElement.validity ? this.inputElement : this.inputElement.inputElement;
            var isValid = this._validate();
            if (isValid && this.validationFunction) {
                isValid = this.validationFunction(this.value);
            }
            if (isValid && coreElem && coreElem.validity) {
                if (coreElem.validity.valid === false) {
                    if (coreElem.validity.valueMissing) {
                        key = 'valueMissing';
                    } else if (coreElem.validity.patternMismatch) {
                        key = 'patternMismatch';
                    } else if (coreElem.validity.rangeOverflow) {
                        key = 'rangeOverflow';
                    } else if (coreElem.validity.rangeUnderflow) {
                        key = 'rangeUnderflow';
                    } else if (coreElem.validity.tooLong) {
                        key = 'tooLong';
                    } else if (coreElem.validity.tooShort) {
                        key = 'tooShort';
                    } else if (coreElem.validity.typeMismatch) {
                        key = 'typeMismatch';
                    } else if (coreElem.validity.stepMismatch) {
                        key = 'stepMismatch';
                    } else if (coreElem.validity.customError) {
                        key = coreElem.validationMessage;
                    } else if (coreElem.validity.badInput) {
                        key = 'badInput';
                    }
                }

                isValid = coreElem.validity.valid;
                if (this.max && this.value > this.max) {
                    this.setValidity(false, 'rangeOverflow');
                    isValid = false;
                } else if (this.min && this.value < this.min) {
                    this.setValidity(false, 'rangeUnderflow');
                    isValid = false;
                } else {
                    this.setValidity(isValid, key);
                }
            }
            return isValid;
        }

        /**
         * Registers the field through event , so the parent form can save it.
         * Binds the 'validationFunction' property based on its type
         * Adds eventListener to input based on 'validateOnInput'
         */
        connectedCallback() {
            super.connectedCallback();
            if (this.fieldId) {
                this.fire('register-field', {
                    fieldId: this.fieldId
                });
            }

            if (typeof this.validationFunction === 'string') {
                var validationFunction = this._deepValue(window, this.validationFunction);
                if (validationFunction && typeof validationFunction === 'function') {
                    this.validationFunction = validationFunction;
                } else {
                    console.warn('Invalid or undefined validationFunction [' + this.validationFunction + ']');
                    this.validationFunction = undefined;
                }
            }

            if (this.validateOnInput) {
                this.listen(this, 'input', 'validate');
            }
        }

        /**
         * Generates a Hash for the given string.
         * @param {String} str String for which Hash needs to be computed
         * @return {Number} hash number for the given string
         */
        hashFunc(str) {
            var hash = 5381;
            for (var i = 0; i < str.length; i++) {
                var char = str.charCodeAt(i);
                hash = ((hash << 5) + hash) + char; /* hash * 33 + c */
            }
            return hash;
        }

        /**
         * Polymer fire function used to dispatch custom events
         * @param {String} type event name
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
    }
}

export default dedupingMixin(FieldMixin);
