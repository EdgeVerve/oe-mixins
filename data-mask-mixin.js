/**
 * @license
 * ©2018-2019 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 */
import {
  dedupingMixin
} from "@polymer/polymer/lib/utils/mixin.js";

/**
 * `OEDataMaskMixin` is used to mask parts of data in the display of oe-ui components
 * 
 * @polymer
 * @mixinFunction
 */
export const OEDataMaskMixin = dedupingMixin(function (BaseClass) {

  /**
   * @polymer
   * @mixinClass
   */
  return class extends BaseClass {
    static get properties() {
      return {
        /**
         * RegExp to choose the substring(s) to be masked
         */
        maskPattern: {
          type: String
        },

        /**
         * RegExp  flag to be used with the `maskPattern`
         */
        maskPatternFlag: {
          type: String
        },

        /**
         * Character that is used to mask the characters present in the substring(s) matching the `maskPattern`
         * If `maskString` property overrides this value.
         */
        maskChar: {
          type: String,
          value: 'X'
        },

        /**
         * String that is used to mask the substring(s) matching the `maskPattern`.
         */
        maskString: {
          type: String
        },

        /**
         * Appends specified number of `maskChar` to the input when it is blured.
         */
        appendCharLength: {
          type: Number,
          value: 0
        }
      };
    }

    static get observers() {
      return ['_maskDisplay(formattedDisplay)'];
    }

    /**
     * Return a replaced masked string based on the match.
     * 
     * @param {Object} match 
     * @return {string} replaced string with maskChar
     */
    _replacer(match) {
      return new Array(match.length + 1).join(this.maskChar);
    }

    /**
     * Sets the 'display' after masking the formatted string with the 'maskChar'.
     * 
     * @param {string} formattedDisplay formatted string to be masked
     */
    _maskDisplay(formattedDisplay) {
      var valueToShow;
      if (formattedDisplay && this.maskPattern) {
        if (this.maskString) {
          var pattern = new RegExp(this.maskPattern, this.maskPatternFlag);
          valueToShow = formattedDisplay.replace(pattern, this.maskString);
        } else {
          var pattern = new RegExp(this.maskPattern, this.maskPatternFlag); // eslint-disable-line no-redeclare
          valueToShow = formattedDisplay.length ? formattedDisplay.replace(pattern, this._replacer.bind(this)) : '';
        }
      } else {
        valueToShow = formattedDisplay;
      }
      this.set('display', valueToShow);
    }
  };
});