import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';

const FieldMixin = function (BaseClass) {
    return class extends BaseClass {
        static get properties() {
            return {

                /* i18n placeholders for the error */
                errorPlaceholders: {
                    type: Array
                },
                /* User specified Custom error message 
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
                errorMessage: {
                    type: String,
                    notify: true
                },
                /* Flag for Custom error message/code*/
                _hasCustomMessage: {
                    type: Boolean,
                    value: false
                },
                hidden: {
                    type: Boolean,
                    reflectToAttribute: true,
                    value: false
                },
                /* Custom validation function */
                validationFunction: {
                    type: String
                },
                validateOnInput: {
                    type: Boolean
                },
                /* binding to property */
                fieldId: String
            }
        }

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

        _setValidity(isValid, errorMessage, errorPlaceholders) {
            this.set('invalid', !isValid);
            this.set('errorMessage', errorMessage);
            if (!isValid) {
                errorPlaceholders = errorPlaceholders || this;
                this.set('errorPlaceholders', errorPlaceholders);
            }
        }

        /*
        override in individual elements to return element specific validity.
        */
        _validate() {
            return true;
        }

        _deepValue(obj, path) {
            path = path.split('.');
            for (var i = 0, len = path.length; obj && i < len; i++) {
                obj = obj[path[i]];
            }
            return obj;
        }

        /* validate, overrides Paper-Input-Behavior's validate method
           since, we also need to set errorMessage which is not supported in PaperInputBehavior
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

        hashFunc(str) {
            var hash = 5381;
            for (i = 0; i < str.length; i++) {
                char = str.charCodeAt(i);
                hash = ((hash << 5) + hash) + char; /* hash * 33 + c */
            }
            return hash;
        }
    }
}

export default dedupingMixin(FieldMixin);
