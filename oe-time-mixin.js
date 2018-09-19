/**
 * @license
 * ©2018-2019 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 */
import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';

/**
 * This is the Mixin that takes care of default validation of oe-ui input components
 * 
 * @polymer
 * @mixinFunction
 */
const TimeMixin = function (BaseClass) {

    /**
     * @polymer
     * @mixinClass
     */
    return class extends BaseClass {


        connectedCallback(){
            super.connectedCallback();
            this.$.hour.addEventListener('change', e => this._onHourChange(e));
            this.$.hour.addEventListener('keyup', e => this._onKeyup(e));
            this.$.minute.addEventListener('change', e => this._onMinuteChange(e));
            this.$.minute.addEventListener('keyup', e => this._onKeyup(e));
        }

        
        /**
         * Adds padding to given number
         * @param {Number} num number to pad
         * @param {Number} size expected size of padded number
         * @return {String} padded number string
         */
        _pad(num, size) {
            if(num === undefined || num === null || isNaN(num)){
                return '';
            }
            var s = num + '';
            while (s.length < size) {
                s = '0' + s;
            }
            return s;
        }

        /**
         * Parses the input enetered does 24hr -> 12hr conversion
         * @param {Event} e change event on hour input
         */
        _onHourChange(e) {
            var el = e.currentTarget.inputElement ? e.currentTarget.inputElement :  e.currentTarget;
            var tHour = el.value;
            if (!tHour || tHour === '') {
                this.hour = 0;
                el.value = '12';
                this.txtAMPM = 'AM';
            } else {
                var newHour = parseInt(tHour);
                if (newHour === 0 || newHour > 23) {
                    this.hour = 0;
                    el.value = '12';
                    this.txtAMPM = 'AM';
                } else if (newHour > 12) {
                    this.hour = newHour;
                    this.txtAMPM = 'PM';
                    el.value = this._pad(newHour - 12, 2);
                } else if (newHour === 12) {
                    this.hour = (this.txtAMPM === 'AM' ? 0 : 12);
                    el.value = this._pad(newHour, 2);
                } else {
                    this.hour = (this.txtAMPM === 'AM' ? newHour : newHour + 12);
                    //don't change AM/PM
                    el.value = this._pad(newHour, 2);
                }
            }
        }

        /**
         * Parses the input entered and pads additonal zeroes.
         * @param {Event} e change event on minute input
         */
        _onMinuteChange(e) {
            var el = e.currentTarget.inputElement ? e.currentTarget.inputElement :  e.currentTarget;
            var tMinute = el.value;
            if (!tMinute || tMinute === '') {
                this.minute = 0;
                el.value = '00';
            } else {
                var newMinute = parseInt(tMinute);
                if (newMinute === 0 || newMinute > 59) {
                    this.minute = 0;
                    el.value = '00';
                } else {
                    this.minute = newMinute;
                    el.value = this._pad(newMinute, 2);
                }
            }
        }

        /**
         * Handles up/down arrow keys on inputs
         * @param {Event} e 
         */
        _onKeyup(e) {
            if (e.keyCode === 38 || e.keyCode === 40) {
                var currentTarget = e.currentTarget;
                var currentValue = currentTarget.inputElement?currentTarget.inputElement.value: currentTarget.value;
                currentValue = currentValue ? parseInt(currentValue) : 0;
                if (e.keyCode === 38) {
                    currentValue++;
                    if (currentValue > currentTarget.dataMax) {
                        currentValue = currentTarget.dataMin;
                    }
                } else if (e.keyCode === 40) {
                    currentValue--;
                    if (currentValue < currentTarget.dataMin) {
                        currentValue = currentTarget.dataMax;
                    }
                }
                currentTarget.value = this._pad(currentValue, 2);

                if (currentTarget === this.$.hour) {
                    this.hour = currentValue % 12;
                    if (this.txtAMPM === 'PM') {
                        this.hour += 12;
                    }
                } else if (currentTarget === this.$.minute) {
                    this.minute = currentValue;
                }

                e.preventDefault();
            }
        }

        /**
         * Toggles AM/PM display
         */
        _toggleAMPM() {
            if (this.txtAMPM === 'AM') {
                this.txtAMPM = 'PM';
                if (this.hour != undefined) this.hour += 12;
            } else if (this.txtAMPM === 'PM') {
                this.txtAMPM = 'AM';
                if (this.hour != undefined) this.hour -= 12;
            }
        }

        /**
         * Returns hour string after converting 24hr -> 12hr conversion
         * 
         * @param {Number} h 
         * @return {String} padded hour value string
         */
        _hoursDisplay(h) {
            if(isNaN(h) || h === null || h === undefined){
                return '';
            }else if (h === 0 || h > 23) {
                this.txtAMPM = 'AM';
                return '12';
            } else if (h > 12) {
                this.txtAMPM = 'PM';
                return this._pad(h - 12, 2);
            } else if (h === 12) {
                return '12';
            } else {
                //less than 12
                return this._pad(h, 2);
            }
        }

        /**
         * Returns minute string padded with necessary zeroes
         * @param {Number} m 
         * @return {String} padded minute string
         */
        _minutesDisplay(m) {
            if(isNaN(m) || m === null || m === undefined){
                return '';
            }else if (m <= 0 || m > 59) {
                return '00';
            } else {
                return this._pad(m, 2);
            }
        }
    }
}

export const OETimeMixin = dedupingMixin(TimeMixin);