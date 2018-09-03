/**
 * @license
 * ©2018-2019 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 */
import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';
import 'oe-utils/date-utils.js';
import 'oe-utils/oe-utils.js';

/**
 * This is the Mixin that takes care of default validation of oe-ui input components
 * 
 * @polymer
 * @mixinFunction
 */
const DateMixin = function (BaseClass) {

    /**
     * @polymer
     * @mixinClass
     */
    return class extends BaseClass {

        static get properties() {
            return {
                /**
                 * Property to be binded for the value
                 */
                value: {
                    type: Date,
                    notify: true,
                    observer: '_valueChanged'
                },

                /**
                 * String to specify the format in which the data needs to be displayed in the input.
                 */
                format: {
                    type: String,
                    value: 'DD MMM YYYY',
                    observer: '_formattingChanged'
                }
            };
        }

        /**
         * Observer on 'format' property to update the display based on the format.
         * @param {String} newFormat 
         * @param {String} oldFormat 
         */
        _formattingChanged(newFormat, oldFormat) { //eslint-disable-line no-unused-vars
            this.$.display.value = this._format(this.value);
        }

        /**
         * Converts the user shortHand inputs to Date values.
         * computes values for 'today' , 3y , -7M etc.
         * @param {String} input input shortHand string
         * @return {Date} parsed Date value
         */
        _parseShorthand(input) {

            if (!input || input.trim().length === 0) {
                return undefined;
            }
            var tuInput = input.trim().toUpperCase();

            var retDate;

            //reference for date calculation is today in user's timezone
            //but represented as UTC.
            //i.e. if entering '1d' at 2AM IST on 5th. It should calculate 6th as the date.
            //but 6th 00:00:00Z in UTC timezone.
            var mDate = new Date();
            mDate = new Date(Date.UTC(mDate.getFullYear(), mDate.getMonth(), mDate.getDate()));

            if (tuInput === 'T' || tuInput === 'TOD' || tuInput === 'TODAY') {
                retDate = mDate;
            } else if (tuInput == 'TOM') {
                retDate = mDate.setUTCDate(mDate.getUTCDate() + 1);
            } else if (tuInput[tuInput.length - 1] === 'D') {
                retDate = this._calcDate(mDate, tuInput, 'days');
            } else if (tuInput[tuInput.length - 1] === 'W') {
                retDate = this._calcDate(mDate, tuInput, 'weeks');
            } else if (tuInput[tuInput.length - 1] === 'M') {
                retDate = this._calcDate(mDate, tuInput, 'months');
            } else if (tuInput[tuInput.length - 1] === 'Q') {
                retDate = this._calcDate(mDate, tuInput, 'quarters');
            } else if (tuInput[tuInput.length - 1] === 'Y') {
                retDate = this._calcDate(mDate, tuInput, 'years');
            } else {
                retDate = OEUtils.DateUtils.parse(tuInput, this.format);
            }

            return retDate;
        }


        /**
         * Parses the input string into a float after validation
         * @param {String} input 
         * @return {Float|undefined} parsed float value or undefined if the input cannot be parsed. 
         */
        _parseDecimal(input) {
            if (!input || input.length === 0) {
                return undefined;
            }
            var tmp = input;
            var isInvalid = tmp.split('.').length > 2 || tmp.lastIndexOf('+') > 0 || tmp.lastIndexOf('-') > 0 || tmp.replace(
                /[\+\-0-9\.]/g, '').length > 0;
            if (isInvalid) {
                return undefined;
            }
            return parseFloat(tmp);
        }

        /**
         * Computes a date based on given parameters.
         * converts a date , 1 ,'year' to return a new Date which is date+1year.
         * @param {Date} mDate input Date
         * @param {String} tuInput variation value
         * @param {String} type variation type
         * @return {Date} computed date
         */
        _calcDate(mDate, tuInput, type) {
            var retDate;
            var topup = tuInput.length === 1 ? 1 : this._parseDecimal(tuInput.slice(0, tuInput.length - 1));
            if (!isNaN(topup)) {
                retDate = new Date(mDate.getTime());
                switch (type) {
                    case 'days':
                        var newDay = retDate.getUTCDate() + topup;
                        retDate.setUTCDate(newDay);
                        break;

                    case 'weeks':
                        var newDay = retDate.getUTCDate() + 7 * topup; //eslint-disable-line no-redeclare
                        retDate.setUTCDate(newDay);
                        break;

                    case 'months':
                        var newMonth = retDate.getUTCMonth() + topup;
                        retDate.setUTCMonth(newMonth);
                        break;

                    case 'quarters':
                        var newMonth = retDate.getUTCMonth() + 3 * topup; //eslint-disable-line no-redeclare
                        retDate.setUTCMonth(newMonth);
                        break;

                    case 'years':
                        var newyear = retDate.getUTCFullYear() + topup;
                        retDate.setUTCFullYear(newyear);
                        break;

                    default:
                        break;
                }
            }
            return retDate;
        }

        /**
         * Formats the input Date and returns a formatted string
         * @param {Date} dateVal Date to format.
         * @return {String} formatted date string
         */
        _format(dateVal) {
            var retVal = '';
            if (dateVal) {
                retVal = OEUtils.DateUtils.format(dateVal, this.format);
            }
            return retVal;
        }

        /**
         * Observer on value property.
         * @param {Date} newValue 
         * @param {Date} oldValue 
         */
        _valueChanged(newValue, oldValue) { //eslint-disable-line no-unused-vars
            if (newValue && !(newValue instanceof Date)) {
                var v = new Date(newValue);
                this.value = v;
                newValue = v;
            }

            if ((newValue instanceof Date) && !isNaN(newValue.getTime())) {
                this.$.display.value = this._format(newValue);
                this.validate();
            }

            if (newValue === undefined || newValue === null) {
                this.$.display.value = '';
                this.validate();
            }
        }

        /**
         * Event listener for changes to input
         * @param {Event} evt 
         */
        _displayChanged(evt) { //eslint-disable-line no-unused-vars
            var newstr = this.$.display.value;
            var newDate;

            newstr = newstr.trim();
            if (newstr !== '') {
                newDate = this._parseShorthand(newstr);
                if (!newDate) {
                    this.value = undefined;
                    this.setValidity(false, 'dateFormat');
                    return;
                }
                this.set('value', newDate);
                this.$.display.value = this._format(newDate);
            } else {
                this.value = undefined;
                this.$.display.value = '';
                /*Retain the original entered text*/
                this.$.display.value = newstr;
            }
            this.validate();
        }

        /**
         * Check for min/max validity
         * @param {Date} value 
         */
        _checkMinMaxValidity(value) {
            if (this.max && value > this.max) {
                this.setValidity(false, 'rangeOverflow');
            }
            if (this.min && value < this.min) {
                this.setValidity(false, 'rangeUnderflow');
            }
        }

    }
}

export default dedupingMixin(FieldMixin);