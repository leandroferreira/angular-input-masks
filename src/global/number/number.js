'use strict';

angular.module('ui.utils.masks.global.number', [
	'ui.utils.masks.helpers'
])
.directive('uiNumberMask',
	['$locale', '$parse', 'PreFormatters', 'NumberMasks', 'NumberValidators',
	function ($locale, $parse, PreFormatters, NumberMasks, NumberValidators) {
		return {
			restrict: 'A',
			require: 'ngModel',
			link: function (scope, element, attrs, ctrl) {
				var decimalDelimiter = $locale.NUMBER_FORMATS.DECIMAL_SEP,
					thousandsDelimiter = $locale.NUMBER_FORMATS.GROUP_SEP,
					// decimals = $parse(attrs.uiNumberMask)(scope);
					decimals = parseInt(attrs.uiNumberMask);

				if (angular.isDefined(attrs.uiHideGroupSep)){
					thousandsDelimiter = '';
				}

				if(isNaN(decimals)) {
					decimals = 2;
				}

				var viewMask = NumberMasks.viewMask(decimals, decimalDelimiter, thousandsDelimiter),
					modelMask = NumberMasks.modelMask(decimals);

				function parser(value) {
					if(ctrl.$isEmpty(value)) {
						return value;
					}

					var valueToFormat = PreFormatters.clearDelimitersAndLeadingZeros(value) || '0';
					if(angular.isDefined(attrs.uiSufix) && value.length > attrs.uiSufix.length && value.indexOf(attrs.uiSufix) === -1) {
						valueToFormat = valueToFormat.slice(0, valueToFormat.length - 1) || '0';
					}
					var formatedValue = viewMask.apply(valueToFormat);
					var actualNumber = parseFloat(modelMask.apply(valueToFormat));

					if(angular.isDefined(attrs.uiNegativeNumber)){
						var isNegative = (value[0] === '-'),
							needsToInvertSign = (value.slice(-1) === '-');

						//only apply the minus sign if it is negative or(exclusive)
						//needs to be negative and the number is different from zero
						if(needsToInvertSign ^ isNegative && !!actualNumber) {
							actualNumber *= -1;
							formatedValue = '-' + formatedValue;
						}
					}

					if(angular.isDefined(attrs.uiSufix)){
						formatedValue = formatedValue + ' ' + attrs.uiSufix;
					}

					if (ctrl.$viewValue !== formatedValue) {
						ctrl.$setViewValue(formatedValue);
						ctrl.$render();
					}

					return actualNumber;
				}

				function formatter(value) {
					if(ctrl.$isEmpty(value)) {
						return value;
					}

					var prefix = '';
					if(angular.isDefined(attrs.uiNegativeNumber) && value < 0){
						prefix = '-';
					}

					var sufix = '';
					if(angular.isDefined(attrs.uiSufix)){
						sufix = attrs.uiSufix;
					}

					var valueToFormat = PreFormatters.prepareNumberToFormatter(value, decimals);
					return prefix + viewMask.apply(valueToFormat) + ' ' + sufix;
				}

				ctrl.$formatters.push(formatter);
				ctrl.$parsers.push(parser);

				if (attrs.uiNumberMask) {
					scope.$watch(attrs.uiNumberMask, function(decimals) {
						if(isNaN(decimals)) {
							decimals = 2;
						}
						viewMask = NumberMasks.viewMask(decimals, decimalDelimiter, thousandsDelimiter);
						modelMask = NumberMasks.modelMask(decimals);

						parser(ctrl.$viewValue);
					});
				}

				if(attrs.min){
					ctrl.$parsers.push(function(value) {
						var min = $parse(attrs.min)(scope);
						return NumberValidators.minNumber(ctrl, value, min);
					});

					scope.$watch(attrs.min, function(value) {
						NumberValidators.minNumber(ctrl, ctrl.$modelValue, value);
					});
				}

				if(attrs.max) {
					ctrl.$parsers.push(function(value) {
						var max = $parse(attrs.max)(scope);
						return NumberValidators.maxNumber(ctrl, value, max);
					});

					scope.$watch(attrs.max, function(value) {
						NumberValidators.maxNumber(ctrl, ctrl.$modelValue, value);
					});
				}
			}
		};
	}
]);
