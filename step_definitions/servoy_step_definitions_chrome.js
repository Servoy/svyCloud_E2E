'use strict';
var proc = require('process');
var { defineSupportCode } = require('../lib/cucumberLoader').load();
var EC = protractor.ExpectedConditions;
var element = browser.element;
var expect = require('expect');
var startDate = new Date();
var tempDate;
var startBlockDate = new Date();
var tempBlockDate;
var hasErrorDuringSuite = false;
var userAnalytics = require('universal-analytics');
var universalAnlytics = require('../features/custom_scripts/universal analytics/universal_analytics.js');
var analytics = userAnalytics(universalAnlytics.getId());
var fs = require('fs-extra');
var timeoutAgAction = 60 * 1000;
var storedValues = [];
var dateUtils = require('../lib/dateUtils/dateUtils');

defineSupportCode(({ Given, Then, When, Before, After }) => {
	//BASIC NAGIVATION
	Given('I go to {url}', { timeout: 60 * 1000 }, function (url, callback) {
		console.log("Opening browser URL: " + url);
		browser.get(url).then(function () {
			wrapUp(callback, "navigateURLEvent");
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('I want to navigate to {url} in a new tab', {timeout: 60 * 1000}, function(url, callback){
		browser.executeScript("return window.open(arguments[0], '_blank')", url).then(function(){
			browser.getAllWindowHandles().then(function (handles) {
				console.log(handles)
				browser.switchTo().window(handles[Object.keys(handles)[Object.keys(handles).length-1]]).then(function () {
					wrapUp(callback, "navigateURLEvent");
				});				
			});
		}).catch(function (error) {
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('I want to switch to browser tab {tabNumber}', {timeout: 15 * 1000}, function(tabNumber, callback){
		browser.getAllWindowHandles().then(function(handles) {
			var newTabHandle = handles[tabNumber - 1];
			browser.switchTo().window(newTabHandle).then(function () {
				wrapUp(callback, "navigateEvent");
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	//URL VALIDATION
	Then('I expect the url to be {browserUrl}', { timeout: 30 * 1000 }, function (url, callback) {
		browser.wait(EC.urlContains(url), 15 * 1000, 'URL has not changed!').then(function () {
			wrapUp(callback, "validateEvent");
		}).catch(function (error) {
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END URL VALIDATION

	Then('I want to navigate back', {timeout: 15 * 1000}, function(callback){
		browser.navigate().back().then(function(){
			wrapUp(callback, "navigateEvent");
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	Given('I navigate to the test domain', { timeout: 60 * 1000}, function(callback) {
		console.log("Opening testdomain URL: " + browser.params.testDomainURL);
		browser.get(browser.params.testDomainURL).then(function () {
			wrapUp(callback, "navigateURLEvent")
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END BASIC NAVIGATION

	Then('I want to refresh the page', { timeout: 15 * 1000 }, function () {
		browser.sleep(1500).then(function () {
			browser.driver.navigate().refresh();
			browser.sleep(2000);
		});
	});

	//END ENVORONMENT SETUP
	//SERVOY SIDENAV COMPONENT
	When('servoy sidenav component with name {elementName} the menu is clicked', { timeout: 30 * 1000 }, function (elementName, callback) {
		browser.wait(EC.visibilityOf(element(by.xpath("//data-servoyextra-sidenav[@data-svy-name='" + elementName + "']/div/div/i")))).then(function () {
			element(by.xpath("//data-servoyextra-sidenav[@data-svy-name='" + elementName + "']/div/div/i")).click().then(function () {
				wrapUp(callback, "clickEvent");
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy sidenav component with name {elementName} tab {tabName} is clicked', { timeout: 30 * 1000 }, function (elementName, text, callback) {
		text = text.toLowerCase();
		var sideNav = element(by.css("data-servoyextra-sidenav[data-svy-name='"+elementName+"']"));
		browser.wait(EC.presenceOf(sideNav), 15 * 1000, 'Sidenavigation component not found!').then(function(isPresent){
			if(isPresent) {
				var item = sideNav.all(by.xpath("//*[text()[contains(translate(., '" + text.toUpperCase() + "', '" + text.toLowerCase() + "'), '" + text + "')] and contains(@class, 'svy-sidenav-item-text')]")).first();
				browser.wait(EC.presenceOf(item), 15 * 1000, 'Sidenavigation item not found!').then(function() {
					browser.wait(EC.elementToBeClickable(item), 30 * 1000, 'Element not clickable').then(function(){
						clickElement(item).then(function(){
							wrapUp(callback, "Click event");
						}).catch(function (error) {			
							tierdown(true);
							callback(new Error(error.message));
						});
					}).catch(function (error) {			
						tierdown(true);
						callback(new Error(error.message));
					});
				});
			}
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy sidenav component with name {elementName} I want to click tab number {tabNumber}', {timeout: 15 * 1000}, function(elementName, tabNumber, callback) {
		var sideNav = element(by.css("data-servoyextra-sidenav[data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(sideNav), 10 * 1000, 'Sidenavigation component not found!').then(function() {
			var navMenu = sideNav.all(by.className('svy-sidenav-menu')).first();
			var navMenuItem = navMenu.all(by.css("li")).get(tabNumber - 1);
			clickElement(navMenuItem).then(function() {
				wrapUp(callback, "clickEvent");
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('servoy sidenav component with name {elementName} I expect the tab {tabText} to be present', {timeout: 30 * 1000 },function(elementName, tabText, callback){
		var sideNav = element(by.xpath("//data-servoyextra-sidenav[@data-svy-name='" + elementName+"']"));
		browser.wait(EC.presenceOf(sideNav), 30 * 1000, 'Sidenav not found!').then(function(){
			var sideNavTab = sideNav.element(by.xpath("//span[text()='" + tabText + "']"));
			browser.wait(EC.presenceOf(sideNavTab), 20 * 1000, 'Tab with the given text not found!').then(function(){
				wrapUp(callback, "validateEvent");
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('data-servoyextra-sidenav component with name {elementName} the tab with the text {tabText} on level {tabLevel} is clicked', {timeout: 40 * 1000}, function(elementName, text, tabLevel, callback){
		const sideNav = element.all(by.css(`data-servoyextra-sidenav[data-svy-name='${elementName}']`));
		browser.wait(EC.presenceOf(sideNav), 15 * 1000, 'Sidenavigation component not found!').then(function(){
			sideNav.all(by.xpath(`//a[contains(@class, 'sn-level-${parseInt(tabLevel)}')]`)).each(function (menuItems) {
				var menuItem = menuItems.element(by.css('span'));
				browser.wait(EC.presenceOf(menuItem), 15 * 1000, 'menuItem not found!').then(function() {
					menuItem.getText().then(function(menuItemText) {
						if(menuItemText.toLowerCase() === text.toLowerCase()) {
							clickElement(menuItem).then(function() {
								wrapUp(callback, "clickEvent");
							});
						}
					})
				});			
			});			
			
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('data-servoyextra-sidenav component with name {elementName} the tab with the class {className} on level {tabLevel} is clicked', {timeout: 40 * 1000}, function(elementName, className, tabLevel, callback){
		const sideNav = element(by.css(`data-servoyextra-sidenav[data-svy-name='${elementName}']`));
		browser.wait(EC.presenceOf(sideNav), 15 * 1000, 'Sidenavigation component not found!').then(function(){
			sideNav.all(by.xpath(`//a[contains(@class, 'sn-level-${parseInt(tabLevel)}')]`)).each(function (menuItems) {
				var elem = menuItems.element(by.xpath(`//i[contains(@class, '${className}')]`));
				browser.wait(EC.presenceOf(elem), 15 * 1000, 'Menuitem not found!').then(function() {
					clickElement(elem).then(function() {
						wrapUp(callback, "clickEvent");
					})
				});
			});			
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END SERVOY SIDENAV COMPONENT

	//SERVOY CALENDAR COMPONENT
	When('servoy calendar component with name {elementName} is clicked', { timeout: 60 * 1000 }, function (elementName, callback) {
		var calendar = element(by.xpath("//data-servoydefault-calendar[@data-svy-name='" + elementName + "']/div/span[1]"));
		browser.wait(EC.presenceOf(calendar), 15 * 1000, 'Calendar not found!').then(function () {
			clickElement(calendar).then(function () {
				wrapUp(callback, "Click event");
			}).catch(function (error) {			
				tierdown(true);
				callback(new Error(error.message));
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('I want to {activity} for {second} second(s)', {timeout: 120 * 1000}, function (activity, timer, callback) {
		browser.sleep((parseInt(timer) * 1000)).then(function () {
			wrapUp(callback, null);
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	When('servoy calendar component I want to select {day} {month} {year}', { timeout: 120 * 1000 }, function (day, month, year, callback) {
		var promise = Promise.resolve(setCalendar(day, month, year, null, callback));
		promise.then(function() {					
			wrapUp(callback, "calendarEvent");					
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy default calendar component I want to set the date to today', {timeout: 120 * 1000}, function(callback) {				
		var dToday = new Date();
		var monthList = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
		var selectedMonth = monthList[dToday.getMonth()];
		var promise = Promise.resolve(setCalendar(dToday.getDate(), selectedMonth, dToday.getFullYear(), null, callback));
		promise.then(function() {					
			wrapUp(callback, "calendarEvent");					
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy default calendar component I want to set the date to today {+|-} {days} day(s)', {timeout: 120 * 1000}, function(operator, dayAmount, callback) {
		var dToday = new Date();
		if(operator === '-') {
			dToday.setDate(dToday.getDate() - parseInt(dayAmount));
		} else if(operator === '+'){
			dToday.setDate(dToday.getDate() + parseInt(dayAmount));
		} else {
			tierdown(true);
			callback(new Error("Invalid operator given! Use '+' or '-'"));
		}
		var monthList = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
		var selectedMonth = monthList[dToday.getMonth()];			
		var promise = Promise.resolve(setCalendar(dToday.getDate(), selectedMonth, dToday.getFullYear(), null, callback));
		promise.then(function() {					
			wrapUp(callback, "calendarEvent");					
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});

	});

	When('servoy default calendar component I want to set the date to {weekDay} {before|after} today', {timeout: 120 * 1000}, function(weekDay, direction ,callback){
		var newDate = new Date();
		var monthList = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
		var dayList = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];		
		var day = dayList.indexOf(weekDay.toLowerCase());
		console.log(day);
		if(day === -1) {
			return callback(new Error("Invalid weekday given! Use monday, tuesday, wednesday, etc. instead."));
		}
		var dayToday = newDate.getDay();
		var selectedMonth;
		var difference;
		switch (direction) {
			case "before":
				if (day === dayToday) {
					newDate.setDate(newDate.getDate() - 7);
				} else {
					difference = dayToday - day;
					if (difference > 0) {
						newDate.setDate(newDate.getDate() - difference);
					} else {
						difference = (7 - (difference * -1));
						newDate.setDate(newDate.getDate() - difference);
					}
				}
				selectedMonth = monthList[newDate.getMonth()];
				var promise = Promise.resolve(setCalendar(newDate.getDate(), selectedMonth, newDate.getFullYear(), null, callback));
				promise.then(function () {
					wrapUp(callback, "calendarEvent");
				});
				break;
			case "after":
				if (day === dayToday) {
					newDate.setDate(newDate.getDate() + 7);
				} else {
					difference = day - dayToday;
					if (difference > 0) {
						newDate.setDate(newDate.getDate() + difference);
					} else {
						difference = (7 - (difference * -1));
						newDate.setDate(newDate.getDate() + difference);
					}
				}
				selectedMonth = monthList[newDate.getMonth()];
				var promise = Promise.resolve(setCalendar(newDate.getDate(), selectedMonth, newDate.getFullYear(), null, callback));
				promise.then(function () {
					wrapUp(callback, "calendarEvent");
				});
				break;
			default:
				tierdown(true);
				return callback(new Error("Invalid input given! Use 'after' and 'before' is supported."));
		}
	});

	When('servoy default calendar component I want to set the date to {weekDay} {before|after} today {+|-} {days} day(s)', {timeout: 120 * 1000}, function(weekDay, direction, operator, days, callback){
		var newDate = new Date();
		var monthList = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
		var dayList = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];		
		var day = dayList.indexOf(weekDay.toLowerCase());
		if (day === -1) {
			tierdown(true);
			return callback(new Error("Invalid weekday given! Use monday, tuesday, wednesday, etc. instead."));
		}
		var dayToday = newDate.getDay();
		var selectedMonth;
		var difference;
		switch (direction) {
			case "before":
				if (day === dayToday) {
					newDate.setDate(newDate.getDate() - 7);
				} else {
					difference = dayToday - day;
					if (difference > 0) {
						newDate.setDate(newDate.getDate() - difference);
					} else {
						difference = (7 - (difference * -1));
						newDate.setDate(newDate.getDate() - difference);
					}
				}

				switch (operator) {
					case "+":
						newDate.setDate(newDate.getDate() + parseInt(days));
						break;
					case "-":
						newDate.setDate(newDate.getDate() - parseInt(days));
						break;
					default:
						tierdown(true);
						return callback(new Error("Invalid operator given! Only '+' or '-' is allowed."));
				}
				selectedMonth = monthList[newDate.getMonth()];
				var promise = Promise.resolve(setCalendar(newDate.getDate(), selectedMonth, newDate.getFullYear(), 'bootstrap', callback));
				promise.then(function () {
					wrapUp(callback, "calendarEvent");
				});
				break;
			case "after":
				if (day === dayToday) {
					newDate.setDate(newDate.getDate() + 7);
				} else {
					difference = day - dayToday;
					if (difference > 0) {
						newDate.setDate(newDate.getDate() + difference);
					} else {
						difference = (7 - (difference * -1));
						newDate.setDate(newDate.getDate() + difference);
					}
				}

				switch (operator) {
					case "+":
						newDate.setDate(newDate.getDate() + parseInt(days));
						break;
					case "-":
						newDate.setDate(newDate.getDate() - parseInt(days));
						break;
					default:
						tierdown(true);
						return callback(new Error("Invalid operator given! Only '+' or '-' is allowed."));
				}
				selectedMonth = monthList[newDate.getMonth()];
				var promise = Promise.resolve(setCalendar(newDate.getDate(), selectedMonth, newDate.getFullYear(), 'bootstrap', callback));
				promise.then(function () {
					wrapUp(callback, "calendarEvent");
				});
				break;
			default:
				tierdown(true);
				return callback(new Error("Invalid input given! Use 'after' and 'before' is supported."));
		}
	});


	//END SERVOY CALENDAR COMPONENT

	//SERVOY SELECT2TOKENIZER COMPONENT
	When('servoy select2tokenizer component with name {elementName} is clicked', { timeout: 60 * 1000 }, function (elementName, callback) {
		var tokenizer = element(by.css("data-servoyextra-select2tokenizer[data-svy-name='" + elementName + "']"))
		browser.wait(EC.presenceOf(tokenizer), 15 * 1000, 'Tokenizer not found!').then(function(){
			clickElement(tokenizer).then(function () {
				wrapUp(callback, "Click event");
			}).catch(function (error) {				
				tierdown(true);
				callback(new Error(error.message));
			});
		}).catch(function (error) {				
			tierdown(true);
			callback(new Error(error.message));
		});	
	});

	When('servoy select2tokenizer component record number {rowNumber} is clicked', { timeout: 60 * 1000 }, function (rowNumber, callback) {
		var container = element.all(by.xpath("//span[contains(@class, 'select2-results')]"));
		browser.wait(EC.presenceOf(container), 15 * 1000, 'Tokenizer container not found!').then(function () {
			var containerUl = container.all(by.xpath("//ul[@aria-expanded='true']"));
			var rows = containerUl.all(by.xpath("//li[contains(@class, 'select2-results__option')]"));
			var searchRow = rows.get(0);
			searchRow.getText().then(function (text) {
				browser.wait(EC.not(EC.textToBePresentInElementValue(searchRow, 'Searching...'))).then(function (hasChanged) {
					if (hasChanged || text !== 'Searching...') {
						if(browser.browserName === 'firefox') {
							rows.get(rowNumber - 1).click().then(function () {
								wrapUp(callback, "clickEvent");
							});
						} else {
							clickElement(rows.get(rowNumber - 1)).then(function () {								
								wrapUp(callback, "clickEvent");
							});
						}
					}
				});
			})
		}).catch(function (error) {
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('servoy select2tokenizer component record number {rowNumber} equals the text {recordText}', { timeout: 60 * 1000 }, function (recordNumber, validateText, callback) {
		browser.sleep(500).then(function(){
			var container = element.all(by.xpath("//span[contains(@class, 'select2-results')]"));
			var containerUl = container.all(by.xpath("//ul[@aria-expanded='true']"));
			var rows = containerUl.all(by.xpath("//li[contains(@class, 'select2-results__option')]"));
			var searchRow = rows.get(0);
			searchRow.getText().then(function(text){
				browser.wait(EC.not(EC.textToBePresentInElementValue(searchRow, 'Searching...'))).then(function(hasChanged){
					if(hasChanged || text !== 'Searching...'){
						rows.get(recordNumber - 1).getText().then(function (textToCompare) {
							if(textToCompare.toLowerCase() === validateText.toLowerCase()) {
								wrapUp(callback, "validateEvent");
							};
						})
					}
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy select2tokenizer component with name {elementName} I want to unselect the item with the text {text}', {timeout: 20 * 1000}, function(elementName, text, callback) {
		var tokenizer = element(by.css("data-servoyextra-select2tokenizer[data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(tokenizer), 15 * 1000, 'Tokenizer not found!').then(function() {
			var elemToDeselect = tokenizer.element(by.css("li[title='" + text + "']"));
			clickElement(elemToDeselect.element(by.css("span"))).then(function() {
				wrapUp(callback, "clickEvent");
			});
		}).catch(function(error) {
			tierdown(true);
			callback(new Error(error.message));
		})
	});

	When('servoy select2tokenizer component with name {elementName} the text {recordText} is inserted', { timeout: 60 * 1000 }, function (elementName, text, callback) {
		var elem = element(by.css("data-servoyextra-select2tokenizer[data-svy-name='" + elementName + "']")).element(by.css("input"));
		sendKeys(elem, text, 'tokenizer').then(function () {
			wrapUp(callback, "Click event");
		}).catch(function (error) {
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy select2tokenizer component I want to select the record with the exact text {text}', { timeout: 60 * 1000 }, function (text, callback) {
		var tokenizerList = element(by.css("ul[class='select2-results__options'"));
		browser.wait(EC.presenceOf(tokenizerList), 15 * 1000, 'Tokenizer list not found!').then(function() {
			var tokenizerItem = tokenizerList.all(by.xpath("//li[text()[contains(translate(., '" + text.toUpperCase() + "', '" + text.toLowerCase() + "'), '" + text + "')]]")).first();
			clickElement(tokenizerItem).then(function() {
				wrapUp(callback, "clickEvent");
			})
		}).catch(function(error) {
			tierdown(false);
			callback(new Error(error.message))
		});
	});

	When('servoy select2tokenizer component with name {elementName} I want to select the record with the partial text {text}', { timeout: 60 * 1000 }, function (elementName, text, callback) {
		
	});
	//END SERVOY SELECT2TOKENIZER COMPONENT

	//BROWSER ACTION
	When('I press {browserAction}', { timeout: 30 * 1000 }, function (browserAction, callback) {
		pressKey(browserAction).then(function() {
			wrapUp(callback, "insertEvent");
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('On the element with the name {elementName} I want to press {browserAction}', {timeout: 30 * 1000}, function(elementName, browserAction, callback) {
		var elem = element(by.css(`*[data-svy-name='${elementName}']`));
		browser.wait(EC.presenceOf(elem), 15 * 1000, 'Element could not be found!').then(function() {
			switch(browserAction.toLowerCase()) {
				case "enter":
					elem.sendKeys(protractor.Key.ENTER);
					wrapUp(callback, null);
					break;
				default:
					callback(new Error('Browser action not yet supported!'));
					break;
			}
		}).catch(function(err) {
			callback(new Error(err.message));
		})
	});

	When('I want to press the {browserAction} key with the {key} key', { timeout: 15 * 1000 }, function (browserAction, key, callback) {		
		browserAction = browserAction.toLowerCase();
		var Key = protractor.Key;
		
		switch (browserAction) {
			case "control":
				if(key.toLowerCase() === 't'){
					browser.executeScript("return window.open(arguments[0], '_blank')").then(function(){
						wrapUp(callback, "navigateEvent");
					})
				} else {
					browser.actions().keyDown(protractor.Key.CONTROL).sendKeys(key).keyUp(protractor.Key.CONTROL).perform().then(function () {
						wrapUp(callback, "keypressEvent");
					}).catch(function (error) {			
						tierdown(true);
						callback(new Error(error.message));
					});
				}
				break;
			case "alt": 
				browser.actions().keyDown(protractor.Key.ALT).sendKeys(key).keyUp(protractor.Key.CONTROL).perform().then(function () {
					wrapUp(callback, "keypressEvent");
				}).catch(function (error) {			
					tierdown(true);
					callback(new Error(error.message));
				});
				break;
			case "shift": 
				browser.actions().keyDown(protractor.Key.SHIFT).sendKeys(key).keyUp(protractor.Key.CONTROL).perform().then(function () {
					wrapUp(callback, "keypressEvent");
				}).catch(function (error) {			
					tierdown(true);
					callback(new Error(error.message));
				});
				break;
		}		
	});
	//END BROWSER ACTION

	//BROWSER ZOOM
	Then('I want to zoom the page out to {percentage} percent', {timeout: 10*1000}, function(percentage, callback){
		browser.executeScript("document.body.style.zoom='"+percentage+"%'").then(function(){
			wrapUp(callback, 'browserZoomEvent');
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	//END BROWSER ZOOM

	//SERVOY TABLE COMPONENT
	When('servoy table component with name {elementName} I scroll to the record with {string} as text', { timeout: 60 * 1000 }, function (elementName, recordText, callback) {
		findRecordTableComponent(elementName, recordText, false, callback);
	});

	When('servoy table component with name {elementName} I scroll and select the record with {string} as text', { timeout: 60 * 1000 }, function (elementName, recordText, callback) {
		findRecordTableComponent(elementName, recordText, true, callback);
	});

	When('servoy table component with name {elementName} I want to validate that a record with the text {text} exists', {timeout: 60 * 1000}, function(elementName, text, callback){
		var found = false;
		var table = element.all(by.xpath("//div[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.presenceOf(table.first()), 30 * 1000, 'Table not found!').then(function(){
			var inputField = table.first().element(by.xpath("//input[value='" + text + "']"));
			inputField.isPresent().then(function (isPresent) {
				if (isPresent) {
					found = true;
				} else {
					var elem = table.first().element(by.xpath("//*[text()='" + text + "']"));
					elem.isPresent().then(function (isPresent) {
						if (isPresent) {
							found = true;
						}
					});
				}
			}).then(function () {
				if (found) {
					wrapUp(callback, 'validationEvent');
				} else {
					tierdown(true);
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy table component with name {elementName} I want to select {elementType} number {elementNumber} with the name {elemName}',{timeout: 30 * 1000} ,function(elementName, elementType, rowNumber, elemName, callback){
		var table = element(by.xpath("//div[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.visibilityOf(table), 30 * 1000, 'Table not found!').then(function(){
			var elem = table.all(by.xpath("//*[@data-svy-name='"+elemName+"']")).get(rowNumber - 1);
			switch (elementType) {
				case "checkbox":
					clickElement(elem.element(by.css('input'))).then(function () {
						wrapUp(callback, "clickEvent");
					});
					break;
				case "input":
					clickElement(elem).then(function () {
						wrapUp(callback, "clickEvent");
					});
					break;
				default:
					tierdown(true);
					return callback(new Error("Invalid input given! Use 'after' and 'before' is supported."));
			}

		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('servoy table component with name {elementName} I want to validate that an element contains a(n) {attribute} with the value {value} on the row with the text {text} exists', {timeout: 90 * 1000}, function(elementName, attribute, value, text, callback){
		var found = false;
		var table = element.all(by.xpath("//div[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.presenceOf(table.first()), 30 * 1000, 'Table not found!').then(function(){
			var inputField = table.first().element(by.xpath("//input[@value='" + text + "']"));
			inputField.isPresent().then(function (isPresent) {
				if (isPresent) {
					var elementWithAttribute = inputField.element(by.xpath("..")).element(by.xpath("..")).element(by.xpath("..")).element(by.xpath("..")).element(by.xpath("//*[@"+attribute+"='" + value+"']"));
					elementWithAttribute.isPresent().then(function(isAttributePresent){
						if(isAttributePresent) {
							var elementWithAttribute = elem.element(by.xpath("ancestor::div[contains(@class, 'ui-grid-row')]")).element(by.xpath("//*[@"+attribute+"='" + value+"']"));
							elementWithAttribute.isPresent().then(function (isAttributePresent) {
								if (isAttributePresent) {
									found = true;
								}
							});
						}
					})
				} else {
					var elem = table.first().element(by.xpath("//*[text()='" + text + "']"));
					elem.isPresent().then(function (isPresent) {
						if (isPresent) {
							var elementWithAttribute = elem.element(by.xpath("ancestor::div[contains(@class, 'ui-grid-row')]")).element(by.xpath("//*[@" + attribute + "='" + value + "']"));
							elementWithAttribute.isPresent().then(function (isAttributePresent) {
								if (isAttributePresent) {
									found = true;
								}
							});
						}
					});
				}
			}).then(function () {
				if (found) {
					wrapUp(callback, 'validationEvent');
				} else {
					callback(new Error('Element with the given attribute has not been found!'));
					tierdown(true);
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('servoy table component with name {elementName} I want to validate that there is/are {rowCount} row(s) currently visible', {timeout: 60 * 1000}, function(elementName, rowCount, callback){
		var baseTable = element.all(by.xpath("//div[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.presenceOf(baseTable.first()), 30 * 1000, 'Table not found!').then(function(){
			baseTable.all(by.xpath("//div[contains(@class, 'ui-grid-row')]")).count().then(function(count){
				if(count === parseInt(rowCount)) {
					wrapUp(callback, "validateEvent");
				} else {
					callback(new Error('Invalid amount of rows found. Found: ' + count + ". Expected: " + rowCount));
					tierdown(true);
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy table component with name {elementName} on row {rowNumber} I want to double click on the element with the name {componentElementName}', {timeout: 60 * 1000}, function(elementName, rowNumber, componentElementName, callback){
		var baseTable = element.all(by.xpath("//div[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.presenceOf(baseTable.first()), 30 * 1000, 'Table not found!').then(function(){
			var record = baseTable.all(by.css("div[role=row]")).get(rowNumber - 1);
			var elementToClick = record.element(by.css("*[data-svy-name='" + componentElementName + "']"));

			doubleClickElement(elementToClick).then(function(){
				wrapUp(callback, "clickEvent");
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy table component with name {elementName} on row {rowNumber} I want to click on the element with the name {componentElementName}', {timeout: 60 * 1000}, function(elementName, rowNumber, componentElementName, callback){
		var baseTable = element.all(by.xpath("//div[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.presenceOf(baseTable.first()), 30 * 1000, 'Table not found!').then(function(){
			var record = baseTable.all(by.css("div[role=row]")).get(rowNumber - 1);
			var elementToClick = record.element(by.css("*[data-svy-name='" + componentElementName + "']"));

			clickElement(elementToClick).then(function(){
				wrapUp(callback, "clickEvent");
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	//Function for scrolling to the right
	When('servoy table component with name {elementName} I want to scroll the table to the right to an element with the name {headerElementName}', { timeout: 30 * 1000 }, function(elementName, headerElementName, callback){
		var table = element(by.xpath("//div[@data-svy-name='" + elementName +  "']")).element(by.className("ui-grid-viewport"));
		browser.wait(EC.visibilityOf(table), 30 * 1000, 'Table not found!').then(function(){
			var tableHeader = table.element(by.xpath("//*[@data-svy-name='"+headerElementName+"']"))
			browser.executeScript("arguments[0].scrollIntoView(true);", tableHeader.getWebElement()).then(function(){
				wrapUp(callback, "scrollEvent");
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END SERVOY TABLE COMPONENT

	//SERVOY EXTRA TABLE COMPONENT
	When('servoy extra table component with name {elementName} I scroll to the record with {string} as text', { timeout: 60 * 1000 }, function (elementName, recordText, callback) {
		dataServoyExtraTableScroll(elementName, recordText, false, callback);
	});

	When('servoy extra table component with name {elementName} I want to measure the time it takes to render the cell with text {string}', { timeout: 60 * 1000 }, function (elementName, recordText, callback) {
		var elem = element.all(by.xpath("//*[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(elem).call(), 30000, 'Element not visible').then(function () {
			var elemCell = elem.all(by.xpath("//div[text()='" + recordText + "']"))
			browser.wait(EC.presenceOf(elemCell).call(), 30000, 'Element not visible').then(function () {
				wrapUp(callback, "render extra table");
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy extra table component with name {elementName} I want to select row number {rowNumber}', { timeout: 30 * 1000 }, function (elementName, rowNumber, callback) {
		browser.wait(EC.visibilityOf(element(by.xpath("//data-servoyextra-table[@data-svy-name='" + elementName + "']"))), 30 * 1000, 'Element not found!').then(function () {
			element.all(by.xpath("//data-servoyextra-table[@data-svy-name='" + elementName + "']")).each(function (rowItems) {
				clickElement(rowItems.all(by.xpath("div/table/tbody/tr")).get(rowNumber - 1)).then(function () {
					wrapUp(callback, "clickEvent");
				});
			}).catch(function (error) {			
				tierdown(true);
				callback(new Error(error.message));
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy extra table component with name {elementName} I want to double click row number {rowNumber}', { timeout: 30 * 1000 }, function (elementName, rowNumber, callback) {
		browser.wait(EC.visibilityOf(element(by.xpath("//data-servoyextra-table[@data-svy-name='" + elementName + "']"))), 30 * 1000, 'Element not found!').then(function () {			
			element.all(by.xpath("//data-servoyextra-table[@data-svy-name='" + elementName + "']")).each(function (rowItems) {
				browser.actions().doubleClick(rowItems.all(by.xpath("div/table/tbody/tr")).get(rowNumber - 1)).perform().then(function () {
					wrapUp(callback, "clickEvent");
				});
			}).catch(function (error) {			
				tierdown(true);
				callback(new Error(error.message));
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	//NOTE: this test step only works for the timesheet application
	When('servoy data-servoyextra-table component I want to edit row number {rowNumber} of {weekDay}', { timeout: 30 * 1000 }, function (rowNumber, weekDay, callback) {
		var table = element(by.xpath("//data-servoyextra-table[@data-svy-name='timesheetPage.table" + weekDay.toLowerCase().charAt(0).toUpperCase() + weekDay.slice(1) + "']"));
		clickElement(table.$$("tbody").$$("tr").get(rowNumber - 1).$$("td").get(5)).then(function () {
			wrapUp(callback, "clickEvent");
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	//NOTE: this test step only works for the timesheet application
	When('servoy data-servoyextra-table component I want to delete row number {rowNumber} of {weekDay}', { timeout: 30 * 1000 }, function (rowNumber, weekDay, callback) {
		var table = element(by.xpath("//data-servoyextra-table[@data-svy-name='timesheetPage.table" + weekDay.toLowerCase().charAt(0).toUpperCase() + weekDay.slice(1) + "']"));
		browser.wait(EC.visibilityOf(table), 30 * 1000, 'Element not found!').then(function () {
			clickElement(table.$$("tbody").$$("tr").get(rowNumber - 1).$$("td").get(6)).then(function () {
				wrapUp(callback, "clickEvent");
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy extra table component with name {elementName} I want to validate that a record with the text {text} exists', {timeout: 30 * 1000}, function(elementName, text, callback){
		var found = false;
		var table = element.all(by.xpath("//data-servoyextra-table[@data-svy-name='"+elementName+"']"));
		table.each(function(tableItems){
			//wait untill the table is loaded
			var waitForInputField = tableItems.element(by.xpath('//table/tbody/tr[1]'));
			browser.wait(EC.visibilityOf(waitForInputField)).then(function(){
				var elem = element(by.xpath("//div[text()='"+text+"']"));
				elem.isPresent().then(function(isPresent){
					wrapUp(callback, 'validateEvent');
					if(isPresent) {
						wrapUp(callback, 'validateEvent');
					}
				})
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	//NOTE: this test step only works for the timesheet application
	//ToDo: check if element exists if there are 0 elements
	When('servoy data-servoyextra-table component I want to validate {weekDay} has {rowCount} row(s)', { timeout: 30 * 1000 }, function (weekDay, rowCount, callback) {
		var table = element(by.xpath("//data-servoyextra-table[@data-svy-name='timesheetPage.table" + weekDay.toLowerCase().charAt(0).toUpperCase() + weekDay.slice(1) + "']"));
		table.$$("tbody").$$("tr").get(0).isPresent().then(function (isPresent) {
			if (isPresent) {
				table.$$("tbody").$$("tr").count().then(function (count) {
					console.log(count);
					if (count == rowCount) {
						console.log("Count matches with the amount of rows");
						wrapUp(callback, "validateEvent");
					}
				})
			} else { //table row doesn't exist, meaning, there are 0 rows
				if (rowCount == 0) {
					wrapUp(callback, "validateEvent");
				}
			}
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy extra table component with name {elementName} I want to validate that there are {rowCount} row(s)', { timeout: 30 * 1000 }, function (elementName, rowCount, callback) {
		var table = element(by.xpath("//data-servoyextra-table[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(table), 15 * 1000, 'Table not found!').then(function () {
			element.all(by.xpath("//data-servoyextra-table[@data-svy-name='" + elementName + "']/div/table/tbody/tr")).count().then(function (count) {
				console.log('Records found: ' + count);
				if (count == rowCount) {
					console.log("Count matches with the amount of rows");
					wrapUp(callback, "validateEvent");
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy extra table component with name {elementName} I want to scroll and select the row with text {rowText}', { timeout: 60 * 1000}, function(elementName, text, callback){
		dataServoyExtraTableScroll(elementName, text, true, callback);
	});

	When('servoy extra table component with name {elementName} I want to click on the icon with the class {className} on the row with the text {text}', {timeout: 45 * 1000}, function(elementName, className, text, callback){
		var table = element(by.xpath("//data-servoyextra-table[@data-svy-name='"+elementName+"']"));
		var elementToFind = table.element(by.xpath("//div[text()='"+text+"']"));
		browser.wait(EC.visibilityOf(table), 15 * 1000, 'Table not found!').then(function(){			
			elementToFind.isPresent().then(function(isPresent){
				if(isPresent) {
					clickElement(elementToFind.element(by.xpath("..")).element(by.xpath("..")).element(by.xpath("//td[contains(@class, '" + className +"')]"))).then(function(){
						wrapUp(callback, "clickEvent");
					});
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy extra table component with name {elementName} I want to sort the table by {tableHeader}', {timeout: 30 * 1000}, function(elementName, tableHeader, callback){
		browser.wait(EC.visibilityOf(element(by.xpath("//data-servoyextra-table[@data-svy-name='" + elementName + "']"))), 30 * 1000, 'Element not found!').then(function () {
			element.all(by.xpath("//data-servoyextra-table[@data-svy-name='" + elementName + "']")).each(function (rowItems) {
				var header = rowItems.element(by.xpath("//thead/tr/th/div/div/div[text()='" + tableHeader + "']"));
				browser.wait(EC.presenceOf(header), 30 * 1000, 'Element not visible').then(function(){
					browser.wait(EC.elementToBeClickable(header), 30 * 1000, 'Element not clickable').then(function(){
						clickElement(header).then(function(){
							wrapUp(callback, 'clickEvent');
						});
					});
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy extra table component with name {elementName} I want to click on the element which contains the class {className} in row number {rowNumber}', {timeout: 30 * 1000}, function(elementName, className, rowNumber, callback) {
		rowNumber -= 1;
		var table = element(by.css(`data-servoyextra-table[data-svy-name='${elementName}']`));
		browser.wait(EC.presenceOf(table), 15 * 1000, 'Table not found!').then(function() {
			var body = table.element(by.css('tbody'))
			var row = body.all(by.css('tr')).get(rowNumber);
			// clickElement(row.element(by.xpath(`//td[contains(@class, '${className}')]`))).then(function() {
			clickElement(row.element(by.css(`.${className}`))).then(function() {
				wrapUp(callback, "clickEvent");
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});	
	});
	//END SERVOY EXTRA TABLE COMPONENT

	//SERVOY AGENDA COMPONENT
	When('servoy agenda component with name {elementName} I want to see my appointments on {day} {month} {year}', { timeout: 60 * 1000 }, function (elementName, day, month, year, callback) {
		var agendaComponent = element(by.xpath("//div[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(agendaComponent), 15 * 1000, 'Agenda not found!').then(function () {
			clickElement(element(by.xpath("//div[@data-svy-name='" + elementName + "']/div/div[8]"))).then(function () {
				clickElement(element(by.xpath("//div[@data-svy-name='" + elementName + "']/div/div[11]"))).then(function () {
					return navigateCalendar(elementName, month, year);
				}).then(function (done) {
					if (done) {
						wrapUp(callback, "calendarEvent");
					}
				});
			})
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	function navigateCalendar(elementName, month, year) {
		var monthTo = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"].indexOf(month.toLowerCase()) + 1;
		var yearFrom = new Date().getFullYear();
		var monthFrom = new Date().getMonth() + 1;
		var monthsDifference;
		var yearTo = year;
		if (yearTo == yearFrom) { //same year
			if (monthTo < monthFrom) { //past month
				for (x = 0; x < monthFrom - monthTo; x++) {
					clickElement(element(by.xpath("//div[@data-svy-name='" + elementName + "']/div/div[10]")));
				}
			} else { //future month
				for (x = 0; x < monthTo - monthFrom; x++) {
					clickElement(element(by.xpath("//div[@data-svy-name='" + elementName + "']/div/div[14]")));
				}
			}
		} else if (yearTo < yearFrom) { //past year
			//first calculate if it's more than 12 clicks to get to the date
			//go to the correct year
			for (var x = 0; x < yearFrom - yearTo; x++) {
				clickElement(element(by.xpath("//div[@data-svy-name='" + elementName + "']/div/div[7]")));
			}
			//go to the correct month
			if (monthTo < monthFrom) {
				// monthsDifference += monthFrom - monthTo;
				for (var x = 0; x < monthFrom - monthTo; x++) {
					clickElement(element(by.xpath("//div[@data-svy-name='" + elementName + "']/div/div[10]")));
				}
			} else {
				for (var x = 0; x < monthTo - monthFrom; x++) {
					clickElement(element(by.xpath("//div[@data-svy-name='" + elementName + "']/div/div[14]")));
				}
			}
		} else { //future year
			//go to the correct year
			for (var x = 0; x < yearTo - yearFrom; x++) {
				clickElement(element(by.xpath("//div[@data-svy-name='" + elementName + "']/div/div[12]")));
			}
			//go to the correct month
			if (monthTo < monthFrom) {
				for (var x = 0; x < monthFrom - monthTo; x++) {
					clickElement(element(by.xpath("//div[@data-svy-name='" + elementName + "']/div/div[10]")));
				}
			} else {
				for (var x = 0; x < monthTo - monthFrom % 12; x++) {
					clickElement(element(by.xpath("//div[@data-svy-name='" + elementName + "']/div/div[14]")));
				}
			}
		}
		return browser.controlFlow().execute(function () {
			return true;
		});
	}
	//END SERVOY AGENDA COMPONENT

	//SERVOY TYPAHEAD
	When('servoy default typeahead component with name {elementName} the text {text} is inserted', { timeout: 60 * 1000 }, function (elementName, text, callback) {
		var typeahead = element(by.xpath("//input[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(typeahead), 15 * 1000, 'Typeahead not visible!').then(function () {
			sendKeys(typeahead, text).then(function () {
				wrapUp(callback, "Insert value event");
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy default typeahead component with name {elementName} is clicked', { timeout: 60 * 1000 }, function (elementName, callback) {
		var typeahead = element(by.css("input[data-svy-name='" + elementName +"']"));
		browser.wait(EC.visibilityOf(typeahead), 15 * 1000, 'Typeahead not visible!').then(function(){
			if(browser.browserName === 'firefox') {
				typeahead.click().then(function(){
					wrapUp(callback, "clickEvent");
				}).catch(function (error) {
					callback(new Error(error.message));
				});
			} else {
				clickElement(typeahead).then(function(){
					wrapUp(callback, "clickEvent");
				}).catch(function (error) {
					callback(new Error(error.message));
				});
			}
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy default typeahead component I want row {rowNumber} to equal {text}', { timeout: 30 * 1000 }, function (rowNumber, text, callback) {
		browser.wait(EC.visibilityOf(element(by.xpath("//ul[contains(concat(' ', @class, ' '), ' dropdown-menu ') and contains(concat(' ', @class, ' '), ' ng-isolate-scope ') and not(contains(concat(' ', @class, ' '), ' ng-hide '))]")))).then(function () {
			element.all(by.xpath("//ul[contains(concat(' ', @class, ' '), ' dropdown-menu ') and contains(concat(' ', @class, ' '), ' ng-isolate-scope ') and not(contains(concat(' ', @class, ' '), ' ng-hide '))]")).each(function (typeaheadSelectOptions) {
				typeaheadSelectOptions.all(by.xpath("//li[contains(@class, 'uib-typeahead-match') and contains(@class, 'ng-scope')]/a")).get(rowNumber - 1).getText().then(function (liText) {
					if (text.toLowerCase() == liText.toLowerCase()) {
						wrapUp(callback, "validationEvent");
					}
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy default typeahead component I want to select row number {rowNumber}', { timeout: 30 * 1000 }, function (rowNumber, callback) {
		// dropdown-menu ng-isolate-scope
		element.all(by.xpath("//ul[contains(concat(' ', @class, ' '), ' dropdown-menu ') and contains(concat(' ', @class, ' '), ' ng-isolate-scope ') and not(contains(concat(' ', @class, ' '), ' ng-hide '))]")).each(function (typeaheadSelectOptions) {
			clickElement(typeaheadSelectOptions.all(by.xpath("//li[contains(@class, 'uib-typeahead-match') and contains(@class, 'ng-scope')]/a")).get(rowNumber - 1)).then(function () {
				wrapUp(callback, "clickEvent");
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('servoy default typeahead component with name {elementName} I want to validate that the typeahead equals the text {text}', {timeout: 15 * 1000}, function(elementName, text, callback){
		var typeahead = element(by.css(`input[data-svy-name='${elementName}']`));
		browser.wait(EC.visibilityOf(typeahead), 15 * 1000, 'Typeahead not visible!').then(function(){
			typeahead.getAttribute('value').then(function(value){
				if (value.toLowerCase() === text.toLowerCase()) {
					wrapUp(callback, "validateEvent");
				} else {
					console.log('Expected value: ' + text);
					console.log('Actual value: ' + value);
				}
			})
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END SERVOY TYPEAHEAD
		
	//DEFAULT INPUT FIELD
	When('servoy default input component with name {elementName} the text {input} is inserted', {timeout: 30 * 1000}, function(elementName, text, callback){
		var inputField = element(by.xpath(`//input[@data-svy-name='${elementName}']`));
		browser.wait(EC.visibilityOf(inputField), 30 * 1000, 'Textfield not found!').then(function(){
			sendKeys(inputField, text).then(function(){
				wrapUp(callback, 'insertEvent');
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {			
			console.log(error.message);
			tierdown(true);
		});
	});

	When('servoy default input component with name {elementName} is clicked', {timeout: 30 * 1000}, function(elementName, callback){
		var inputField = element(by.xpath("//input[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.visibilityOf(inputField), 30 * 1000, 'Textfield not found!').then(function(){
			clickElement(inputField).then(function(){
				wrapUp(callback, 'insertEvent');
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy default input component with name {elementName} I want to clear the text field', {timeout: 30 * 1000}, function(elementName, callback){
		var inputField = element(by.xpath("//input[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.visibilityOf(inputField), 30 * 1000, 'Textfield not found!').then(function(){
			clearKeys(inputField).then(function(){
				wrapUp(callback, 'insertEvent');
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('servoy default input component with name {elementName} I want to validate that the input field equals the text {text}', {timeout: 30 * 1000}, function(elementName, text, callback){
		var val;
		var inputField = element(by.xpath("//input[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.visibilityOf(inputField), 30 * 1000, 'Input field not found!').then(function(){
			inputField.getAttribute('value').then(function(inputText){
				val = inputText;
				return inputText.toLowerCase() === text.toLowerCase();
			}).then(function(isValidated){
				if(isValidated) {
					wrapUp(callback, 'validateEvent');
				} else {
					callback(new Error("Validation failed! Expected the input field to equal the text '" + text + "'. Got '" + val + "' instead."))
				}
			})
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('servoy default input component with name {elementName} I want to validate that the input field contains the text {text}', {timeout: 30 * 1000}, function(elementName, text, callback){
		var inputField = element(by.css("input[data-svy-name='"+elementName+"']"));
		browser.wait(EC.visibilityOf(inputField), 30 * 1000, 'Input field not found!').then(function(){
			inputField.getAttribute('value').then(function(inputText) {
				if(inputText.toLowerCase().indexOf(text.toLowerCase()) > -1) {
					wrapUp(callback, "validateEvent");
				} else {
					callback(new Error("Validation failed! Expected the input field to contain the text '" + text + "'. Got '" + inputText + "' instead."))
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('servoy default input component with name {elementName} I want to validate that the input field is empty', {timeout: 30 * 1000}, function(elementName, callback){
		var val;
		var inputField = element(by.css(`input[data-svy-name='${elementName}']`));
		browser.wait(EC.visibilityOf(inputField), 30 * 1000, 'Input field not found!').then(function(){
			inputField.getAttribute('value').then(function(inputText){
				if(!inputText) {
					wrapUp(callback, 'validateEvent');
				} else {
					callback(new Error(`Validation failed! Expected the input field to be empty. Got '${inputText}' instead.`))
				}
			})
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	
	Then('servoy default input component I want to validate that the input field contains the text {text} in element number {elementNumber} with name {elementName}', {timeout: 30 * 1000}, function(text, elementNumber, elementName, callback){
		var inputField = element.all(by.css("input[data-svy-name='"+elementName+"']")).get(elementNumber - 1);
		browser.wait(EC.visibilityOf(inputField), 30 * 1000, 'Input field not found!').then(function(){
			inputField.getAttribute('value').then(function(inputText) {
				if(inputText.toLowerCase().indexOf(text.toLowerCase()) > -1) {
					wrapUp(callback, "validateEvent");
				} else {
					callback(new Error("Validation failed! Expected the input field to contain the text '" + text + "'. Got '" + inputText + "' instead."))
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END DEFAULT INPUT FIELD 

	//DEFAULT CHECKBOX FIELD
	When('servoy data-servoydefault-check component with name {elementName} I want it to be {checkboxOption}', { timeout: 30 * 1000 }, function (elementName, checkboxOption, callback) {
		var checkbox = element(by.css(`data-servoydefault-check[data-svy-name='${elementName}']`));
		browser.wait(EC.presenceOf(checkbox), 25 * 1000, 'Checkbox not found!').then(function(){
			var inputfield = checkbox.element(by.css('input'));
			inputfield.isSelected().then(function (isChecked) {
				return isChecked && checkboxOption.toLowerCase() === "unchecked" || !isChecked && checkboxOption.toLowerCase() === "checked";
			}).then(function(isChecked){
				if(isChecked) {
					clickElement(checkbox).then(function () {
						wrapUp(callback, "checkboxEvent");
					})
				} else {
					wrapUp(callback, "checkboxEvent");
				}
			})
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy data-servoydefault-check component with name {elementName} I want to validate that the checkbox is {checkBoxState}', { timeout: 30 * 1000 }, function (elementName, checkBoxState, callback) {
		var checkbox = element(by.css(`data-servoydefault-check[data-svy-name='${elementName}']`));
		browser.wait(EC.visibilityOf(checkbox), 15 * 1000, 'Checkbox not found!').then(function(){
			var inputfield = checkbox.element(by.css('input'));
			inputfield.isSelected().then(function (isChecked) {
				return !isChecked && checkBoxState.toLowerCase() === "unchecked" || isChecked && checkBoxState.toLowerCase() === "checked"
			}).then(function(isChecked) {
				if (isChecked) {
					wrapUp(callback, "checkboxEvent");
				} else {
					tierdown(true);
				}
			}).catch(function (error) {			
				tierdown(true);
				callback(new Error(error.message));
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END DEFAULT CHECKBOX FIELD

	//SERVOY PASSWORD FIELD
	When('servoy data-servoydefault-password component with name {elementName} the text {password} is inserted', {timeout: 30 * 1000}, function(elementName, text, callback){
		var inputField = element(by.xpath("//data-servoydefault-password[@data-svy-name='" + elementName + "']/input"));
		browser.wait(EC.visibilityOf(inputField), 15 * 1000, 'Input field not found!').then(function () {
			sendKeys(inputField, text).then(function () {
				wrapUp(callback, 'insertEvent');
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END SERVOY PASSWORD FIELD

	//SERVOY COMBOBOX
	When('servoy combobox component with name {elementName} is clicked', { timeout: 60 * 1000 }, function (elementName, callback) {
		var combobox = element(by.css("data-servoydefault-combobox[data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(combobox), 15 * 1000, 'Combobox not found!').then(function () {
			if(browser.browserName = 'firefox') {
				clickElement(combobox.element(by.className("pull-left"))).then(function () {
					wrapUp(callback, "Click event");
				});
			} else {
				clickElement(combobox).then(function () {
					wrapUp(callback, "Click event");
				})
			}
			
		}).catch(function (error) {			
			callback(new Error(error.message));
		});
	});
	
	Then('servoy combobox component I want to select number {comboboxNumber} in the combobox', { timeout: 60 * 1000 }, function (comboboxNumber, callback) {
		element.all(by.css(".svy-combobox.ui-select-container.ui-select-bootstrap")).each(function (comboItems) {
			comboItems.all(by.xpath("//div[contains(@class, 'ui-select-choices-row')]")).get(comboboxNumber - 1).click().then(function () {
				wrapUp(callback, "comboboxSelectEvent");
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('servoy combobox component I want to select the combobox item with the text {text}', { timeout: 60 * 1000 }, function (text, callback) {
		var comboBoxItem = element.all(by.xpath("//div[contains(@class, 'svy-combobox') and contains(@class, 'ui-select-container')]")).first()
			.all(by.xpath("//div[text()='"+text+"']")).first();
		browser.wait(EC.visibilityOf(comboBoxItem), 30 * 1000, 'Combobox item not found!').then(function(){
			browser.wait(EC.elementToBeClickable(comboBoxItem), 30 * 1000, 'Combobox item not clickable!').then(function(){
				clickElement(comboBoxItem).then(function(){
					wrapUp(callback, 'clickEvent');
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy combobox component with name {elementName} I want to validate that the combobox item with text {text} is selected', {timeout: 30 * 1000}, function(elementName, text, callback){
		var combobox = element(by.css(`data-servoydefault-combobox[data-svy-name='${elementName}']`));
		browser.wait(EC.presenceOf(combobox), 30 * 1000, 'Combobox not found!').then(function(){
			var selectedItem = combobox.element(by.xpath(`//span[contains(@class, 'ui-select-match-text') and text()='${text}']`));
			selectedItem.isPresent().then(function(isPresent){
				if(isPresent) {
					wrapUp(callback, 'validateEvent');
				}
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy combobox component with name {elementName} I want to validate that the selected combobox item is empty', {timeout: 30 * 1000}, function(elementName, callback){
		var combobox = element(by.css(`data-servoydefault-combobox[data-svy-name='${elementName}']`));
		browser.wait(EC.presenceOf(combobox), 30 * 1000, 'Combobox not found!').then(function(){
			combobox.element(by.className(`ui-select-match-text`)).getText().then(function(selectedItemText){
				if(!selectedItemText) {
					wrapUp(callback, "validateEvent");
				} else {
					callback(new Error(`Validation failed! The selected combobox item is not empty. The selected item is: ${selectedItemText}`));
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy combobox component the text {text} is inserted', { timeout: 60 * 1000 }, function (text, callback) {
		var container = element(by.css('.ui-select-container.dropdown.open'));	
		browser.wait(EC.visibilityOf(container), 15 * 1000, 'Combobox not found!').then(function(){
			var comboBox = container.all(by.css("input[type='search']")).last();
			sendComboboxKeys(comboBox, text).then(function () {
				wrapUp(callback, "Insert value event");
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END SERVOY COMBOBOX

	//SERVOY BUTTON
	When('servoy button component with name {elementName} is clicked', { timeout: 60 * 1000 }, function (elementName, callback) {
		var button = element(by.xpath("//data-servoydefault-button[@data-svy-name='" + elementName + "']/button"));
		browser.wait(EC.visibilityOf(button), 15 * 1000, 'Button not found!').then(function () {
			clickElement(button).then(function () {
				wrapUp(callback, "Click event");
			})
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy button component with name {elementName} is double clicked', { timeout: 60 * 1000 }, function (elementName, callback) {
		var button = element(by.xpath("//data-servoydefault-button[@data-svy-name='" + elementName + "']/button"));
		browser.wait(EC.visibilityOf(button), 15 * 1000, 'Button not found!').then(function () {
			doubleClickElement(button).then(function () {
				wrapUp(callback, "Click event");
			})
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END SERVOY BUTTON

	//END DEFAULT INPUT FIELD
	//SERVOY LABEL 
	When('servoy data-servoydefault-label component with name {elementName} is clicked', {timeout: 30 * 1000}, function(elementName, callback) {
		var labelButton = element(by.xpath(`//data-servoydefault-button[@data-svy-name='${elementName}']/button`));
		labelButton.isPresent().then(function(isPresent){
			if(isPresent){
				clickElement(labelButton).then(function(){
					wrapUp(callback, "clickEvent");
				}).catch(function (error) {			
					tierdown(true);
					callback(new Error(error.message));
				});
			} else {
				var label = element(by.xpath(`//data-servoydefault-label[@data-svy-name='${elementName}']`));
				browser.wait(EC.visibilityOf(label), 30 * 1000, 'Label not found!').then(function(){
					clickElement(element(by.xpath(`//data-servoydefault-label[@data-svy-name='${elementName}']/div`))).then(function(){
						wrapUp(callback, "clickEvent");
					}).catch(function (error) {			
						tierdown(true);
						callback(new Error(error.message));
					});
				}).catch(function (error) {			
					tierdown(true);
					callback(new Error(error.message));
				});
			}
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('servoy data-servoydefault-label component with name {elementName} I want to validate that the label equals the text {text}', {timeout: 30 * 1000}, function(elementName, text, callback){
		var label = element(by.css(`data-servoydefault-label[data-svy-name='${elementName}']`));
		var labelButton = element(by.xpath("//data-servoydefault-button[@data-svy-name='"+elementName+"']/button/div/span[2]"));
		labelButton.isPresent().then(function(isPresent){
			if(isPresent){
				labelButton.getText().then(function(labelText){
					if(labelText.indexOf(text) !== -1) {
						wrapUp(callback, 'valdiateEvent')
					}
				});
			} else {
				browser.wait(EC.visibilityOf(label), 30 * 1000, 'Label not found!').then(function(){
					label.getText().then(function(labelText){
						console.log(labelText);
						if(labelText.indexOf(text) !== -1) {
							wrapUp(callback, 'valdiateEvent')
						}
					}).catch(function (error) {
						console.log(error.message);
						tierdown(true);
					});
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});
			}
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	})
	//END SERVOY LABEL

	//BOOTSTRAP COMPONENTS
	//BOOTSTRAP TEXTBOX
	When('bootstrap data-bootstrapcomponents-textbox component with name {elementName} the text {text} is inserted', { timeout: 30 * 1000 }, function (elementName, text, callback) {
		var textbox = element.all(by.xpath("//data-bootstrapcomponents-textbox[@data-svy-name='" + elementName + "']/input")).first()
		browser.wait(EC.visibilityOf(textbox), 30 * 1000, 'Textfield not found!').then(function () {
			sendKeys(textbox, text).then(function () {
				wrapUp(callback, "insertTextEvent");
			}).catch(function (error) {
				callback(new Error(error.message));
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('bootstrap data-bootstrapcomponents-textbox component with name {elementName} is clicked', { timeout: 30 * 1000 }, function (elementName, callback) {
		var textField = element(by.xpath("//data-bootstrapcomponents-textbox[@data-svy-name='" + elementName+"']/input"));
		browser.wait(EC.visibilityOf(textField), 30 * 1000, 'Textfield not found!').then(function () {
			textField.click().then(function() {
				wrapUp(callback, "insertTextEvent");
			}).catch(function (error) {			
				tierdown(true);
				callback(new Error(error.message));
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('bootstrap data-bootstrapcomponents-textbox component with name {elementName} I want to validate that text text is blank', {timeout: 30 * 1000}, function(elementName, callback){		
		var textField = element(by.xpath("//data-bootstrapcomponents-textbox[@data-svy-name='" + elementName + "']/input"));
		browser.wait(EC.presenceOf(textField), 30 * 1000, 'Textfield not found!').then(function () {
			textField.getAttribute('value').then(function (value) {
				if (!value) {
					wrapUp(callback, "validateEvent");
				} else {
					callback(new Error("Validation failed. Expected an empty text field. Got " + value));
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('bootstrap data-bootstrapcomponents-textbox component with name {elementName} I want to validate that the input field equals the text {text}', { timeout: 30 * 1000 }, function (elementName, text, callback) {
		var textField = element(by.xpath("//data-bootstrapcomponents-textbox[@data-svy-name='" + elementName + "']/input"));
		browser.wait(EC.visibilityOf(textField), 30 * 1000, 'Textfield not found!').then(function () {
			textField.getAttribute('value').then(function(textFieldText){
				if(text == textFieldText) {
					wrapUp(callback, "validateEvent");
				} else {
					console.log("Validation failed. Expected " + text + ". Got " + textFieldText);
				}
			})
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});	

	When('bootstrap data-bootstrapcomponents-textbox component with name {elementName} I want to insert the date {day} {month} {year}', { timeout: 30 * 1000 }, function (elementName, day, month, year, callback) {		
		var monthList = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
		var index = monthList.indexOf(month.toLowerCase()) + 1;
		if(!index) {
			callback(new Error('Invalid date inserted!'));
		}
		var textField = element(by.css("data-bootstrapcomponents-textbox[data-svy-name='" + elementName + "']")).element(by.css('input'));
		browser.wait(EC.visibilityOf(textField), 15 * 1000, 'Textfield not found!').then(function() {
			clickElement(textField).then(function() {
				textField.sendKeys(day).then(function() {
					textField.sendKeys(index).then(function() {
						textField.sendKeys(year).then(function() {
							wrapUp(callback, "insertEvent");
						});
					});
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('bootstrap data-bootstrapcomponents-textbox component with name {elementName} I want to set the date to today {+|-} {number} day(s)', { timeout: 30 * 1000 }, function (elementName, operator, dayCount, callback) {
		var newDate;
		if(operator === '+') {
			newDate = dateUtils.addDays(parseInt(dayCount));
		} else {
			newDate = dateUtils.substractDays(parseInt(dayCount));
		}
		
		var textField = element(by.css("data-bootstrapcomponents-textbox[data-svy-name='" + elementName + "']")).element(by.css('input'));
		browser.wait(EC.visibilityOf(textField), 15 * 1000, 'Textfield not found!').then(function() {
			clickElement(textField).then(function() {
				textField.sendKeys(newDate.getDate()).then(function() {
					if((newDate.getDate()) < 4) {
						browser.actions().sendKeys(protractor.Key.TAB).perform()
					}
					textField.sendKeys(newDate.getMonth() + 1).then(function() {
						if((newDate.getMonth() + 1) < 2) {
							browser.actions().sendKeys(protractor.Key.TAB).perform();
						}
						
						textField.sendKeys(newDate.getFullYear()).then(function() {
							wrapUp(callback, "insertEvent");
						});
					});
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('bootstrap data-bootstrapcomponents-textbox component with name {elementName} I want to clear the text', {timeout: 15 * 1000}, function(elementName, callback) {
		var textField = element(by.css("data-bootstrapcomponents-textbox[data-svy-name='" + elementName + "']")).element(by.css("input"));
		browser.wait(EC.visibilityOf(textField), 30 * 1000, 'Textfield not found!').then(function () {
			textField.clear().then(function() {
				wrapUp(callback, "clearEvent");
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END BOOTSTRAP TEXTBOX
	//BOOTSTRAP BUTTON
	When('bootstrap data-bootstrapcomponents-button component with name {elementName} is clicked', { timeout: 30 * 1000 }, function (elementName, callback) {
		var button = element(by.css("data-bootstrapcomponents-button[data-svy-name='" + elementName + "']")).element(by.css('button'));
		browser.wait(EC.visibilityOf(button), 15 * 1000, 'Button not found!').then(function(){
			clickElement(button).then(function () {
				wrapUp(callback, "clickEvent");
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});	
	});

	When('bootstrap data-bootstrapcomponents-button component with name {elementName} is double clicked', { timeout: 30 * 1000 }, function (elementName, callback) {
		var button = element(by.xpath("//data-bootstrapcomponents-button[@data-svy-name='" + elementName + "']/button"));
		browser.wait(EC.visibilityOf(button), 15 * 1000, 'Button not found!').then(function(){
			doubleClickElement(button).then(function () {
				wrapUp(callback, "clickEvent");
			}).catch(function (error) {
				callback(new Error(error.message));
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});	
	});

	Then('bootstrap data-bootstrapcomponents-button component with name {elementName} I want to validate that the button is {enabled|disabled}', { timeout: 30 * 1000 }, function (elementName, state, callback) {
		var button = element(by.xpath("//data-bootstrapcomponents-button[@data-svy-name='" + elementName + "']/button"));
		browser.wait(EC.presenceOf(button), 15 * 1000, 'Button not found!').then(function(){
			button.isEnabled().then(function(buttonState) {
				if(!buttonState && state === 'disabled' || buttonState && state === 'enabled') {
					wrapUp(callback, "validateEvent");
				} else {
					if(!buttonState) {
						callback(new Error('Button is currently disabled. Expected it to be enabled.'));
					} else {
						callback(new Error('Button is currently enabled. Expected it to be disabled.'));
					}
				}
			}).catch(function (error) {			
				tierdown(true);
				callback(new Error(error.message));
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('bootstrap data-bootstrapcomponents-button component with name {elementName} I want to validate that the button its text partially equals the text {text}', {timeout: 30 * 1000}, function(elementName, text, callback){
		var button = element(by.xpath("//data-bootstrapcomponents-button[@data-svy-name='" + elementName + "']/button"));
		browser.wait(EC.visibilityOf(button), 15 * 1000, 'Button not found!').then(function(){
			button.getText().then(function(buttonText){
				if(buttonText.indexOf(text) > -1) {
					wrapUp(callback, "validateEvent");
				} else {
					callback(new Error("Partial validation failed. Expected " + text + ". Got " + buttonText));
				}
			}).catch(function (error) {			
				tierdown(true);
				callback(new Error(error.message));
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	
	Then('bootstrap data-bootstrapcomponents-button component with name {elementName} I want to validate that the button its text equals the exact text {text}', {timeout: 30 * 1000}, function(elementName, text, callback){
		var button = element(by.xpath("//data-bootstrapcomponents-button[@data-svy-name='" + elementName + "']/button"));
		browser.wait(EC.visibilityOf(button), 15 * 1000, 'Button not found!').then(function(){
			button.getText().then(function(buttonText){
				if(buttonText === text) {
					wrapUp(callback, "validateEvent");
				} else {
					console.log("Partial validation failed. Expected " + text + ". Got " + buttonText);
				}
			}).catch(function (error) {			
				tierdown(true);
				callback(new Error(error.message));
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END BOOTSTRAP BUTTON

	//BOOTSTRAP SELECT
	When('bootstrap data-bootstrapcomponents-select component with name {elementName} is clicked', { timeout: 30 * 1000 }, function (elementName, callback) {
		var selectComponent = element(by.css("data-bootstrapcomponents-select[data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(selectComponent), 15 * 1000, 'Select component not found!').then(function () {
			selectComponent.click().then(function () {
				wrapUp(callback, "clickEvent");
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('bootstrap data-bootstrapcomponents-select component with name {elementName} I want to select the row with {text} as text', { timeout: 45 * 1000 }, function (elementName, text, callback) {
		var selectComponent = element(by.css(`data-bootstrapcomponents-select[data-svy-name='${elementName}']`));
		browser.wait(EC.visibilityOf(selectComponent), 30 * 1000, 'Select component not visible!').then(function () {
			var inputField = selectComponent.element(by.cssContainingText(`option`,`${text}`));
			//by.cssContainingText('option', text)
			inputField.isPresent().then(function (isPresent) {
				// console.log()
				if (isPresent) {
					if (browser.browserName === 'firefox') {
						inputField.click().then(function () {
							selectComponent.click().then(function () {
								wrapUp(callback, "clickEvent");
							});
						});
					} else {
						clickElement(inputField).then(function () {
							clickElement(selectComponent).then(function () {
								wrapUp(callback, "clickEvent");
							});
						});
					}
				}
			});
		}).catch(function (error) {
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('bootstrap data-bootstrapcomponents-select component with name {elementName} I want to select row number {rowNumber}', { timeout: 45 * 1000 }, function (elementName, rowNumber, callback) {
		var select = element.all(by.xpath("//data-bootstrapcomponents-select[@data-svy-name='" + elementName + "']/select"));
		var selectItems = select.all(by.xpath('//option[text()!=""]'));
		selectItems.get(rowNumber - 1).click().then(function() {
			wrapUp(callback, "clickEvent");
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('bootstrap data-bootstrapcomponents-select component with name {elementName} I want to validate that the selected row equals {text}', { timeout: 45 * 1000 }, function (elementName, text, callback) {
		var table = element(by.css("data-bootstrapcomponents-select[data-svy-name='" + elementName + "']")).$('select');
		var row = table.element(by.css("option[selected=selected]"));
		browser.wait(EC.presenceOf(row), 30 * 1000, 'No row is selected!').then(function(){
			row.getText().then(function(rowText){
				if (rowText === text) {
					wrapUp(callback, "validateEvent");
				} else {
					callback(new Error(`Validation failed. Expected '${text}'. Got '${rowText}' instead!`));
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END BOOTSTRAP SELECT

	//BOOTSTRAP TEXTAREA
	When('bootstrap data-bootstrapcomponents-textarea component with name {elementName} the text {text} is inserted', { timeout: 30 * 1000 }, function (elementName, text, callback) {
		var textarea = element(by.css("data-bootstrapcomponents-textarea[data-svy-name='" + elementName + "']")).element(by.css("textarea"));
		browser.wait(EC.presenceOf(textarea), 15 * 1000, 'Textarea not found!').then(function () {
			sendKeys(textarea, text).then(function () {
				wrapUp(callback, "insertEvent");
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('bootstrap data-bootstrapcomponents-textarea component with name {elementName} I want to validate that the input field equals the text {text}', { timeout: 30 * 1000 }, function (elementName, text, callback) {
		var textarea = element(by.css("data-bootstrapcomponents-textarea[data-svy-name='" + elementName + "']")).element(by.css("textarea"));
		browser.wait(EC.visibilityOf(textarea), 30 * 1000, 'Textarea not found!').then(function () {
			textarea.getAttribute('value').then(function(textareaText){
				if(text === textareaText) {
					wrapUp(callback, "validateEvent");
				} else {
					callback(new Error("Validation failed. Expected " + text + ". Got " + textareaText));
				}
			})
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});	

	When('bootstrap data-bootstrapcomponents-textarea component with name {elementName} is clicked', { timeout: 30 * 1000 }, function (elementName, callback) {
		var textarea = element(by.css("data-bootstrapcomponents-textarea[data-svy-name='" + elementName + "']")).element(by.css("textarea"));
		browser.wait(EC.visibilityOf(textarea), 30 * 1000, 'Textarea not found!').then(function () {
			textarea.click().then(function() {
				wrapUp(callback, "insertTextEvent");
			}).catch(function (error) {
				callback(new Error(error.message));
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('bootstrap data-bootstrapcomponents-textarea component with name {elementName} I want to clear the text', {timeout: 15 * 1000}, function(elementName, callback) {
		var textarea = element(by.css("data-bootstrapcomponents-textarea[data-svy-name='" + elementName + "']")).element(by.css("textarea"));
		browser.wait(EC.visibilityOf(textarea), 30 * 1000, 'Textarea not found!').then(function () {
			textarea.clear().then(function() {
				wrapUp(callback, "clearEvent");
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('bootstrap data-bootstrapcomponents-textarea component with name {elementName} I want to validate that text text is blank', {timeout: 30 * 1000}, function(elementName, callback){		
		var textarea = element(by.css("data-bootstrapcomponents-textarea[data-svy-name='" + elementName + "']")).element(by.css("textarea"));
		browser.wait(EC.presenceOf(textarea), 30 * 1000, 'Textarea not found!').then(function () {
			textarea.getAttribute('value').then(function (value) {
				if (!value) {
					wrapUp(callback, "validateEvent");
				} else {
					callback(new Error("Validation failed. Expected an empty text area. Got " + value));
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END BOOTSTRAP TEXTAREA

	//BOOTSTRAP CHECKBOX
	When('bootstrap data-bootstrapcomponents-checkbox component with name {elementName} I want it to be {checkboxState}', { timeout: 30 * 1000 }, function (elementName, checkboxOption, callback) {
		var checkbox = element(by.css(`data-bootstrapcomponents-checkbox[data-svy-name='${elementName}']`));
		browser.wait(EC.visibilityOf(checkbox), 15 * 1000, 'Checkbox not found!').then(function () {
			var input_fld = checkbox.$('input');
			input_fld.isSelected().then(function (isChecked) {
				if (isChecked && checkboxOption.toLowerCase() === "unchecked" || !isChecked && checkboxOption.toLowerCase() === "checked") {
					clickElement(checkbox).then(function () {
						wrapUp(callback, "checkboxEvent");
					})
				} else {
					console.log('Checkbox did not have to be changed');
					wrapUp(callback, "checkboxEvent");
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('bootstrap data-bootstrapcomponents-checkbox component with name {elementName} I want to validate that the checkbox is {checkBoxState}', { timeout: 30 * 1000 }, function (elementName, checkboxOption, callback) {
		var checkbox = element(by.css(`data-bootstrapcomponents-checkbox[data-svy-name='${elementName}']`));
		browser.wait(EC.visibilityOf(checkbox), 15 * 1000, 'Checkbox not found!').then(function () {
			var input_fld = checkbox.$('input');
			input_fld.isSelected().then(function (isChecked) {		
				if (isChecked && checkboxOption.toLowerCase() === "checked" || !isChecked && checkboxOption.toLowerCase() === "unchecked") {				
					wrapUp(callback, "checkboxEvent");
				} else {
					console.log('Validation failed. State of the checkbox does not match the expected state!');
					tierdown(true);
				}
			}).catch(function (error) {			
				tierdown(true);
				callback(new Error(error.message));
			});
		});
	});

	Then('bootstrap data-bootstrapcomponents-checkbox component with name {elementName} I want to validate that the checkbox label equals the text {text}', { timeout: 30 * 1000 }, function (elementName, text, callback) {
		var checkbox = element(by.css(`data-bootstrapcomponents-checkbox[data-svy-name='${elementName}']`));
		browser.wait(EC.visibilityOf(checkbox), 15 * 1000, 'Checkbox not found!').then(function(){
			var input_fld = checkbox.$('span');
			input_fld.getText().then(function(inputText) {
				if(inputText === text) {
					wrapUp(callback, "validateEvent")
				} else {
					console.log("Validation failed. Expected " + text + ". Got " + inputText);
				}
			})
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('bootstrap data-bootstrapcomponents-checkbox component with name {elementName} I want to validate that the checkbox label partially equals the text {text}', { timeout: 30 * 1000 }, function (elementName, text, callback) {
		var checkbox = element(by.css(`data-bootstrapcomponents-checkbox[data-svy-name='${elementName}']`));
		browser.wait(EC.visibilityOf(checkbox), 15 * 1000, 'Checkbox not found!').then(function(){
			var input_fld = checkbox.$('span');
			input_fld.getText().then(function(inputText) {
				if(inputText.indexOf(text) > -1) {
					wrapUp(callback, "validateEvent")
				} else {
					console.log("Validation failed. Expected " + text + ". Got " + inputText);
				}
			})
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END BOOTSTRAP CHECKBOX

	//BOOTSTRAP BADGE COMPONENT
	When('bootstrap data-bootstrapextracomponents-badge component with name {elementName} is clicked', { timeout: 30 * 1000 }, function (elementName, callback) {
		browser.wait(EC.visibilityOf(element(by.xpath("//data-bootstrapextracomponents-badge[@data-svy-name='" + elementName + "']")))).then(function () {
			element(by.xpath("//data-bootstrapextracomponents-badge[@data-svy-name='" + elementName + "']")).click().then(function () {
				wrapUp(callback, "clickEvent");
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});	
	//END BOOTSTRAP BADGE COMPONENT

	//BOOTSTRAP BUTTON GROUP
	When('bootstrap data-bootstrapextracomponents-buttons-group component with name {elementName} I want to select button number {number}', {timeout: 30 * 1000}, function(elementName, number, callback){
		var group = element.all(by.xpath("//data-bootstrapextracomponents-buttons-group[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(group.first()), 30 * 1000, 'Buttons group not found!').then(function(){
			var button = group.all(by.css("button")).get(number - 1);
			browser.wait(EC.visibilityOf(button), 30 * 1000, 'Button not found!').then(function(){
				clickElement(button).then(function(){
					wrapUp(callback, "clickEvent");
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('bootstrap data-bootstrapextracomponents-buttons-group component with name {elementName} I want to select the button with the exact text {text}', {timeout: 30 * 1000}, function(elementName, text, callback){
		var group = element.all(by.xpath("//data-bootstrapextracomponents-buttons-group[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(group.first()), 30 * 1000, 'Buttons group not found!').then(function(){
			group.all(by.css("button")).each(function(button){
				button.getText().then(function(buttonText){
					if(buttonText.toLowerCase() === text.toLowerCase()) {
						clickElement(button).then(function(){
							wrapUp(callback, "clickEvent");
						});
					}
				})
			})
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('bootstrap data-bootstrapextracomponents-buttons-group component with name {elementName} I want to select the button with the partial text {text}', {timeout: 30 * 1000}, function(elementName, text, callback){
		var found = false;
		var group = element.all(by.xpath("//data-bootstrapextracomponents-buttons-group[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(group.first()), 30 * 1000, 'Buttons group not found!').then(function(){
			group.all(by.css("button")).each(function(button){
				button.getText().then(function(buttonText){
					if(buttonText.toLowerCase().indexOf(text) > -1) {
						if(found === false) {
							clickElement(button).then(function(){
								found = true;					
								wrapUp(callback, "clickEvent");
							});
						}
					}
				})
			})
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END BOOTSTRAP BUTTON GROUP

	//BOOTSTRAP CHOICEGROUP
	When('bootstrap data-bootstrapcomponents-choicegroup component with name {elementName} I want option {optionNumber} to be {checkboxOption}', { timeout: 30 * 1000 }, function (elementName, optionNumber, checkboxOption, callback) {
		var choiceGroup = element.all(by.css(`data-bootstrapcomponents-choicegroup[data-svy-name='${elementName}']`));
		browser.wait(EC.presenceOf(choiceGroup.first()), 30 * 1000, 'Choicegroup not found!').then(function(){
			var option = choiceGroup.all(by.css("input")).get(optionNumber - 1);
			browser.wait(EC.presenceOf(option), 15 * 1000, 'Option not found!').then(function(){
				option.isSelected().then(function(isChecked){
					return isChecked && checkboxOption.toLowerCase() === "unchecked" || !isChecked && checkboxOption.toLowerCase() === "checked";
				}).then(function(isChecked){
					if(isChecked) {
						clickElement(option.element(by.xpath(".."))).then(function () {
							wrapUp(callback, "checkboxEvent");
						})
					} else {
						wrapUp(callback, "checkboxEvent");
					}
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('bootstrap data-bootstrapcomponents-choicegroup component with name {elementName} I want the option with the text {text} to be {checkboxOption}', { timeout: 30 * 1000 }, function (elementName, checkboxOption, callback) {
		
	});
	//END BOOTSTRAP CHOICEGROUP

	//BOOTSTRAP CALENDAR
	When('bootstrap data-bootstrapcomponents-calendar component with name {elementName} I want to select {day} {month} {year}', { timeout: 120 * 1000 }, function (elementName, day, month, year, callback) {
		var calendar = element(by.xpath("//data-bootstrapcomponents-calendar[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(calendar), 30 * 1000, 'Calendar not found!').then(function (){
			clickElement(calendar.element(by.css("span[class='glyphicon glyphicon-calendar']"))).then(function () {
				var promise = Promise.resolve(setCalendar(day, month, year, 'bootstrap', callback));
				promise.then(function() {					
					wrapUp(callback, "calendarEvent");					
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('bootstrap data-bootstrapcomponents-calendar component with name {elementName} I want to set the date to today', {timeout: 120 * 1000}, function(elementName, callback) {				
		var dToday = new Date();
		var monthList = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
		var selectedMonth = monthList[dToday.getMonth()];
		var calendar = element(by.css("data-bootstrapcomponents-calendar[data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(calendar), 15 * 1000, 'Calendar not found!').then(function() {
			clickElement(calendar.element(by.css("span[class='glyphicon glyphicon-calendar']"))).then(function () {
				var promise = Promise.resolve(setCalendar(dToday.getDate(), selectedMonth, dToday.getFullYear(), 'bootstrap', callback));
				promise.then(function() {					
					wrapUp(callback, "calendarEvent");					
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('bootstrap data-bootstrapcomponents-calendar component with name {elementName} I want to set the date to today {+|-} {days} days', {timeout: 120 * 1000}, function(elementName, operator, dayAmount, callback) {
		var dToday = new Date();		
		if(operator === '-') {
			dToday.setDate(dToday.getDate() - parseInt(dayAmount));
		} else if(operator === '+'){
			dToday.setDate(dToday.getDate() + parseInt(dayAmount));
		} else {
			callback(new Error("Invalid operator given! Use '+' or '-'"));
		}
		var monthList = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
		var selectedMonth = monthList[dToday.getMonth()];
		var calendar = element(by.css("data-bootstrapcomponents-calendar[data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(calendar), 15 * 1000, 'Calendar not found!').then(function() {
			clickElement(calendar.element(by.css("span[class='glyphicon glyphicon-calendar']"))).then(function () {				
				var promise = Promise.resolve(setCalendar(dToday.getDate(), selectedMonth, dToday.getFullYear(), 'bootstrap', callback));
				promise.then(function() {					
					wrapUp(callback, "calendarEvent");					
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('bootstrap data-bootstrapcomponents-calendar component with name {elementName} I want to set the date to {weekDay} {before|after} today', {timeout: 120 * 1000}, function(elementName, weekDay, direction ,callback){
		var newDate = new Date();
		var monthList = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
		var dayList = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];		
		var day = dayList.indexOf(weekDay.toLowerCase());
		console.log(day);
		if(day === -1) {
			return callback(new Error("Invalid weekday given! Use monday, tuesday, wednesday, etc. instead."));
		}
		var dayToday = newDate.getDay();
		var selectedMonth;
		var difference;
		var calendar = element(by.css("data-bootstrapcomponents-calendar[data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(calendar), 15 * 1000, 'Calendar not found!').then(function() {
			clickElement(calendar.element(by.css("span[class='glyphicon glyphicon-calendar']"))).then(function () {
				switch (direction) {
					case "before":
						if(day === dayToday) {
							newDate.setDate(newDate.getDate() - 7);
						} else {
							difference = dayToday - day;
							if(difference > 0) {
								newDate.setDate(newDate.getDate() - difference);
							} else {
								difference = (7 - (difference * -1));
								newDate.setDate(newDate.getDate() - difference);
							}							
						}
						selectedMonth = monthList[newDate.getMonth()];
						var promise = Promise.resolve(setCalendar(newDate.getDate(), selectedMonth, newDate.getFullYear(), 'bootstrap', callback));
						promise.then(function() {					
							wrapUp(callback, "calendarEvent");					
						});				
						break;
					case "after":
						if(day === dayToday) {
							newDate.setDate(newDate.getDate() + 7);
						} else {
							difference = day - dayToday;
							if(difference > 0) {
								newDate.setDate(newDate.getDate() + difference);
							} else {
								difference = (7 - (difference * -1));
								newDate.setDate(newDate.getDate() + difference);
							}
						}
						selectedMonth = monthList[newDate.getMonth()];
						var promise = Promise.resolve(setCalendar(newDate.getDate(), selectedMonth, newDate.getFullYear(), 'bootstrap', callback));
						promise.then(function() {					
							wrapUp(callback, "calendarEvent");					
						});	
						break;
					default:
						tierdown(true);	
						return callback(new Error("Invalid input given! Use 'after' and 'before' is supported."));						
				}
			});
		});
	});

	When('bootstrap data-bootstrapcomponents-calendar component with name {elementName} I want to set the date to {weekDay} {before|after} today {+|-} {days} day(s)', {timeout: 120 * 1000}, function(elementName, weekDay, direction, operator, days, callback){
		var newDate = new Date();
		var monthList = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
		var dayList = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];		
		var day = dayList.indexOf(weekDay.toLowerCase());
		if(day === -1) {
			return callback(new Error("Invalid weekday given! Use monday, tuesday, wednesday, etc. instead."));
		}
		var dayToday = newDate.getDay();
		var selectedMonth;
		var difference;
		var calendar = element(by.css("data-bootstrapcomponents-calendar[data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(calendar), 15 * 1000, 'Calendar not found!').then(function() {
			clickElement(calendar.element(by.css("span[class='glyphicon glyphicon-calendar']"))).then(function () {
				switch (direction) {
					case "before":
						if(day === dayToday) {
							newDate.setDate(newDate.getDate() - 7);
						} else {
							difference = dayToday - day;
							if(difference > 0) {
								newDate.setDate(newDate.getDate() - difference);
							} else {
								difference = (7 - (difference * -1));
								newDate.setDate(newDate.getDate() - difference);
							}							
						}

						switch(operator) {
							case "+":
								newDate.setDate(newDate.getDate() + parseInt(days));
								break;
							case "-":
								newDate.setDate(newDate.getDate() - parseInt(days));
								break;
							default: 
								tierdown(true);
								return callback(new Error("Invalid operator given! Only '+' or '-' is allowed."));
						}
						selectedMonth = monthList[newDate.getMonth()];	
						var promise = Promise.resolve(setCalendar(newDate.getDate(), selectedMonth, newDate.getFullYear(), 'bootstrap', callback));
						promise.then(function() {					
							wrapUp(callback, "calendarEvent");					
						});				
						break;
					case "after":
						if (day === dayToday) {
							newDate.setDate(newDate.getDate() + 7);
						} else {
							difference = day - dayToday;
							if (difference > 0) {
								newDate.setDate(newDate.getDate() + difference);
							} else {
								difference = (7 - (difference * -1));
								newDate.setDate(newDate.getDate() + difference);								
							}
						}

						switch(operator) {
							case "+":
								newDate.setDate(newDate.getDate() + parseInt(days));
								break;
							case "-":
								newDate.setDate(newDate.getDate() - parseInt(days));
								break;
							default: 
								return callback(new Error("Invalid operator given! Only '+' or '-' is allowed."));
						}
						selectedMonth = monthList[newDate.getMonth()];
						var promise = Promise.resolve(setCalendar(newDate.getDate(), selectedMonth, newDate.getFullYear(), 'bootstrap', callback));
						promise.then(function() {					
							wrapUp(callback, "calendarEvent");					
						});	
						break;
					default:
						tierdown(true);	
						return callback(new Error("Invalid input given! Use 'after' and 'before' is supported."));
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});	

	Then('bootstrap data-bootstrapcomponents-calendar component with name {elementName} I expect it to be {visible|present|hidden}', {timeout: 30 * 1000}, function(elementName, state, callback){
		var calendar = element(by.css("data-bootstrapcomponents-calendar[data-svy-name='" + elementName + "']")).all(by.css("div")).get(0);
		if (state.toLowerCase() === 'visible') {
			browser.wait(EC.visibilityOf(calendar), 15 * 1000, 'Calendar not visible!').then(function() {
				wrapUp(callback, "validateEvent");
			}).catch(function(error) {
				tierdown(true);
				callback(new Error(error.message));
			});
		} else if (state.toLowerCase() === 'present') {
			
			browser.wait(EC.presenceOf(calendar), 15 * 1000, 'Calendar not found!').then(function() {
				wrapUp(callback, "validateEvent");
			}).catch(function(error) {
				tierdown(true);
				callback(new Error(error.message));
			});
		} else if (state.toLowerCase() === 'hidden') {
			browser.wait(EC.presenceOf(calendar), 15 * 1000, 'Calendar not rendered!').then(function(){
				browser.wait(EC.invisibilityOf(calendar), 15 * 1000, 'Calendar never disappeared!').then(function() {
					wrapUp(callback, "validateEvent");
				}).catch(function(error) {
					tierdown(true);
					callback(new Error(error.message));
				});
			}).catch(function(error) {
				tierdown(true);
				callback(new Error(error.message));
			})
		} else {
			tierdown(true);
			callback(new Error("Expected input is 'visible', 'present' or 'hidden'"));
		}
	});
	//END BOOTSTRAP CALENDAR

	//BOOTSTRAP INPUT GROUP
	When('bootstrap data-bootstrapextracomponents-input-group component with name {elementName} I want to insert the text {text} in field number {fieldNumber}', {timeout: 30 * 1000}, function(elementName, text, fieldNumber, callback){
		var inputGroup = element.all(by.xpath("//data-bootstrapextracomponents-input-group[@data-svy-name='" + elementName+"']"));
		browser.wait(EC.presenceOf(inputGroup.first()), 20 * 1000, 'Input group not found!').then(function(){
			var inputField = inputGroup.all(by.css("input[type='text']")).get(fieldNumber - 1);
			sendKeys(inputField, text).then(function(){
				wrapUp(callback, "insertEvent");
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('bootstrap data-bootstrapextracomponents-input-group component with name {elementName} I want to clear the text in field number {fieldNumber}', {timeout: 30 * 1000}, function(elementName, fieldNumber, callback){
		var inputGroup = element.all(by.xpath("//data-bootstrapextracomponents-input-group[@data-svy-name='" + elementName+"']"));
		browser.wait(EC.presenceOf(inputGroup.first()), 20 * 1000, 'Input group not found!').then(function(){
			var inputField = inputGroup.all(by.css("input[type='text']")).get(fieldNumber - 1);
			inputField.clear().then(function(){
				wrapUp(callback, "insertEvent");
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('bootstrap data-bootstrapextracomponents-input-group component with name {elementName} I want to click on button number {buttonNumber}', {timeout: 30 * 1000}, function(elementName, fieldNumber, callback){
		var inputGroup = element.all(by.xpath("//data-bootstrapextracomponents-input-group[@data-svy-name='" + elementName+"']"));
		browser.wait(EC.presenceOf(inputGroup.first()), 20 * 1000, 'Input group not found!').then(function(){
			var button = inputGroup.all(by.css("button")).get(fieldNumber - 1);
			browser.wait(EC.visibilityOf(button), 20 * 1000, 'Button not found!').then(function(){
				clickElement(button).then(function(){
					wrapUp(callback, "insertEvent");
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('bootstrap data-bootstrapextracomponents-input-group component with name {elementName} I want to validate that the text in field number {fieldNumber} equals the text {text}', {timeout: 30 * 1000}, function(elementName, fieldNumber, text, callback){
		var inputGroup = element.all(by.xpath("//data-bootstrapextracomponents-input-group[@data-svy-name='" + elementName+"']"));
		browser.wait(EC.presenceOf(inputGroup.first()), 20 * 1000, 'Input group not found!').then(function(){
			var inputField = inputGroup.all(by.xpath("input")).get(fieldNumber - 1);
			inputField.getAttribute('value').then(function(fieldText) {
				if(fieldText === text) {
					wrapUp(callback, "validateEvent");
				} else {
					console.log("Validation failed. Expected " + text + ". Got " + fieldText);
				}
			})
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END BOOTSTRAP INPUT GROUP

	//BOOTSTRAP LABEL
	Then('bootstrap data-bootstrapcomponents-label component with name {elementName} I want to validate that the label equals the exact text {text}', {timeout: 30 * 1000}, function(elementName, text, callback){
		var bootstrapLabel = element(by.xpath("//data-bootstrapcomponents-label[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.visibilityOf(bootstrapLabel), 30 * 1000, 'Label not found!').then(function(){
			bootstrapLabel.element(by.css("span")).getText().then(function(labelText){
				if(text.toLowerCase() == labelText.toLowerCase()) {
					wrapUp(callback, "validateEvent");
				} else {
					callback(new Error(`Validation failed. Expected '${text}'. Got '${labelText}' instead!`));
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('bootstrap data-bootstrapcomponents-label component with name {elementName} I want to validate that the label has no text', {timeout: 30 * 1000}, function(elementName, callback){
		var bootstrapLabel = element(by.xpath("//data-bootstrapcomponents-label[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.visibilityOf(bootstrapLabel), 30 * 1000, 'Label not found!').then(function(){
			bootstrapLabel.element(by.css("span")).getText().then(function(labelText){
				console.log(labelText)
				if(!labelText) {
					wrapUp(callback, "validateEvent");
				} else {
					console.log("Validation failed. Expected no value. Got '" + labelText + "'");
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('bootstrap data-bootstrapcomponents-label component with name {elementName} I want to validate that the label equals the partial text {text}', {timeout: 30 * 1000}, function(elementName, text, callback){
		var bootstrapLabel = element(by.xpath("//data-bootstrapcomponents-label[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.visibilityOf(bootstrapLabel), 30 * 1000, 'Label not found!').then(function(){
			bootstrapLabel.element(by.css("span")).getText().then(function(labelText){
				if(labelText.indexOf(text) > -1) {
					wrapUp(callback, "validateEvent");
				} else {
					console.log("Partial validation failed. Expected '" + text + "'. Got '" + labelText + "'");
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('bootstrap data-bootstrapcomponents-label component with name {elementName} is clicked', {timeout: 30 * 1000}, function(elementName, callback){
		var label = element(by.xpath("//data-bootstrapcomponents-label[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(label), 15 * 1000, 'Datalabel not found!').then(function(){
			clickElement(label.element(by.css('span'))).then(function(){
				wrapUp(callback, "clickEvent");
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END BOOTSTRAP LABEL

	//BOOTSTRAP DATA LABEL
	Then('bootstrap data-bootstrapcomponents-datalabel component with name {elementName} I want to validate that the label equals the exact text {text}', {timeout: 30 * 1000}, function(elementName, text, callback){
		var bootstrapLabel = element(by.xpath("//data-bootstrapcomponents-datalabel[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.visibilityOf(bootstrapLabel), 30 * 1000, 'Label not found!').then(function(){
			bootstrapLabel.element(by.css("span")).getText().then(function(labelText){
				if(text.toLowerCase() === labelText.toLowerCase()) {
					wrapUp(callback, "validateEvent");
				} else {
					console.log("Validation failed. Expected '" + text + "'. Got '" + labelText + "'");
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('bootstrap data-bootstrapcomponents-datalabel component with name {elementName} I want to validate and click on the label that has the exact text {text}', {timeout: 30 * 1000}, function(elementName, text, callback){
		var bootstrapLabel = element(by.xpath("//data-bootstrapcomponents-datalabel[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.visibilityOf(bootstrapLabel), 30 * 1000, 'Label not found!').then(function(){
			bootstrapLabel.element(by.css("span")).getText().then(function(labelText){
				if(text.toLowerCase() === labelText.toLowerCase()) {
					var span = bootstrapLabel.$('span');
					clickElement(span).then(function() {
						wrapUp(callback, "clickAndValidateEvent");
					})
				} else {
					console.log("Validation failed. Expected '" + text + "'. Got '" + labelText + "'");
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('bootstrap data-bootstrapcomponents-datalabel component with name {elementName} I want to validate that the label has no text', {timeout: 30 * 1000}, function(elementName, callback){
		var bootstrapLabel = element(by.xpath("//data-bootstrapcomponents-datalabel[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.visibilityOf(bootstrapLabel), 30 * 1000, 'Label not found!').then(function(){
			bootstrapLabel.element(by.css("span")).getText().then(function(labelText){
				console.log(labelText)
				if(!labelText) {
					wrapUp(callback, "validateEvent");
				} else {
					console.log("Validation failed. Expected no value. Got '" + labelText + "'");
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('bootstrap data-bootstrapcomponents-datalabel component with name {elementName} I want to validate that the label equals the partial text {text}', {timeout: 30 * 1000}, function(elementName, text, callback){
		var bootstrapLabel = element(by.xpath("//data-bootstrapcomponents-datalabel[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.visibilityOf(bootstrapLabel), 30 * 1000, 'Label not found!').then(function(){
			bootstrapLabel.element(by.css("span")).getText().then(function(labelText){
				if(labelText.indexOf(text) > -1) {
					wrapUp(callback, "validateEvent");
				} else {
					console.log("Partial validation failed. Expected '" + text + "'. Got '" + labelText + "'");
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	}); 

	When('bootstrap data-bootstrapcomponents-datalabel component with name {elementName} is clicked', {timeout: 30 * 1000}, function(elementName, callback){
		var dataLabel = element(by.xpath("//data-bootstrapcomponents-datalabel[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(dataLabel), 15 * 1000, 'Datalabel not found!').then(function(){
			clickElement(dataLabel.$('span')).then(function(){
				wrapUp(callback, "clickEvent");
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END BOOTSTRAP DATA LABEL

	//BOOTSTRAP SWITCH
	When("bootstrap data-bootstrapextracomponents-switch component with name {elementName} I want to change the state to {switchText}", {timeout: 30 * 1000}, function(elementName, switchText, callback){
		var servoySwitch = element(by.xpath("//data-bootstrapextracomponents-switch[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(servoySwitch), 20 * 1000, 'Switch not found!').then(function () {
			//Margin determins whether the switch is turned off or on
			servoySwitch.element(by.xpath("//div[@class='bootstrap-switch-container']")).getCssValue("margin-left").then(function (margin) {
				//Get the text of the left part of the switch
				servoySwitch.element(by.xpath("//span[contains(@class, 'bootstrap-switch-handle-on')]")).getText().then(function (textOn) {
					//Less than 0 means that the switch is turned off
					if (parseInt(margin) < 0) {
						//because the switch is off, we need to validate if the onText is equal to the given text
						//if it's equal, that means the switch has to be turned on
						if (textOn.toLowerCase() === switchText.toLowerCase()) {
							clickElement(servoySwitch).then(function() {
								wrapUp(callback, "switchEvent");
							})							
						} else {
							//the text does not equal the onText. Now it needs to check if it actually equals the offText
							//if it doesn't equal the offtext, an unknown state has been given
							servoySwitch.element(by.xpath("//span[contains(@class, 'bootstrap-switch-handle-off')]")).getText().then(function (textOff) {
								if(textOff.toLowerCase() === switchText.toLowerCase()) {
									wrapUp(callback, "switchEvent");
								} else {
									callback(new Error('Neither the off nor on text of the switch equals the given text!'));
									tierdown(true);
								}
							});	
						}
					} else { //Switch is turned on
						if (textOn.toLowerCase() === switchText.toLowerCase()) {
							servoySwitch.element(by.xpath("//span[contains(@class, 'bootstrap-switch-handle-off')]")).getText().then(function (textOff) {
								if(textOff.toLowerCase() === switchText.toLowerCase()) {
									wrapUp(callback, "switchEvent");
								} else {
									callback(new Error('Neither the off nor on text of the switch equals the given text!'));
									tierdown(true);
								}
							});
						} else {
							clickElement(servoySwitch).then(function() {
								wrapUp(callback, "switchEvent");
							});					
						}
					}
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END BOOTSTRAP SWITCH

	//BOOTSTRAP DROPDOWN
	When('bootstrap data-bootstrapextracomponents-dropdown component with name {elementName} is clicked', { timeout: 45 * 1000 }, function (elementName, callback) {
		var selectComponent = element(by.css("data-bootstrapextracomponents-dropdown[data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(selectComponent), 30 * 1000, 'Dropdown component not visible!').then(function(){
			clickElement(selectComponent).then(function(){				
				wrapUp(callback, "clickEvent");
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('bootstrap data-bootstrapextracomponents-dropdown component with name {elementName} I want to select the row with {text} as text', { timeout: 45 * 1000 }, function (elementName, text, callback) {
		var selectComponent = element(by.css("data-bootstrapextracomponents-dropdown[data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(selectComponent), 30 * 1000, 'Dropdown component not visible!').then(function(){
			clickElement(selectComponent).then(function(){
				var inputField = selectComponent.element(by.xpath("//a[text()[normalize-space() = '" + text + "']]"));
				clickElement(inputField).then(function(){
					wrapUp(callback, "clickEvent");
				});
			});
		}).catch(function (error) {
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	
	When('bootstrap data-bootstrapextracomponents-dropdown component with name {elementName} I want to select row number {rowNumber}', { timeout: 45 * 1000 }, function (elementName, rowNumber, callback) {
		var selectComponent = element(by.css("data-bootstrapextracomponents-dropdown[data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(selectComponent), 30 * 1000, 'Dropdown component not visible!').then(function(){
			clickElement(selectComponent).then(function(){
				var item = selectComponent.all(by.css('li')).get(rowNumber - 1)
				browser.wait(EC.presenceOf(item), 15 * 1000, 'No dropdown items have been found!').then(function(){
					clickElement(item).then(function(){
						wrapUp(callback, "clickEvent");
					});
				})
			});
		}).catch(function (error) {
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END BOOTSTRAP DROPDOWN

	//DATA-BOOTSTRAPCOMPONENTS-TABPANEL
	When('bootstrap data-bootstrapcomponents-tabpanel with name {elementName} I want to select the tab with the exact text {text}', {timeout: 30 * 1000}, function(elementName, text, callback) {
		text = text.toLowerCase();
		var tabpanel = element(by.css("data-bootstrapcomponents-tabpanel[data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(tabpanel), 15 * 1000, 'Tabpanel not found!').then(function() {
			var tabItem = tabpanel.all(by.xpath("//span[text()[contains(translate(., '" + text.toUpperCase() + "', '" + text.toLowerCase() + "'), '" + text + "')]]")).first();
			browser.wait(EC.visibilityOf(tabItem), 15 * 1000, 'Tab element not found!').then(function() {
				clickElement(tabItem).then(function() {
					wrapUp(callback, "clickEvent");
				});
			});			
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('bootstrap data-bootstrapcomponents-tabpanel with name {elementName} I want to select the tab with the partial text {text}', {timeout: 30 * 1000}, function(elementName, text, callback) {
		text = text.toLowerCase();
		var tabpanel = element(by.css("data-bootstrapcomponents-tabpanel[data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(tabpanel), 15 * 1000, 'Tabpanel not found!').then(function() {
			var tabItem = tabpanel.all(by.xpath("//span[text()[contains(translate(., '" + text.toUpperCase() + "', '" + text.toLowerCase() + "'), '" + text + "')]]")).first();
			clickElement(tabItem).then(function() {
				wrapUp(callback, "clickEvent");
			})
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('data-bootstrapcomponents-tabpanel with name {elementName} I expect that the tab with the exact text {text} is active', {timeout: 30 * 1000}, function(elementName, text, callback) {
		text = text.toLowerCase();
		var tabpanel = element(by.css("data-bootstrapcomponents-tabpanel[data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(tabpanel), 15 * 1000, 'Tabpanel not found!').then(function() {
			var tabItem = tabpanel.all(by.xpath("//span[text()[contains(translate(., '" + text.toUpperCase() + "', '" + text.toLowerCase() + "'), '" + text + "')]]")).first();
			var header = tabItem.element(by.xpath('..')).element(by.xpath('..')).element(by.xpath('..'));
			header.getAttribute('class').then(function(classes){
				if(classes.indexOf('active') > -1) {
					wrapUp(callback, 'validateEvent');
				} else {
					tierdown(false);
					callback(new Error('Selected tab is not active!'));
				}
			})
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END DATA-BOOTSTRAPCOMPONENTS-TABPANEL

	//BOOTSTRAP COMPONENTS INSIDE FORMCOMPONENT
	//TEXT FIELDS
	When('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-textbox component with name {elementName} the text {text} is inserted', { timeout: 30 * 1000 }, function (formComponentName, elementName, text, callback) {
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not visible!').then(function () {
			browser.wait(EC.presenceOf(fComponent.element(by.xpath(`//data-bootstrapcomponents-textbox[@data-svy-name='${elementName}']`))), 30 * 1000, 'Element not found!').then(function () {
				var tField = fComponent.element(by.xpath(`//data-bootstrapcomponents-textbox[@data-svy-name='${elementName}']`)).element(by.css("input"));
				browser.wait(EC.visibilityOf(tField), 30 * 1000, 'Textfield not found!').then(function(){
					sendKeys(tField, text).then(function () {
						wrapUp(callback, "insertTextEvent");
					});
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-textbox component with name {cElementName} I want to validate that text text is blank', {timeout: 30 * 1000}, function(formComponentName, elementName, callback){
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function(){
			var textField = fComponent.element(by.xpath(`//data-bootstrapcomponents-textbox[@data-svy-name='${elementName}']`)).element(by.css("input"));
			browser.wait(EC.presenceOf(textField), 30 * 1000, 'Textbox not found!').then(function(){
				textField.getAttribute('value').then(function(value) {
					if (!value) {
						wrapUp(callback, "validateEvent");
					} else {
						console.log("Validation failed. Expected an empty text field. Got " + value);
					}
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-textbox component with name {elementName} I want to validate that the input field equals the text {text}', { timeout: 30 * 1000 }, function (formComponentName, elementName, text, callback) {
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function () {
			var textField = fComponent.element(by.xpath(`//data-bootstrapcomponents-textbox[@data-svy-name='${elementName}']`)).element(by.css("input"));
			browser.wait(EC.visibilityOf(textField), 30 * 1000, 'Element not found!').then(function () {
				textField.getAttribute('value').then(function (textFieldText) {
					if (text === textFieldText) {
						wrapUp(callback, "validateEvent");
					} else {
						console.log("Validation failed. Expected " + text + ". Got " + textFieldText);
					}
				})
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});	
	
	When('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-textbox component with name {elementName} is clicked', { timeout: 30 * 1000 }, function (formComponentName, elementName, callback) {
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function () {
			var textField = fComponent.element(by.xpath(`//data-bootstrapcomponents-textbox[@data-svy-name='${elementName}']`)).element(by.css("input"));
			browser.wait(EC.visibilityOf(textField), 30 * 1000, 'Textfield not found!').then(function () {
				clickElement(textField).then(function () {
					wrapUp(callback, "insertTextEvent");
				}).catch(function (error) {			
					tierdown(true);
					callback(new Error(error.message));
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END TEXT FIELDS
	//DATA LABELS	
	Then('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-datalabel component with name {elementName} I want to validate that the label equals the exact text {text}', {timeout: 30 * 1000}, function(formComponentName, elementName, text, callback){
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function(){
			var bootstrapLabel = fComponent.element(by.xpath(`//data-bootstrapcomponents-datalabel[@data-svy-name='${elementName}']`));
			browser.wait(EC.visibilityOf(bootstrapLabel), 30 * 1000, 'Label not found!').then(function(){
				bootstrapLabel.element(by.css("span")).getText().then(function(labelText){
					if(text.toLowerCase() === labelText.toLowerCase()) {
						wrapUp(callback, "validateEvent");
					} else {
						console.log("Validation failed. Expected '" + text + "'. Got '" + labelText + "'");
					}
				});
			}).catch(function (error) {			
				tierdown(true);
				callback(new Error(error.message));
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-datalabel component with name {elementName} I want to validate that the label has no text', {timeout: 30 * 1000}, function(formComponentName, elementName, callback){
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function(){
			var bootstrapLabel = fComponent.element(by.xpath(`//data-bootstrapcomponents-datalabel[@data-svy-name='${elementName}']`));
			browser.wait(EC.presenceOf(bootstrapLabel), 30 * 1000, 'Label not found!').then(function(){
				bootstrapLabel.element(by.css("span")).getAttribute('textContent').then(function(labelText){
					if(!labelText) {
						wrapUp(callback, "validateEvent");
					} else {
						callback(new Error("Validation failed. Expected no value. Got '" + labelText + "'"));
					}
				});
			}).catch(function (error) {			
				tierdown(true);
				callback(new Error(error.message));
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-datalabel component with name {elementName} I want to validate that the label equals the partial text {text}', {timeout: 30 * 1000}, function(formComponentName, elementName, text, callback){
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function(){
			var bootstrapLabel = fComponent.element(by.xpath(`//data-bootstrapcomponents-datalabel[@data-svy-name='${elementName}']`));
			browser.wait(EC.visibilityOf(bootstrapLabel), 30 * 1000, 'Label not found!').then(function(){
				bootstrapLabel.element(by.css("span")).getText().then(function(labelText){
					if(labelText.indexOf(text) > -1) {
						wrapUp(callback, "validateEvent");
					} else {
						callback(new Error(`Partial validation failed. Expected '${text}'. Got '${labelText}'`));
					}
				});
			}).catch(function (error) {			
				tierdown(true);
				callback(new Error(error.message));
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	}); 

	When('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-datalabel component with name {elementName} is clicked', {timeout: 30 * 1000}, function(formComponentName, elementName, callback){
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function(){
			var dataLabel = fComponent.element(by.xpath(`//data-bootstrapcomponents-datalabel[@data-svy-name='${elementName}']`));
			browser.wait(EC.visibilityOf(dataLabel), 15 * 1000, 'Datalabel not found!').then(function(){
				clickElement(dataLabel).then(function(){
					wrapUp(callback, "clickEvent");
				});
			}).catch(function (error) {			
				tierdown(true);
				callback(new Error(error.message));
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END DATA LABELS
	//LABELS
	When('formcomponent with the name {elementName} with a data-bootstrapcomponents-label component with name {cElementName} is clicked', {timeout: 30 * 1000}, function(formComponentName, elementName, callback){
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function(){
			var label = fComponent.element(by.xpath(`//data-bootstrapcomponents-label[@data-svy-name='${elementName}']`));
			browser.wait(EC.visibilityOf(label), 30 * 1000, 'Label not found!').then(function(){
				clickElement(label).then(function(){
					wrapUp(callback, "clickEvent");
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('formcomponent with the name {elementName} with a data-bootstrapcomponents-label component with name {cElementName} I want to validate that the label equals the partial text {text}', {timeout: 30 * 1000}, function(formComponentName, elementName, text, callback) {
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function(){
			var label = fComponent.element(by.xpath(`//data-bootstrapcomponents-label[@data-svy-name='${elementName}']`));
			browser.wait(EC.visibilityOf(label), 30 * 1000, 'Label not found!').then(function(){
				label.getText().then(function(labelText) {
					if(labelText.indexOf(text) > -1) {
						wrapUp(callback, "validateEvent");
					} else {
						console.log(`'${text} + "' not found in the text '${labelText}'`);
					}
				})
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('formcomponent with the name {elementName} with a data-bootstrapcomponents-label component with name {cElementName} I want to validate that the label equals the exact text {text}', {timeout: 40 * 1000}, function(formComponentName, elementName, text, callback) {
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function(){
			var label = element(by.xpath(`//data-bootstrapcomponents-label[@data-svy-name='${elementName}']`));
			browser.wait(EC.visibilityOf(label), 30 * 1000, 'Label not found!').then(function(){
				label.getText().then(function(labelText) {
					console.log(labelText);
					console.log(text);
					if(labelText.toLowerCase() == text.toLowerCase()) {
						wrapUp(callback, "validateEvent");
					} else {
						callback(new Error(`Validation failed. Expected '${text}'. Got '${labelText}' instead!`));
					}
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('formcomponent with the name {elementName} with a bootstrap data-bootstrapcomponents-label component with name {elementName} I want to validate that the label has no text', { timeout: 30 * 1000 }, function (formComponentName, elementName, callback) {
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function () {
			var bootstrapLabel = fComponent.element(by.xpath(`//data-bootstrapcomponents-label[@data-svy-name='${elementName}']`));
			browser.wait(EC.visibilityOf(bootstrapLabel), 30 * 1000, 'Label not found!').then(function () {
				bootstrapLabel.element(by.css("span")).getText().then(function (labelText) {
					if (!labelText) {
						wrapUp(callback, "validateEvent");
					} else {
						callback(new Error("Validation failed. Expected no value. Got '" + labelText + "'"));
					}
				});
			}).catch(function (error) {			
				tierdown(true);
				callback(new Error(error.message));
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END LABELS

	//BUTTONS
	When('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-button component with name {elementName} is clicked', { timeout: 30 * 1000 }, function (formComponentName, elementName, callback) {
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not visible!').then(function () {
			browser.wait(EC.presenceOf(fComponent.element(by.xpath(`//data-bootstrapcomponents-button[@data-svy-name='${elementName}']`))), 30 * 1000, 'Element not found!').then(function () {
				var button = fComponent.element(by.xpath(`//data-bootstrapcomponents-button[@data-svy-name='${elementName}']`)).element(by.css("button"));
				clickElement(button).then(function(){
					wrapUp(callback, "clickEvent");
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-button component with name {elementName} I want to validate that the button is {enabled|disabled}', { timeout: 30 * 1000 }, function (formComponentName, elementName, state, callback) {
		var formComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(formComponent), 15 * 1000, 'Form component not found!').then(function(){
			var button = formComponent.element(by.xpath(`//data-bootstrapcomponents-button[@data-svy-name='${elementName}']`)).element(by.css("button"));
			browser.wait(EC.visibilityOf(button), 15 * 1000, 'Button not found!').then(function(){
				button.isEnabled().then(function(buttonState) {
					if(!buttonState && state === 'disabled' || buttonState && state === 'enabled') {
						wrapUp(callback, "validateEvent");
					} else {
						if(!buttonState) {
							callback(new Error('Button is currently disabled. Expected it to be enabled.'));
						} else {
							callback(new Error('Button is currently enabled. Expected it to be disabled.'));
						}
					}
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END BUTTONS

	//COMBOBOX
	When('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-select component with name {elementName} is clicked', { timeout: 30 * 1000 }, function (formComponentName, elementName, callback) {
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not visible!').then(function () {
			browser.wait(EC.presenceOf(fComponent.element(by.css("data-bootstrapcomponents-select[data-svy-name='" + elementName + "']"))), 30 * 1000, 'Element not found!').then(function () {
				var button = fComponent.element(by.css("data-bootstrapcomponents-select[data-svy-name='" + elementName + "']")).element(by.css('select'));
				clickElement(button).then(function(){
					wrapUp(callback, "clickEvent");
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('formcomponent with the name {formComponentName} with a data-bootstrapcomponents-select component with name {elementName} I want to validate that a row with the text {text} does not exist', {timeout: 30 * 1000}, function(formComponentName, elementName, text, callback){
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function(){
			var combobox = fComponent.element(by.css("data-bootstrapcomponents-select[data-svy-name='" + elementName + "']"));
			browser.wait(EC.visibilityOf(combobox), 30 * 1000, 'Combobox not found!').then(function(){
				var comboboxItem = combobox.element(by.css("[value='" + text + "']"));
				comboboxItem.isPresent().then(function(isPresent){
					if(!isPresent) {
						wrapUp(callback, "validateEvent")
					} else {
						console.log("Row with the text " + text+ " has been found!");
					}
				})
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('formcomponent with the name {formComponentName} with a data-bootstrapcomponents-select component with name {elementName} I want to select the combobox item with the exact text {text}', {timeout: 30 * 1000}, function(formComponentName, elementName, text, callback){
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function(){
			var combobox = fComponent.element(by.css("data-bootstrapcomponents-select[data-svy-name='" + elementName + "']"));
			browser.wait(EC.visibilityOf(combobox), 30 * 1000, 'Combobox not found!').then(function(){
				clickElement(combobox).then(function(){
					var comboboxItem = combobox.element(by.css("[value='" + text + "']"));
					browser.wait(EC.presenceOf(comboboxItem), 30 * 1000, 'Combobox row not found').then(function(){
						clickElement(comboboxItem).then(function(){
							clickElement(combobox).then(function(){
								wrapUp(callback, "clickEvent");
							});
						});
					});
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-select component with name {elementName} I want to select row number {rowNumber}', { timeout: 45 * 1000 }, function (formComponentName, elementName, rowNumber, callback) {
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent.first()), 15 * 1000, 'Formcomponent not found!').then(function () {
			var selectTable = fComponent.all(by.css("data-bootstrapcomponents-select[data-svy-name='" + elementName + "']")).all(by.css("select"));
			if (rowNumber) {
				selectTable.all(by.css('option')).then(function (options) {
					options[rowNumber].click().then(function () {
						wrapUp(callback, "clickEvent");
					})
				});
			}
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-select component with name {elementName} I want to validate that the selected row equals {text}', { timeout: 45 * 1000 }, function (formComponentName, elementName, text, callback) {
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent.first()), 15 * 1000, 'Formcomponent not found!').then(function () {
			var table = fComponent.all(by.css("data-bootstrapcomponents-select[data-svy-name='" + elementName + "']")).all(by.css("select"));
			var row = table.first().element(by.css("option[selected='selected']"));
			browser.wait(EC.presenceOf(row), 30 * 1000, 'No row is selected!').then(function () {
				row.getText().then(function (rowText) {
					if (rowText === text) {
						wrapUp(callback, "validateEvent");
					} else {
						console.log("Validation failed. Expected " + text + ". Got " + rowText);
					}
				})
			}).catch(function (error) {			
				tierdown(true);
				callback(new Error(error.message));
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//COMBOBOX

	//CHECKBOX
	When('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-checkbox component with name {elementName} I want it to be {checkboxState}', { timeout: 15 * 1000 }, function (formComponentName, elementName, checkboxOption, callback) {
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function () {
			var checkbox = fComponent.element(by.xpath(`//data-bootstrapcomponents-checkbox[@data-svy-name='${elementName}']`));
			browser.wait(EC.presenceOf(checkbox), 15 * 1000, 'Checkbox not found!').then(function () {
				checkbox.isSelected().then(function (isChecked) {
					if (isChecked && checkboxOption.toLowerCase() === "unchecked" || !isChecked && checkboxOption.toLowerCase() === "checked") {
						checkbox.element(by.css('label')).click().then(function () {
							wrapUp(callback, "checkboxEvent");
						})
					} else {
						console.log('Checkbox did not have to be changed');
						wrapUp(callback, "checkboxEvent");
					}
				})
			})
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-checkbox component with name {elementName} I want to validate that the checkbox is {checkBoxState}', { timeout: 30 * 1000 }, function (formComponentName, elementName, checkboxOption, callback) {
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function () {
			var checkbox = fComponent.element(by.css("data-bootstrapcomponents-checkbox[data-svy-name='" + elementName + "']")).element(by.css("input"));
			checkbox.isSelected().then(function (isChecked) {			
				if (isChecked && checkboxOption.toLowerCase() === "checked" || !isChecked && checkboxOption.toLowerCase() === "unchecked") {				
					wrapUp(callback, "checkboxEvent");
				} else {
					callback(new Error('Validation failed. State of the checkbox does not match the expected state!'));
					tierdown(true);
				}
			}).catch(function (error) {			
				tierdown(true);
				callback(new Error(error.message));
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-checkbox component with name {elementName} I want to validate that the checkbox label equals the text {text}', { timeout: 30 * 1000 }, function (formComponentName, elementName, text, callback) {
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function () {
			var checkbox = fComponent.element(by.css("data-bootstrapcomponents-checkbox[data-svy-name='" + elementName + "']")).element(by.css("span"));
			browser.wait(EC.visibilityOf(checkbox), 15 * 1000, 'Checkbox not found!').then(function(){
				checkbox.getText().then(function(inputText) {
					if(inputText === text) {
						wrapUp(callback, "validateEvent")
					} else {
						console.log("Validation failed. Expected " + text + ". Got " + inputText);
					}
				})
			}).catch(function (error) {			
				tierdown(true);
				callback(new Error(error.message));
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-checkbox component with name {elementName} I want to validate that the checkbox label partially equals the text {text}', { timeout: 30 * 1000 }, function (formComponentName, elementName, text, callback) {
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function () {
			var checkbox = fComponent.element(by.css("data-bootstrapcomponents-checkbox[data-svy-name='" + elementName + "']")).element(by.css("span"));
			browser.wait(EC.visibilityOf(checkbox), 15 * 1000, 'Checkbox not found!').then(function(){
				checkbox.getText().then(function(inputText) {
					if(inputText.indexOf(text) > -1) {
						wrapUp(callback, "validateEvent")
					} else {
						callback(new Error("Validation failed. Expected " + text + ". Got " + inputText));
					}
				})
			}).catch(function (error) {			
				tierdown(true);
				callback(new Error(error.message));
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END CHECKBOX

	//RADIOBUTTONS
	When('formcomponent with the name {formComponentName} with a data-bootstrapcomponents-choicegroup component with name {elementName} I want select item {radioNumber}', { timeout: 40 * 1000 }, function (formComponentName, elementName, radioNumber, callback) {
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function () {
			var choiceGroup = fComponent.element(by.xpath(`//data-bootstrapcomponents-choicegroup[@data-svy-name='${elementName}']`));
			var radio = choiceGroup.all(by.xpath(`//input[@type='radio']`)).get(radioNumber -1);
			browser.wait(EC.presenceOf(radio), 15 * 1000, 'Radio not found!').then(function() {
				clickElement(radio.element(by.xpath(".."))).then(function() {
					wrapUp(callback, "clickEvent");
				});
			});			
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('formcomponent with the name {formComponentName} with a data-bootstrapcomponents-choicegroup component with name {elementName} I want to validate that item {radioNumber} is {checkBoxState}', { timeout: 30 * 1000 }, function (formComponentName, elementName, radioNumber, checkboxOption, callback) {
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function () {
			var choiceGroup = fComponent.element(by.xpath(`//data-bootstrapcomponents-choicegroup[@data-svy-name='${elementName}']`));
			var radio = choiceGroup.all(by.css(`input[type='radio']`)).get(radioNumber -1);
			radio.getAttribute('class').then(function(classes) {
				switch(checkboxOption.toLowerCase()){				
					case "checked": 
					case "selected":
						if(classes.indexOf('ng-not-empty') > -1) {
							wrapUp(callback, "validateEvent");
						} else {
							callback(new Error("Given radio button is not checked!"));
						}
						break;
					case "unchecked": 
					case "not selected":
						if(classes.indexOf('ng-not-empty') == -1) {
							wrapUp(callback, "validateEvent");
						} else {
							callback(new Error("Given radio button is not checked!"));
						}
						break;
					default:
						callback(new Error("Only the keywords 'checked/selected' and 'unchecked/not selected' are supported!"))
						break;
				}
			})
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('formcomponent with the name {formComponentName} with a data-bootstrapcomponents-choicegroup component with name {elementName} I want to validate that item {radioNumber} its text equals the text {text}', { timeout: 30 * 1000 }, function (formComponentName, elementName, text, callback) {
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function () {
			var choiceGroup = fComponent.element(by.css(`data-bootstrapcomponents-choicegroup[data-svy-name='${elementName}']`));
			var radio = choiceGroup.all(by.css(`label`)).get(radioNumber -1);
			radio.getText().then(function(radioText) {
				if(radioText.indexOf(text) > -1) {
					wrapUp(callback, "validateEvent");
				} else {
					callback(new Error(`Validation failed! Expected: '${text}'. Got '${radioText}' instead!`))
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('formcomponent with the name {formComponentName} with a data-bootstrapcomponents-choicegroup component with name {elementName} I want to validate that item {radioNumber} partially equals the text {text}', { timeout: 30 * 1000 }, function (formComponentName, elementName, text, callback) {
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function () {
			var choiceGroup = fComponent.element(by.css(`data-bootstrapcomponents-choicegroup[data-svy-name='${elementName}']`));
			var radio = choiceGroup.all(by.css(`label`)).get(radioNumber -1);
			radio.getText().then(function(radioText) {
				if(radioText == text) {
					wrapUp(callback, "validateEvent");
				} else {
					callback(new Error(`Validation failed! Expected: '${text}'. Got '${radioText}' instead!`))
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END RADIOBUTTONS


	//INPUT GROUP
	When('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapextracomponents-input-group component with name {elementName} I want to insert the text {text} in field number {fieldNumber}', { timeout: 30 * 1000 }, function (formComponentName, elementName, text, fieldNumber, callback) {
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 15 * 1000, 'Formcomponent not found!').then(function () {
			var inputGroup = fComponent.all(by.css("data-bootstrapextracomponents-input-group[data-svy-name='" + elementName + "']"));
			browser.wait(EC.presenceOf(inputGroup.first()), 20 * 1000, 'Input group not found!').then(function () {
				var inputField = inputGroup.all(by.css("input[type='text']")).get(fieldNumber - 1);
				sendKeys(inputField, text).then(function () {
					wrapUp(callback, "insertEvent");
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapextracomponents-input-group component with name {elementName} I want to clear the text in field number {fieldNumber}', {timeout: 30 * 1000}, function(formComponentName, elementName, fieldNumber, callback){
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 15 * 1000, 'Formcomponent not found!').then(function () {
			var inputGroup = fComponent.all(by.css("data-bootstrapextracomponents-input-group[data-svy-name='" + elementName + "']"));
			browser.wait(EC.presenceOf(inputGroup.first()), 20 * 1000, 'Input group not found!').then(function () {
				var inputField = inputGroup.all(by.css("input[type='text']")).get(fieldNumber - 1);
				inputField.clear().then(function () {
					wrapUp(callback, "insertEvent");
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapextracomponents-input-group component with name {elementName} I want to click on button number {buttonNumber}', {timeout: 30 * 1000}, function(formComponentName, elementName, fieldNumber, callback){
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 15 * 1000, 'Formcomponent not found!').then(function () {
			var inputGroup = fComponent.all(by.css("data-bootstrapextracomponents-input-group[data-svy-name='" + elementName + "']"));
			browser.wait(EC.presenceOf(inputGroup.first()), 20 * 1000, 'Input group not found!').then(function () {
				var button = inputGroup.all(by.css("button")).get(fieldNumber - 1);
				browser.wait(EC.visibilityOf(button), 20 * 1000, 'Button not found!').then(function () {
					clickElement(button).then(function () {
						wrapUp(callback, "insertEvent");
					});
				});
			})
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapextracomponents-input-group component with name {elementName} I want to validate that the text in field number {fieldNumber} equals the text {text}', {timeout: 30 * 1000}, function(formComponentName, elementName, fieldNumber, text, callback){
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 15 * 1000, 'Formcomponent not found!').then(function () {
			var inputGroup = fComponent.all(by.css("data-bootstrapextracomponents-input-group[data-svy-name='" + elementName + "']"));
			browser.wait(EC.presenceOf(inputGroup.first()), 20 * 1000, 'Input group not found!').then(function () {
				var inputField = inputGroup.all(by.css("input")).get(fieldNumber - 1);
				inputField.getAttribute('value').then(function (fieldText) {
					if (fieldText === text) {
						wrapUp(callback, "validateEvent");
					} else {
						callback(new Error("Validation failed. Expected " + text + ". Got " + fieldText));
					}
				})
			})
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END INPUT GROUP
	//END BOOTSTRAP COMPONENTS INSIDE FORMCOMPONENT
	//END BOOTSTRAP COMPONENTS
	//DEFAULT COMPONENTS INSIDE FORM COMPONENTS
	When('Formcomponent with the name {formComponentName} with a servoy default input component with name {elementName} is clicked', {timeout: 30 * 1000}, function(formComponentName, elementName, callback){
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 15 * 1000, 'Formcomponent not found!').then(function () {
			var inputField = fComponent.element(by.xpath(`//input[@data-svy-name='${elementName}']`));
			browser.wait(EC.visibilityOf(inputField), 30 * 1000, 'Textfield not found!').then(function () {
				clickElement(inputField).then(function () {
					wrapUp(callback, 'insertEvent');
				}).catch(function (error) {			
					tierdown(true);
					callback(new Error(error.message));
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END DEFAULT COMPONENTS INSIDE FORM COMPONENTS
	//FORM COMPONENTS
	//WILDCARD ELEMENT EXISTANCE VALIDATION
	Then('formcomponent with the name {formComponentName} I expect an element with the name {elementName} to be present', {timeout: 30 * 1000}, function(formComponentName, elementName, callback) {
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function(){
			var wildcard = fComponent.element(by.xpath(`//*[@data-svy-name='${elementName}']`));
			browser.wait(EC.presenceOf(wildcard), 15 * 1000, 'Element not found!').then(function(){
				wrapUp(callback, "validateEvent");
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('formcomponent with the name {formComponentName} I expect an element with the name {elementName} to not be present', {timeout: 30 * 1000}, function(formComponentName, elementName, callback) {
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent.first()), 30 * 1000, 'Formcomponent not found!').then(function(){
			fComponent.all(by.xpath(`//*[data-svy-name='${elementName}']`)).then(function(items) {
				if(items.length === 0) {
					wrapUp(callback, "validateEvent");
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END WILDCARD ELEMENT EXISTANCE VALIDATION

	//SERVOY EXTRA COMPONENTS INSIDE FORMCOMPONENTS
	When('formcomponent with the name {formComponentName} with a servoy select2tokenizer component with name {elementName} is clicked', { timeout: 60 * 1000 }, function (fComponentName, elementName, callback) {
		var fComponent = element(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" + fComponentName + "']"));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function () {
			var tokenizer = fComponent.element(by.xpath(`//data-servoyextra-select2tokenizer[@data-svy-name='${elementName}']`));
			browser.wait(EC.presenceOf(tokenizer), 15 * 1000, 'Tokenizer not found!').then(function () {
				clickElement(tokenizer).then(function () {
					wrapUp(callback, "clickEvent");
				}).catch(function (error) {
					tierdown(true);
					callback(new Error(error.message));
				});
			})
		}).catch(function (error) {
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('formcomponent with the name {formComponentName} with a servoy select2tokenizer component with name {elementName} I want to unselect the item with the text {text}', { timeout: 20 * 1000 }, function (fComponentName, elementName, text, callback) {
		var fComponent = element(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" + formComponentName + "']"));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function () {
			var tokenizer = fComponent.element(by.xpath(`//data-servoyextra-select2tokenizer[@data-svy-name='${elementName}']`));
			browser.wait(EC.presenceOf(tokenizer), 15 * 1000, 'Tokenizer not found!').then(function () {
				var elemToDeselect = tokenizer.element(by.css("li[title='" + text + "']"));
				clickElement(elemToDeselect.element(by.css("span"))).then(function () {
					wrapUp(callback, "clickEvent");
				});
			});
		}).catch(function (error) {
			tierdown(true);
			callback(new Error(error.message));
		})
	});

	When('formcomponent with the name {formComponentName} with a servoy select2tokenizer component with name {elementName} the text {recordText} is inserted', { timeout: 60 * 1000 }, function (fComponentName, elementName, text, callback) {
		var fComponent = element(by.xpath(`//data-bootstrapcomponents-formcomponent[@data-svy-name='${formComponentName}']`));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function () {
			var elem = fComponent.element(by.xpath(`//data-servoyextra-select2tokenizer[@data-svy-name='${elementName}']`)).element(by.css("input"));
			sendKeys(elem, text, 'tokenizer').then(function () {
				wrapUp(callback, "Click event");
			})
		}).catch(function (error) {
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END SERVOY EXTRA COMPONENTS INSIDE FORMCOMPONENTS
	//END FORMCOMPONENTS

	//SERVOY GROUPING GRID COMPONENT
	When('servoy data-aggrid-groupingtable component with name {elementName} I scroll to the record with {string} as text', { timeout: 120 * 1000 }, function (elementName, recordText, callback) {
		groupingGridTableScroll(elementName, recordText, callback, false, false, false, false, false, null);
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to {rowOption} row level {rowLevel} with {rowText} as text', { timeout: timeoutAgAction }, function (elementName, rowOption, rowLevel, rowText, callback) {
		findRecordByRowLevel(elementName, rowText, rowOption, rowLevel - 1, callback);
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to sort the table by {sortBy}', { timeout: timeoutAgAction }, function (elementName, text, callback) {
		var grid = element(by.css(`data-aggrid-groupingtable[data-svy-name='${elementName}']`));
		browser.wait(EC.presenceOf(grid), 30 * 1000, 'Table not found!').then(function () {
			var gridHeader = grid.all(by.className("ag-header-row")).first();
			var columnHeader = gridHeader.all(by.xpath(`//span[text()[contains(translate(., '${text.toUpperCase()}', '${text.toLowerCase()}'), '${text.toLowerCase()}')]]`)).first();
			clickElement(columnHeader).then(function() {
				wrapUp(callback, "clickEvent");
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to group the table by {tableHeaderText}', { timeout: timeoutAgAction }, function (elementName, tableHeaderText, callback) {
		var table = element.all(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(element(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"))), 30 * 1000, 'Table not found!').then(function(){
			table.each(function(tableItems){
				var groupingHeaders = tableItems.all(by.xpath("//div[@class='ag-header-row']")).all(by.xpath("//div[contains(@class,'ag-header-cell') and contains(@class, 'g-header-cell-sortable')]"));
				groupingHeaders.each(function(headerItems){
					var headerText = headerItems.element(by.xpath("//span[text()='" + tableHeaderText + "']"))
					headerText.isPresent().then(function(isPresent){
						if(isPresent) {
							var elem = headerText.element(by.xpath("..")).element(by.xpath("..//span[@ref='eMenu']"));
							elem.isPresent().then(function(menuIsPresent){
								if(menuIsPresent) {
									browser.executeScript("arguments[0].click()", elem).then(function () {
										clickElement(tableItems.element(by.cssContainingText("span", "Group by " + tableHeaderText))).then(function () {
											wrapUp(callback, "tableGroupingEvent");
										});
									});
								}
							});
						}
					});
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to ungroup the table by {tableHeaderText}', { timeout: timeoutAgAction }, function (elementName, filterTableText, callback) {
		var grid = element.all(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(grid), 30 * 1000, 'Table not found!').then(function () {
			grid.each(function (menuItems) {
				menuItems.all(by.css(".ag-column-drop-cell")).each(function (orderByElement) {
					if (filterTableText.toLowerCase() !== "everything") {
						orderByElement.element(by.cssContainingText('.ag-column-drop-cell-text', filterTableText)).isPresent().then(function (present) {
							if (present) {
								clickElement(orderByElement.element(by.css(".ag-column-drop-cell-button"))).then(function () {
									wrapUp(callback, "removeTableFilterEvent");
								});
							}
						});
					}
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to drag the grouping item with {groupingText} as text to the start', { timeout: timeoutAgAction }, function (elementName, groupingText, callback) {		
		var table = element.all(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(element(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"))), 30 * 1000, 'Table not found!').then(function(){
			table.each(function (gridItems) {
				var fromElement = gridItems.all(by.xpath("//span[text()='" + groupingText + "']")).first().element(by.xpath("../span[@class='ag-column-drag']"));
				var toElement = gridItems.all(by.xpath("//span[@class='ag-column-drop-cell']/span[@class='ag-column-drag']")).first();
				dragAndDropd(fromElement, toElement).then(function () {
						wrapUp(callback, "aggridGroupMovingEvent")
					});					
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	var rowCount = 0;
	var lastRow = 0;
	Then('servoy data-aggrid-groupingtable component with name {elementName} I expect there will be {orderCount} orders placed', { timeout: timeoutAgAction }, function (elementName, orderCount, callback) {
		element.all(by.css('.ag-column-drop-cell')).count().then(function (count) {
			return count;
		}).then(function (count) {
			browser.sleep(2000).then(function () {
				calcRows(elementName, count, orderCount, callback);
			});
		});
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to scroll to the top', { timeout: 120 * 1000 }, function (elementName, callback) {
		groupingGridScrollToTop(elementName, callback);
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to select row number {rowNumber}', { timeout: 120 * 1000 }, function (elementName, rowNumber, callback) {
		rowNumber -= 1;
		var table = element(by.css(`data-aggrid-groupingtable[data-svy-name='${elementName}']`));
		browser.wait(EC.visibilityOf(table), 30 * 1000, 'Table not found!').then(function(){
			var locator = `div[row-index='${rowNumber}']`;
			//Rows are generated multiple times in the aggrid structure. The displayed rows are in the following wrapper
			var row = table.all(by.css(locator)).first();
			row.isPresent().then(function(isPresent) {
				if(isPresent) {					
					clickElement(row).then(function() {
						wrapUp(callback, "clickEvent");
					});				
				} else {
					groupingGridTableScroll(elementName, null, callback, true, null, null, null, true, false, locator);
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to double click row number {rowNumber}', { timeout: 120 * 1000 }, function (elementName, rowNumber, callback) {
		rowNumber -= 1;
		var table = element(by.css(`data-aggrid-groupingtable[data-svy-name='${elementName}']`));
		browser.wait(EC.visibilityOf(table), 30 * 1000, 'Table not found!').then(function(){
			agGridIsGrouped(elementName).then(function (isGrouped) {
				if (isGrouped) {
					return "ag-full-width-viewport";
				} else {
					return "ag-body-viewport";
				}
			}).then(function (cName) {
				var locator = `div[row-index='${rowNumber}']`;
				var rowContainer = table.all(by.className(cName)).first()
				var row = rowContainer.all(by.css(locator)).first();
				row.isPresent().then(function(isPresent) {
					if(isPresent) {
							doubleClickElement(row).then(function() {
								wrapUp(callback, "clickEvent");
							});	
					} else {
						groupingGridTableScroll(elementName, null, callback, true, null, null, null, true, false, locator);
					}
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to right click row number {rowNumber}', { timeout: 120 * 1000 }, function (elementName, rowNumber, callback) {
		rowNumber -= 1;
		var table = element(by.css(`data-aggrid-groupingtable[data-svy-name='${elementName}']`));
		browser.wait(EC.visibilityOf(table), 30 * 1000, 'Table not found!').then(function(){
			agGridIsGrouped(elementName).then(function (isGrouped) {
				if (isGrouped) {
					return "ag-full-width-viewport";
				} else {
					return "ag-body-viewport";
				}
			}).then(function (cName) {
				var locator = `div[row-index='${rowNumber}']`;
				var rowContainer = table.all(by.className(cName)).first()
				var row = rowContainer.all(by.css(locator)).last();
				row.isPresent().then(function(isPresent) {
					if(isPresent) { 
						rightClickElement(row).then(function() {
							wrapUp(callback, "clickEvent");
						});
					} else {
						groupingGridTableScroll(elementName, null, callback, true, null, null, null, true, false, locator);
					}
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to select the record with the text {text}', {timeout: 120 * 1000}, function(elementName, text, callback){
		groupingGridTableScroll(elementName, text, callback, true, null, false, false, false, null);
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to select the record with the partial text {text}', {timeout: 120 * 1000}, function(elementName, text, callback){
		groupingGridTableScroll(elementName, text, callback, true, null, false, false, false, null, null, null, true);
	});	
	When('servoy data-aggrid-groupingtable component with name {elementName} I want to double click the record with the text {text}', {timeout: 120 * 1000}, function(elementName, text, callback){
		groupingGridTableScroll(elementName, text, callback, true, null, false, false, true, null);
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to validate that a record with the text {text} exists', {timeout: 120 * 1000}, function(elementName, text, callback){
		groupingGridTableScroll(elementName, text, callback, false, null, false, false, false, null, null, null, false);
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to validate that a record with the partial text {text} exists', {timeout: 120 * 1000}, function(elementName, text, callback){
		groupingGridTableScroll(elementName, text, callback, false, null, false, false, false, null, null, null, true);
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to validate that a record with the text {text} does not exist', {timeout: 30 * 1000}, function(elementName, text, callback){
		text = text.toLowerCase();
		var table = element.all(by.css("data-aggrid-groupingtable[data-svy-name='"+elementName+"']"));
		browser.wait(EC.presenceOf(table.first()), 30 * 1000, 'Table not found!').then(function(){			
			table.each(function(tableItems){
				//wait untill the table is loaded
				var waitForInputField = tableItems.element(by.css("div[role=row]"));
				browser.wait(EC.visibilityOf(waitForInputField)).then(function(){
					var elem = tableItems.all(by.xpath("//*[text()[contains(translate(., '" + text.toUpperCase() + "', '" + text.toLowerCase() + "'), '" + text.toLowerCase() + "')]]")).first();
					elem.isPresent().then(function(isPresent){
						if(isPresent) {
							callback(new Error("Table item with the given text has been found!"));
						} else {
							wrapUp(callback, 'validateEvent');
						}
					});
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});




	When('servoy data-aggrid-groupingtable component with name {elementName} I want to validate that a record on row number {rowNumber} with the text {text} exists', {timeout: 30 * 1000}, function(elementName, rowNumber, text, callback){
		rowNumber -= 1;
		var table = element.all(by.css("data-aggrid-groupingtable[data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(table.first()), 30 * 1000, 'Table not found!').then(function(){
			agGridIsGrouped(elementName).then(function(isGrouped){
				if(isGrouped) {
					return "ag-full-width-viewport";
				} else {
					return "ag-body-viewport-wrapper";
				}
			}).then(function(containerClass) {
				//Rows are generated multiple times in the aggrid structure. The displayed rows are in the following wrapper
				var rowContainer = table.all(by.className(`${containerClass}`));
				// var row = rowContainer.element(by.css(`div[row-index='${rowNumber}']`));
				rowContainer.all(by.css(`div[row-index='${rowNumber}']`)).each(function(row) {
					var elem = row.element(by.xpath(`//*[text()[contains(translate(., '${text.toLowerCase()}', '${text.toLowerCase()}'), '${text.toLowerCase()}')]]`));
					elem.isPresent().then(function(isPresent){
						if(isPresent) {
							wrapUp(callback, 'validateEvent');
						} else {
							callback(new Error("Table item with the given text has not been found!"));
						}
					});
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to validate that a record on row number {rowNumber} with the text {text} does not exist', {timeout: 30 * 1000}, function(elementName, rowNumber, text, callback){
		rowNumber -= 1;
		var table = element.all(by.css("data-aggrid-groupingtable[data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(table.first()), 30 * 1000, 'Table not found!').then(function(){
			agGridIsGrouped(elementName).then(function(isGrouped){
				if(isGrouped) {
					return "ag-full-width-viewport";
				} else {
					return "ag-body-viewport-wrapper";
				}
			}).then(function(containerClass) {
				//Rows are generated multiple times in the aggrid structure. The displayed rows are in the following wrapper
				var rowContainer = table.all(by.className(`${containerClass}`));
				// var row = rowContainer.element(by.css(`div[row-index='${rowNumber}']`));
				rowContainer.all(by.css(`div[row-index='${rowNumber}']`)).each(function(row) {
					var elem = row.element(by.xpath(`//*[text()[contains(translate(., '${text.toLowerCase()}', '${text.toLowerCase()}'), '${text.toLowerCase()}')]]`));
					elem.isPresent().then(function(isPresent){
						if(isPresent) {
							callback(new Error("Table item with the given text has been found!"));
						} else {
							wrapUp(callback, 'validateEvent');
						}
					});
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});



	When('servoy data-aggrid-groupingtable component with name {elementName} I want to scroll and select the row with the text {rowText}', { timeout: 120 * 1000}, function(elementName, text, callback){
		groupingGridTableScroll(elementName, text, callback, true, null, false, false, false, null);
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to scroll and double click the row with the text {rowText}', { timeout: 120 * 1000}, function(elementName, text, callback){
		groupingGridTableScroll(elementName, text, callback, true, null, false, true, false, null);
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to scroll to the row with text {rowText}', { timeout: 120 * 1000}, function(elementName, text, callback){
		groupingGridTableScroll(elementName, text, callback, false, null, false, false, false, null);
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to scroll to row number {rowNumber}', {timeout: 120 * 1000}, function(elementName, rowNumber, callback){
		rowNumber -= 1;
		var table = element(by.css(`data-aggrid-groupingtable[data-svy-name='${elementName}']`));
		browser.wait(EC.visibilityOf(table), 30 * 1000, 'Table not found!').then(function(){
			agGridIsGrouped(elementName).then(function(isGrouped){
				if(isGrouped) {
					return "ag-full-width-viewport";
				} else {
					return "ag-body-viewport";
				}
			}).then(function(containerClass) {
				var locator = `div[row-index='${(rowNumber).toString()}']`;
				//Rows are generated multiple times in the aggrid structure. The displayed rows are in the following wrapper
				var rowContainer = table.element(by.xpath(`//div[contains(@class, '${containerClass}')]`));
				var row = rowContainer.element(by.css(locator));
				row.isPresent().then(function(isPresent) {
					if(isPresent) {
						clickElement(row).then(function() {
							wrapUp(callback, "clickEvent");
						});
					} else {
						groupingGridTableScroll(elementName, null, callback, true, null, null, null, false, false, locator);
					}
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to scroll and select the row with text {rowText} and click the element which contains the class {className}', {timeout: 120 * 1000}, function(elementName, text, className, callback){
		groupingGridTableScroll(elementName, text, callback, true, className, null, null, false, null, null);
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to scroll and select the row with text {rowText} and double click the element which contains the class {className}', {timeout: 120 * 1000}, function(elementName, text, className, callback){
		groupingGridTableScroll(elementName, text, callback, true, className, null, null, true, null, null);
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to click on the element which contains the class {className} on the row with the text {text}', {timeout: 45 * 1000}, function(elementName, className, text, callback){
		groupingGridTableScroll(elementName, text, callback, true, className, null, null, false, null, null);
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to double click on the element which contains the class {className} on the row with the text {text}', {timeout: 45 * 1000}, function(elementName, className, text, callback){
		groupingGridTableScroll(elementName, text, callback, true, className, null, null, true, null, null);
	});
	
	When('servoy data-aggrid-groupingtable component with name {elementName} I want to click on the element which contains the class {className} in row number {rowNumber}', {timeout: 45 * 1000}, function(elementName, className, rowNumber, callback){
		rowNumber -= 1;
		var table = element(by.css(`data-aggrid-groupingtable[data-svy-name='${elementName}']`));
		browser.wait(EC.visibilityOf(table), 30 * 1000, 'Table not found!').then(function(){
			agGridIsGrouped(elementName).then(function(isGrouped){
				if(isGrouped) {
					return "ag-full-width-viewport";
				} else {
					return "ag-body-viewport";
				}
			}).then(function(containerClass) {
				var locator = `div[row-index='${rowNumber}']`;
				//Rows are generated multiple times in the aggrid structure. The displayed rows are in the following wrapper
				var rowContainer = table.all(by.className(containerClass));
				var row = rowContainer.all(by.css(locator)).last();
				row.isPresent().then(function(isPresent) {
					console.log(isPresent);
					if(isPresent) {
						var elemWithClass = row.element(by.className(className));
						browser.wait(EC.presenceOf(elemWithClass), 15 * 1000, 'Row with the given class has not been found!').then(function() {
							clickElement(elemWithClass).then(function() {
								wrapUp(callback, "clickEvent");
							});
						});
						
					 } else {
						groupingGridTableScroll(elementName, null, callback, true, className, null, null, false, false, locator);
					}
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to double click on the element which contains the class {className} in row number {rowNumber}', {timeout: 45 * 1000}, function(elementName, className, rowNumber, callback){
		rowNumber -= 1;
		var table = element(by.css(`data-aggrid-groupingtable[data-svy-name='${elementName}']`));
		browser.wait(EC.visibilityOf(table), 30 * 1000, 'Table not found!').then(function(){
			agGridIsGrouped(elementName).then(function(isGrouped){
				if(isGrouped) {
					return "ag-full-width-viewport";
				} else {
					return "ag-body-viewport";
				}
			}).then(function(containerClass) {
				var locator = `div[row-index='${(rowNumber).toString()}']`;
				//Rows are generated multiple times in the aggrid structure. The displayed rows are in the following wrapper
				var rowContainer = table.element(by.xpath(`//div[contains(@class, '${containerClass}')]`));
				var row = rowContainer.element(by.css(locator));
				row.isPresent().then(function(isPresent) {
					if(isPresent) {
						doubleClickElement(row.element(by.className(className))).then(function() {
							wrapUp(callback, "clickEvent");
						});
					} else {
						groupingGridTableScroll(elementName, null, callback, true, className, null, null, true, false, locator);
					}
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('servoy data-aggrid-groupingtable component with name {elementName} I want to validate that there are/is {count} row(s)', { timeout: 30 * 1000 }, function (elementName, count, callback) {
		var table = element.all(by.css(`data-aggrid-groupingtable[data-svy-name='${elementName}']`));
		browser.wait(EC.presenceOf(table.first()), 25 * 1000, 'Table not found!').then(function(){		
			agGridIsGrouped(elementName).then(function (isGrouped) {
				if (isGrouped) {
					return "ag-full-width-viewport";
				} else {
					return "ag-body-viewport";
				}
			}).then(function (containerClass) {
				var rowContainer = table.all(by.xpath(`//div[contains(@class, '${containerClass}')]`));
				var rows = rowContainer.all(by.css("div[role=row]"));
				rows.count().then(function(rowCount){
					if(rowCount == count) {
						wrapUp(callback, 'validateEvent');
					} else {
						callback(new Error("Validation failed! Expected " + count + " rows. Got " + rowCount));
					}
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	//GROUPING GRID INSERT EVENTS
	When('servoy data-aggrid-groupingtable component with name {elementName} I want to insert the text {text} on rownumber {rowNumber} on columnnumber {columnNumber}', { timeout: 30 * 1000 }, function (elementName, text, rowNumber, columnNumber, callback) {
		rowNumber -= 1;
		var table = element(by.css(`data-aggrid-groupingtable[data-svy-name='${elementName}']`));
		browser.wait(EC.visibilityOf(table), 30 * 1000, 'Table not found!').then(function () {
			agGridIsGrouped(elementName).then(function (isGrouped) {
				if (isGrouped) {
					return "ag-full-width-viewport";
				} else {
					return "ag-body-viewport";
				}
			}).then(function (containerClass) {
				var rowContainer = table.element(by.xpath(`//div[contains(@class, '${containerClass}')]`));
				var row = rowContainer.element(by.css(`div[row-index='${rowNumber}']`));
				var col = row.all(by.css("div[role=gridcell]")).get(columnNumber - 1);
				browser.wait(EC.presenceOf(col), 15 * 1000).then(function () {					
					doubleClickElement(col).then(function () {
						//certain versions of the grid uses an input field. Others a div.
						var inputField = col.element(by.css("input[class='ag-cell-edit-input']"))
						inputField.sendKeys(text).then(function () {								
							col.sendKeys(protractor.Key.TAB).then(function () {
								browser.wait(EC.visibilityOf(col), 15 * 1000).then(function () {
									col = row.all(by.css("div[role=gridcell]")).get(columnNumber - 1);
									col.getText().then(function (newText) {
										if (newText === text) {
											wrapUp(callback, "insertEvent");
										} else {
											callback(new Error(`Validation failed! Expected '${text}'. Got '${newText}'. Possibility is that the column is not editable`))
										}
									});
								});
							});
						});
					});
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to double click on the combobox on rownumber {rowNumber} on columnnumber {columnNumber} and select the item with the text {text}', {timeout: 30 * 1000}, function(elementName, rowNumber, columnNumber, text, callback) {		
		rowNumber -= 1;
		var table = element(by.css("data-aggrid-groupingtable[data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(table), 30 * 1000, 'Table not found!').then(function () {
			agGridIsGrouped(elementName).then(function (isGrouped) {
				if (isGrouped) {
					return "ag-full-width-viewport";
				} else {
					return "ag-body-viewport";
				}
			}).then(function (containerClass) {
				var rowContainer = table.element(by.xpath("//div[contains(@class, '" + containerClass + "')]"));
				var row = rowContainer.element(by.css("div[row-index='" + rowNumber + "']"));
				var col = row.all(by.css("div[role=gridcell]")).get(columnNumber - 1);
				browser.wait(EC.visibilityOf(col), 15 * 1000).then(function () {
					doubleClickElement(col).then(function () {
						//click again to open the combobox
						col.click().then(function(){
							//clicks the option with the given text
							col.element(by.css("option[value='"+text+"']")).click().then(function(){
								clickElement(col).then(function(){
									col.sendKeys(protractor.Key.TAB).then(function(){
										col = row.all(by.css("div[role=gridcell]")).get(columnNumber - 1);
										//the enter key triggers an onColumnDataChange - this can refresh the table. Wait until the column is visible again
										browser.wait(EC.visibilityOf(col), 15 * 1000).then(function(){
											col.getAttribute('textContent').then(function(newText) {
												// validate input
												if (newText === text) {
													wrapUp(callback, "clickEvent");
												} else {
													callback(new Error("Validation failed! Expected '" + text + "'. Got '" + newText + "'. Possibility is that the column is not editable"))
												}
											});
										});
									});
								});
							});
						});
					});
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to double click on the typeahead on rownumber {rowNumber} on columnnumber {columnNumber} and select the item with the text {text}', {timeout: 30 * 1000}, function(elementName, rowNumber, columnNumber, text, callback) {
		var table = element.all(by.css("data-aggrid-groupingtable[data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(table.first()), 30 * 1000, 'Table not found!').then(function(){
			table.each(function(tableItems){
				agGridIsGrouped(elementName).then(function(isGrouped){
					if(isGrouped) {
						return "ag-full-width-viewport";
					} else {
						return "ag-body-viewport";
					}
				}).then(function(containerClass) {
					var rowContainer = tableItems.all(by.xpath("//div[contains(@class, '" + containerClass + "')]"));
					rowContainer.each(function(rowElements){
						browser.wait(EC.presenceOf(rowElements.all(by.css("div[role=row]")).get(0))).then(function(){
							var row = rowElements.all(by.css("div[role=row]")).get(rowNumber - 2);
							var col = row.all(by.css("div[role=gridcell]")).get(columnNumber - 1);
							doubleClickElement(col).then(function () {
								var comboBoxItem = element.all(by.xpath("//ul[contains(@class, 'dropdown-menu')]"))
									.all(by.xpath("//a[text()='" + text + "']")).first();
								browser.wait(EC.visibilityOf(comboBoxItem), 30 * 1000, 'Combobox item not found!').then(function () {
									browser.wait(EC.elementToBeClickable(comboBoxItem), 30 * 1000, 'Combobox item not clickable!').then(function () {
										clickElement(comboBoxItem).then(function () {
											col.sendKeys(protractor.Key.TAB).then(function() {
												browser.wait(EC.visibilityOf(col), 15 * 1000).then(function(){										
													col.getAttribute('textContent').then(function(newText) {
														if (newText === text) {
															wrapUp(callback, 'clickEvent');
														} else {
															callback(new Error("Validation failed! Expected '" + text + "'. Got '" + newText + "'. Possibility is that the column is not editable"))
														}
													});
												});
											});
										});
									});
								});
							});
						});
					});
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to double click on the calendar on rownumber {rowNumber} on columnnumber {columnNumber} and set the date to {day} {month} {year}', {timeout: 30 * 1000}, function(elementName, rowNumber, columnNumber, day, month, year, callback) {
		var table = element.all(by.css("data-aggrid-groupingtable[data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(table.first()), 30 * 1000, 'Table not found!').then(function(){
			table.each(function(tableItems){
				agGridIsGrouped(elementName).then(function(isGrouped){
					if(isGrouped) {
						return "ag-full-width-viewport";
					} else {
						return "ag-body-viewport";
					}
				}).then(function(containerClass) {
					var rowContainer = tableItems.all(by.xpath("//div[contains(@class, '" + containerClass + "')]"));
					rowContainer.each(function(rowElements){
						browser.wait(EC.presenceOf(rowElements.all(by.css("div[role=row]")).get(0))).then(function(){
							var selectedRow = rowElements.all(by.css("div[role=row]")).get(rowNumber - 2);
							var selectedColumnToValidate = selectedRow.all(by.css("div[role=gridcell]")).get(columnNumber - 1);
							doubleClickElement(selectedColumnToValidate).then(function () {
								setCalendar(day, month, year, null).then(function() {
									wrapUp(callback, "calendarEvent");
								});
							});
						});
					});
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END GROUPING GRID INSERT EVENTS
	//END AGGRID COMPONENT

	//I want to close the community edition popup/
	Then('I want to close the community edition popup', { timeout: 10 * 1000 }, function (callback) {
		var communityPopup = element(by.xpath("//div[@id='infoPanel']"));
		communityPopup.element(by.cssContainingText("a", "Close")).isPresent().then(function (isPresent) {
			if (isPresent) {
				clickElement(communityPopup.element(by.cssContainingText("a", "Close"))).then(function () {
					callback();
				});
			} else {
				callback();
			}
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	//TOAST COMPONENT
	Then('default toast component I want to validate that there is a(n) {toastType} toast present', { timeout: 30 * 1000 }, function (toastType, callback) {
		browser.wait(EC.visibilityOf(element(by.xpath("//div[@id='toast-container']")).element(by.xpath("//div[@class='toast toast-" + toastType + "']"))), 30 * 1000, 'Toast popup not found!').then(function () {
			element(by.xpath("//div[@id='toast-container']")).element(by.xpath("//div[@class='toast toast-" + toastType + "']")).isPresent().then(function (isPresent) {
				if (isPresent) {
					wrapUp(callback, "toastValidateEvent");
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('default toast component I want to validate that the text of the {toastType} toast equals {toastMessage}', { timeout: 60 * 1000 }, function (toastType, toastMessage, callback) {
		element(by.xpath("//div[@id='toast-container']")).element(by.xpath("//div[@class='toast toast-" + toastType + "']")).element(by.xpath("//div[@class='toast-message']")).isPresent().then(function (isPresent) {
			if (isPresent) {
				element(by.xpath("//div[@id='toast-container']")).element(by.xpath("//div[@class='toast toast-" + toastType + "']")).element(by.xpath("//div[@class='toast-message']")).getText().then(function (text) {
					if (text.toLowerCase() === toastMessage.toLowerCase()) {
						wrapUp(callback, "toastValidateTextEvent");
					}
				});
			}
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('default toast component I want to validate that the text of the toast message equals {toastMessage}', { timeout: 60 * 1000 }, function ( toastMessage, callback) {
		var toast = element(by.xpath("//div[@class='toast-message']"))
		browser.wait(EC.presenceOf(toast), 30 * 1000, 'Toast message did not appear within the timer').then(function() {
			toast.getText().then(function (text) {
				if (text.toLowerCase() === toastMessage.toLowerCase()) {
					wrapUp(callback, "toastValidateTextEvent");
				} else {
					callback(new Error(`Toast message did not appear within the timer. Toast message is ${text}`));
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('default toast component I want wait until the toast popup is gone', { timeout: 30 * 1000 }, function (callback) {
		browser.wait(EC.invisibilityOf(element(by.xpath("//div[@id='toast-container']"))), 15 * 1000).then(function () {
			wrapUp(callback, "toastEvent");
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('I want to wait for maximum 5 minutes for a toast message with the text {text} to appear', {timeout: 300 * 1000}, function(toastMessage, callback) {
		var toast = element(by.xpath("//div[@id='toast-container']")).element(by.xpath("//div[@class='toast-message']"));
		browser.wait(EC.visibilityOf(toast), 299 * 1000, 'Toast message not displayed after 5 minutes!').then(function () {
			toast.element(by.xpath("//div[@class='toast-message']")).getText().then(function (text) {
				if (text.toLowerCase() === toastMessage.toLowerCase()) {
					wrapUp(callback, "toastValidateTextEvent");
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	})

	Then('I want to wait for maximum 5 minutes for a toast message which contains the text {text} to appear', {timeout: 300 * 1000}, function(toastMessage, callback) {
		var toast = element(by.xpath("//div[@id='toast-container']")).element(by.xpath("//div[@class='toast-message']"));
		browser.wait(EC.visibilityOf(toast), 299 * 1000, 'Toast message not displayed after 5 minutes!').then(function () {
			toast.element(by.xpath("//div[@class='toast-message']")).getText().then(function (text) {
				if (text.toLowerCase().indexOf(toastMessage.toLowerCase()) > -1) {
					wrapUp(callback, "toastValidateTextEvent");
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	})
	//END TOAST COMPONENT

	//STANDARD SCROLL EVENTS
	When('I want to scroll to an element with name {elementName}', {timeout: 30 * 1000}, function(elementName, callback) {
		var elementToScrollTo = element(by.xpath("//*[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(elementToScrollTo)).then(function(){
			browser.executeScript("arguments[0].scrollIntoView();", elementToScrollTo.getWebElement()).then(function(){
				wrapUp(callback, "scrollEvent");
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	})
	//END STANDARD SCROLL EVENTS

	//DEFAULT HTML COMPONENTS
	When('default textarea component with name {elementName} the text {text} is inserted', { timeout: 30 * 1000 }, function (elementName, text, callback) {
		var txtArea = element(by.css("textarea[data-svy-name='" + elementName + "']"))
		browser.wait(EC.visibilityOf(txtArea), 30 * 1000, 'Textarea not found!').then(function(){
			sendKeys(txtArea, text).then(function () {
				wrapUp(callback, "Insert value event");
			}).catch(function (error) {				
				tierdown(true);
				callback(new Error(error.message));
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('default textarea component with name {elementName} I want to validate that the input field is empty', {timeout: 30 * 1000}, function(elementName, callback){
		var inputField = element(by.css(`textarea[data-svy-name='${elementName}']`))
		browser.wait(EC.visibilityOf(inputField), 30 * 1000, 'Textarea not found!').then(function(){
			inputField.getAttribute('value').then(function(inputText){
				if(!inputText) {
					wrapUp(callback, "validateEvent");
				} else {
					callback(new Error(`Text area with the given name is not empty! It contains the text ${inputText}`));
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('default textarea component with name {elementName} I want to validate that the input field equals the text {text}', {timeout: 30 * 1000}, function(elementName, text, callback){
		var inputField = element(by.xpath("//textarea[@data-svy-name='" + elementName + "']"))
		browser.wait(EC.visibilityOf(inputField), 30 * 1000, 'Textarea not found!').then(function(){
			inputField.getAttribute('value').then(function(inputText){
				return inputText === text;
			}).then(function(isValidated){
				if(isValidated) {
					wrapUp(callback, 'validateEvent');
				}
			}).catch(function (error) {			
				tierdown(true);
				callback(new Error(error.message));
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END DEFAULT HTML COMPONENTS

	//DIALOG POPUP COMPONENT
	When('default modal-dialog component the button with the text {text} is pressed', {timeout: 30 * 1000}, function(text, callback){
		var dialog = element(by.xpath("//div[@class='modal-dialog']")).all(by.xpath("//button[text()[normalize-space() = '" + text + "']]")).last();
		browser.wait(EC.presenceOf(dialog), 30 * 1000, 'Dialog button not found!').then(function(){
			clickElement(dialog).then(function(){
				wrapUp(callback, 'clickEvent');
			}).catch(function (error) {			
				tierdown(true);
				callback(new Error(error.message));
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('default modal-dialog I want to wait untill the modal-dialog view is gone', {timeout: 15 * 1000}, function(callback){
		var dialog = element(by.xpath("//div[contains(@class, 'modal-backdrop')]"));
		waitUntillElementIsGone(dialog).then(function(){
			wrapUp(callback, 'dialogEvent');
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('default modal-dialog component I want to validate that the text {dialogText} is present', { timeout: 15 * 1000 }, function (dialogText, callback) {
		element.all(by.xpath("//div[contains(@class, 'modal-dialog')]")).each(function(dialogItems){
			var textMessageThing = dialogItems.element(by.cssContainingText(".bootbox-body", dialogText))
			textMessageThing.isPresent().then(function(isPresent){
				if(isPresent) {
					wrapUp(callback, "validateEvent")
				}
			})
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('I expect a modal-dialog popup to appear', { timeout: 15 * 1000 }, function (callback) {
		var dialog = element(by.xpath("//div[@class='modal-content']"));
		browser.wait(EC.presenceOf(dialog), 10 * 1000, 'Dialog not present!').then(function(){			
			wrapUp(callback, "modalDialogEvent");			
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('default input-dialog I want to insert the text {text}', {timeout: 30 * 1000}, function(text, callback){
		var dialog = element(by.xpath("//div[@class='modal-dialog']"));
		browser.wait(EC.presenceOf(dialog), 30 * 1000, 'Dialog not found!').then(function(){
			var inputField = dialog.element(by.css("input"));
			sendKeys(inputField, text).then(function(){
				wrapUp(callback, "insertEvent");
			}).catch(function (error) {			
				tierdown(true);
				callback(new Error(error.message));
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('default select-dialog I want to select the combobox item with the text {text}', {timeout: 30 * 1000}, function(text, callback){
		var dialog = element(by.xpath("//div[@class='modal-dialog']"));
		browser.wait(EC.presenceOf(dialog), 30 * 1000, 'Dialog not found!').then(function(){
			var selectField = dialog.element(by.css("select"));
			clickElement(selectField).then(function(){
				var optionField = selectField.element(by.css("option[value='"+text+"']"));
				clickElement(optionField).then(function(){
					wrapUp(callback, "clickEvent");
				});
			}).catch(function (error) {			
				tierdown(true);
				callback(new Error(error.message));
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END MODEL DIALOG COMPONENT

	//DEFAULT POPUP
	When('default default popup menu I want to select the menu item with the text {text}', {timeout: 30 * 1000}, function(text, callback) {
		var menu = element(by.className('yui-module'));
		browser.wait(EC.presenceOf(menu), 15 * 1000, 'Popup menu has not been found!').then(function() {
			console.log('found menu')
			clickElement(menu.element(by.xpath(`//span[text()='${text}']`))).then(function() {
				wrapUp(callback, "clickEvent");
			});
		}).catch(function(error) {
			tierdown(false);
			callback(new Error(error.message));
		})
	})
	//END DEFAULT POPUP

	//SERVOY WINDOW COMPONENT 
	When('servoy window component I want to wait untill the window disappears', {timeout: 45 * 1000}, function(callback){
		var window = element(by.xpath("//div[contains(@class, 'window')]"));
		window.isPresent().then(function(isPresent){
			if(!isPresent) {
				wrapUp(callback, "dialogEvent");
			} else{
				waitUntillElementIsGone(window).then(function(){
					wrapUp(callback, 'dialogEvent');
				}).catch(function (error) {			
					tierdown(true);
					callback(new Error(error.message));
				});
			}
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END SERVOY WINDOW COMPONENT

	//SERVOY TABPANEL COMPONENT
	When('servoy data-servoydefault-tabpanel component with name {elementName} the tab with the text {text} is clicked', {timeout: 60 * 1000}, function(elementName, text, callback){
		var tabPanel = element(by.css(`data-servoydefault-tabpanel[data-svy-name='${elementName}']`));
		browser.wait(EC.visibilityOf(tabPanel), 30 * 1000, 'Tabelpanel not found!').then(function(){
			var item = tabPanel.element(by.xpath(`//span[text()='${text}']`));
			clickElement(item).then(function() {
				wrapUp(callback, "clickEvent");
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy data-servoydefault-tabpanel component with name {elementName} I want to slide to the {direction}', {timeout: 60 * 1000}, function(elementName, direction, callback){
		var tabPanel = element(by.xpath("//data-servoydefault-tabpanel[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.visibilityOf(tabPanel), 30 * 1000, 'Tabelpanel not found!').then(function(){
			var icon;
			if(direction.toLowerCase() === 'left') {
				icon = tabPanel.element(by.className('glyphicon-chevron-left'));
			} else if(direction.toLowerCase() === 'right') {
				icon = tabPanel.element(by.className('glyphicon-chevron-right'));
			} else {
				callback(new Error("The navigation can only slide to the 'left' or 'right'"));
			}
			clickElement(icon).then(function() {
				wrapUp(callback, "clickEvent");
			})
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy data-servoydefault-tabpanel component with name {elementName} the tab with the exact text {text} is clicked', {timeout: 60 * 1000}, function(elementName, text, callback){
		var tabPanel = element.all(by.xpath("//data-servoydefault-tabpanel[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.visibilityOf(element(by.xpath("//data-servoydefault-tabpanel[@data-svy-name='"+elementName+"']"))), 30 * 1000, 'Tabelpanel not found!').then(function(){
			tabPanel.each(function(tabRows){
				var row = tabRows.all(by.xpath("//span[text()='"+text+"']")).last();
				row.isPresent().then(function(isPresent){
					if(isPresent) {
						clickElement(row).then(function(){
							wrapUp(callback, "clickEvent");
						});
					}
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END SERVOY TABPANEL COMPONENT

	//PERFORMANCE LOGGING
	Then('I want to log the time it took to do the {event} event', { timeout: 60 * 1000 }, function (event, callback) {
		var duration = calcBlockDuration(new Date());
		console.log('The ' + event + ' event took ' + duration + ' miliseconds');
		analytics.event('Scenario 1', "Performance", event, duration).send();
		callback();
	});
	//END PERFORMANCE LOGGING

	//WAIT FOR VALUE CHANGE 
	Then('servoy default input component with name {elementName} I want to wait until the value equals {newValue}', {timeout: 30 * 1000}, function(elementName, newValue, callback){
		var inputField = element(by.xpath("//input[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.presenceOf(inputField), 15 * 1000, 'Inputfield not found!').then(function(){
			browser.wait(EC.textToBePresentInElementValue(inputField, newValue)).then(function(hasChanged){
				if(hasChanged) {
					wrapUp(callback, 'validateEvent');
				} else {					
					inputField.getText().then(function(text){
						console.log('Input value has not changed!')
						console.log('Expected result: ' + newValue);
						console.log('Found result: ' + text);
					});
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END WAIT FOR VALUE CHANGE 

	//HTMLVIEW COMPONENT
	Then('servoy htmlview component with name {elementName} I want to validate that the htmlview contains the text {text}', {timeout: 30 * 1000}, function(elementName, text, callback){
		var htmlView = element.all(by.xpath("//data-servoydefault-htmlview[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.visibilityOf(htmlView.first()), 15 * 1000, 'HTML view not found!').then(function(){
			htmlView.each(function(htmlViewColumns){
				htmlViewColumns.element(by.cssContainingText("*", text)).isPresent().then(function(isPresent){
					if(isPresent) {
						wrapUp(callback, "validateEvent");
					}
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END HTMLVIEW COMPONENT

	//DATA-BOOTSTRAPEXTRACOMPONENTS-NAVBAR
	When('bootstrap data-bootstrapextracomponents-navbar component with the name {elementName} the tab with the text {tabText} on level {tabLevel} is clicked', {timeout: 40 * 1000}, function(elementName, tabText, tabLevel, callback){
		var tab = element(by.xpath("//data-bootstrapextracomponents-navbar[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.presenceOf(tab), 30 * 1000, 'Navbar not found!').then(function(){
			var tabElement;			
			switch(parseInt(tabLevel)){				
				case 1: 
					tabElement = tab.element(by.xpath("//*[text()[normalize-space() = '" + tabText + "'] and contains(@class, 'svy-navbar-dropdown')]"));
					browser.sleep(3000);
					tabElement.isPresent().then(function(isPresent){
						if(!isPresent) {
							tabElement = tab.element(by.xpath("//*[text()[normalize-space() = '" + tabText + "'] and (contains(@class, 'svy-navbar-item') or contains(@class, 'svy-navbar-item-text'))]"));
						}
						browser.wait(EC.elementToBeClickable(tabElement), 30 * 1000, 'Tab item not found!').then(function(){
							clickElement(tabElement).then(function(){
								wrapUp(callback, "clickEvent");
							});
						});
					});
					break;
				case 2:
					tabElement = tab.element(by.xpath("//*[text()[normalize-space() = '" + tabText + "'] and not(contains(@class, 'svy-navbar-dropdown'))]"));
					browser.wait(EC.elementToBeClickable(tabElement), 30 * 1000, 'Tab item not found!').then(function(){
						clickElement(tabElement).then(function(){
							wrapUp(callback, "clickEvent");
						});
					});
					break;
				case 3:
					tabElement = tab.element(by.xpath("//*[text()[normalize-space() = '" + tabText + "'] and not(contains(@class, 'svy-navbar-dropdown'))]"));
					browser.wait(EC.elementToBeClickable(tabElement), 30 * 1000, 'Tab item not found!').then(function(){
						clickElement(tabElement).then(function(){
							wrapUp(callback, "clickEvent");
						});
					});
					break;
				default:
					console.log('Only level tabLevel 1 and 2 are supported');
					break;
			}
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('bootstrap data-bootstrapextracomponents-navbar component with the name {elementName} I want to insert the text {text} in the search bar', {timeout: 40 * 1000}, function(elementName, text, callback){
		var tab = element(by.css("data-bootstrapextracomponents-navbar[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.presenceOf(tab), 30 * 1000, 'Navbar not found!').then(function(){
			var searchField = tab.element(by.css("input[data-menu-item-id='SEARCH']"));
			browser.wait(EC.visibility(searchField), 15 * 1000, 'Search field not found!').then(function() {
				sendKeys(searchField, text).then(function() {
					wrapUp(callback, "insertEvent");
				})
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('bootstrap data-bootstrapextracomponents-navbar component with the name {elementName} I want to click on the element with the exact text {text} in the drop down menu', {timeout: 40 * 1000}, function(elementName, text, callback){
		var tab = element(by.css("data-bootstrapextracomponents-navbar[data-svy-name='"+elementName+"']"));
		browser.wait(EC.presenceOf(tab), 30 * 1000, 'Navbar not found!').then(function(){
			var dropDown = tab.element(by.css("ul[@class='dropdown-menu ng-scope']"));
			var dropDownItem = dropDown.element()
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('bootstrap data-bootstrapextracomponents-navbar component with the name {elementName} I want to click on the element with the class {className}', {timeout: 40 * 1000}, function(elementName, className, callback){
		var menu = element(by.css(`data-bootstrapextracomponents-navbar[data-svy-name='${elementName}']`));
		browser.wait(EC.presenceOf(menu), 30 * 1000, 'Navbar not found!').then(function(){
			var elementToClick = menu.element(by.className(`${className}`));
			browser.wait(EC.presenceOf(elementToClick), 15 * 1000, 'Element with the given class has not been found!').then(function() {
				clickElement(elementToClick).then(function() {
					wrapUp(callback, "clickEvent");
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('bootstrap data-bootstrapextracomponents-navbar component with name {elementName} the tab {tabText} is clicked', {timeout: 30 * 1000}, function(elementName, tabText, callback){
		var tab = element(by.xpath("//data-bootstrapextracomponents-navbar[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.presenceOf(tab), 30 * 1000, 'Navbar not found!').then(function () {
			var tabElement = tab.element(by.xpath("//a[text()[normalize-space() = '" + tabText + "'] and contains(@class, 'svy-navbar-dropdown')]"));
			browser.sleep(3000);
			tabElement.isPresent().then(function (isPresent) {
				if (!isPresent) {
					tabElement = tab.element(by.xpath("//a[text()[normalize-space() = '" + tabText + "'] and contains(@class, 'svy-navbar-item')]"));
				}
				browser.wait(EC.elementToBeClickable(tabElement), 30 * 1000, 'Tab item not found!').then(function () {
					clickElement(tabElement).then(function () {
						wrapUp(callback, "clickEvent");
					});
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('bootstrap data-bootstrapextracomponents-navbar component with the name {elementName} I want to select the drop-down item with the text {text}', {timeout: 30 * 1000}, function(elementName, text, callback) {
		var tab = element(by.xpath("//data-bootstrapextracomponents-navbar[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.presenceOf(tab), 30 * 1000, 'Navbar not found!').then(function(){		
			var menuItem = tab.all(by.xpath("//a[text()[contains(translate(., '" + text.toUpperCase() + "', '" + text.toLowerCase() + "'), '" + text.toLowerCase() + "')]]")).first();
			browser.wait(EC.visibilityOf(menuItem), 15 * 1000, 'Menu item not found!').then(function() {
				clickElement(menuItem).then(function() {
					wrapUp(callback, "clickEvent");
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});		
	});

	//END DATA-BOOTSTRAPEXTRACOMPONENTS-NAVBAR

	//LISTBOX COMPONENT
	//CHECK IF X AMOUNT OF ROWS EXIST
	When('servoy data-servoydefault-listbox with name {elementName} I want to validate that there are {rowCount} rows', {timeout: 30 * 1000}, function(elementName, expectedCount, callback){
		var listBox = element.all(by.xpath("//data-servoydefault-listbox[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(listBox.first()), 30 * 1000, 'Listbox not found!').then(function(){
			listBox.all(by.css("option")).count().then(function(count){
				if(count == expectedCount) {
					wrapUp(callback, "validateEvent");
				} else {
					console.log("Invalid count. Expected: " + expectedCount + ". Got " + count);					
				}
			})
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	
	When('servoy data-servoydefault-listbox with name {elementName} I want to select row number {rowNumber}', {timeout: 30 * 1000}, function(elementName, rowNumber, callback){
		var listBox = element.all(by.xpath("//data-servoydefault-listbox[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(listBox.first()), 30 * 1000, 'Listbox not found!').then(function(){
			var row = listBox.all(by.css("option")).get(rowNumber - 1);
			browser.wait(EC.visibilityOf(row), 30 * 1000, 'Row not found!').then(function(){
				clickElement(row).then(function(){
					wrapUp(callback, "clickEvent");
				});
			})
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	//SELECT ROW BY PARTIAL MATCH
	When('servoy data-servoydefault-listbox with name {elementName} I want to select the row with the partial text {text}', {timeout: 30 * 1000}, function(elementName, text, callback){
		var listBox = element.all(by.xpath("//data-servoydefault-listbox[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(listBox.first()), 30 * 1000, 'Listbox not found!').then(function(){
			listBox.all(by.css("option")).each(function(row){
				row.getAttribute('value').then(function(value){
					if(value.indexOf(text) > -1) {
						clickElement(row).then(function(){
							wrapUp(callback, "validateEvent");
						});
					}
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	//SELECT ROW BY EXACT MATCH
	When('servoy data-servoydefault-listbox with name {elementName} I want to select the row with the exact text {text}', {timeout: 30 * 1000}, function(elementName, text, callback){
		var listBox = element.all(by.xpath("//data-servoydefault-listbox[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(listBox.first()), 30 * 1000, 'Listbox not found!').then(function(){
			listBox.all(by.css("option")).each(function(row){
				row.getAttribute('value').then(function(value){
					if(value === text) {
						clickElement(row).then(function(){
							wrapUp(callback, "validateEvent");
						});
					}
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	//VALIDATE BY PARTIAL MATCH
	When('servoy data-servoydefault-listbox with name {elementName} I want to validate that a row with the partial text {text} exists', {timeout: 30 * 1000}, function(elementName, text, callback){
		var listBox = element.all(by.xpath("//data-servoydefault-listbox[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(listBox.first()), 30 * 1000, 'Listbox not found!').then(function(){
			listBox.all(by.css("option")).each(function(row){
				row.getAttribute('value').then(function(value){
					if(value.indexOf(text) > -1) {
						wrapUp(callback, "validateEvent");
					}
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	//VALIDATE BY EXACT MATCH
	When('servoy data-servoydefault-listbox with name {elementName} I want to validate that a row with the exact text {text} exists', {timeout: 30 * 1000}, function(elementName, text, callback){
		var listBox = element.all(by.xpath("//data-servoydefault-listbox[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(listBox.first()), 30 * 1000, 'Listbox not found!').then(function(){
			listBox.all(by.css("option")).each(function(row){
				row.getAttribute('value').then(function(value){
					if(value === text) {
						wrapUp(callback, "validateEvent");
					}
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END LISTBOX COMPONENT

	//FONT AWESOME
	When('servoy data-servoyextra-fontawesome component with name {elementName} is clicked', { timeout: 30 * 1000 }, function (elementName, callback) {
		var fontAwesome = element(by.xpath("//data-servoyextra-fontawesome[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(fontAwesome), 30 * 1000, 'Icon not found!').then(function () {
			clickElement(fontAwesome).then(function () {
				wrapUp(callback, "clickEvent");
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END FONT AWESOME

	//Wildcard check
	Then('I expect the {before|after} value of the CSS class property {property} of the {className} of the child of an element with the name {elementName} to be {value}', {timeout: 15 * 1000}, function(beforeAfter, cssProperty, className, elementName, value, callback){
		var wildcard = element(by.css(`*[data-svy-name='${elementName}']`));
		browser.wait(EC.presenceOf(wildcard), 10 * 1000, 'Element could not be found!').then(function() {
			var wildcardClassElem = element(by.css('.'+ className));
			browser.wait(EC.presenceOf(wildcardClassElem), 10 * 1000, `Element with the class ${className} could not be found!`).then(function() {			
				var script = `return window.getComputedStyle(document.querySelector('.${className}'), ':${beforeAfter}').getPropertyValue('${cssProperty}')`;
				browser.executeScript(script).then(function(result) {
					if(result[0] && result[result.length -1] == "\"") {
						var result_parsed = result.substring(1, result.length - 1);
						if(result_parsed.toLowerCase() == value.toLowerCase()) {
							wrapUp(callback, "validationEvent");
						} else {
							callback(new Error(`Validation failed! Expected the property to be '${value}'. Got '${result}'` ));
						}
					} else {
						if(result.toLowerCase() == value.toLowerCase()) {
							wrapUp(callback, "validationEvent");
						} else {
							callback(new Error(`Validation failed! Expected the property to be '${value}'. Got '${result}'` ));
						}
					}
				})
			});
		}).catch(function(err) {
			callback(new Error(err.message));
		})
	});

	Then('I expect an element with the name {elementName} to not be present', {timeout: 20 * 1000}, function(elementName, callback){
		element.all(by.xpath("//*[@data-svy-name='" + elementName+"']")).then(function(items){
			if(items.length === 0) {
				wrapUp(callback, "validateEvent"); 
			} else {
				console.log('Validation failed! Expected 0 matches, got ' + items.length);
				tierdown(true);
			}
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('I expect an element with the name {elementName} to contain the class {className}', {timeout: 30 * 1000}, function(elementName, className, callback){
		var wildcard = element(by.xpath("//*[@data-svy-name='" + elementName+"']"));
		browser.wait(EC.presenceOf(wildcard), 20 * 1000, 'Element has not been found!').then(function(){
			wildcard.getAttribute('class').then(function(classes) {
				if(classes.indexOf(className) != -1) {				
					wrapUp(callback, "validateEvent");
				} else {
					var nestedElem = wildcard.element(by.className(className));
					nestedElem.isPresent().then(function(isPresent) {
						if(isPresent) {
							wrapUp(callback, "validateEvent");
						} else {
							tierdown(true);
							callback(new Error('Validation failed! Element with the given does not class exist!'));							
						}
					});
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('I expect an element with the name {elementName} to not contain the class {className}', {timeout: 30 * 1000}, function(elementName, className, callback){
		var wildcard = element(by.xpath("//*[@data-svy-name='" + elementName+"']"));
		browser.wait(EC.presenceOf(wildcard), 20 * 1000, 'Element has not been found!').then(function(){
			wildcard.getAttribute('class').then(function(classes) {
				if(classes.indexOf(className) === -1) {
					var nestedElem = wildcard.element(by.className(className));
					nestedElem.isPresent(nestedElem).then(function(isPresent) {
						if(isPresent) {
							tierdown(true);
							callback(new Error('Validation failed! Element with the given class exists!'));
						} else {
							wrapUp(callback, "validateEvent");
						}
					});
				} else {
					callback(new Error('Validation failed! Element with the given class exists!'));
				}
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('I expect an element with the name {elementName} to be {visible|hidden|present}', { timeout: 15 * 1000 }, function (elementName, visibility, callback) {
		var wildcard = element(by.xpath("//*[@data-svy-name='" + elementName + "']"));
		if (visibility === 'present') {
			browser.wait(EC.presenceOf(wildcard), 15 * 1000, 'Element has not been found!').then(function () {
				wrapUp(callback, "validateEvent");
			}).catch(function (error) {
				tierdown(true);
				callback(new Error(error.message));
			});
		} else if (visibility === 'visible') {
			browser.wait(EC.presenceOf(wildcard), 15 * 1000, 'Element has not been found!').then(function () {
				var parent = wildcard.element(by.xpath(".."));
				parent.getCssValue('display').then(function (isHidden) {
					if (isHidden != 'none' && visibility.toLowerCase() === 'visible') {
						wrapUp(callback, "validateEvent");
					} else {
						tierdown(true);
						callback(new Error('Validation failed! Excepted element to be ' + visibility));
					}
				})
			}).catch(function (error) {				
				tierdown(true);
				callback(new Error(error.message));
			});
		} else if (visibility === 'hidden' ) {
			browser.wait(EC.invisibilityOf(wildcard), 15 * 1000, 'Element never disappeared!').then(function() {
				wrapUp(callback, "invisibleCheck")
			}).catch(function(error) {
				tierdown(true);
				callback(new Error(error.message));
			})
		} else {
			tierdown(true);
			callback(new Error("Parameter not supported! End the step with the word 'visible', 'hidden' or 'present'!"));
		}
	});

	Then('formcomponent with the name {fComponentName} I expect an element with the name {elementName} to be {visible|hidden|}', { timeout: 15 * 1000 }, function (formComponentName, elementName, visibility, callback) {
		var fComponent = element(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" + formComponentName + "']"));
		browser.wait(EC.presenceOf(fComponent), 15 * 1000, 'Formcomponent not found!').then(function () {
			var elem = fComponent.element(by.css("*[data-svy-name='" + elementName + "']"));
			browser.wait(EC.presenceOf(elem), 15 * 1000, 'Element not found!').then(function () {
				var parent = elem.element(by.xpath(".."));
				parent.getCssValue('display').then(function (isHidden) {
					console.log('Visibility: ' + isHidden)
					if (isHidden === 'none' && visibility.toLowerCase() === 'hidden' || isHidden != 'none' && visibility.toLowerCase() === 'visible') {
						wrapUp(callback, "validateEvent");
					} else {
						console.log('Validation failed! Excepted element to be ' + visibility)
						tierdown(true);
					}
				})
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END WILDCARD CHECK


	//SERVOY PDF VIEWER
	Then('servoy data-pdfviewer-pdf-js-viewer component with name {elementName} I expect it to be visible', {timeout: 30 * 1000}, function(elementName, callback){
		var viewer = element(by.xpath("//data-pdfviewer-pdf-js-viewer[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(viewer), 20 * 1000, 'PDF viewer not found!').then(function(){
			wrapUp(callback, "validateEvent");
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END SERVOY PDF VIEWER

	//SERVOY EXTRA SLIDER
	When('servoy extra slider component with name {elementName} I want to slide it to value {value} where the value is stored in the element with name {storedElementName}', {timeout: 30 * 1000}, function(elementName, value, storedElementName, callback){
		var slider = element(by.xpath("//div[@data-svy-name='" + elementName + "']"));
		getValueOfElement("*", storedElementName).then(function (tempStoredValue) {
			value = parseInt(value);
			browser.wait(EC.visibilityOf(slider), 30 * 1000, 'Slider not found!').then(function () {
				var sliderIcon = slider.element(by.xpath("//span[contains(@class, 'ui-slider-handle')]"));
				sliderIcon.click().then(function () {
					var Key = protractor.Key;
					//to calculate the amount of times the 'left' or right' button has to be clicked, the value of of 1 'click' needs to be calculated
					var steps;
					if (value < tempStoredValue) {
						browser.actions().sendKeys(Key.ARROW_LEFT).perform().then(function () {
							//calculate sliderSteps
							getValueOfElement("*", storedElementName).then(function (storedValue) {
								steps = (storedValue > value) ? storedValue - value : value - storedValue;
								for (var x = 0; x < steps; x++) {
									browser.actions().sendKeys(Key.ARROW_LEFT).perform();
								}
							})

						});
					} else {
						browser.actions().sendKeys(Key.ARROW_RIGHT).perform().then(function () {
							//calculate sliderSteps
							getValueOfElement("*", storedElementName).then(function (storedValue) {
								steps = (storedValue > value) ? storedValue - value : value - storedValue;
								console.log('Steps: ' + steps);
								for (var x = 0; x < (value / steps); x++) {
									browser.actions().sendKeys(Key.ARROW_RIGHT).perform();
								}
							})
						});
					}
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('servoy extra data-servoyextra-slider component with name {elementName} I want to set the {min|max} value to {value} where the step size is {stepSize}', { timeout: 15 * 1000 }, function (elementName, sliderParam, value, stepSize, callback) {
		var slider = element(by.css("data-servoyextra-slider[data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(slider), 30 * 1000, 'Slider not found!').then(function () {
			var sliderMin = slider.element(by.className("rz-model-value")); //min selected value
			var sliderMax = slider.element(by.className("rz-model-high")); //max selected value
			var sliderMinLoc = slider.element(by.className("rz-pointer-min")); //min slider icon
			var sliderMaxLoc = slider.element(by.className("rz-pointer-max")); //max slider icon
			var sliderMinValue = slider.element(by.className("rz-floor")); //min achievable value
			var leftPartOfSlider = slider.element(by.className("rz-bar-wrapper")); //most left part of the slide


			// var sliderMin = slider.element(by.xpath("//span[contains(@class, 'rz-model-value')]")); //min selected value
			// var sliderMax = slider.element(by.xpath("//span[contains(@class, 'rz-model-high')]")); //max selected value
			// var sliderMinLoc = slider.element(by.xpath("//span[contains(@class, 'rz-pointer-min')]")); //min slider icon
			// var sliderMaxLoc = slider.element(by.xpath("//span[contains(@class, 'rz-pointer-max')]")); //max slider icon
			// var sliderMinValue = slider.element(by.xpath("//span[contains(@class, 'rz-floor')]")); //min achievable value
			// var leftPartOfSlider = slider.element(by.xpath("//span[contains(@class, 'rz-bar-wrapper')]")); //most left part of the slider
			sliderMin.getAttribute('textContent').then(function (minValue) {
				sliderMax.getAttribute('textContent').then(function (maxValue) {
					//gets the width of the slider (difference between max/min value)
					sliderMinLoc.getLocation().then(function (minLoc) {
						sliderMaxLoc.getLocation().then(function (maxLoc) {
							leftPartOfSlider.getSize().then(function (sliderSize) {
								leftPartOfSlider.getLocation().then(function (leftSlideLoc) {
									//basic check to see if the values can be set
									// if(sliderParam.toLowerCase() === 'max' && minValue > value || sliderParam.toLowerCase() === 'min' && maxValue < value) {

									// var width = maxLoc.x - minLoc.x;
									var width = sliderSize.width;
									console.log('Pixels to move: ' + (width / (maxValue - minValue) * parseInt(value) - (minLoc.x - leftSlideLoc.x)));
									if (sliderParam.toLowerCase() === 'min') {
										browser.actions()
											.mouseMove(sliderMinLoc.getWebElement())
											.mouseDown()
											.mouseMove({ x: Math.round(width / (maxValue - minValue) * parseInt(value) - (minLoc.x - leftSlideLoc.x)), y: 0 })
											.mouseUp()
											.perform().then(function () {
												sliderMin.getAttribute('textContent').then(function (newMinValue) {
													if (newMinValue === value) {
														wrapUp(callback, "slideEvent");
													} else {
														//Since decimal pixels are not possible, a new calculation has to be made to see if the steps are possible
														//e.g.: min val achievable: 1, max val achievable: 10, steps: 3, meaning value 5 is not possible. Only 1, 4, 7, 10
														sliderMinValue.getAttribute('textContent').then(function (minSliderValue) {
															var testVal = parseInt(minSliderValue) + value;
															if (testVal % stepSize === 0) {
																if (parseInt(newMinValue) < parseInt(value)) {
																	moveSliderByArrowKey('right', sliderMin, stepSize, parseInt(value), callback);
																} else {
																	moveSliderByArrowKey('left', sliderMin, stepSize, parseInt(value), callback);
																}
															} else {																
																tierdown(true);
																callback(new Error('Exact value is not reachable with the step size.'));
															}
														});

													}
												});
											});
									}

									if (sliderParam.toLowerCase() === 'max') {
										browser.actions()
											.mouseMove(sliderMaxLoc.getWebElement())
											.mouseDown()
											.mouseMove({ x: Math.round(width / (maxValue - minValue) * parseInt(value) - (maxLoc.x - leftSlideLoc.x)), y: 0 })
											.mouseUp()
											.perform().then(function () {
												sliderMax.getAttribute('textContent').then(function (newMaxValue) {
													if (newMaxValue === value) {
														wrapUp(callback, "slideEvent");
													} else {
														// moveSliderByArrowKey(side, sliderMin, stepSize, parseInt(value), callback);
														sliderMinValue.getAttribute('textContent').then(function (maxSliderValue) {
															var testVal = parseInt(maxSliderValue) + value;
															if (testVal % stepSize === 0) {
																if (parseInt(newMaxValue) < parseInt(value)) {
																	moveSliderByArrowKey('right', sliderMax, stepSize, parseInt(value), callback);
																} else {
																	moveSliderByArrowKey('left', sliderMax, stepSize, parseInt(value), callback);
																}
															} else {																
																tierdown(true);
																callback(new Error('Exact value is not reachable with the step size.'));
															}
														});
													}
												});
											});
									}
									// }
								})
							})
						});
					});
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END SERVOY EXTRA SLIDER

	//STORE VALUES
	When('servoy {componentType} with name {elementName} I want to store the value and {parse} it to a numeric value', {timeout: 30 * 1000}, function(componentType, elementName, parse, callback){		
		var wildCard = element(by.xpath("//" + componentType + "[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(wildCard), 15 * 1000, 'Element not found!').then(function(){
			console.log('Storing the value in position ' + (storedValues.length + 1));
			switch(componentType){
				case "data-servoydefault-label":
				case "data-servoydefault-button":
					wildCard.element(by.css("span[class='ng-binding']")).getText().then(function(text){
						if(parse === "parse") {
							text = text.replace(/[^0-9 \.]/g, '');
						}
						storedValues.push(text);
						wrapUp(callback, "storeValueEvent");
					});
					break;

				case "data-bootstrapcomponents-label":
				case "data-bootstrapcomponents-datalabel":
					wildCard.element(by.css("span")).getText().then(function(text){
						if(parse === "parse") {
							text = text.replace(/[^0-9 \.]/g, '');
						}
						storedValues.push(text);
						wrapUp(callback, "storeValueEvent");
					});					
					break;
				
				case "data-bootstrapcomponents-textbox":
					wildCard.element(by.css("input")).getAttribute('value').then(function(text) {
						if(parse === "parse") {
							text = text.replace(/[^0-9 \.]/g, '');
						}
						storedValues.push(text);
						wrapUp(callback, "storeValueEvent");
					});					
					break;
				
				case "input":
					wildCard.getAttribute('value').then(function(text){
						if(parse === "parse") {
							text = text.replace(/[^0-9 \.]/g, '');
						}
						storedValues.push(text);
						wrapUp(callback, "storeValueEvent");
					})					
					break;
				
				default: 					
					tierdown(true);
					callback(new Error('Unknown component type. Supported types are: "data-servoydefault-label", "data-bootstrapcomponents-label", "data-bootstrapcomponents-datalabel", "data-bootstrapcomponents-textbox", "input", "data-servoydefault-button"'));
					break;
			}
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	When('I want to store the value {value} in the list', {timeout: 30 * 1000}, function(value, callback){
		console.log('Storing the value in position ' + (storedValues.length + 1));
		storedValues.push(value);
		wrapUp(callback, "storeValueEvent");
	})

	Then('I want to clear the list of stored values', {timeout: 10 * 1000}, function(callback){
		storedValues = null;
		callback();
	});

	Then('I want to validate that {valueNumber|customValue} {-+/*} {valueNumber|customValue} equals {valueNumber|customValue}', {timeout: 15 * 1000} , function(valOne, operator, valTwo, valThree, callback) {
		if(valOne.startsWith("(")) {
			var indexVal = valOne.replace(/[^0-9]+/g, "");
			valOne = parseFloat(storedValues[parseInt(indexVal) - 1]);
			if(!valOne) {
				callback(new Error('List with the given index does not contain a value!'));
			}
		} else {
			valOne = parseFloat(valOne);
		} 
		if(valTwo.startsWith("(")) {
			var indexVal = valTwo.replace(/[^0-9]+/g, "");
			valTwo = parseFloat(storedValues[parseInt(indexVal) - 1]);
			if(!valTwo) {
				callback(new Error('List with the given index does not contain a value!'));
			}
		} else {
			valTwo = parseFloat(valTwo);
		} 
		if(valThree.startsWith("(")) {
			var indexVal = valThree.replace(/[^0-9]+/g, "");
			valThree = parseFloat(storedValues[parseInt(indexVal) - 1]);
			if(!valThree) {
				callback(new Error('List with the given index does not contain a value!'));
			}
		} else {
			valThree = parseFloat(valThree);
		} 
		switch(operator) {
			case '-': 
				console.log('Calculating ' + valOne + ' - ' + valTwo + '.');
				if(valOne - valTwo === valThree) {
					wrapUp(callback, 'validateEvent');
				} else {					
					tierdown(true);
					callback(new Error('Validation failed. Expected. ' + valThree + '. Got: ' + (valOne - valTwo)));
				}
				break;
			case '+':
				console.log('Calculating ' + valOne + ' + ' + valTwo + '.');
				if(valOne + valTwo === valThree) {
					wrapUp(callback, 'validateEvent');
				} else {					
					tierdown(true);
					callback(new Error('Validation failed. Expected. ' + valThree + '. Got: ' + (valOne + valTwo)));
				}
				break;
			case '/':
				console.log('Calculating ' + valOne + ' / ' + valTwo + '.');
				if(valOne / valTwo === valThree) {
					wrapUp(callback, 'validateEvent');
				} else {					
					tierdown(true);
					callback(new Error('Validation failed. Expected. ' + valThree + '. Got: ' + (valOne / valTwo)));
				}
				break;
			case '*':
				console.log('Calculating ' + valOne + ' * ' + valTwo + '.');
				if(valOne * valTwo === valThree) {
					wrapUp(callback, 'validateEvent');
				} else {					
					tierdown(true);
					callback(new Error('Validation failed. Expected. ' + valThree + '. Got: ' + (valOne * valTwo)));
				}
				break;
			default:				
				tierdown(true);
				callback(new Error("Only operators that area allowed are '-', '+', '/' and '*'"));
				break;
		}
	});
	//END STORE VALUES

	//SET IGNORESYNCHRONIZATION
	When('I want to set the synchronization to {option}', {timeout: 10 * 1000}, function(option, callback){
		if(option === "true") {
			browser.ignoreSynchronization = true; 			
		} else {
			browser.ignoreSynchronization = false;
		}
		wrapUp(callback, "");
	})
	//END SET IGNORESYNCHRONIZATION

	//SERVOY LISTVIEW ITEMS
	//TODO: input click/insert/validate
	//		button click/validate/double click
	//		
	//END SERVOY LISTVIEW ITEMS

	//ADMIN LOG
	Given('I navigate to the admin page {ur} and clean up the warnings', {timeout: 30 * 1000}, function(url, callback) {
		browser.ignoreSynchronization = true;
		browser.get(url).then(function () {
			var button = element(by.css("input[value='Clear Log']"));
			browser.wait(EC.visibilityOf(button), 30 * 1000, 'Button not found!').then(function () {
				clickElement(button).then(function () {
					browser.ignoreSynchronization = false;
					wrapUp(callback, "adminPageClearLogEvent");
				});
			});
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});

	Then('on the servoy admin page {url} I want to count the warnings and the errors in the log file', {timeout: 30 * 1000}, function(url, callback){
		browser.ignoreSynchronization = true;
		browser.getCurrentUrl(function(url) {
			var admin_url = browser.params.servoyAdminGetURL;
			var button = element(by.css("input[value='Clear Log']"));
			browser.wait(EC.visibilityOf(button), 30 * 1000, 'Button not found!').then(function () {
				element.all(by.xpath("//font[@color='#FC9206']")).count().then(function (warningCount) {
					console.log('Warnings found: ' + warningCount);
					element.all(by.xpath("//font[@color='#993300']")).count().then(function (errorCount) {
						console.log('Errors found: ' + warningCount);
						if (parseInt(errorCount) > 0) {
							console.log('Errors have been found during the test! Count: ' + errorCount);
							element.all(by.xpath("//font[@color='#993300']")).each(function (errorRows) {
								errorRows.all(by.xpath("..")).all(by.xpath("..")).all(by.css("td[title='Message']")).getText().then(function (text) {
									console.log(text);
								});
							});
						} else {
							wrapUp(callback, 'adminPageLogEvent');
						}
					});
				});
			});
		}).then(function () {
			browser.ignoreSynchronization = false;
		}).catch(function (error) {			
			tierdown(true);
			callback(new Error(error.message));
		});
	});
	//END ADMIN LOG
	After(function () {
		console.log('Completed scenario');
		if (!hasErrorDuringSuite) {
			tierdown(false);
		}
	});

	Before(function () {
		hasErrorDuringSuite = false;
		console.log('Starting scenario');
		browser.driver.getCapabilities().then(function(caps){
			browser.browserName = caps.get('browserName');
		});
	});
});

function clearAdminPage() {
	// console.log('Clearing logs...');
	// browser.ignoreSynchronization = true;
	// var admin_url = browser.params.servoyAdminGetURL + '/log';
	// browser.get(admin_url).then(function () {
	// 	var button = element(by.css("input[value='Clear Log']"));
	// 	browser.wait(EC.visibilityOf(button), 30 * 1000, 'Button not found!').then(function () {
	// 		clickElement(button).then(function () {
	// 			browser.ignoreSynchronization = false;
	// 		});
	// 	});
	// }).catch(function (error) {			
	// 	tierdown(true);
	// 	// console.log('Unable to clear the admin page logs!');
	// 	console.log(error.message);
	// });
}

function getAdminLogs(scenario) {
	if(!browser.params.servoyAdminGetURL) {
		return;
	}
	var scenarioName = scenario.scenario.name
	console.log('Scenario name: ' + scenarioName);
	console.log('Getting logs...');
	browser.ignoreSynchronization = true;
	var admin_url = browser.params.servoyAdminGetURL + '/log';
	browser.get(admin_url).then(function() {
		console.log('admin page reached')
		var button = element(by.css("input[value='Clear Log']"));			
		browser.wait(EC.visibilityOf(button), 30 * 1000, 'Button not found!').then(function () {
			console.log('button found!');
			browser.executeScript("return arguments[0].outerHTML;", element.all(by.css('table')).last()).then(function(result) {		
				fs.appendFileSync(browser.params.htmlDirectory + '/admin_logs.html', '<div style="width:100%"><h1> Scenario results for: ' + scenarioName + "</h1></div>");
				fs.appendFileSync(browser.params.htmlDirectory + '/admin_logs.html', '<table> ' + result + "</table>");
				console.log('klaar');
				browser.ignoreSynchronization = false;
			})			
		}).catch(function (error) {			
			console.log(error.message);
		});
	}).catch(function (error) {			
		console.log('Unable to get the admin page logs!');
		console.log(error.message);
	});
}

function errorHandleProcedure(callback, error) {
	console.log(error.message);	
	console.log(error.message.indexOf('Angular could not be found on the page') > -1);
	if(error.message.indexOf('Angular could not be found on the page') > -1) {
		browser.getCurrentUrl().then(function(URL) {
			console.log('Error reaching website. Currently no page has been rendered on ' + URL);
			console.log('Attempting to reach landing page of the application server...');
			browser.get(browser.params.testDomainURL).then(function() {
				console.log('Landing page reached. Stopping current scenario. Continuing with the tests...');
				callback(new Error());
			}).catch(function(finalError) {
				console.log('Attempting to reach the landing page has failed!');
				console.log('Shutting down the driver!');
				console.log('Error: ' + finalError);
				driver.quit();
			})
		})
		
	} else {
		callback(new Error(error.message));
	}
}

/*
* @param {String} sideToMove - slider has to move to the left or right
* @param {Number} sliderVal - current slider value
* @param {Number} stepSize - increment of 1 key press (left or right)
* @param {Number} expectedValue - value to be reached
* @param {Object} callback - resolves the promise
*/
function moveSliderByArrowKey(sideToMove, sliderVal, stepSize, expectedValue, callback) {
	sliderVal.getAttribute('textContent').then(function (val) {
		var difference = parseInt(expectedValue) - parseInt(val);
		var remainingSteps = difference / parseInt(stepSize);
		if (remainingSteps < 0) {
			remainingSteps *= -1;
		}
		console.log(remainingSteps);
		for (var i = 0; i < remainingSteps; i++) {
			if (sideToMove === 'left') {
				browser.actions().sendKeys(protractor.Key.ARROW_LEFT).perform().then(function () {
					// browser.sleep(300);
					// console.log('Excecuting LEFT click');
				});
			} else {
				browser.actions().sendKeys(protractor.Key.ARROW_RIGHT).perform().then(function () {
					// browser.sleep(300);
					// console.log('Excecuting RIGHT click');
				});
			}
		}
	}).then(function () {
		sliderVal.getAttribute('textContent').then(function(val){
			if(val == expectedValue) {
				console.log('Success')
				wrapUp(callback, ""); 
			} else {
				
			}
		});
	});
}

function arrowKey(side) {
	if(side === 'left') {
		return browser.actions().sendKeys(protractor.Key.ARROW_LEFT).perform();
	} else {
		return browser.actions().sendKeys(protractor.Key.ARROW_RIGHT).perform();
	}
}

function getValueOfElement(elementType, elementName) {
	var elem = element(by.xpath("//" + elementType+ "[@data-svy-name='" + elementName +"']"));
	return browser.wait(EC.visibilityOf(elem), 30 * 1000, 'Element not found!').then(function(){
		return elem.getText().then(function(text){			
			return text;
		})
	})
}

function validate(input, inputToCompare) {
	return expect(input).toBe(inputToCompare);
}

function wrapUp(callback, performanceEvent) {
	var duration = calcStepDuration(new Date());
	console.log('Step took ' + duration + ' miliseconds');
	if(performanceEvent) {
		// analytics.event('Scenario 1', "Performance", performanceEvent, duration).send();
	}
	callback();
}

function clickElement(elem) {
	if(browser.browserName === 'firefox') {
		return clickByScript(elem);
	} else {
		return browser.wait(EC.presenceOf(elem), 30 * 1000, 'Element not visible').then(function () {
			return browser.wait(EC.elementToBeClickable(elem), 30 * 1000, 'Element not clickable').then(function () {
				return elem.click();
			});
		});
	}
}

function doubleClickElement(elem) {
	return browser.wait(EC.presenceOf(elem).call(), 30000, 'Element not visible').then(function () {
		return browser.wait(EC.elementToBeClickable(elem), 30000, 'Element not clickable').then(function () {
			return browser.actions().doubleClick(elem).perform();
		});
	});
}

function rightClickElement(elem) {
	return browser.wait(EC.presenceOf(elem).call(), 30000, 'Element not visible').then(function () {
		return browser.wait(EC.elementToBeClickable(elem), 30000, 'Element not clickable').then(function () {
			return browser.actions().click(elem, protractor.Button.RIGHT).perform();
		});
	});
}

function clickElementByLocation(elem) {
	return browser.wait(EC.presenceOf(elem).call(), 30 * 1000, 'Element not found!').then(function () {
		return elem.getLocation().then(function (location) {
			return browser.actions().mouseMove(elem, { x: 0, y: 0 }).click().perform();
		});
	});
}

function clickByScript(elem) {
	return browser.wait(EC.presenceOf(elem), 30000, 'Element not visible').then(function () {
		return browser.executeScript("arguments[0].click()", elem);
	});
}

function sendKeys(elem, input, type) {
	return browser.wait(EC.visibilityOf(elem).call(), 30000, 'Element not visible').then(function () {
		return elem.clear().then(function () {
			return elem.sendKeys(input).then(function(){
				return elem.getAttribute('value').then(function(text) {
					if(browser.browserName === 'firefox' && !type) {
						$('body').sendKeys(protractor.Key.TAB);
					}
					if(text != input) {
						sendKeys(elem, input);
					}
				});
			});
		});
	});
}

function clearKeys(elem) {
	return browser.wait(EC.visibilityOf(elem).call(), 30000, 'Element not visible').then(function () {
		return elem.clear();
	});
}

function hasClass(element, className) {
	return element.getAttribute('class').then(function (classes) {
		return classes.split(' ').indexOf(className) !== -1;
	});
}


function sendComboboxKeys(elem, input) {
	return browser.wait(EC.visibilityOf(elem), 30 * 1000, 'Element not visible').then(function(){
		return elem.sendKeys(input);
	});
}

function waitUntillElementIsGone(elem) {
	return browser.wait(EC.not(EC.presenceOf(elem)));
}

function calcBlockDuration(timeStepCompleted) {
	if (!!tempBlockDate) {
		var stepduration = timeStepCompleted - tempBlockDate;
		tempBlockDate = timeStepCompleted;
		return stepduration;
	} else {
		var stepduration = timeStepCompleted - startBlockDate;
		tempBlockDate = timeStepCompleted;
		return stepduration;
	}
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

function formatTimestamp(date) {
	return date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear() + ' at ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
}

function tierdown(hasError) {
	if (hasError) {
		console.log('Has error during entire suite. Starting partial tier down');
		hasErrorDuringSuite = true;
		// setupDatabase(onErrorVersion, 'OnCrash');
	} else {
		console.log('Has no error during entire suite. Starting complete tier down');
		// setupDatabase(onCompleteVersion, 'OnComplete');
	}
}

function findRecord(elementName, recordText, callback) {
	var found = false;
	var click = 0;
	element.all(by.xpath("//div[@data-svy-name='" + elementName + "']")).each(function (childElement) {
		childElement.all(by.xpath("//div[@class='ui-grid-row ng-scope']")).each(function (grandChild) {
			grandChild.getText().then(function (text) {
				if (text.indexOf(recordText) > -1) {
					found = true;
					if (click === 0) {
						clickElement(grandChild).then(function () {
							wrapUp(callback, "Scroll event");
						});
						click++;
					}
				}
			});
		});
	}).then(function () {
		if (!found) {
			scrollToElement(elementName, recordText, callback);
		}
	});
}

function scrollToElement(elementName, recordText, callback) {
	element.all(by.xpath("//div[@data-svy-name='" + elementName + "']")).each(function (childElement) {
		var elem = childElement.all(by.xpath("//div[@class='ui-grid-row ng-scope']")).last();
		browser.executeScript("arguments[0].scrollIntoView(true);", elem.getWebElement()).then(function () {
			findRecord(elementName, recordText, callback);
		});
	});
}

function agGridIsGrouped(elementName) {
	var table = element(by.css(`data-aggrid-groupingtable[data-svy-name='${elementName}']`));
	var groupedElement = table.all(by.xpath("//div[contains(@class,'ag-column-drop-row-group') and not(contains(@class,'ag-hidden'))]")).first();
	return groupedElement.isPresent().then(function(ret_val) {
		if(ret_val) {
			return table.all(by.xpath("//div[contains(@class,'ag-column-drop-row-group') and not(contains(@class,'ag-hidden'))]")).first().isDisplayed().then(function(isDisplayed){
				if(isDisplayed) {
					return true;
				} else {
					return false;
				}
			});
		} else {
			return false;
		}
	});
}

function groupingGridScrollToTop(elementName, callback) {
	var table = element(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"));
	var tableContainer = table.element(by.xpath("//div[contains(@class, 'ag-body-container')]"));
	browser.executeScript("arguments[0].scrollIntoView(true);", tableContainer.getWebElement()).then(function () {
		wrapUp(callback, "tableScrollEvent");
	}).catch(function (error) {
		console.log(error.message);
		tierdown(true);
	});
}

// SERVOY TABLE
function findRecordTableComponent(elementName, recordText, shouldClick, callback) {
	var found = false;
	var baseTable = element.all(by.xpath("//div[@data-svy-name='" + elementName + "']"));
	browser.wait(EC.presenceOf(baseTable), 15 * 1000, 'Table ')
	baseTable.first().element(by.xpath("//span[text()='" + recordText + "']")).isPresent().then(function (isPresent) {
		if(isPresent) {
			if(shouldClick) {
				browser.executeScript("arguments[0].scrollIntoView(true);", baseTable.first().element(by.xpath("//span[text()='" + recordText + "']")).getWebElement()).then(function () {
					clickElement(baseTable.first().element(by.xpath("//span[text()='" + recordText + "']"))).then(function(){
						found = true;
						wrapUp(callback, "scrollEvent");
					});
				});
				
			} else {
				found = true;
				wrapUp(callback, "scrollEvent");
			}

		} else {
			baseTable.all(by.xpath("//input")).each(function(rowItems) {
				rowItems.getAttribute('value').then(function(value) {
					if(value === recordText) {
						if(shouldClick){
							clickElement(rowItems).then(function(){
								found = true;
								wrapUp(callback, "scrollEvent");
							});
						} else {
							found = true;
							wrapUp(callback, "scrollEvent");
						}
					}
				});
			});
		}
	}).then(function () {
		if (!found) {
			scrollToElementTableComponent(elementName, recordText, shouldClick, callback);
		}
	}).catch(function (error) {
		console.log(error.message);
		tierdown(true);
	});
}

function scrollToElementTableComponent(elementName, recordText, shouldClick, callback) {
	element.all(by.xpath("//div[@data-svy-name='" + elementName + "']")).each(function (tableItems) {
		var lastRow = tableItems.all(by.css('div[role=row')).last();
		browser.executeScript("arguments[0].scrollIntoView(true);", lastRow.getWebElement()).then(function () {
			findRecordTableComponent(elementName, recordText, shouldClick, callback);
		});
	});
}

// SERVOY GROUPING TABLE
function groupingGridTableScroll(elementName, text, callback, shouldClick, className, rowOption, level, shouldDoubleClick, isDone, locator, insertInField, partialTextMatch){
	var elementWithClass;
	var found = false;
	//Step 1 - Wait untill the table component is visible
	var table = element.all(by.xpath(`//data-aggrid-groupingtable[@data-svy-name='${elementName}']`));
	browser.wait(EC.presenceOf(table.first()), 30 * 1000, 'Table not found!').then(function () {
		table.each(function (rowItems) {
			agGridIsGrouped(elementName).then(function (isGrouped) {
				if (isGrouped) {
					return "ag-full-width-viewport";
				} else {
					return "ag-body-viewport";
				}
			}).then(function (cName) {
				var rowContainer = rowItems.all(by.className(cName));
				var elementToScroll = null;
				//Step 2a - Create the element that has to be found
				if (locator) {
					elementToScroll = rowContainer.all(by.css(`${locator}`)).first();
				} else {	
					if(partialTextMatch) {
						elementToScroll = rowContainer.all(by.cssContainingText(`*`, `${text}`)).first();
					} else if(text) {
						elementToScroll = rowContainer.all(by.xpath(`//*[text()="${text}"]`)).first();	 
					} 
				}
				if(className && !text) {
					elementToScroll = rowContainer.all(by.css(`${className}`)).first();
				}

				if(className && text) {
					var elemWithText = rowContainer.all(by.xpath(`//*[text()="${text}"]`)).first();
					elemWithText.isPresent(function(bla) {
						elementToScroll = elemWithText.element(by.xpath("..")).element(by.css(`${className}`));
					});
					
				}
				//Step 2b - Try and locate the required element (interaction with an element outside the viewport causes protractor to crash. isPresent handles this)
				elementToScroll.isPresent().then(function (isPresent) {
					//Step 3a - Check if the element is present
					if (isPresent) {
						found = true;
						//Step 3b - Element has been found. Conclude the test
						if (className) {
							if(locator) {
								elementWithClass = elementToScroll.all(by.className(className)).first();
							} else {
								elementWithClass = elementToScroll.all(by.xpath("..")).all(by.className(className)).first();
							}
							
							elementWithClass.isPresent().then(function (isPresent) {
								if (isPresent) {
									if (shouldDoubleClick) {
										doubleClickElement(elementWithClass).then(function () {
											wrapUp(callback, "scrollEvent");
										});
									} else {
										clickElement(elementWithClass).then(function () {
											wrapUp(callback, "scrollEvent");
										});
									}
								} else {
									if(locator) {
										elementWithClass = elementToScroll.findElement(by.className(className));
									} else {
										elementWithClass = elementToScroll.getWebElement().findElement(by.className(className));
									}
									
									if (shouldDoubleClick) {
										elementWithClass.doubleClick();
									} else {
										elementWithClass.click();
									}
								}
							});
						} else if (shouldClick) {
							if (shouldDoubleClick) {
								browser.actions().doubleClick(elementToScroll).perform().then(function () {
									wrapUp(callback, "scrollEvent");
								});
							} else {
								clickElement(elementToScroll).then(function () {
									wrapUp(callback, "scrollEvent");
								});
							}
						} else if (rowOption) {
							findRecordByRowLevel(elementName, text, rowOption, level, callback);
						} else {
							wrapUp(callback, "scrollEvent");
						}
					} else {
						//Rows are sorted underneath a different contrainer when grouped or not
						agGridIsGrouped(elementName).then(function (isGrouped) {
							if (isGrouped) {
								return "ag-full-width-viewport";
							} else {
								return "ag-body-viewport";
							}
						}).then(function (cName) {
							var rowContainer = rowItems.all(by.className(cName));
							var grid = rowContainer.$$("div[role=row]");
							var maxIndex = 0;
							grid.each(function (row) {
								row.getAttribute('row-index').then(function (index) {
									maxIndex = (parseInt(index)) > maxIndex ? parseInt(index) : maxIndex;
								})
							}).then(function () {
								var lastElement = rowContainer.all(by.css(`div[row-index='${(maxIndex - 1).toString()}']`)).first();
								browser.wait(EC.presenceOf(lastElement), 10 * 1000, 'Unable to scroll to last element or element with the given text has not been found!').then(function () {
									browser.executeScript("arguments[0].scrollIntoView(true);", lastElement.getWebElement()).then(function () {
										groupingGridTableScroll(elementName, text, callback, shouldClick, className, rowOption, level, shouldDoubleClick, isDone, locator);
									});
								}).catch(function (error) {
									callback(new Error(error.message));
									tierdown(true);
								})
							});
						});
					}
				});
			});
		}).catch(function (error) {
			callback(new Error(error.message));
		});
	}).then(function(){
		if(insertInField && found) {
			return true;
		}
		if(found) {
			wrapUp(callback, "scrollEvent");
		}
	}).catch(function (error) {
		callback(new Error(error.message));
	});
}

function findRecordByRowLevel(elementName, recordText, rowOption, level, callback) {
	var found = false;
	var table = element.all(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"));
	browser.wait(EC.visibilityOf(element(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"))), 30 * 1000, 'Table not found!').then(function () {
		table.each(function (row) {
			var elementToClick = row.all(by.xpath('//*[text()="' + recordText + '"]'));
			elementToClick.first().isPresent().then(function (isPresent) {
				if (isPresent) {
					if (rowOption == 'expand') {
						clickElement(elementToClick.all(by.xpath("..")).first().element(by.css(".glyphicon.glyphicon-plus.ag-icon"))).then(function () {
							found = true;
							wrapUp(callback, "gridExpand");
						});
					} else if (rowOption == 'collapse') {
						clickElement(elementToClick.all(by.xpath("..")).last().element(by.css(".glyphicon.glyphicon-minus.ag-icon"))).then(function () {
							found = true;
							wrapUp(callback, "gridCollapse");
						});
					} else {
						callback(new Error('Only expand or collapse is supported'))
					}
				}
			});
		}).then(function () {
			if (!found) {
				if(rowOption == 'expand') {
					groupingGridTableScroll(elementName, recordText, callback, true, 'glyphicon-plus', rowOption, level);
				} else {
					groupingGridTableScroll(elementName, recordText, callback, true, 'glyphicon-minus', rowOption, level);
				}
				
			}
		});
	});
}

//EXTRA TABLE
//recursive function that keeps scrolling until it finds the element
function dataServoyExtraTableScroll(elementName, text, shouldClick, callback){
	//Step 1 - Wait untill the table component is visible
	browser.wait(EC.visibilityOf(element(by.xpath("//data-servoyextra-table[@data-svy-name='" + elementName + "']"))), 30 * 1000, 'Element not visible').then(function () {			
		element.all(by.xpath("//data-servoyextra-table[@data-svy-name='" + elementName + "']")).each(function (rowItems) {
			//Step 2a - Loop through the table and find the element
			var elementToScrollTo = rowItems.element(by.xpath('//td/div[text()="'+text+'"]'));
			//Step 2b - Define the last TR that is currently loaded in the table. This will always be a different element		
			var lastRow = rowItems.all(by.xpath("//tr[last()]")).last();

			//Step 2c - Try and locate the required element with isPresent
			browser.wait(elementToScrollTo.isPresent()).then(function(isPresent){
				//Step 3a - Check if the element is present
				if(isPresent) {
					//Step 3b - Element has been found. Conclude the test
					if(shouldClick) {
						clickElement(elementToScrollTo).then(function(){
							wrapUp(callback, "scrollEvent");
						});
					} else {
						wrapUp(callback, "scrollEvent");
					}
				} else {
					//Step 3c - Element has not been found. Table has to scroll to the last TR loaded
					browser.executeScript("arguments[0].scrollIntoView();", lastRow.getWebElement()).then(function(){
						dataServoyExtraTableScroll(elementName, text, shouldClick, callback)
					});
				}
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	}).catch(function(error) {
		console.log(error.message);
		tierdown(true);
	});
}

function setCalendar(day, month, year, calType, callback) {
	if(!day || !month || !year) {
		tierdown(true);
		return callback(new Error('Invalid date parameters used. Use the following syntax: \n Months: (january, february, march, april, may, june, july, august, september, october, december. Not case sensitive. \nDays: 1-31. \nYear: e.g. 2012'));
	}
	var calendar = element(by.xpath("//div[contains(@class, 'bootstrap-datetimepicker-widget')]"));
	var monthList = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
	var monthTo = monthList.indexOf(month.toLowerCase());
	if(isValidDate(day, monthTo, year)) {
		var calMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		var yearTo = year;
		var dateHeaderText = calendar.all(by.css("th[class='picker-switch']")).first();
		return browser.wait(EC.presenceOf(dateHeaderText), 15 * 1000, 'Header text not visible!').then(function () {
			return dateHeaderText.getText().then(function (calYear) {
				var yearFrom = calYear.split(" ")[1];
				if (yearFrom != yearTo) { //switch years if end dates aint equal
					clickElement(calendar.all(by.xpath("//div[@class='datepicker-days']/table/thead/tr/th[2]")).first()).then(function () {
						if (yearFrom < yearTo) {
							for (var x = 0; x < (yearTo - yearFrom); x++) {
								clickElement(calendar.all(by.xpath("//div[@class='datepicker-months']/table/thead/tr/th[3]")).first());
							}
						} else {
							for (var x = 0; x < (yearFrom - yearTo); x++) {
								clickElement(calendar.all(by.xpath("//div[@class='datepicker-months']/table/thead/tr/th[1]")).first());
							}
						}
					}).then(function () {
						var monthoTo = calendar.all(by.xpath("//div[@class='datepicker-months']")).first().all(by.xpath("//span[.='" + calMonths[monthTo] + "']")).first();
						monthoTo.isPresent().then(function(isPresent) {
							if(isPresent) {
								clickElement(monthoTo).then(function () {
									clickElement(calendar.all(by.xpath("//div[@class='datepicker-days']")).first().all(by.xpath("//td[.='" + day + "' and not(contains(@class, 'cw')) and not(contains(@class, 'old'))]")).first());
								});
							} else {
								monthoTo = calendar.all(by.className("month")).get(monthList.indexOf(month.toLowerCase()));
								clickElement(monthoTo).then(function () {
									clickElement(calendar.all(by.xpath("//div[@class='datepicker-days']")).first().all(by.xpath("//td[.='" + day + "' and not(contains(@class, 'cw')) and not(contains(@class, 'old'))]")).first());
								});
							}
						});
					});
				} else {
					return clickElement(calendar.all(by.xpath("//div[@class='datepicker-days']/table/thead/tr/th[2]")).first()).then(function () {
						var monthoTo = calendar.all(by.xpath("//div[@class='datepicker-months']")).first().all(by.xpath("//span[.='" + calMonths[monthTo] + "']")).first();
						monthoTo.isPresent().then(function(isPresent) {
							if(isPresent) {
								clickElement(monthoTo).then(function () {
									clickElement(calendar.all(by.xpath("//div[@class='datepicker-days']")).first().all(by.xpath("//td[.='" + day + "' and not(contains(@class, 'cw')) and not(contains(@class, 'old'))]")).first());
								});
							} else {
								monthoTo = calendar.all(by.className("month")).get(monthList.indexOf(month.toLowerCase()));
								clickElement(monthoTo).then(function () {
									clickElement(calendar.all(by.xpath("//div[@class='datepicker-days']")).first().all(by.xpath("//td[.='" + day + "' and not(contains(@class, 'cw')) and not(contains(@class, 'old'))]")).first());
								});
							}
						});						
					});
				}
			}).then(function () {
				if(!calType) {
					var closeIcon = calendar.element(by.xpath("//span[contains(@class, 'glyphicon-ok')]"));
					closeIcon.isPresent().then(function(isPresent) {	
						if(isPresent) {
							clickElement(calendar.element(by.xpath("//span[contains(@class, 'glyphicon-ok')]")));
						}
						return Promise.resolve();
					});
				} else {
					if(browser.browserName != 'firefox') {
						browser.actions().sendKeys(protractor.Key.ENTER).perform();
					}
					return Promise.resolve();
				}
			});
		});	
	} else {
		tierdown(true);
		return callback(new Error('Invalid date given!'));
	}
}

/**
 * Get the number of days in any particular month
 * @param  {integer} m The month (valid: 0-11)
 * @param  {integer} y The year
 * @return {integer}   The number of days in the month
 */
function daysInMonth(m, y) {
    switch (m) {
        case 1 :
            return (y % 4 == 0 && y % 100) || y % 400 == 0 ? 29 : 28;
        case 8 : case 3 : case 5 : case 10 :
            return 30;
        default :
            return 31
    }
};

/**
 * Check if a date is valid
 * @param  {[type]}  d The day
 * @param  {[type]}  m The month
 * @param  {[type]}  y The year
 * @return {Boolean}   Returns true if valid
 */
function isValidDate (d, m, y) {
	m = parseInt(m, 10);
    return m >= 0 && m < 12 && d > 0 && d <= daysInMonth(m, y);
};

function pressKey(browserAction) {
	var deferred = protractor.promise.defer();
	browserAction = browserAction.toLowerCase();
	switch (browserAction) {
		case "enter":
			// return $('body').sendKeys(protractor.Key.ENTER);
			return browser.actions().sendKeys(protractor.Key.ENTER).perform()
		case "control":
			return browser.actions().sendKeys(protractor.Key.CONTROL).perform()
		case "tab":
			return browser.actions().sendKeys(protractor.Key.TAB).perform();
		case "escape":
			return browser.actions().sendKeys(protractor.Key.ESCAPE).perform();
		case "backspace":
			return browser.actions().sendKeys(protractor.Key.BACK_SPACE).perform();
		case "delete":
			return browser.actions().sendKeys(protractor.Key.DELETE).perform();
		case "space":
			return browser.actions().sendKeys(protractor.Key.SPACE).perform();
		case "page up":
		case "pageup":
			return browser.actions().mouseMove(element(by.xpath("//body")), { x: 0, y: 0 }).perform().then(function () {
				return browser.actions().click().perform().then(function () {
					return browser.actions().sendKeys(protractor.Key.PAGE_UP).perform();
				});
			});
		case "page down":
		case "pagedown":
			return browser.actions().mouseMove(element(by.xpath("//body")), { x: 0, y: 0 }).perform().then(function () {
				return browser.actions().click().perform().then(function () {
					return browser.actions().sendKeys(protractor.Key.PAGE_DOWN).perform();
				});
			});
		case "arrow right":
			return $('body').sendKeys(protractor.Key.ARROW_RIGHT);
		case "arrow left":
			return $('body').sendKeys(protractor.Key.ARROW_LEFT);
		case "arrow down":
			return $('body').sendKeys(protractor.Key.ARROW_DOWN);
		case "arrow up":
			return $('body').sendKeys(protractor.Key.ARROW_UP);
		case "end":
			return browser.actions().sendKeys(protractor.Key.END).perform();
		case "home":
			return browser.actions().sendKeys(protractor.Key.HOME).perform();
		case "f1":
			return browser.actions().sendKeys(protractor.Key.F1).perform();
		case "f2":
			return browser.actions().sendKeys(protractor.Key.F2).perform();
		case "f3":
			return browser.actions().sendKeys(protractor.Key.F3).perform();
		case "f4":
			return browser.actions().sendKeys(protractor.Key.F4).perform();
		case "f5":
			return browser.actions().sendKeys(protractor.Key.F5).perform();
		case "f6":
			return browser.actions().sendKeys(protractor.Key.F6).perform();
		case "f7":
			return browser.actions().sendKeys(protractor.Key.F7).perform();
		case "f8":
			return browser.actions().sendKeys(protractor.Key.F8).perform();
		case "f9":
			return browser.actions().sendKeys(protractor.Key.F9).perform();
		case "f10":
			return browser.actions().sendKeys(protractor.Key.F10).perform();
		case "f11":
			return browser.actions().sendKeys(protractor.Key.F11).perform();
		case "f12":
			return browser.actions().sendKeys(protractor.Key.F12).perform();
		default:
			console.log("Unknown browser action");
			tierdown(true);
			return deferred.promise;
	}
}

function dragAndDropd(fromElement, toElement) {
	return browser.actions()
		.mouseDown(fromElement)
		.mouseMove(toElement)
		.mouseUp()
		.perform()
}