import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';

const DataMaskMixin = function (BaseClass) {
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

      }
    }

    static get observers() {
      return ['_maskDisplay(formattedDisplay)'];
    }

    _replacer(match) {
      return new Array(match.length + 1).join(this.maskChar);
    }

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

  }
}

export default dedupingMixin(DataMaskMixin);