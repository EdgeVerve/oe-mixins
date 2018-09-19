/**
 * @license
 * ©2018-2019 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 */
import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';
import { OECommonMixin } from "../oe-common-mixin";
import 'oe-ajax/oe-ajax.js';

/**
 *`FormValidation` mixin is used to handle validation of oe field components in the form.
 * It includes single field validation and multi field validations via oe-validators
 *  
 * @polymer
 * @mixinFunction
 */
const FormValidation = function (BaseClass) {

    /**
     * @polymer
     * @mixinClass
     */
    return class extends BaseClass {

        static get properties() {
            return {

                /**
                 * Maintains the  list of controls for a given model property
                 * e.g.
                 * {
                 *     prop1 : [ctrl1, ctrl2],
                 *     prop3 : [ctrl3]
                 * }
                 * 
                 */
                fieldControls: {
                    type: Object,
                    value: function () {
                        return {};
                    }
                },

                /**
                 * Array of cross-field validators 
                 */
                _validators: {
                    type: Array
                },

                /**
                 * Object hash of cross-field validators 
                 * e.g.
                 *  {
                 *    "fieldId" : [validators-voting-for-this-field]
                 *  } 
                 */
                validators: {
                    type: Object,
                    value: function () {
                        return {};
                    }
                },

                errors: {
                    type: Array,
                    value: function () {
                        return [];
                    }
                }
            }
        }

        static get observers() {
            return ['_clearAllErrors(vm)'];
        }

        /**
         * Attaches the necessary event listeners for the form
         */
        connectedCallback() {
            super.connectedCallback();
            this.addEventListener('register-field', this._onRegisterField.bind(this));
            this.addEventListener('register-validator', this._onRegisterValidator.bind(this));
            this.addEventListener('oe-field-error', this._onFieldError.bind(this));
            this.addEventListener('oe-field-ok', this._onFieldOk.bind(this));
            this.addEventListener('oe-validator-error', this._onValidatorError.bind(this));
            this.addEventListener('oe-validator-ok', this._onValidatorOk.bind(this));
            this.addEventListener('oe-validate', this._onOEValidate.bind(this));
            this.addEventListener('oe-reset-errors', this._clearAllErrors.bind(this));
        }

        /**
         * Validates each of the registered oe field components and returns a Promise
         * @return {Promise} Promise that resolves to give {valid:Boolean,message:String,control:HTMLElement}
         */
        validateForm() {
            var state = {
                valid: true
            };
            if (!this.errors || this.errors.length === 0) {
                var self = this;
                this.fieldControls && Object.keys(this.fieldControls).forEach(function (fieldId) {
                    self.fieldControls[fieldId].forEach(function (control) {
                        control.validate && control.validate();
                    });
                });

                //Ideally, oe-field-ok raised by control.validate() will
                //trigger cross-field-validations. So we don't need below.
                if (!this.errors || this.errors.length === 0) {
                    //No infield errors, perform any pending cross-field validations
                    //'every' ensures we stop on first error.
                    if (this._validators) {
                        var validationPromises = this._validators.map(function (v) {
                            //return the promise object
                            return v.validate();
                        });
                        return Promise.all(validationPromises).then(function (states) {
                            states.every(function (s) {
                                state = s;
                                return state.valid;
                            });
                            return state;
                        });
                    } else {
                        return Promise.resolve(state);
                    }
                } else {
                    state.valid = false;
                    state.message = state.message || this.errors[0].message;
                    state.control = state.control || this.errors[0].controls[0] || this;
                    return Promise.resolve(state);
                }
            } else {
                state.valid = false;
                state.message = state.message || this.errors[0].message;
                state.control = state.control || this.errors[0].controls[0] || this;
                return Promise.resolve(state);
            }
        }

        /**
         * Calls custom validators attached to the form component
         * @param {Event} event 
         */
        _onOEValidate(event) {
            //Case-1 If details.id IS NOT present, call 'validateForm' on ourself.
            //Case-2 If details.id IS present, look for our child _validators with given id
            //     2a    If a validator is found, and call validate on them and stop propagation
            //     2b    otherwise, simply ignore and let it propagate to our parent to validate
            //Except for (2b) if details.callback is available, call this function post validation.

            var self = this;
            var detail = event.detail || {};
            var state = {
                valid: true
            };
            if (detail.id) {
                var targetValidator = (this._validators || []).find(function (v) {
                    return v.id === detail.id;
                });

                /**
                 * if we identify this validator-id then we validate on it and stop event from bubbling up
                 * else -> do nothing and let the event bubble up (hoping that somebody up will handle it
                 */
                if (targetValidator) {
                    targetValidator.validate().then(function (s) {
                        state = s;
                        if (detail.callback) {
                            detail.callback(state);
                        }
                        self.fire('oe-validation-result', state);
                    });
                    event.stopPropagation();
                }
            } else {
                self.validateForm().then(function (s) {
                    state = s;
                    if (detail.callback) {
                        detail.callback(state);
                    }
                    self.fire('oe-validation-result', state);
                });
                event.stopPropagation();
            }
        }

        /**
         * Registers a oe-ui component as a field in form
         * @param {Event} event 
         */
        _onRegisterField(event) {
            var fieldId = event.detail.fieldId;
            if (fieldId) {
                var el = event.target;

                this.fieldControls = this.fieldControls || {};
                this.fieldControls[fieldId] = this.fieldControls[fieldId] || [];
                if (this.fieldControls[fieldId].indexOf(el) < 0) {
                    this.fieldControls[fieldId].push(el);
                    el.set('_parent', this);
                }
            }
            event.stopPropagation();
        }

        /**
         * Clears the error of the components related to a fieldId
         * @param {String} fieldId 
         * @param {String} errType 
         */
        clearFieldErrors(fieldId, errType) {
            var self = this;
            if (self.fieldControls && self.fieldControls[fieldId]) {
                self.fieldControls[fieldId].forEach(function (ctrl) {
                    if (ctrl.set && (!errType || ctrl.errorMessage === errType)) {
                        ctrl.set('invalid', false);
                        ctrl.set('errorMessage', undefined);
                    }
                    if (self.errors) {
                        var errRecord = self.errors.find(function (err) {
                            return err.controls && err.controls.indexOf(ctrl) >= 0 && (!errType || err.message === errType);
                        });
                        if (errRecord) {
                            var errIndex = self.errors.indexOf(errRecord);
                            if (errIndex >= 0) {
                                self.errors.splice(errIndex, 1);
                            }
                        }
                    }
                });
            }
            self._validators && self._validators.forEach(function (validator) {
                validator.clearFieldErrors && validator.clearFieldErrors(fieldId);
            });
        }

        /**
         * Registers a oe validator to the form
         * @param {Event} event 
         */
        _onRegisterValidator(event) {
            var validator = event.target;

            if (validator !== this) {

                /*Process only if event was raised by child not by self */
                /*If 'this' has raised event, then do nothing. Also don't stopPropagation. Let parent register 'this'*/
                validator._parent = this;
                var crossFields = validator.fields;
                this.validators = this.validators || {};
                this._validators = this._validators || [];
                this._validators.push(validator);

                for (var i = 0; i < crossFields.length; i++) {
                    var field = crossFields[i];
                    if (!this.validators[field]) {
                        this.validators[field] = [];
                    }
                    this.validators[field].push(validator);
                }
                event.stopPropagation();
            }
        }

        /**
         * Registers a field error inside the form
         * @param {Event} event 
         */
        _onFieldError(event) {
            //console.log(event);
            var control = event.target;
            var error;
            // hide as well remove all error where this field is part of
            for (var i = 0; i < this.errors.length; i++) {
                error = this.errors[i];
                if (error.controls.indexOf(control) >= 0) {
                    //console.log('this field is part of some other error' + error.controls.indexOf(control));
                    this._clearError(error);
                    this.errors.splice(i, 1);
                    i--;
                }
            }

            // add error
            error = {};
            error.validator = control;
            error.message = event.detail.errorMessage;
            error.controls = [];
            var ctrls = this.fieldControls[control.fieldId];
            for (var j = 0; j < ctrls.length; j++) {
                error.controls.push(ctrls[j]);
                ctrls[j].set('invalid', true);
                ctrls[j].set('errorMessage', event.detail.errorMessage);
            }
            this.errors.push(error);
            event.stopPropagation();
        }

        /**
         * Registers a field validation to be success to clear the related errors
         * @param {Event} event 
         */
        _onFieldOk(event) {

            //var control = event.target;

            for (var i = 0; this.errors && i < this.errors.length; i++) {
                var error = this.errors[i];
                if (error.controls.indexOf(event.target) >= 0) {
                    for (var j = 0; j < error.controls.length; j++) {
                        var ctrl = error.controls[j];
                        ctrl.set('invalid', false);
                        ctrl.set('errorMessage', undefined);
                    }
                    this.errors.splice(i, 1);
                    i--;
                }
            }

            //Trigger any cross-validators for this field.
            var fieldValidators = this.validators[event.detail.fieldId];
            if (fieldValidators) {
                for (j = 0; j < fieldValidators.length; j++) {
                    var validator = fieldValidators[j];
                    validator.validate();
                }
            }

            this._showAnyOtherError();
            event.stopPropagation();
        }

        /**
         * Registers a error from oe-validators
         * @param {Event} event 
         */
        _onValidatorError(event) {
            var validator = event.target;

            if (validator !== this) {

                var error;

                /*Process only if event was raised by child not by myself */
                /*If 'this' has raised event, then do nothing. Also don't stopPropagation. Let parent handle 'this'*/

                for (var i = 0; i < this.errors.length; i++) {
                    error = this.errors[i];
                    if (error.validator === validator) {
                        this._clearError(error);
                        this.errors.splice(i, 1);
                        i--;
                    }
                }

                error = {};
                error.validator = validator;
                error.controls = [];
                error.message = event.detail;
                for (var i = 0; i < validator.fields.length; i++) { // eslint-disable-line no-redeclare
                    var controls = this.fieldControls[validator.fields[i]];
                    for (var j = 0; controls && j < controls.length; j++) { // eslint-disable-line no-unmodified-loop-condition
                        if (controls[j].invalid === false) {
                            controls[j].set('invalid', true);
                            controls[j].set('errorMessage', error.message);
                        }
                        error.controls.push(controls[j]);
                    }
                }
                this.errors.push(error);
                event.stopPropagation();
            }
        }

        /**
         * Registers a validators validation to be success to clear related errors
         * @param {Event} event 
         */
        _onValidatorOk(event) {
            var validator = event.target;

            if (validator !== this) {

                /*Process only if event was raised by child not by myself */
                /*If 'this' has raised event, then do nothing. Also don't stopPropagation. Let parent handle 'this'*/
                validator = event.target;
                for (var i = 0; i < this.errors.length; i++) {
                    var error = this.errors[i];
                    if (error.validator === validator) {
                        this._clearError(error);
                        this.errors.splice(i, 1);
                        i--;
                    }
                }
                this._showAnyOtherError();
                event.stopPropagation();
            }
        }

        /**
         * Clear the error in related controls
         * @param {Object} error 
         */
        _clearError(error) {
            for (var j = 0; j < error.controls.length; j++) {
                var ctrl = error.controls[j];
                ctrl.set('invalid', false);
                ctrl.set('errorMessage', undefined);
            }
        }

        /**
         * Displays all errors in controls
         */
        _showAnyOtherError() {
            for (var i = 0; i < this.errors.length; i++) {
                var error = this.errors[i];
                for (var j = 0; j < error.controls.length; j++) {
                    var field = error.controls[j];
                    if (field.invalid === false) {
                        field.set('invalid', true);
                        field.set('errorMessage', error.message);
                    }
                }
            }
        }

        /**
         * Clears all errors in the form
         * @param {Event} evt 
         */
        _clearAllErrors(evt) {
            for (var i = 0; this.errors && i < this.errors.length; i++) {
                var error = this.errors[i];
                for (var j = 0; j < error.controls.length; j++) {
                    var field = error.controls[j];
                    field.set('invalid', false);
                    field.set('errorMessage', undefined);
                }
                if (error.validator._clearAllErrors) {
                    //if validator has this behavior, call _clearAllErrors on it.
                    error.validator._clearAllErrors(evt);
                }
            }
            this.errors = [];
        }
    }
}

export const OEFormValidationMixin = dedupingMixin(OECommonMixin(FormValidation));
