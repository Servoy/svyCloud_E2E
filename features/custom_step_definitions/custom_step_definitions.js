'use strict';
var proc = require('process');
var { defineSupportCode } = require('../../lib/cucumberLoader').load();
var EC = protractor.ExpectedConditions;
var element = browser.element;
var startDate = new Date();
var tempDate;

defineSupportCode(({ Given, Then, When, Before, After }) => {
    
});


function clickElement(elem) {
	return browser.wait(EC.presenceOf(elem).call(), 30000, 'Element not visible').then(function () {
		return browser.wait(EC.elementToBeClickable(elem), 30000, 'Element not clickable').then(function () {
			return elem.click();
		});
	});
}

function wrapUp(callback, performanceEvent) {
	var duration = calcStepDuration(new Date());
	console.log('Step took ' + duration + ' miliseconds');
	callback();
}

function calcStepDuration(timeStepCompleted) {
	if (!!tempDate) {
		var stepduration = timeStepCompleted - tempDate;
		tempDate = timeStepCompleted;
		return stepduration;
	} else {
		var stepduration = timeStepCompleted - startDate;
		tempDate = timeStepCompleted;
		return stepduration;
	}
}