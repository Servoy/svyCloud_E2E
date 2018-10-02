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

defineSupportCode(({ Given, Then, When, Before, After }) => {
	//BASIC NAGIVATION
	Given('I go to {url}', { timeout: 60 * 1000 }, function (url, callback) {
		console.log("Opening browser URL: " + url);
		browser.get(url).then(function () {
			wrapUp(callback, "navigateURLEvent");
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
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
			console.log(error.message);
			tierdown(true);
		});
	});

	When('I want to switch to browser tab {tabNumber}', {timeout: 15 * 1000}, function(tabNumber, callback){
		browser.getAllWindowHandles().then(function(handles) {
			var newTabHandle = handles[tabNumber - 1];
			browser.switchTo().window(newTabHandle).then(function () {
				wrapUp(callback, "navigateEvent");
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	//URL VALIDATION
	Then('I expect the url to be {browserUrl}', { timeout: 30 * 1000 }, function (url, callback) {
		browser.getCurrentUrl().then(function (browserUrl) {
			if(browserUrl === url) {
				wrapUp(callback, "validateEvent");
			} else {
				console.log('Validation failed. Expected URL: ' + url + '. Current URL: ' + browserUrl)
			}
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
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
			console.log(error.message);
			tierdown(true);
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
			console.log(error.message);
			tierdown(true);
		});
	});

	When('servoy sidenav component with name {elementName} tab {tabName} is clicked', { timeout: 30 * 1000 }, function (elementName, tabName, callback) {
		var sideNav = element(by.xpath("//data-servoyextra-sidenav[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.presenceOf(sideNav)).then(function(isPresent){
			if(isPresent) {
				var item = sideNav.element(by.xpath('//*[text()=\"' + tabName + '\" and contains(@class, "svy-sidenav-item-text")]'));
				browser.wait(EC.elementToBeClickable(item), 30 * 1000, 'Element not clickable').then(function(){
					clickElement(item).then(function(){
						wrapUp(callback, "Click event");
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
			console.log(error.message);
			tierdown(true);
		});
	});

	Then('servoy sidenav component with name {elementName} I expect the tab {tabText} to be present', {timeout: 30 * 1000 },function(elementName, tabText, callback){
		var sideNav = element(by.xpath("//data-servoyextra-sidenav[@data-svy-name='" + elementName+"']"));
		browser.wait(EC.presenceOf(sideNav), 30 * 1000, 'Sidenav not found!').then(function(){
			var sideNavTab = sideNav.element(by.xpath("//span[text()='" + tabText + "']"));
			browser.wait(EC.presenceOf(sideNavTab), 20 * 1000, 'Tab with the given text not found!').then(function(){
				wrapUp(callback, "validateEvent");
			});
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
		});
	})
	//END SERVOY SIDENAV COMPONENT

	//SERVOY CALENDAR COMPONENT
	When('servoy calendar component with name {elementName} is clicked', { timeout: 60 * 1000 }, function (elementName, callback) {
		var calendar = element(by.xpath("//data-servoydefault-calendar[@data-svy-name='" + elementName + "']/div/span[1]"));
		browser.wait(EC.presenceOf(calendar), 15 * 1000, 'Calendar not found!').then(function () {
			clickElement(calendar).then(function () {
				wrapUp(callback, "Click event");
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			})
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
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
		var monthList = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
		var monthTo = monthList.indexOf(month.toLowerCase());
		var calMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		var yearTo = year;
		var dateHeaderText = element(by.xpath("//th[@class='picker-switch']"));
		browser.wait(EC.presenceOf(dateHeaderText), 15 * 1000, 'Header text not visible!').then(function () {
			dateHeaderText.getText().then(function (calYear) {
				var yearFrom = calYear.split(" ")[1];
				if (yearFrom != yearTo) { //switch years if end dates aint equal
					clickElement(element(by.xpath("//div[@class='datepicker-days']/table/thead/tr/th[2]"))).then(function () {
						if (yearFrom < yearTo) {
							for (var x = 0; x < (yearTo - yearFrom); x++) {
								clickElement(element(by.xpath("//div[@class='datepicker-months']/table/thead/tr/th[3]")));
							}
						} else {
							for (var x = 0; x < (yearFrom - yearTo); x++) {
								clickElement(element(by.xpath("//div[@class='datepicker-months']/table/thead/tr/th[1]")));
							}
						}
					}).then(function () {
						clickElement(element(by.xpath("//div[@class='datepicker-months']")).element(by.xpath("//span[.='" + calMonths[monthTo] + "']"))).then(function () {
							return clickElement(element(by.xpath("//div[@class='datepicker-days']")).element(by.xpath("//td[.='" + day + "' and not(contains(@class, 'cw')) and not(contains(@class, 'old'))]")));
						});
					});
				} else {
					clickElement(element(by.xpath("//div[@class='datepicker-days']/table/thead/tr/th[2]"))).then(function () {
						return clickElement(element(by.xpath("//div[@class='datepicker-months']")).element(by.xpath("//span[.='" + calMonths[monthTo] + "']"))).then(function () {
							return clickElement(element(by.xpath("//div[@class='datepicker-days']")).element(by.xpath("//td[.='" + day + "' and not(contains(@class, 'cw')) and not(contains(@class, 'old'))]")));
						});
					});
				}
			}).then(function () {		
				wrapUp(callback, "Calendar event");			
			});
		}).catch(function(error){
			console.log(error.message);
			tierdown(true)
		});	
	});

	When('servoy calendar component I want to select day {day}', { timeout: 15 * 1000 }, function (day, callback) {
		browser.wait(EC.presenceOf(element(by.cssContainingText("td", day)))).then(function () {
			browser.wait(EC.elementToBeClickable(element(by.cssContainingText("td", day)))).then(function () {
				clickElement(element(by.cssContainingText("td.day", day))).then(function () {
					wrapUp(callback, "Click event");
				});
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});
	//END SERVOY CALENDAR COMPONENT

	//SERVOY SELECT2TOKENIZER COMPONENT
	When('servoy select2tokenizer component with name {elementName} is clicked', { timeout: 60 * 1000 }, function (elementName, callback) {
		var tokenizer = element(by.css("data-servoyextra-select2tokenizer[data-svy-name='" + elementName + "']")).element(by.css("input"));
		browser.wait(EC.visibilityOf(tokenizer), 15 * 1000, 'Tokenizer not found!').then(function(){
			clickElement(tokenizer).then(function () {
				wrapUp(callback, "Click event");
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
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
						clickElement(rows.get(rowNumber - 1)).then(function () {
							wrapUp(callback, "clickEvent");
						});
					}
				});
			})
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
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
							console.log(textToCompare)
							if(textToCompare.toLowerCase() === validateText.toLowerCase()) {
								wrapUp(callback, "validateEvent");
							};
						})
					}
				})
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
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
			console.log(error.message);
			tierdown(true);
		})
	});

	When('servoy select2tokenizer component with name {elementName} the text {recordText} is inserted', { timeout: 60 * 1000 }, function (elementName, text, callback) {
		var elem = element(by.css("data-servoyextra-select2tokenizer[data-svy-name='" + elementName + "']")).element(by.css("input"));
		sendKeys(elem, text).then(function () {
			wrapUp(callback, "Click event");
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});
	//END SERVOY SELECT2TOKENIZER COMPONENT

	//BROWSER ACTION
	When('I press {browserAction}', { timeout: 30 * 1000 }, function (browserAction, callback) {
		pressKey(browserAction).then(function(retVal) {
			if(retVal) {
				wrapUp(callback, "insertEvent");
			}			
		}).catch(function(error) {
			console.log(error.message);
			tierdown(true);
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
					browser.actions().keyDown(protractor.Key.CONTROL).sendKeys(key).perform().then(function () {
						wrapUp(callback, "keypressEvent");
					}).catch(function (error) {
						console.log(error.message);
						tierdown(true);
					});
				}
				break;
			case "alt": 
				browser.actions().keyDown(protractor.Key.ALT).sendKeys(key).perform().then(function () {
					wrapUp(callback, "keypressEvent");
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});
			case "shift": 
				browser.actions().keyDown(protractor.Key.SHIFT).sendKeys(key).perform().then(function () {
					wrapUp(callback, "keypressEvent");
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});
		}		
	});
	//END BROWSER ACTION

	//BROWSER ZOOM
	Then('I want to zoom the page out to {percentage} percent', {timeout: 10*1000}, function(percentage, callback){
		browser.executeScript("document.body.style.zoom='"+percentage+"%'").then(function(){
			wrapUp(callback, 'browserZoomEvent');
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
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
		}).catch(function(error) {
			console.log(error.message);
			tierdown(true);
		});	
	});

	When('servoy table component with name {elementName} I want to select element number {number} with name {elemName}',{timeout: 30 * 1000} ,function(elementName, rowNumber, elemName, callback){
		var table = element.all(by.xpath("//div[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.visibilityOf(table.first()), 30 * 1000, 'Table not found!').then(function(){
			var elem = table.all(by.xpath("//*[@data-svy-name='"+elemName+"']")).get(rowNumber - 1);
			clickElement(elem).then(function(){
				wrapUp(callback, "clickEvent");
			});
		}).catch(function(error) {
			console.log(error.message);
			tierdown(true);
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
					console.log('Element with the given attribute has not been found!');
					tierdown(true);
				}
			});
		}).catch(function(error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	Then('servoy table component with name {elementName} I want to validate that there is/are {rowCount} row(s) currently visible', {timeout: 60 * 1000}, function(elementName, rowCount, callback){
		var baseTable = element.all(by.xpath("//div[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.presenceOf(baseTable.first()), 30 * 1000, 'Table not found!').then(function(){
			baseTable.all(by.xpath("//div[contains(@class, 'ui-grid-row')]")).count().then(function(count){
				if(count === parseInt(rowCount)) {
					wrapUp(callback, "validateEvent");
				} else {
					console.log('Invalid amount of rows found. Found: ' + count + ". Expected: " + rowCount);
					tierdown(true);
				}
			});
		}).catch(function(error) {
			console.log(error.message);
			tierdown(true);
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
		}).catch(function(error) {
			console.log(error.message);
			tierdown(true);
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
		}).catch(function(error) {
			console.log(error.message);
			tierdown(true);
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
		}).catch(function(error) {
			console.log(error.message);
			tierdown(true);
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
			console.log(error.message);
			tierdown(true);
		});
	});

	When('servoy extra table component with name {elementName} I want to select row number {rowNumber}', { timeout: 30 * 1000 }, function (elementName, rowNumber, callback) {
		browser.wait(EC.visibilityOf(element(by.xpath("//data-servoyextra-table[@data-svy-name='" + elementName + "']"))), 30 * 1000, 'Element not found!').then(function () {
			element.all(by.xpath("//data-servoyextra-table[@data-svy-name='" + elementName + "']")).each(function (rowItems) {
				clickElement(rowItems.all(by.xpath("div/table/tbody/tr")).get(rowNumber - 1)).then(function () {
					wrapUp(callback, "clickEvent");
				});
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function(error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	When('servoy extra table component with name {elementName} I want to double click row number {rowNumber}', { timeout: 30 * 1000 }, function (elementName, rowNumber, callback) {
		browser.wait(EC.visibilityOf(element(by.xpath("//data-servoyextra-table[@data-svy-name='" + elementName + "']"))), 30 * 1000, 'Element not found!').then(function () {			
			element.all(by.xpath("//data-servoyextra-table[@data-svy-name='" + elementName + "']")).each(function (rowItems) {
				browser.actions().doubleClick(rowItems.all(by.xpath("div/table/tbody/tr")).get(rowNumber - 1)).perform().then(function () {
					wrapUp(callback, "clickEvent");
				});
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function(error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	//NOTE: this test step only works for the timesheet application
	When('servoy data-servoyextra-table component I want to edit row number {rowNumber} of {weekDay}', { timeout: 30 * 1000 }, function (rowNumber, weekDay, callback) {
		var table = element(by.xpath("//data-servoyextra-table[@data-svy-name='timesheetPage.table" + weekDay.toLowerCase().charAt(0).toUpperCase() + weekDay.slice(1) + "']"));
		clickElement(table.$$("tbody").$$("tr").get(rowNumber - 1).$$("td").get(5)).then(function () {
			wrapUp(callback, "clickEvent");
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
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
			console.log(error.message);
			tierdown(true);
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
						console.log(found);
					// 	found = true;
					}
				})
			});
		}).then(function(){
			// if(found) {
			// 	wrapUp(callback, 'validateEvent');
			// }
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
		})
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
			console.log(error.message);
			tierdown(true);
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
			console.log(error.message);
			tierdown(true);
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
			console.log(error.message);
			tierdown(true);
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
			console.log(error.message);
			tierdown(true);
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
			console.log(error.message);
			tierdown(true);
		});
	});

	When('servoy default typeahead component with name {elementName} is clicked', { timeout: 60 * 1000 }, function (elementName, callback) {
		var typeahead = element(by.xpath("//input[@data-svy-name='" + elementName +"']"));
		browser.wait(EC.visibilityOf(typeahead), 15 * 1000, 'Typeahead not visible!').then(function(){
			clickElement(typeahead).then(function(){
				wrapUp(callback, "clickEvent");
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
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
			console.log(error.message);
			tierdown(true);
		});
	});

	When('servoy default typeahead component I want to select row number {rowNumber}', { timeout: 30 * 1000 }, function (rowNumber, callback) {
		// dropdown-menu ng-isolate-scope
		element.all(by.xpath("//ul[contains(concat(' ', @class, ' '), ' dropdown-menu ') and contains(concat(' ', @class, ' '), ' ng-isolate-scope ') and not(contains(concat(' ', @class, ' '), ' ng-hide '))]")).each(function (typeaheadSelectOptions) {
			clickElement(typeaheadSelectOptions.all(by.xpath("//li[contains(@class, 'uib-typeahead-match') and contains(@class, 'ng-scope')]/a")).get(rowNumber - 1)).then(function () {
				wrapUp(callback, "clickEvent");
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	Then('servoy default typeahead component with name {elementName} I want to validate that the typeahead equals the text {text}', {timeout: 15 * 1000}, function(elementName, text, callback){
		var typeahead = element(by.xpath("//input[@data-svy-name='" + elementName +"']"));
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
			console.log(error.message);
			tierdown(true);
		});
	});
	//END SERVOY TYPEAHEAD
		
	//DEFAULT INPUT FIELD
	When('servoy default input component with name {elementName} the text {input} is inserted', {timeout: 30 * 1000}, function(elementName, text, callback){
		var inputField = element(by.xpath("//input[@data-svy-name='"+elementName+"']"));
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
			console.log(error.message);
			tierdown(true);
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
			console.log(error.message);
			tierdown(true);
		});
	});

	Then('servoy default input component with name {elementName} I want to validate that the input field equals the text {text}', {timeout: 30 * 1000}, function(elementName, text, callback){
		var inputField = element(by.xpath("//input[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.visibilityOf(inputField), 30 * 1000, 'Input field not found!').then(function(){
			inputField.getAttribute('value').then(function(inputText){
				return inputText.toLowerCase() === text.toLowerCase();
			}).then(function(isValidated){
				console.log(isValidated);
				if(isValidated) {
					wrapUp(callback, 'validateEvent');
				}
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});
	
	When('servoy data-servoydefault-check component with name {elementName} I want it to be {checkboxOption}', { timeout: 30 * 1000 }, function (elementName, checkboxOption, callback) {
		var checkbox = element(by.xpath("//data-servoydefault-check[@data-svy-name='" + elementName + "']/label/input"));
		browser.wait(EC.presenceOf(checkbox), 25 * 1000, 'Checkbox not found!').then(function(){
			checkbox.isSelected().then(function (isChecked) {
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
			console.log(error.message);
			tierdown(true);
		});
	});

	When('servoy data-servoydefault-check component with name {elementName} I want to validate that the checkbox is {checkBoxState}', { timeout: 30 * 1000 }, function (elementName, checkBoxState, callback) {
		var checkbox = element(by.xpath("//data-servoydefault-check[@data-svy-name='" + elementName + "']/label/input"));
		browser.wait(EC.visibilityOf(checkbox), 15 * 1000, 'Checkbox not found!').then(function(){
			checkbox.isSelected().then(function (isChecked) {
				return !isChecked && checkBoxState.toLowerCase() === "unchecked" || isChecked && checkBoxState.toLowerCase() === "checked"
			}).then(function(isChecked) {
				if (isChecked) {
					wrapUp(callback, "checkboxEvent");
				} else {
					tierdown(true);
				}
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	//SERVOY PASSWORD FIELD
	When('servoy data-servoydefault-password component with name {elementName} the text {password} is inserted', {timeout: 30 * 1000}, function(elementName, text, callback){
		var inputField = element(by.xpath("//data-servoydefault-password[@data-svy-name='" + elementName + "']/input"));
		browser.wait(EC.visibilityOf(inputField), 15 * 1000, 'Input field not found!').then(function () {
			sendKeys(inputField, text).then(function () {
				wrapUp(callback, 'insertEvent');
			});
		}).catch(function (error) {
			tierdown(error)
		});
	});
	//END SERVOY PASSWORD FIELD

	//SERVOY COMBOBOX
	When('servoy combobox component with name {elementName} is clicked', { timeout: 60 * 1000 }, function (elementName, callback) {
		var combobox = element(by.xpath("//data-servoydefault-combobox[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(combobox), 15 * 1000, 'Combobox not found!').then(function () {
			clickElement(combobox).then(function () {
				wrapUp(callback, "Click event");
			})
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});
	
	Then('servoy combobox component I want to select number {comboboxNumber} in the combobox', { timeout: 60 * 1000 }, function (comboboxNumber, callback) {
		element.all(by.css(".svy-combobox.ui-select-container.ui-select-bootstrap")).each(function (comboItems) {
			comboItems.all(by.xpath("//div[contains(@class, 'ui-select-choices-row')]")).get(comboboxNumber - 1).click().then(function () {
				wrapUp(callback, "comboboxSelectEvent");
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	Then('servoy combobox component I want to select the combobox item with the text {text}', { timeout: 60 * 1000 }, function (text, callback) {
		//no looping through the elements due to element not being visible anymore after it's clicked.
		var comboBoxItem = element.all(by.xpath("//div[contains(@class, 'svy-combobox') and contains(@class, 'ui-select-container')]"))
			.all(by.xpath("//div[text()='"+text+"']")).first();
		browser.wait(EC.visibilityOf(comboBoxItem), 30 * 1000, 'Combobox item not found!').then(function(){
			browser.wait(EC.elementToBeClickable(comboBoxItem), 30 * 1000, 'Combobox item not clickable!').then(function(){
				clickElement(comboBoxItem).then(function(){
					wrapUp(callback, 'clickEvent');
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	When('servoy combobox component with name {elementName} I want to validate that the combobox item with text {text} is selected', {timeout: 30 * 1000}, function(elementName, text, callback){
		var combobox = element.all(by.xpath("//data-servoydefault-combobox[@data-svy-name='" + elementName +"']"));
		browser.wait(EC.visibilityOf(element(by.xpath("//data-servoydefault-combobox[@data-svy-name='" + elementName +"']"))), 30 * 1000, 'Combobox not found!').then(function(){
			var selectedItem = combobox.all(by.xpath("//span[text()='"+text+"']"));
			selectedItem.isPresent().then(function(isPresent){
				return isPresent;
			}).then(function(isPresent){
				if(isPresent) {
					wrapUp(callback, 'validateEvent');
				}
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	When('servoy combobox component the text {text} is inserted', { timeout: 60 * 1000 }, function (text, callback) {
		var comboBox = element.all(by.xpath("//div[contains(@class, 'ui-select-container') and contains(@class, 'ui-select-bootstrap') and contains(@class, 'ng-touched')]/input")).last();
		browser.wait(EC.visibilityOf(comboBox), 15 * 1000, 'Combobox not found!').then(function(){
			sendComboboxKeys(comboBox, text).then(function () {
				wrapUp(callback, "Insert value event");
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
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
			console.log(error.message);
			tierdown(true);
		});
	});
	//END SERVOY BUTTON

	//END DEFAULT INPUT FIELD
	//SERVOY LABEL 
	When('servoy data-servoydefault-label component with name {elementName} is clicked', {timeout: 30 * 1000}, function(elementName, callback) {
		var labelButton = element(by.xpath("//data-servoydefault-button[@data-svy-name='"+elementName+"']/button"));
		labelButton.isPresent().then(function(isPresent){
			if(isPresent){
				clickElement(labelButton).then(function(){
					wrapUp(callback, "clickEvent");
				}).catch(function(error){
					tierdown(error)
				});
			} else {
				var label = element(by.xpath("//data-servoydefault-label[@data-svy-name='"+elementName+"']"));
				browser.wait(EC.visibilityOf(label), 30 * 1000, 'Label not found!').then(function(){
					clickElement(element(by.xpath("//data-servoydefault-label[@data-svy-name='"+elementName+"']/div"))).then(function(){
						wrapUp(callback, "clickEvent");
					}).catch(function(error){
						tierdown(error)
					});
				}).catch(function(error){
					tierdown(error)
				});
			}
		}).catch(function(error){
			tierdown(error)
		});
	});

	Then('servoy data-servoydefault-label component with name {elementName} I want to validate that the label equals the text {text}', {timeout: 30 * 1000}, function(elementName, text, callback){
		var label = element(by.xpath("//data-servoydefault-label[@data-svy-name='"+elementName+"']"));
		var labelButton = element(by.xpath("//data-servoydefault-button[@data-svy-name='"+elementName+"']/button/div/span[2]"));
		labelButton.isPresent().then(function(isPresent){
			console.log(isPresent);
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
		}).catch(function(error){
			tierdown(error)
		});
	})
	//END SERVOY LABEL

	//BOOTSTRAP COMPONENTS
	//BOOTSTRAP TEXTBOX
	When('bootstrap data-bootstrapcomponents-textbox component with name {elementName} the text {text} is inserted', { timeout: 30 * 1000 }, function (elementName, text, callback) {
		browser.wait(EC.visibilityOf(element(by.xpath("//data-bootstrapcomponents-textbox[@data-svy-name='" + elementName + "']/input"))), 30 * 1000, 'Element not found!').then(function () {
			sendKeys(element(by.xpath("//data-bootstrapcomponents-textbox[@data-svy-name='" + elementName + "']/input")), text).then(function () {
				wrapUp(callback, "insertTextEvent");
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	When('bootstrap data-bootstrapcomponents-textbox component with name {elementName} is clicked', { timeout: 30 * 1000 }, function (elementName, callback) {
		var textField = element(by.xpath("//data-bootstrapcomponents-textbox[@data-svy-name='" + elementName+"']/input"));
		browser.wait(EC.visibilityOf(textField), 30 * 1000, 'Textfield not found!').then(function () {
			clickElement(textField).then(function() {
				wrapUp(callback, "insertTextEvent");
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	Then('bootstrap data-bootstrapcomponents-textbox component with name {elementName} I want to validate that text text is blank', {timeout: 30 * 1000}, function(elementName, callback){		
		var textField = fComponent.element(by.xpath("//data-bootstrapcomponents-textbox[@data-svy-name='" + elementName + "']/input"));
		browser.wait(EC.presenceOf(textField), 30 * 1000, 'Textbox not found!').then(function () {
			textField.getAttribute('value').then(function (value) {
				if (!value) {
					wrapUp(callback, "validateEvent");
				} else {
					console.log("Validation failed. Expected an empty text field. Got " + value);
				}
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	Then('bootstrap data-bootstrapcomponents-textbox component with name {elementName} I want to validate that the input field equals the text {text}', { timeout: 30 * 1000 }, function (elementName, text, callback) {
		var textField = element(by.xpath("//data-bootstrapcomponents-textbox[@data-svy-name='" + elementName + "']/input"));
		browser.wait(EC.visibilityOf(textField), 30 * 1000, 'Element not found!').then(function () {
			textField.getAttribute('value').then(function(textFieldText){
				if(text === textFieldText) {
					wrapUp(callback, "validateEvent");
				} else {
					console.log("Validation failed. Expected " + text + ". Got " + textFieldText);
				}
			})
		}).catch(function(error){
			console.log(error.message);
			tierdown(false);
		});
	});	
	//END BOOTSTRAP TEXTBOX
	//BOOTSTRAP BUTTON
	When('bootstrap data-bootstrapcomponents-button component with name {elementName} is clicked', { timeout: 30 * 1000 }, function (elementName, callback) {
		var button = element(by.xpath("//data-bootstrapcomponents-button[@data-svy-name='" + elementName + "']/button"));
		browser.wait(EC.visibilityOf(button), 15 * 1000, 'Button not found!').then(function(){
			clickElement(button).then(function () {
				wrapUp(callback, "clickEvent");
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
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
						console.log('Button is currently disabled. Expected it to be enabled.')
					} else {
						console.log('Button is currently enabled. Expected it to be disabled.')
					}
				}
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	Then('bootstrap data-bootstrapcomponents-button component with name {elementName} I want to validate that the button its text partially equals the text {text}', {timeout: 30 * 1000}, function(elementName, text, callback){
		var button = element(by.xpath("//data-bootstrapcomponents-button[@data-svy-name='" + elementName + "']/button"));
		browser.wait(EC.visibilityOf(button), 15 * 1000, 'Button not found!').then(function(){
			button.getText().then(function(buttonText){
				if(buttonText.indexOf(text) > -1) {
					wrapUp(callback, "validateEvent");
				} else {
					console.log("Partial validation failed. Expected " + text + ". Got " + buttonText);
				}
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
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
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});
	//END BOOTSTRAP BUTTON

	//BOOTSTRAP SELECT
	When('bootstrap data-bootstrapcomponents-select component with name {elementName} is clicked', { timeout: 30 * 1000 }, function (elementName, callback) {
		var selectComponent = element(by.xpath("//data-bootstrapcomponents-select[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(selectComponent), 15 * 1000, 'Select component not found!').then(function () {
			clickElement(selectComponent).then(function () {
				wrapUp(callback, "clickEvent");
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});	
	});

	When('bootstrap data-bootstrapcomponents-select component with name {elementName} I want to select the row with {text} as text', { timeout: 45 * 1000 }, function (elementName, text, callback) {
		var selectComponent = element(by.xpath("//data-bootstrapcomponents-select[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(selectComponent), 30 * 1000, 'Select component not visible!').then(function(){
			var inputField = selectComponent.element(by.xpath("//option[text()='"+text+"']"));
			inputField.isPresent().then(function(isPresent){
				console.log(isPresent);
				if(isPresent) {
					clickElement(inputField).then(function(){
						wrapUp(callback, "clickEvent");
					});
				}
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	When('bootstrap data-bootstrapcomponents-select component with name {elementName} I want to select row number {rowNumber}', { timeout: 45 * 1000 }, function (elementName, rowNumber, callback) {
		var table = element.all(by.xpath("//data-bootstrapcomponents-select[@data-svy-name='" + elementName + "']/select"));
		if (rowNumber) {
			table.all(by.tagName('option')).then(function (options) {
				options[rowNumber].click().then(function () {
					wrapUp(callback, "clickEvent");
				})
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		}
	});

	Then('bootstrap data-bootstrapcomponents-select component with name {elementName} I want to validate that the selected row equals {text}', { timeout: 45 * 1000 }, function (elementName, rowNumber, text, callback) {
		var table = element.all(by.xpath("//data-bootstrapcomponents-select[@data-svy-name='" + elementName + "']/select"));
		var row = table.first().element(by.xpath("//option[@selected='selected']"));
		browser.wait(EC.presenceOf(row), 30 * 1000, 'No row is selected!').then(function(){
			row.getText().then(function(rowText){
				if (rowText === text) {
					wrapUp(callback, "validateEvent");
				} else {
					console.log("Validation failed. Expected " + text + ". Got " + rowText);
				}
			})
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});
	//END BOOTSTRAP SELECT

	//BOOTSTRAP TEXTAREA
	When('bootstrap data-bootstrapcomponents-textarea component with name {elementName} the text {text} is inserted', { timeout: 30 * 1000 }, function (elementName, text, callback) {
		sendKeys(element(by.xpath("//data-bootstrapcomponents-textarea[@data-svy-name='" + elementName + "']/textarea")), text).then(function () {
			wrapUp(callback, "insertEvent");
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});
	//END BOOTSTRAP TEXTAREA

	//BOOTSTRAP CHECKBOX
	When('bootstrap data-bootstrapcomponents-checkbox component with name {elementName} I want it to be {checkboxState}', { timeout: 30 * 1000 }, function (elementName, checkboxOption, callback) {
		var checkbox = element(by.xpath("//data-bootstrapcomponents-checkbox[@data-svy-name='" + elementName + "']/div/label/input"));
		checkbox.isSelected().then(function (isChecked) {
			console.log(isChecked);
			if (isChecked && checkboxOption.toLowerCase() === "unchecked" || !isChecked && checkboxOption.toLowerCase() === "checked") {
				clickElement(checkbox).then(function () {
					wrapUp(callback, "checkboxEvent");
				})
			} else {
				console.log('Checkbox did not have to be changed');
				wrapUp(callback, "checkboxEvent");
			}
		}).catch(function (error) {
			console.log(error.message);
		})
	});

	Then('bootstrap data-bootstrapcomponents-checkbox component with name {elementName} I want to validate that the checkbox is {checkBoxState}', { timeout: 30 * 1000 }, function (elementName, checkboxOption, callback) {
		var checkbox = element(by.xpath("//data-bootstrapcomponents-checkbox[@data-svy-name='" + elementName + "']/div/label/input"));
		browser.wait(EC.visibilityOf(checkbox), 15 * 1000, 'Checkbox not found!').then(function(){
			checkbox.isSelected().then(function (isChecked) {			
				if (isChecked && checkboxOption.toLowerCase() === "checked" || !isChecked && checkboxOption.toLowerCase() === "unchecked") {				
					wrapUp(callback, "checkboxEvent");
				} else {
					console.log('Validation failed. State of the checkbox does not match the expected state!');
					tierdown(true);
				}
			}).catch(function (error) {
				console.log(error.message);
			});
		});
	});

	Then('bootstrap data-bootstrapcomponents-checkbox component with name {elementName} I want to validate that the checkbox label equals the text {text}', { timeout: 30 * 1000 }, function (elementName, text, callback) {
		var checkbox = element(by.xpath("//data-bootstrapcomponents-checkbox[@data-svy-name='" + elementName + "']/div/label/span"));
		browser.wait(EC.visibilityOf(checkbox), 15 * 1000, 'Checkbox not found!').then(function(){
			checkbox.getText().then(function(inputText) {
				if(inputText === text) {
					wrapUp(callback, "validateEvent")
				} else {
					console.log("Validation failed. Expected " + text + ". Got " + inputText);
				}
			})
		}).catch(function(error){
			tierdown(true);
		});
	});

	Then('bootstrap data-bootstrapcomponents-checkbox component with name {elementName} I want to validate that the checkbox label partially equals the text {text}', { timeout: 30 * 1000 }, function (elementName, text, callback) {
		var checkbox = element(by.xpath("//data-bootstrapcomponents-checkbox[@data-svy-name='" + elementName + "']/div/label/span"));
		browser.wait(EC.visibilityOf(checkbox), 15 * 1000, 'Checkbox not found!').then(function(){
			checkbox.getText().then(function(inputText) {
				if(inputText.indexOf(text) > -1) {
					wrapUp(callback, "validateEvent")
				} else {
					console.log("Validation failed. Expected " + text + ". Got " + inputText);
				}
			})
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
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
			console.log(error.message);
			tierdown(true);
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
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);			
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
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);			
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
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);			
		});
	});
	//END BOOTSTRAP BUTTON GROUP

	//BOOTSTRAP CHOICEGROUP
	When('bootstrap data-bootstrapcomponents-choicegroup component with name {elementName} I want option {optionNumber} to be {checkboxOption}', { timeout: 30 * 1000 }, function (elementName, optionNumber, checkboxOption, callback) {
		var choiceGroup = element.all(by.xpath("//data-bootstrapcomponents-choicegroup[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(choiceGroup.first()), 30 * 1000, 'Choicegroup not found!').then(function(){
			var option = choiceGroup.all(by.css("input")).get(optionNumber - 1);
			browser.wait(EC.presenceOf(option), 15 * 1000, 'Option not found!').then(function(){
				option.isSelected().then(function(isChecked){
					return isChecked && checkboxOption.toLowerCase() === "unchecked" || !isChecked && checkboxOption.toLowerCase() === "checked";
				}).then(function(isChecked){
					if(isChecked) {
						clickElement(option).then(function () {
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
			console.log(error.message);
			tierdown(true);
		});
	});

	When('bootstrap data-bootstrapcomponents-choicegroup component with name {elementName} I want the option with the text {text} to be {checkboxOption}', { timeout: 30 * 1000 }, function (elementName, checkboxOption, callback) {
		
	});
	//END BOOTSTRAP CHOICEGROUP

	//BOOTSTRAP CALENDAR
	When('bootstrap data-bootstrapcomponents-calendar component with name {elementName} I want to select {day} {month} {year}', { timeout: 120 * 1000 }, function (elementName, day, month, year, callback) {
		var calendar = element(by.xpath("//data-bootstrapcomponents-calendar[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(calendar), 30 * 1000, 'Calendar not found!').then(function () {
			clickElement(calendar.element(by.css("span[class='input-group-addon']"))).then(function () {
				var monthList = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
				var monthTo = monthList.indexOf(month.toLowerCase());
				var calMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
				var yearTo = year;
				var dateHeaderText = element(by.xpath("//th[@class='picker-switch']"));
				browser.wait(EC.presenceOf(dateHeaderText), 15 * 1000, 'Header text not visible!').then(function () {
					dateHeaderText.getText().then(function (calYear) {
						var yearFrom = calYear.split(" ")[1];
						if (yearFrom != yearTo) { //switch years if end dates aint equal
							clickElement(element(by.xpath("//div[@class='datepicker-days']/table/thead/tr/th[2]"))).then(function () {
								if (yearFrom < yearTo) {
									for (var x = 0; x < (yearTo - yearFrom); x++) {
										clickElement(element(by.xpath("//div[@class='datepicker-months']/table/thead/tr/th[3]")));
									}
								} else {
									for (var x = 0; x < (yearFrom - yearTo); x++) {
										clickElement(element(by.xpath("//div[@class='datepicker-months']/table/thead/tr/th[1]")));
									}
								}
							}).then(function () {
								clickElement(element(by.xpath("//div[@class='datepicker-months']")).element(by.xpath("//span[.='" + calMonths[monthTo] + "']"))).then(function () {
									return clickElement(element(by.xpath("//div[@class='datepicker-days']")).element(by.xpath("//td[.='" + day + "' and not(contains(@class, 'cw')) and not(contains(@class, 'old'))]")));
								});
							});
						} else {
							clickElement(element(by.xpath("//div[@class='datepicker-days']/table/thead/tr/th[2]"))).then(function () {
								return clickElement(element(by.xpath("//div[@class='datepicker-months']")).element(by.xpath("//span[.='" + calMonths[monthTo] + "']"))).then(function () {
									return clickElement(element(by.xpath("//div[@class='datepicker-days']")).element(by.xpath("//td[.='" + day + "' and not(contains(@class, 'cw')) and not(contains(@class, 'old'))]")));
								});
							});
						}
					}).then(function () {
						wrapUp(callback, "Calendar event");
					});
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true)
				});
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
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
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
		});
	});

	When('bootstrap data-bootstrapextracomponents-input-group component with name {elementName} I want to clear the text in field number {fieldNumber}', {timeout: 30 * 1000}, function(elementName, fieldNumber, callback){
		var inputGroup = element.all(by.xpath("//data-bootstrapextracomponents-input-group[@data-svy-name='" + elementName+"']"));
		browser.wait(EC.presenceOf(inputGroup.first()), 20 * 1000, 'Input group not found!').then(function(){
			var inputField = inputGroup.all(by.css("input[type='text']")).get(fieldNumber - 1);
			inputField.clear().then(function(){
				wrapUp(callback, "insertEvent");
			});
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
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
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
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
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
		});
	});
	//END BOOTSTRAP INPUT GROUP

	//BOOTSTRAP LABEL
	Then('bootstrap data-bootstrapcomponents-label component with name {elementName} I want to validate that the label equals the exact text {text}', {timeout: 30 * 1000}, function(elementName, text, callback){
		var bootstrapLabel = element(by.xpath("//data-bootstrapcomponents-label[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.visibilityOf(bootstrapLabel), 30 * 1000, 'Label not found!').then(function(){
			bootstrapLabel.element(by.css("span")).getText().then(function(labelText){
				if(text === labelText) {
					wrapUp(callback, "validateEvent");
				} else {
					console.log("Validation failed. Expected '" + text + "'. Got '" + labelText + "'");
				}
			});
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
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
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
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
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
		});
	});

	When('bootstrap data-bootstrapcomponents-label component with name {elementName} is clicked', {timeout: 30 * 1000}, function(elementName, callback){
		var label = element(by.xpath("//data-bootstrapcomponents-label[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(label), 15 * 1000, 'Datalabel not found!').then(function(){
			clickElement(label).then(function(){
				wrapUp(callback, "clickEvent");
			});
		}).catch(function(error) {
			console.log(error.message);
			tierdown(true);
		});
	});
	//END BOOTSTRAP LABEL

	//BOOTSTRAP DATA LABEL
	Then('bootstrap data-bootstrapcomponents-datalabel component with name {elementName} I want to validate that the label equals the exact text {text}', {timeout: 30 * 1000}, function(elementName, text, callback){
		var bootstrapLabel = element(by.xpath("//data-bootstrapcomponents-datalabel[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.visibilityOf(bootstrapLabel), 30 * 1000, 'Label not found!').then(function(){
			bootstrapLabel.element(by.css("span")).getText().then(function(labelText){
				if(text === labelText) {
					wrapUp(callback, "validateEvent");
				} else {
					console.log("Validation failed. Expected '" + text + "'. Got '" + labelText + "'");
				}
			});
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
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
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
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
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
		});
	}); 

	When('bootstrap data-bootstrapcomponents-datalabel component with name {elementName} is clicked', {timeout: 30 * 1000}, function(elementName, callback){
		var dataLabel = element(by.xpath("//data-bootstrapcomponents-datalabel[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(dataLabel), 15 * 1000, 'Datalabel not found!').then(function(){
			clickElement(dataLabel).then(function(){
				wrapUp(callback, "clickEvent");
			});
		}).catch(function(error) {
			console.log(error.message);
			tierdown(true);
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
									console.log('Neither the off nor on text of the switch equals the given text!');
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
									console.log('Neither the off nor on text of the switch equals the given text!');
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
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
		});
	});
	//END BOOTSTRAP SWITCH

	//BOOTSTRAP DROPDOWN
	When('bootstrap data-bootstrapextracomponents-dropdown component with name {elementName} is clicked', { timeout: 45 * 1000 }, function (elementName, callback) {
		var selectComponent = element(by.css("data-bootstrapextracomponents-dropdown[data-svy-name='" + elementName + "']")).element(by.css("button"));
		browser.wait(EC.visibilityOf(selectComponent), 30 * 1000, 'Dropdown component not visible!').then(function(){
			clickElement(selectComponent).then(function(){				
				wrapUp(callback, "clickEvent");
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	When('bootstrap data-bootstrapextracomponents-dropdown component with name {elementName} I want to select the row with {text} as text', { timeout: 45 * 1000 }, function (elementName, text, callback) {
		var selectComponent = element(by.css("data-bootstrapextracomponents-dropdown[data-svy-name='" + elementName + "']")).element(by.css("button"));
		browser.wait(EC.visibilityOf(selectComponent), 30 * 1000, 'Dropdown component not visible!').then(function(){
			clickElement(selectComponent).then(function(){
				var inputField = selectComponent.element(by.xpath("//a[text()[normalize-space() = '" + text + "']]"));
				clickElement(inputField).then(function(){
					wrapUp(callback, "clickEvent");
				});
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});
	
	//END BOOTSTRAP DROPDOWN
	//BOOTSTRAP COMPONENTS INSIDE FORMCOMPONENT
	//TEXT FIELDS
	When('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-textbox component with name {elementName} the text {text} is inserted', { timeout: 30 * 1000 }, function (formComponentName, elementName, text, callback) {
		var fComponent = element(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" + formComponentName + "']"));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not visible!').then(function () {
			browser.wait(EC.presenceOf(fComponent.element(by.css("data-bootstrapcomponents-textbox[data-svy-name='" + elementName + "']"))), 30 * 1000, 'Element not found!').then(function () {
				var tField = fComponent.element(by.css("data-bootstrapcomponents-textbox[data-svy-name='" + elementName + "']")).element(by.css("input"));
				browser.wait(EC.visibilityOf(tField), 30 * 1000, 'Textfield not found!').then(function(){
					sendKeys(tField, text).then(function () {
						wrapUp(callback, "insertTextEvent");
					});
				});
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	Then('formcomponent with the name {formComponentName} with a data-bootstrapcomponents-textbox component with name {cElementName} I want to validate that text text is blank', {timeout: 30 * 1000}, function(formComponentName, elementName, callback){
		var fComponent = element(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" +formComponentName + "']"));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function(){
			var textField = fComponent.element(by.css("data-bootstrapcomponents-textbox[data-svy-name='" + elementName + "']")).element(by.css("input"));
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
			console.log(error.message);
			tierdown(true);
		});
	});

	Then('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-textbox component with name {elementName} I want to validate that the input field equals the text {text}', { timeout: 30 * 1000 }, function (formComponentName, elementName, text, callback) {
		var fComponent = element(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" + formComponentName + "']"));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function () {
			var textField = fComponent.element(by.css("data-bootstrapcomponents-textbox[data-svy-name='" + elementName + "']")).element(by.css("input"));
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
			console.log(error.message);
			tierdown(false);
		});
	});	
	
	When('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-textbox component with name {elementName} is clicked', { timeout: 30 * 1000 }, function (formComponentName, elementName, callback) {
		var fComponent = element(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" + formComponentName + "']"));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function () {
			var textField = fComponent.element(by.css("data-bootstrapcomponents-textbox[data-svy-name='" + elementName + "']")).element(by.css("input"));
			browser.wait(EC.visibilityOf(textField), 30 * 1000, 'Textfield not found!').then(function () {
				clickElement(textField).then(function () {
					wrapUp(callback, "insertTextEvent");
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});


	//END TEXT FIELDS
	//DATA LABELS	
	Then('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-datalabel component with name {elementName} I want to validate that the label equals the exact text {text}', {timeout: 30 * 1000}, function(formComponentName, elementName, text, callback){
		var fComponent = element(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" +formComponentName + "']"));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function(){
			var bootstrapLabel = fComponent.element(by.css("data-bootstrapcomponents-datalabel[data-svy-name='"+elementName+"']"));
			browser.wait(EC.visibilityOf(bootstrapLabel), 30 * 1000, 'Label not found!').then(function(){
				bootstrapLabel.element(by.css("span")).getText().then(function(labelText){
					if(text === labelText) {
						wrapUp(callback, "validateEvent");
					} else {
						console.log("Validation failed. Expected '" + text + "'. Got '" + labelText + "'");
					}
				});
			}).catch(function(error){
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	Then('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-datalabel component with name {elementName} I want to validate that the label has no text', {timeout: 30 * 1000}, function(formComponentName, elementName, callback){
		var fComponent = element(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" +formComponentName + "']"));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function(){
			var bootstrapLabel = fComponent.element(by.css("data-bootstrapcomponents-datalabel[data-svy-name='"+elementName+"']"));
			browser.wait(EC.presenceOf(bootstrapLabel), 30 * 1000, 'Label not found!').then(function(){
				bootstrapLabel.element(by.css("span")).getAttribute('textContent').then(function(labelText){
					console.log('Text: ' + labelText)
					if(!labelText) {
						wrapUp(callback, "validateEvent");
					} else {
						console.log("Validation failed. Expected no value. Got '" + labelText + "'");
					}
				});
			}).catch(function(error){
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	Then('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-datalabel component with name {elementName} I want to validate that the label equals the partial text {text}', {timeout: 30 * 1000}, function(formComponentName, elementName, text, callback){
		var fComponent = element(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" +formComponentName + "']"));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function(){
			var bootstrapLabel = fComponent.element(by.css("data-bootstrapcomponents-datalabel[data-svy-name='"+elementName+"']"));
			browser.wait(EC.visibilityOf(bootstrapLabel), 30 * 1000, 'Label not found!').then(function(){
				bootstrapLabel.element(by.css("span")).getText().then(function(labelText){
					if(labelText.indexOf(text) > -1) {
						wrapUp(callback, "validateEvent");
					} else {
						console.log("Partial validation failed. Expected '" + text + "'. Got '" + labelText + "'");
					}
				});
			}).catch(function(error){
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	}); 

	When('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-datalabel component with name {elementName} is clicked', {timeout: 30 * 1000}, function(formComponentName, elementName, callback){
		var fComponent = element(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" +formComponentName + "']"));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function(){
			var dataLabel = fComponent.element(by.css("data-bootstrapcomponents-datalabel[data-svy-name='" + elementName + "']"));
			browser.wait(EC.visibilityOf(dataLabel), 15 * 1000, 'Datalabel not found!').then(function(){
				clickElement(dataLabel).then(function(){
					wrapUp(callback, "clickEvent");
				});
			}).catch(function(error) {
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});
	//END DATA LABELS
	//LABELS
	When('formcomponent with the name {elementName} with a data-bootstrapcomponents-label component with name {cElementName} is clicked', {timeout: 30 * 1000}, function(formComponentName, elementName, callback){
		var fComponent = element(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" +formComponentName + "']"));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function(){
			var label = fComponent.element(by.css("data-bootstrapcomponents-label[data-svy-name='" + elementName + "']"));
			browser.wait(EC.visibilityOf(label), 30 * 1000, 'Label not found!').then(function(){
				clickElement(label).then(function(){
					wrapUp(callback, "clickEvent");
				});
			});
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
		});
	});

	Then('formcomponent with the name {elementName} with a data-bootstrapcomponents-label component with name {cElementName} I want to validate that the label equals the partial text {text}', {timeout: 30 * 1000}, function(formComponentName, elementName, text, callback) {
		var fComponent = element(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" +formComponentName + "']"));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function(){
			var label = fComponent.element(by.css("data-bootstrapcomponents-label[data-svy-name='" + elementName + "']"));
			browser.wait(EC.visibilityOf(label), 30 * 1000, 'Label not found!').then(function(){
				label.getText().then(function(labelText) {
					if(labelText.indexOf(text) > -1) {
						wrapUp(callback, "validateEvent");
					} else {
						console.log("'" + text + "' not found in the text '" + labelText + "'");
					}
				})
			});
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
		});
	});

	Then('formcomponent with the name {elementName} with a data-bootstrapcomponents-label component with name {cElementName} I want to validate that the label equals the exact text {text}', {timeout: 30 * 1000}, function(formComponentName, elementName, text, callback) {
		var fComponent = element(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" +formComponentName + "']"));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function(){
			var label = fComponent.element(by.css("data-bootstrapcomponents-label[data-svy-name='" + elementName + "']"));
			browser.wait(EC.visibilityOf(label), 30 * 1000, 'Label not found!').then(function(){
				label.getText().then(function(labelText) {
					if(labelText === text) {
						wrapUp(callback, "validateEvent");
					} else {
						console.log("Validation failed. Expected '" + text + "'. Got '" + labelText + "'");
					}
				});
			});
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
		});
	});

	Then('formcomponent with the name {elementName} with a bootstrap data-bootstrapcomponents-label component with name {elementName} I want to validate that the label has no text', { timeout: 30 * 1000 }, function (formComponentName, elementName, callback) {
		var fComponent = element(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" + formComponentName + "']"));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function () {
			var bootstrapLabel = fComponent.element(by.css("data-bootstrapcomponents-label[data-svy-name='" + elementName + "']"));
			browser.wait(EC.visibilityOf(bootstrapLabel), 30 * 1000, 'Label not found!').then(function () {
				bootstrapLabel.element(by.css("span")).getText().then(function (labelText) {
					if (!labelText) {
						wrapUp(callback, "validateEvent");
					} else {
						console.log("Validation failed. Expected no value. Got '" + labelText + "'");
					}
				});
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});
	//END LABELS

	//BUTTONS
	When('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-button component with name {elementName} is clicked', { timeout: 30 * 1000 }, function (formComponentName, elementName, callback) {
		var fComponent = element(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" + formComponentName + "']"));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not visible!').then(function () {
			browser.wait(EC.presenceOf(fComponent.element(by.css("data-bootstrapcomponents-button[data-svy-name='" + elementName + "']"))), 30 * 1000, 'Element not found!').then(function () {
				var button = fComponent.element(by.css("data-bootstrapcomponents-button[data-svy-name='" + elementName + "']")).element(by.css("button"));
				clickElement(button).then(function(){
					wrapUp(callback, "clickEvent");
				});
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	Then('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-button component with name {elementName} I want to validate that the button is {enabled|disabled}', { timeout: 30 * 1000 }, function (formComponentName, elementName, state, callback) {
		var formComponent = element(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" + formComponentName + "']"));
		browser.wait(EC.presenceOf(formComponent), 15 * 1000, 'Form component not found!').then(function(){
			var button = formComponent.element(by.css("data-bootstrapcomponents-button[data-svy-name='" + elementName + "']")).element(by.css("button"));
			browser.wait(EC.visibilityOf(button), 15 * 1000, 'Button not found!').then(function(){
				button.isEnabled().then(function(buttonState) {
					if(!buttonState && state === 'disabled' || buttonState && state === 'enabled') {
						wrapUp(callback, "validateEvent");
					} else {
						if(!buttonState) {
							console.log('Button is currently disabled. Expected it to be enabled.')
						} else {
							console.log('Button is currently enabled. Expected it to be disabled.')
						}
					}
				});
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});
	//END BUTTONS

	//COMBOBOX
	When('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-select component with name {elementName} is clicked', { timeout: 30 * 1000 }, function (formComponentName, elementName, callback) {
		var fComponent = element(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" + formComponentName + "']"));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not visible!').then(function () {
			browser.wait(EC.presenceOf(fComponent.element(by.css("data-bootstrapcomponents-select[data-svy-name='" + elementName + "']"))), 30 * 1000, 'Element not found!').then(function () {
				var button = fComponent.element(by.css("data-bootstrapcomponents-select[data-svy-name='" + elementName + "']"));
				clickElement(button).then(function(){
					wrapUp(callback, "clickEvent");
				});
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	Then('formcomponent with the name {formComponentName} with a data-bootstrapcomponents-select component with name {elementName} I want to validate that a row with the text {text} does not exist', {timeout: 30 * 1000}, function(formComponentName, elementName, text, callback){
		var fComponent = element(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" +formComponentName + "']"));
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
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
		});
	});

	When('formcomponent with the name {formComponentName} with a data-bootstrapcomponents-select component with name {elementName} I want to select the combobox item with the exact text {text}', {timeout: 30 * 1000}, function(formComponentName, elementName, text, callback){
		var fComponent = element(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" +formComponentName + "']"));
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
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
		});
	});

	When('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-select component with name {elementName} I want to select row number {rowNumber}', { timeout: 45 * 1000 }, function (formComponentName, elementName, rowNumber, callback) {
		var fComponent = element.all(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" + formComponentName + "']"));
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
			console.log(error.message);
			tierdown(true);
		});
	});

	Then('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-select component with name {elementName} I want to validate that the selected row equals {text}', { timeout: 45 * 1000 }, function (formComponentName, elementName, text, callback) {
		var fComponent = element.all(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" + formComponentName + "']"));
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
				console.log(error.message);
				tierdown(true);
			})
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});
	//COMBOBOX

	//CHECKBOX
	When('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-checkbox component with name {elementName} I want it to be {checkboxState}', { timeout: 15 * 1000 }, function (formComponentName, elementName, checkboxOption, callback) {
		var fComponent = element(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" + formComponentName + "']"));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function () {
			var checkbox = fComponent.element(by.css("data-bootstrapcomponents-checkbox[data-svy-name='" + elementName + "']"));
			browser.wait(EC.presenceOf(checkbox), 15 * 1000, 'Checkbox not found!').then(function () {
				checkbox.isSelected().then(function (isChecked) {
					if (isChecked && checkboxOption.toLowerCase() === "unchecked" || !isChecked && checkboxOption.toLowerCase() === "checked") {
						checkbox.click().then(function () {
							wrapUp(callback, "checkboxEvent");
						})
					} else {
						console.log('Checkbox did not have to be changed');
						wrapUp(callback, "checkboxEvent");
					}
				})
			})
		}).catch(function (error) {
			console.log(error.message);
		});
	});

	Then('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-checkbox component with name {elementName} I want to validate that the checkbox is {checkBoxState}', { timeout: 30 * 1000 }, function (formComponentName, elementName, checkboxOption, callback) {
		var fComponent = element(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" + formComponentName + "']"));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function () {
			var checkbox = fComponent.element(by.css("data-bootstrapcomponents-checkbox[data-svy-name='" + elementName + "']")).element(by.css("input"));
			checkbox.isSelected().then(function (isChecked) {			
				if (isChecked && checkboxOption.toLowerCase() === "checked" || !isChecked && checkboxOption.toLowerCase() === "unchecked") {				
					wrapUp(callback, "checkboxEvent");
				} else {
					console.log('Validation failed. State of the checkbox does not match the expected state!');
					tierdown(true);
				}
			}).catch(function (error) {
				console.log(error.message);
			})
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	Then('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-checkbox component with name {elementName} I want to validate that the checkbox label equals the text {text}', { timeout: 30 * 1000 }, function (formComponentName, elementName, text, callback) {
		var fComponent = element(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" + formComponentName + "']"));
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
			}).catch(function(error){
				tierdown(true);
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	Then('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapcomponents-checkbox component with name {elementName} I want to validate that the checkbox label partially equals the text {text}', { timeout: 30 * 1000 }, function (formComponentName, elementName, text, callback) {
		var fComponent = element(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" + formComponentName + "']"));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function () {
			var checkbox = fComponent.element(by.css("data-bootstrapcomponents-checkbox[data-svy-name='" + elementName + "']")).element(by.css("span"));
			browser.wait(EC.visibilityOf(checkbox), 15 * 1000, 'Checkbox not found!').then(function(){
				checkbox.getText().then(function(inputText) {
					if(inputText.indexOf(text) > -1) {
						wrapUp(callback, "validateEvent")
					} else {
						console.log("Validation failed. Expected " + text + ". Got " + inputText);
					}
				})
			}).catch(function(error){
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});
	//END CHECKBOX

	//INPUT GROUP
	When('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapextracomponents-input-group component with name {elementName} I want to insert the text {text} in field number {fieldNumber}', { timeout: 30 * 1000 }, function (formComponentName, elementName, text, fieldNumber, callback) {
		var fComponent = element.all(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" + formComponentName + "']"));
		browser.wait(EC.presenceOf(fComponent), 15 * 1000, 'Formcomponent not found!').then(function () {
			var inputGroup = fComponent.all(by.css("data-bootstrapextracomponents-input-group[data-svy-name='" + elementName + "']"));
			browser.wait(EC.presenceOf(inputGroup.first()), 20 * 1000, 'Input group not found!').then(function () {
				var inputField = inputGroup.all(by.css("input[type='text']")).get(fieldNumber - 1);
				sendKeys(inputField, text).then(function () {
					wrapUp(callback, "insertEvent");
				});
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	When('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapextracomponents-input-group component with name {elementName} I want to clear the text in field number {fieldNumber}', {timeout: 30 * 1000}, function(formComponentName, elementName, fieldNumber, callback){
		var fComponent = element.all(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" + formComponentName + "']"));
		browser.wait(EC.presenceOf(fComponent), 15 * 1000, 'Formcomponent not found!').then(function () {
			var inputGroup = fComponent.all(by.css("data-bootstrapextracomponents-input-group[data-svy-name='" + elementName + "']"));
			browser.wait(EC.presenceOf(inputGroup.first()), 20 * 1000, 'Input group not found!').then(function () {
				var inputField = inputGroup.all(by.css("input[type='text']")).get(fieldNumber - 1);
				inputField.clear().then(function () {
					wrapUp(callback, "insertEvent");
				});
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	When('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapextracomponents-input-group component with name {elementName} I want to click on button number {buttonNumber}', {timeout: 30 * 1000}, function(formComponentName, elementName, fieldNumber, callback){
		var fComponent = element.all(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" + formComponentName + "']"));
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
			console.log(error.message);
			tierdown(true);
		});
	});

	Then('formcomponent with the name {formComponentName} with a bootstrap data-bootstrapextracomponents-input-group component with name {elementName} I want to validate that the text in field number {fieldNumber} equals the text {text}', {timeout: 30 * 1000}, function(formComponentName, elementName, fieldNumber, text, callback){
		var fComponent = element.all(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" + formComponentName + "']"));
		browser.wait(EC.presenceOf(fComponent), 15 * 1000, 'Formcomponent not found!').then(function () {
			var inputGroup = fComponent.all(by.css("data-bootstrapextracomponents-input-group[data-svy-name='" + elementName + "']"));
			browser.wait(EC.presenceOf(inputGroup.first()), 20 * 1000, 'Input group not found!').then(function () {
				var inputField = inputGroup.all(by.css("input")).get(fieldNumber - 1);
				inputField.getAttribute('value').then(function (fieldText) {
					if (fieldText === text) {
						wrapUp(callback, "validateEvent");
					} else {
						console.log("Validation failed. Expected " + text + ". Got " + fieldText);
					}
				})
			})
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});
	//END INPUT GROUP
	//END BOOTSTRAP COMPONENTS INSIDE FORMCOMPONENT
	//END BOOTSTRAP COMPONENTS
	//DEFAULT COMPONENTS INSIDE FORM COMPONENTS
	When('Formcomponent with the name {formComponentName} with a servoy default input component with name {elementName} is clicked', {timeout: 30 * 1000}, function(formComponentName, elementName, callback){
		var fComponent = element.all(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" + formComponentName + "']"));
		browser.wait(EC.presenceOf(fComponent), 15 * 1000, 'Formcomponent not found!').then(function () {
			var inputField = fComponent.element(by.css("input[data-svy-name='" + elementName + "']"));
			browser.wait(EC.visibilityOf(inputField), 30 * 1000, 'Textfield not found!').then(function () {
				clickElement(inputField).then(function () {
					wrapUp(callback, 'insertEvent');
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});
	//END DEFAULT COMPONENTS INSIDE FORM COMPONENTS
	//FORM COMPONENTS
	//WILDCARD ELEMENT EXISTANCE VALIDATION
	Then('formcomponent with the name {formComponentName} I expect an element with the name {elementName} to be present', {timeout: 30 * 1000}, function(formComponentName, elementName, callback) {
		var fComponent = element(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" +formComponentName + "']"));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not found!').then(function(){
			var wildcard = fComponent.element(by.css("*[data-svy-name='" + elementName + "']"));
			browser.wait(EC.presenceOf(wildcard), 15 * 1000, 'Element not found!').then(function(){
				wrapUp(callback, "validateEvent");
			});
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
		});
	});

	Then('formcomponent with the name {formComponentName} I expect an element with the name {elementName} to not be present', {timeout: 30 * 1000}, function(formComponentName, elementName, callback) {
		var fComponent = element.all(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" +formComponentName + "']"));
		browser.wait(EC.presenceOf(fComponent.first()), 30 * 1000, 'Formcomponent not found!').then(function(){
			fComponent.all(by.css("*[data-svy-name='" + elementName + "']")).then(function(items) {
				if(items.length === 0) {
					wrapUp(callback, "validateEvent");
				}
			});
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
		});
	});
	//END WILDCARD ELEMENT EXISTANCE VALIDATION
	//END FORMCOMPONENTS

	//SERVOY GROUPING GRID COMPONENT
	When('servoy data-aggrid-groupingtable component with name {elementName} I scroll to the record with {string} as text', { timeout: 120 * 1000 }, function (elementName, recordText, callback) {
		groupingGridTableScroll(elementName, recordText, callback);
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to {rowOption} row level {rowLevel} with {rowText} as text', { timeout: timeoutAgAction }, function (elementName, rowOption, rowLevel, rowText, callback) {
		findRecordByRowLevel(elementName, rowText, rowOption, rowLevel - 1, callback);
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to sort the table by {sortBy}', { timeout: timeoutAgAction }, function (elementName, sortBy, callback) {
		var grid = element.all(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(grid), 30 * 1000, 'Table not found!').then(function () {
			grid.each(function (menuItems) {
				menuItems.all(by.css('.ag-table-header')).each(function (sortHeader) {
					sortHeader.getText().then(function (text) {
						if (text.toLowerCase().indexOf(sortBy.toLowerCase()) > -1) {
							clickElement(sortHeader).then(function () {
								wrapUp(callback, "tableSortingEvent");
							});
						}
					});
				});
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
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
			console.log(error.message);
			tierdown(true);
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
			console.log(error.message);
			tierdown(true);
		});
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to drag the grouping item with {groupingText} as text to the start', { timeout: timeoutAgAction }, function (elementName, groupingText, callback) {		
		var table = element.all(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(element(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"))), 30 * 1000, 'Table not found!').then(function(){
			table.each(function (gridItems) {
				var fromElement = gridItems.all(by.xpath("//span[text()='" + groupingText + "']")).first().element(by.xpath("../span[@class='ag-column-drag']"));
				var toElement = gridItems.all(by.xpath("//span[@class='ag-column-drop-cell']/span[@class='ag-column-drag']")).first();
				
				toElement.getLocation().then(function(toLocation){
					fromElement.getLocation().then(function(fromLocation){
						browser.actions()
							.mouseMove(fromElement.getWebElement(), {x: fromLocation.x, y: fromLocation.y})
							.mouseDown()
							.mouseMove(toElement.getWebElement(), {x: toLocation.x, y: toLocation.y})
							.mouseUp()
							.perform().then(function(){
								wrapUp(callback, "aggridGroupMovingEvent")
							});
					});
				});				
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
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

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to scroll to the top', { timeout: 60 * 1000 }, function (elementName, callback) {
		groupingGridScrollToTop(elementName, callback);
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to select row number {rowNumber}', { timeout: 30 * 1000 }, function (elementName, rowNumber, callback) {
		var table = element.all(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(element(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"))), 30 * 1000, 'Table not found!').then(function(){		
			table.each(function(tableItems){
				var rowContainer = tableItems.all(by.xpath("//div[@class='ag-body-viewport-wrapper']"));
				rowContainer.each(function(rowElements){
					var rows = rowElements.all(by.css("div[role=row]"));
					clickElement(rows.get(rowNumber - 2)).then(function(){
						wrapUp(callback, "clickEvent");
					})
				});
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to select the record with the text {text}', {timeout: 60 * 1000}, function(elementName, text, callback){
		var table = element.all(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(element(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"))), 30 * 1000, 'Table not found!').then(function(){
			var elem = table.all(by.xpath("//div[text()='"+text+"']")).first();
			clickElement(elem).then(function(){
				wrapUp(callback, "clickEvent");
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to validate that a record with the text {text} exists', {timeout: 30 * 1000}, function(elementName, text, callback){
		var found = false;
		browser.wait(EC.presenceOf( element(by.xpath("//data-aggrid-groupingtable[@data-svy-name='"+elementName+"']"))), 30 * 1000, 'Table not found!').then(function(){
			var table = element.all(by.xpath("//data-aggrid-groupingtable[@data-svy-name='"+elementName+"']"));
			table.each(function(tableItems){
				//wait untill the table is loaded
				var waitForInputField = tableItems.element(by.xpath("//div[@role='row']"));
				browser.wait(EC.visibilityOf(waitForInputField)).then(function(){
					var elem = element(by.xpath("//div[text()='"+text+"']"));
					elem.isPresent().then(function(isPresent){
						if(isPresent) {
							found = true;
						}
					});
				});
			}).then(function(){
				if(found) {
					wrapUp(callback, 'validateEvent');
				} else {
					tierdown(true);
				}
			});
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
		});
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to scroll and select the row with the text {rowText}', { timeout: 120 * 1000}, function(elementName, text, callback){
		groupingGridTableScroll(elementName, text, callback, true);
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to scroll to the row with text {rowText}', { timeout: 120 * 1000}, function(elementName, text, callback){
		groupingGridTableScroll(elementName, text, callback, false);
	});
	
	When('servoy data-aggrid-groupingtable component with name {elementName} I want to scroll and select the row with text {rowText} and click the element which contains the class {className}', {timeout: 120 * 1000}, function(elementName, text, className, callback){
		groupingGridTableScroll(elementName, text, callback, true, className);
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to click on the element which contains the class {className} on the row with the text {text}', {timeout: 45 * 1000}, function(elementName, className, text, callback){
		var table = element.all(by.css("data-aggrid-groupingtable[data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(table.first()), 10 * 1000, 'Table not found!').then(function(){
			table.each(function(tableItems){
				agGridIsGrouped(elementName).then(function(isGrouped){
					if(isGrouped) {
						return "ag-full-width-viewport";
					} else {
						return "ag-body-viewport-wrapper";
					}
				}).then(function(containerClass) {
					//Rows are generated multiple times in the aggrid structure. The displayed rows are in the following wrapper
					var rowContainer = tableItems.all(by.css("div[class='" + containerClass + "']"));
					rowContainer.each(function (rowElements) {
						var selectedRow = rowElements.all(by.xpath("//div[text()='" + text + "']")).first();
						browser.wait(EC.presenceOf(selectedRow), 15 * 1000, 'Element with the given text not found!').then(function () {
							var parent = selectedRow.element(by.xpath(".."));
							var child = parent.element(by.className(className));
							child.click().then(function () {
								wrapUp(callback, "clickEvent");
							});
						});
					});
				});
			});			
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});
	
	When('servoy data-aggrid-groupingtable component with name {elementName} I want to click on the element which contains the class {className} in row number {rowNumber}', {timeout: 45 * 1000}, function(elementName, className, rowNumber, callback){
		var table = element.all(by.css("data-aggrid-groupingtable[data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(table.first()), 10 * 1000, 'Table not found!').then(function(){
			table.each(function(tableItems){
				//Rows are generated multiple times in the aggrid structure. The displayed rows are in the following wrapper
				var rowContainer = tableItems.all(by.css("div[class='ag-body-viewport-wrapper']"));
				rowContainer.each(function(rowElements){
					browser.wait(EC.presenceOf(rowElements.all(by.css("div[role=row]")).get(rowNumber - 2)), 15 * 1000).then(function(){
						var selectedRow = rowElements.all(by.css("div[role=row]")).get(rowNumber - 2).getWebElement();
						var child = selectedRow.findElement(by.className(className));
						child.click().then(function() {
							wrapUp(callback, "clickEvent");
						});
					});					
				});
			});			
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	Then('servoy data-aggrid-groupingtable component with name {elementName} I want to validate that there are/is {rowNumber} row(s)', { timeout: 30 * 1000 }, function (elementName, rowNumber, callback) {
		var table = element.all(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(element(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"))), 30 * 1000, 'Table not found!').then(function(){		
			table.each(function(tableItems){
				var rowContainer = tableItems.all(by.xpath("//div[@class='ag-body-viewport-wrapper']"));
				rowContainer.each(function(rowThings){
					var rows = rowThings.all(by.css("div[role=row]"));
					rows.count().then(function(rowCount){
						if(rowCount == rowNumber) {
							wrapUp(callback, 'validateEvent');
						}
					})
				});
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	//GROUPING GRID INSERT EVENTS
	When('servoy data-aggrid-groupingtable component with name {elementName} I want to to insert the text {text} on rownumber {rowNumber} on columnnumber {columnNumber}', {timeout: 10 * 1000}, function(elementName, text, rowNumber, columnNumber, callback) {
		var table = element.all(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(table.first()), 30 * 1000, 'Table not found!').then(function(){
			table.each(function(tableItems){
				agGridIsGrouped(elementName).then(function(isGrouped){
					if(isGrouped) {
						return "ag-full-width-viewport";
					} else {
						return "ag-body-viewport-wrapper";
					}
				}).then(function(containerClass) {
					var rowContainer = tableItems.all(by.xpath("//div[@class='" + containerClass + "']"));
					rowContainer.each(function(rowElements){
						browser.wait(EC.presenceOf(rowElements.all(by.css("div[role=row]")).get(0))).then(function(){
							var row = rowElements.all(by.css("div[role=row]")).get(rowNumber - 2);
							var col = row.all(by.css("div[role=gridcell]")).get(columnNumber - 1);
							doubleClickElement(col).then(function() {
								browser.actions().sendKeys(text).perform().then(function () {
									browser.actions().sendKeys(protractor.Key.ENTER).perform().then(function () {
										col.getText().then(function (newText) {
											if (newText === text) {
												wrapUp(callback, "insertEvent");
											} else {
												console.log("Validation failed! Expected '" + text + "'. Got '" + newText + "'.");
												console.log("Possibility is that the column is not editable");
											}
										});
									});
								});
							});
						});
					});
				});
			});			
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to double click on the combobox on rownumber {rowNumber} on columnnumber {columnNumber} and select the item with the text {text}', {timeout: 10 * 1000}, function(elementName, rowNumber, columnNumber, text, callback) {
		var table = element.all(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(table.first()), 30 * 1000, 'Table not found!').then(function(){
			table.each(function(tableItems){
				agGridIsGrouped(elementName).then(function(isGrouped){
					if(isGrouped) {
						return "ag-full-width-viewport";
					} else {
						return "ag-body-viewport-wrapper";
					}
				}).then(function(containerClass) {
					var rowContainer = tableItems.all(by.xpath("//div[@class='" + containerClass + "']"));
					rowContainer.each(function(rowElements){
						browser.wait(EC.presenceOf(rowElements.all(by.css("div[role=row]")).get(0))).then(function(){
							var row = rowElements.all(by.css("div[role=row]")).get(rowNumber - 2);
							var col = row.all(by.css("div[role=gridcell]")).get(columnNumber - 1);
							doubleClickElement(col).then(function () {
								clickElement(col).then(function(){
									clickElement(col.element(by.cssContainingText('option', text))).then(function(){
										clickElement(col).then(function(){
											browser.actions().sendKeys(protractor.Key.ENTER).perform().then(function(){
												col.getAttribute('textContent').then(function(newText) {
													if (newText === text) {
														wrapUp(callback, "clickEvent");
													} else {
														console.log("Validation failed! Expected '" + text + "'. Got '" + newText + "'.");
														console.log("Possibility is that the column is not editable");
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
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to double click on the typeahead on rownumber {rowNumber} on columnnumber {columnNumber} and select the item with the text {text}', {timeout: 10 * 1000}, function(elementName, rowNumber, columnNumber, text, callback) {
		var table = element.all(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(table.first()), 30 * 1000, 'Table not found!').then(function(){
			table.each(function(tableItems){
				agGridIsGrouped(elementName).then(function(isGrouped){
					if(isGrouped) {
						return "ag-full-width-viewport";
					} else {
						return "ag-body-viewport-wrapper";
					}
				}).then(function(containerClass) {
					var rowContainer = tableItems.all(by.xpath("//div[@class='" + containerClass + "']"));
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
											col.getAttribute('textContent').then(function(newText) {
												if (newText === text) {
													wrapUp(callback, 'clickEvent');
												} else {
													console.log("Validation failed! Expected '" + text + "'. Got '" + newText + "'.");
													console.log("Possibility is that the column is not editable");
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
			console.log(error.message);
			tierdown(true);
		});
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to double click on the calendar on rownumber {rowNumber} on columnnumber {columnNumber} and set the date to {day} {month} {year}', {timeout: 10 * 1000}, function(elementName, rowNumber, columnNumber, day, month, year, callback) {
		var table = element.all(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(table.first()), 30 * 1000, 'Table not found!').then(function(){
			table.each(function(tableItems){
				agGridIsGrouped(elementName).then(function(isGrouped){
					if(isGrouped) {
						return "ag-full-width-viewport";
					} else {
						return "ag-body-viewport-wrapper";
					}
				}).then(function(containerClass) {
					var rowContainer = tableItems.all(by.xpath("//div[@class='" + containerClass + "']"));
					rowContainer.each(function(rowElements){
						browser.wait(EC.presenceOf(rowElements.all(by.css("div[role=row]")).get(0))).then(function(){
							var selectedRow = rowElements.all(by.css("div[role=row]")).get(rowNumber - 2);
							var selectedColumnToValidate = selectedRow.all(by.css("div[role=gridcell]")).get(columnNumber - 1);
							doubleClickElement(selectedColumnToValidate).then(function () {
								setCalendar(day, month, year, callback);
							});
						});
					});
				});
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
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
			console.log(error.message);
			tierdown(true);
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
			console.log(error.message);
			tierdown(true);
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
			console.log(error.message);
			tierdown(true);
		});
	});
	//END TOAST COMPONENT

	//STANDARD SCROLL EVENTS
	When('I want to scroll to an element with name {elementName}', {timeout: 30 * 1000}, function(elementName, callback) {
		var elementToScrollTo = element(by.xpath("//*[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(elementToScrollTo)).then(function(){
			browser.executeScript("arguments[0].scrollIntoView();", elementToScrollTo.getWebElement()).then(function(){
				wrapUp(callback, "scrollEvent");
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	})
	//END STANDARD SCROLL EVENTS

	//SALES DEMO SPECIFIC
	//this test step tests the data-bootstrapextracomponents-badge component. It clicks it and inserts a text in the auto generated form
	//it will select row n (determined by the user) 
	When('data-bootstrapcomponents-textbox the text {text} is inserted I expect there to be {results} result and I want to select item {rowNumber}', {timeout: 60 * 1000}, function(text, expectedResult, rowNumber, callback){
		var textField = element(by.xpath("//svy-formload[contains(@class,'ng-scope')]/div/div/div/data-bootstrapcomponents-textbox/input"));
		browser.wait(EC.visibilityOf(textField)).then(function(){
			sendKeys(textField, text).then(function() {
				element.all(by.xpath("//svy-formload[contains(@class,'ng-scope')]/div/div/div/data-servoyextra-table/div/table/tbody/tr")).count().then(function(count){					
					if(count == expectedResult) {
						var loadedForm = element.all(by.xpath("//svy-formload[contains(@class,'ng-scope')]/div/div/div/data-servoyextra-table/div/table/tbody/tr"));
						browser.wait(EC.visibilityOf(loadedForm.get(rowNumber - 1)), 30 * 1000, 'Element not visible').then(function(){
							browser.wait(EC.elementToBeClickable(loadedForm.get(rowNumber - 1)), 30 * 1000, 'Element not clickable').then(function(){
								clickElement(loadedForm.get(rowNumber - 1)).then(function() {
									//Closes the search form
									var closeIcon = element(by.xpath("//svy-formload[contains(@class,'ng-scope')]/div/div/div/data-servoyextra-fontawesome/div/i"));
									browser.actions().mouseMove(closeIcon).click().perform().then(function(){
										wrapUp(callback, "clickEvent");
									}).catch(function (error) {
										console.log(error.message);
										tierdown(true);
									});
								});
							});
						});
					} else {
						return;
					}
				});
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		});
	});
	
	Then('I want to process a new sales order searching and ordering {orderQuantity} {searchCriteria} I expect there to be {expectedResults} result(s) and I want to select item {rowNumber}', {timeout: 60 * 1000}, function(orderQuantity, searchCriteria, expectedResult, rowNumber, callback) {		
		var textField = element(by.xpath("//svy-formload[contains(@class,'ng-scope')]/div/div/div/input"));
		browser.wait(EC.visibilityOf(textField), 30 * 1000, 'Element not visible').then(function(){
			//Step 1 - searching for the product
			sendKeys(textField, searchCriteria).then(function() {
				//Step 2 - Validate the amount of records found
				element.all(by.xpath("//svy-formload[contains(@class,'ng-scope')]/div/div/div/data-servoyextra-table/div/table/tbody/tr")).count().then(function(count){					
					if(count == expectedResult) {
						//Step 3 - Select row n
						var loadedForm = element.all(by.xpath("//svy-formload[contains(@class,'ng-scope')]/div/div/div/data-servoyextra-table/div/table/tbody/tr"));
						clickElement(loadedForm.get(rowNumber - 1)).then(function() {
							//Step 4 - Increase the Quantity to n
							var quantityField = element(by.xpath("//data-bootstrapcomponents-textbox[@data-svy-name='orderLinesDetail.textbox_2']/input"));
							browser.wait(EC.presenceOf(quantityField)).then(function(){
								sendKeys(quantityField, orderQuantity).then(function(){
									//Step 5 - Setting the shipping date
									var shippingDateField = element(by.xpath("//data-bootstrapcomponents-calendar[@data-svy-name='orderLinesDetail.calendar_5']/div/input"));
									sendKeys(shippingDateField, '10-05-2018').then(function(){
										//Step 6a - Searching for the courier
										var courier = element(by.xpath("//input[@data-svy-name='orderLinesDetail.typeahead_6']"));
										sendKeys(courier, 'Federal Shipping').then(function(){
											//Step 6b - Selecting the correct courier
											var courierItem = element(by.xpath("//ul[contains(@class, 'dropdown-menu') and contains(@class, 'ng-isolate-scope')]/li/a[@title='Federal Shipping']"))
											clickElement(courierItem).then(function(){
												//Step 7 - Confirming the order
												var orderConfirmButton = element(by.xpath("//data-bootstrapcomponents-button[@data-svy-name='orderLinesDetail.button_5']/button"));
												clickElement(orderConfirmButton).then(function(){
													wrapUp(callback, "salesProcessEvent");
												});	
											});
										});
									});
								});
							});
						});
					} else {
						return;
					}
				});
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		});
	});

	Then('I want to edit record 1, change the quanitity to {newQuantity}, the product to {newProduct}, the description to {newDescription}, the date to {newShippingDate} and the courier to {newCourier}', {timeout: 60 * 1000}, function(newQuantity, newProduct, newDescription, newShippingDate, newCourier, callback) {		
		//Step 1 - Alter the quantity		
		var quantityField = element(by.xpath("//data-bootstrapcomponents-textbox[@data-svy-name='orderLinesDetail.textbox_2']/input"));
		browser.wait(EC.presenceOf(quantityField)).then(function(){
			sendKeys(quantityField, newQuantity).then(function(){
				//Step 2a - Alter the product
				var productField = element(by.xpath("//input[@data-svy-name='orderLinesDetail.typeahead_1']"));
				sendKeys(productField, newProduct).then(function(){
					//Step 2b - Selecting the new product
					var productFieldItem = element(by.xpath("//ul[contains(@class, 'dropdown-menu') and contains(@class, 'ng-isolate-scope')]/li/a[@title='" + newProduct + "']"))
					clickElement(productFieldItem).then(function(){
						//Step 3 - Alter the description
						var descriptionField = element(by.xpath("//data-bootstrapcomponents-textarea[@data-svy-name='orderLinesDetail.textarea_4']/textarea"));
						sendKeys(descriptionField, newDescription).then(function(){
							//Step 4 - Alter the shipping date
							var shippingDateField = element(by.xpath("//data-bootstrapcomponents-calendar[@data-svy-name='orderLinesDetail.calendar_5']/div/input"));
							sendKeys(shippingDateField, newShippingDate).then(function(){
								//Step 6a - Searching for the courier
								var courier = element(by.xpath("//input[@data-svy-name='orderLinesDetail.typeahead_6']"));
								sendKeys(courier, newCourier).then(function(){
									//Step 6b - Selecting the correct new courier
									var courierItem = element(by.xpath("//ul[contains(@class, 'dropdown-menu') and contains(@class, 'ng-isolate-scope')]/li/a[@title='" + newCourier + "']"))
									clickElement(courierItem).then(function(){
										//Step 7 - Confirming the changes
										var orderConfirmButton = element(by.xpath("//data-bootstrapcomponents-button[@data-svy-name='orderLinesDetail.button_5']/button"));
										clickElement(orderConfirmButton).then(function(){
											wrapUp(callback, "salesProcessEvent");
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

	When('I want to select salesOrder {orderNumber}', {timeout: 30 * 1000}, function(orderNumber, callback){
		var table = element.all(by.xpath("//data-servoyextra-table[@data-svy-name='orderLinesTable.table']/div/table/tbody/tr"));
		var editElement = table.get(orderNumber - 1).element(by.xpath("//td[contains(@class, 'icon-edit')]"));
		browser.wait(EC.visibilityOf(editElement), 30 * 1000, 'Element not visible').then(function(){
			browser.wait(EC.elementToBeClickable(editElement), 30 * 1000, 'Element not clickable').then(function(){
				clickElement(editElement).then(function(){
					wrapUp(callback, 'clickEvent');
				});
			});
		});
	});

	When('I want to delete salesOrder {orderNumber}', {timeout: 30 * 1000}, function(orderNumber, callback){
		var table = element.all(by.xpath("//data-servoyextra-table[@data-svy-name='orderLinesTable.table']/div/table/tbody/tr"));
		var editElement = table.get(orderNumber - 1).element(by.xpath("//td[contains(@class, 'icon-selection')]"));
		browser.wait(EC.visibilityOf(editElement), 30 * 1000, 'Element not visible').then(function(){
			browser.wait(EC.elementToBeClickable(editElement), 30 * 1000, 'Element not clickable').then(function(){
				clickElement(editElement).then(function(){
					var deleteButton = element(by.xpath("//data-bootstrapcomponents-button[@data-svy-name='orderLinesTable.button_4']/button"));
					browser.wait(EC.visibilityOf(deleteButton), 30 * 1000, 'Element not visible').then(function(){
						browser.wait(EC.elementToBeClickable(deleteButton), 30 * 1000, 'Element not clickable').then(function(){
							clickElement(deleteButton).then(function(){
								wrapUp(callback, 'clickEvent');
							});
						});
					});
				});
			});
		});
	});
	//END SALES DEMO SPECIFIC

	//DEFAULT HTML COMPONENTS
	When('default textarea component with name {elementName} the text {text} is inserted', { timeout: 30 * 1000 }, function (elementName, text, callback) {
		var txtArea = element(by.xpath("//textarea[@data-svy-name='" + elementName + "']"))
		browser.wait(EC.visibilityOf(txtArea), 30 * 1000, 'Textarea not found!').then(function(){
			sendKeys(txtArea, text).then(function () {
				wrapUp(callback, "Insert value event");
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	Then('default textarea component with name {elementName} I want to validate that the input field equals the text {text}', {timeout: 30 * 1000}, function(elementName, text, callback){
		var inputField = element(by.xpath("//textarea[@data-svy-name='" + elementName + "']"))
		browser.wait(EC.visibilityOf(inputField), 30 * 1000, 'Textarea not found!').then(function(){
			inputField.getAttribute('value').then(function(inputText){
				return inputText === text;
			}).then(function(isValidated){
				console.log(isValidated);
				if(isValidated) {
					wrapUp(callback, 'validateEvent');
				}
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});
	//END DEFAULT HTML COMPONENTS

	//DIALOG POPUP COMPONENT
	When('default modal-dialog component the button with the text {text} is pressed', {timeout: 30 * 1000}, function(text, callback){
		var dialog = element(by.xpath("//div[@class='modal-dialog']")).element(by.xpath("//button[text()='" + text + "']"));
		browser.wait(EC.presenceOf(dialog), 30 * 1000, 'Dialog button not found!').then(function(){
			clickElement(dialog).then(function(){
				wrapUp(callback, 'clickEvent');
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	When('default modal-dialog I want to wait untill the modal-dialog view is gone', {timeout: 15 * 1000}, function(callback){
		var dialog = element(by.xpath("//div[contains(@class, 'modal-backdrop')]"));
		waitUntillElementIsGone(dialog).then(function(){
			wrapUp(callback, 'dialogEvent');
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
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
			console.log(error.message);
			tierdown(true);
		});
	});

	Then('I expect a modal-dialog popup to appear', { timeout: 15 * 1000 }, function (callback) {
		var dialog = element(by.xpath("//div[@class='modal-content']"));
		browser.wait(EC.presenceOf(dialog), 10 * 1000, 'Dialog not present!').then(function(){			
			wrapUp(callback, "modalDialogEvent");			
		}).catch(function(error){
			console.log(error.message);
			tierdown(true)
		});
	});

	When('default input-dialog I want to insert the text {text}', {timeout: 30 * 1000}, function(text, callback){
		var dialog = element(by.xpath("//div[@class='modal-dialog']"));
		browser.wait(EC.presenceOf(dialog), 30 * 1000, 'Dialog not found!').then(function(){
			var inputField = dialog.element(by.css("input"));
			sendKeys(inputField, text).then(function(){
				wrapUp(callback, "insertEvent");
			}).catch(function(error){
				console.log(error.message);
				tierdown(true)
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	When('default select-dialog I want to select the combobox item with the text {text}', {timeout: 30 * 1000}, function(text, callback){
		var dialog = element(by.xpath("//div[@class='modal-dialog']"));
		browser.wait(EC.presenceOf(dialog), 30 * 1000, 'Dialog not found!').then(function(){
			var selectField = dialog.element(by.css("select"));
			clickElement(selectField).then(function(){
				var optionField = selectField.element(by.cssContainingText("option", text));
				clickElement(optionField).then(function(){
					wrapUp(callback, "clickEvent");
				});
			}).catch(function(error){
				console.log(error.message);
				tierdown(true)
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});
	//END MODEL DIALOG COMPONENT

	//SERVOY WINDOW COMPONENT 
	When('servoy window component I want to wait untill the window disappears', {timeout: 45 * 1000}, function(callback){
		var window = element(by.xpath("//div[contains(@class, 'window')]"));
		window.isPresent().then(function(isPresent){
			if(!isPresent) {
				wrapUp(callback, "dialogEvent");
			} else{
				waitUntillElementIsGone(window).then(function(){
					wrapUp(callback, 'dialogEvent');
				}).catch(function(error){
					console.log(error.message);
					tierdown(true);
				});
			}
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
		});
	});
	//END SERVOY WINDOW COMPONENT

	//SERVOY TABPANEL COMPONENT
	When('servoy data-servoydefault-tabpanel component with name {elementName} the tab with the text {text} is clicked', {timeout: 60 * 1000}, function(elementName, text, callback){
		var tabPanel = element.all(by.xpath("//data-servoydefault-tabpanel[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.visibilityOf(element(by.xpath("//data-servoydefault-tabpanel[@data-svy-name='"+elementName+"']"))), 30 * 1000, 'Tabelpanel not found!').then(function(){
			tabPanel.each(function(tabRows){
				var row = tabRows.all(by.cssContainingText("span", text)).last();
				row.isPresent().then(function(isPresent){
					if(isPresent) {
						clickElement(row).then(function(){
							wrapUp(callback, "clickEvent");
						});
					}
				});
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
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
			console.log(error.message);
			tierdown(true);
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
			console.log(error.message);
			tierdown(true);
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
						console.log('Found!');
						wrapUp(callback, "validateEvent");
					}
				});
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});
	//END HTMLVIEW COMPONENT

	//DATA-BOOTSTRAPEXTRACOMPONENTS-NAVBAR
	When('bootstrap data-bootstrapextracomponents-navbar component with the name {elementName} the tab with the text {tabText} on level {tabLevel} is clicked', {timeout: 30 * 1000}, function(elementName, tabText, tabLevel, callback){
		var tab = element(by.xpath("//data-bootstrapextracomponents-navbar[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.presenceOf(tab), 30 * 1000, 'Navbar not found!').then(function(){
			var tabElement;			
			switch(parseInt(tabLevel)){				
				case 1: 
					tabElement = tab.element(by.xpath("//a[text()[normalize-space() = '" + tabText + "'] and contains(@class, 'svy-navbar-dropdown')]"));
					browser.sleep(3000);
					tabElement.isPresent().then(function(isPresent){
						if(!isPresent) {
							tabElement = tab.element(by.xpath("//a[text()[normalize-space() = '" + tabText + "'] and contains(@class, 'svy-navbar-item')]"));
						}
						browser.wait(EC.elementToBeClickable(tabElement), 30 * 1000, 'Tab item not found!').then(function(){
							clickElement(tabElement).then(function(){
								wrapUp(callback, "clickEvent");
							});
						});
					});
					break;
				case 2:
					tabElement = tab.element(by.xpath("//a[text()[normalize-space() = '" + tabText + "'] and not(contains(@class, 'svy-navbar-dropdown'))]"));
					browser.wait(EC.elementToBeClickable(tabElement), 30 * 1000, 'Tab item not found!').then(function(){
						clickElement(tabElement).then(function(){
							wrapUp(callback, "clickEvent");
						});
					});
					break;
				case 3:
					tabElement = tab.element(by.xpath("//a[text()[normalize-space() = '" + tabText + "'] and not(contains(@class, 'svy-navbar-dropdown'))]"));
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
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
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
		}).catch(function(error){
			console.log(error.message);
			tierdown(false);
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
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
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
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
		})
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
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
		})
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
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
		})
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
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
		})
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
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
		})
	});
	//END LISTBOX COMPONENT

	//FONT AWESOME
	When('servoy data-servoyextra-fontawesome component with name {elementName} is clicked', { timeout: 30 * 1000 }, function (elementName, callback) {
		var fontAwesome = element(by.xpath("//data-servoyextra-fontawesome[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(fontAwesome), 30 * 1000, 'Icon not found!').then(function () {
			clickElement(fontAwesome).then(function () {
				wrapUp(callback, "clickEvent");
			});
		});
	});
	//END FONT AWESOME

	//Wildcard check
	Then('I expect an element with the name {elementName} to not be present', {timeout: 20 * 1000}, function(elementName, callback){
		element.all(by.xpath("//*[@data-svy-name='" + elementName+"']")).then(function(items){
			if(items.length === 0) {
				wrapUp(callback, "validateEvent"); 
			} else {
				console.log('Validation failed! Expected 0 matches, got ' + items.length);
				tierdown(true);
			}
		}).catch(function(error){
			console.log(error.message)
		});
	});

	Then('I expect an element with the name {elementName} to contain the class {className}', {timeout: 30 * 1000}, function(elementName, className, callback){
		var inputGroup = element(by.xpath("//*[@data-svy-name='" + elementName+"']"));
		browser.wait(EC.presenceOf(inputGroup), 20 * 1000, 'Input group not found!').then(function(){
			var elemWithClass = inputGroup.element(by.xpath("//*[contains(@class, '" + className + "')]"));
			browser.wait(EC.presenceOf(elemWithClass), 15 * 1000, 'Element with the given class has not been found!').then(function(){
				wrapUp(callback, "validateEvent");
			});
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
		});
	});

	Then('I expect an element with the name {elementName} to be {visible|hidden|present}', { timeout: 15 * 1000 }, function (elementName, visibility, callback) {
		if (visibility === 'present') {
			var wildcard = element(by.xpath("//*[@data-svy-name='" + elementName + "']"));
			browser.wait(EC.presenceOf(wildcard), 15 * 1000, 'Element has not been found!').then(function () {
				wrapUp(callback, "validateEvent");
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true)
			});
		} else if (visibility === 'hidden' || visibility === 'visible') {
			var elem = element(by.xpath("//*[@data-svy-name='" + elementName + "']"));
			browser.wait(EC.presenceOf(elem), 15 * 1000, 'Element not found!').then(function () {
				var parent = elem.element(by.xpath(".."));
				parent.getCssValue('display').then(function (isHidden) {
					if (isHidden === 'none' && visibility.toLowerCase() === 'hidden' || isHidden != 'none' && visibility.toLowerCase() === 'visible') {
						wrapUp(callback, "validateEvent");
					} else {
						console.log('Validation failed! Excepted element to be ' + visibility)
						tierdown(true);
					}
				})
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		} else {
			console.log("Parameter not supported! End the step with the word 'visible', 'hidden' or 'present'!" );
			tierdown(true);
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
			console.log(error.message);
			tierdown(true);
		});
	});
	//END WILDCARD CHECK


	//SERVOY PDF VIEWER
	Then('servoy data-pdfviewer-pdf-js-viewer component with name {elementName} I expect it to be visible', {timeout: 30 * 1000}, function(elementName, callback){
		var viewer = element(by.xpath("//data-pdfviewer-pdf-js-viewer[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.presenceOf(viewer), 20 * 1000, 'PDF viewer not found!').then(function(){
			wrapUp(callback, "validateEvent");
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
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
			console.log(error.message);
			tierdown(true);
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
																console.log('Exact value is not reachable with the step size.');
																tierdown(true);
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
																console.log('Exact value is not reachable with the step size.');
																tierdown(true);
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
		}).catch(function(error){
			console.log(error.message);
			tierdown(true);
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
					console.log('Unknown component type. Supported types are: "data-servoydefault-label", "data-bootstrapcomponents-label", "data-bootstrapcomponents-datalabel", "data-bootstrapcomponents-textbox", "input", "data-servoydefault-button"')
					tierdown(true);
					break;
			}
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
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
				console.log('List with the given index does not contain a value!');
			}
		} else {
			valOne = parseFloat(valOne);
		} 
		if(valTwo.startsWith("(")) {
			var indexVal = valTwo.replace(/[^0-9]+/g, "");
			valTwo = parseFloat(storedValues[parseInt(indexVal) - 1]);
			if(!valTwo) {
				console.log('List with the given index does not contain a value!');
			}
		} else {
			valTwo = parseFloat(valTwo);
		} 
		if(valThree.startsWith("(")) {
			var indexVal = valThree.replace(/[^0-9]+/g, "");
			valThree = parseFloat(storedValues[parseInt(indexVal) - 1]);
			if(!valThree) {
				console.log('List with the given index does not contain a value!');
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
					console.log('Validation failed. Expected. ' + valThree + '. Got: ' + (valOne - valTwo));
					tierdown(true);
				}
				break;
			case '+':
				console.log('Calculating ' + valOne + ' + ' + valTwo + '.');
				if(valOne + valTwo === valThree) {
					wrapUp(callback, 'validateEvent');
				} else {
					console.log('Validation failed. Expected. ' + valThree + '. Got: ' + (valOne + valTwo));
					tierdown(true);
				}
				break;
			case '/':
				console.log('Calculating ' + valOne + ' / ' + valTwo + '.');
				if(valOne / valTwo === valThree) {
					wrapUp(callback, 'validateEvent');
				} else {
					console.log('Validation failed. Expected. ' + valThree + '. Got: ' + (valOne / valTwo));
					tierdown(true);
				}
				break;
			case '*':
				console.log('Calculating ' + valOne + ' * ' + valTwo + '.');
				if(valOne * valTwo === valThree) {
					wrapUp(callback, 'validateEvent');
				} else {
					console.log('Validation failed. Expected. ' + valThree + '. Got: ' + (valOne * valTwo));
					tierdown(true);
				}
				break;
			default:
				console.log("Only operators that area allowed are '-', '+', '/' and '*'");
				tierdown(true);
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
		});
	});

	Then('on the servoy admin page {url} I want to count the warnings and the errors in the log file', {timeout: 30 * 1000}, function(url, callback){
		browser.ignoreSynchronization = true;
		browser.get(url).then(function () {
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
			console.log(error.message);
			tierdown(true);
		})
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
	});
});

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
	return browser.wait(EC.presenceOf(elem).call(), 30000, 'Element not visible').then(function () {
		return browser.wait(EC.elementToBeClickable(elem), 30000, 'Element not clickable').then(function () {
			return elem.click();
		});
	});
}

function doubleClickElement(elem) {
	return browser.wait(EC.presenceOf(elem).call(), 30000, 'Element not visible').then(function () {
		return browser.wait(EC.elementToBeClickable(elem), 30000, 'Element not clickable').then(function () {
			return browser.actions().doubleClick(elem).perform();
		});
	});
}

function clickElementByLocation(elem) {
	return browser.wait(EC.presenceOf(elem).call(), 30 * 1000, 'Element not found!').then(function () {
		return elem.getLocation().then(function (location) {
			return browser.actions().mouseMove(elem, { x: location.x, y: location.y }).click().perform();
		});
	});
}

function clickByScript(elem) {
	return browser.wait(EC.presenceOf(elem).call(), 30000, 'Element not visible').then(function () {
		return browser.executeScript("arguments[0].click()", elem);
	});
}

function sendKeys(elem, input) {
	return browser.wait(EC.visibilityOf(elem).call(), 30000, 'Element not visible').then(function () {
		return elem.clear().then(function () {
			return elem.sendKeys(input).then(function(){
				return elem.getAttribute('value').then(function(text) {
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
	var table = element(by.xpath("//data-aggrid-groupingtable[@data-svy-name='"+elementName+"']"));
	return table.element(by.xpath("//div[contains(@class,'ag-column-drop-row-group') and not(contains(@class,'ag-hidden'))]")).isPresent().then(function(isPresent){
		return isPresent;
	});
}

function groupingGridScrollToTop(elementName, callback) {
	var table = element(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"));
	var tableContainer = table.element(by.xpath("//div[@class='ag-body-container']"));
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
function groupingGridTableScroll(elementName, text, callback, shouldClick, className, rowOption, level){
	var found = false;
	//Step 1 - Wait untill the table component is visible
	var table = element.all(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"));
	browser.wait(EC.visibilityOf(element(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"))), 30 * 1000, 'Table not found!').then(function () {
		table.each(function (rowItems) {
			//Step 2a - Create the element that has to be found
			var elementToClick = rowItems.element(by.xpath('//*[text()="' + text + '"]'));

			//Step 2b - Try and locate the required element (interaction with an element outside the viewport causes protractor to crash. isPresent handles this)
			browser.wait(elementToClick.isPresent()).then(function (isPresent) {
				//Step 3a - Check if the element is present
				if (isPresent) {
					found = true;
					//Step 3b - Element has been found. Conclude the test
					if(className) {
						var elementWithClass = elementToClick.element(by.xpath("..")).element(by.className(className));
						clickElement(elementWithClass);
					} else if(shouldClick) {
						clickElement(elementToClick);
					} else if(rowOption) {
						findRecordByRowLevel(elementName, text, rowOption, level, callback);
					}
				} else {
					//Rows are sorted underneath a different contrainer when grouped or not
					var cName;
					agGridIsGrouped(elementName).then(function(isGrouped){
						if(isGrouped) {
							cName = "ag-full-width-viewport";
						} else {
							cName = "ag-body-viewport-wrapper";
						}
					}).then(function(){
						console.log(cName)
						var rowContainer = rowItems.all(by.xpath("//div[@class='"+cName+"']"));
						rowContainer.each(function(rowElements){
							//Get all rows 
							var rows = rowElements.all(by.css("div[role=row]"));
							// var rows = rowElements.all(by.xpath("//div[@role='row']"));
							rows.count().then(function(count){
								console.log(count);
								//Let the browser catch up with rendering
								browser.sleep(1).then(function(){
									//Since the rows are sorted in a very strange way, the new rows are appended on top of the wrapper instead of at the bottom
									for(var x = Math.round((count / 3)); x < Math.round(count / 2); x++) {
									// for(var x = 0; x < count; x++) {
										//ineficient, but it works - after each scroll, check if the element can be found
										var elementToScrollTo = rows.get(x);
										elementToClick.isPresent().then(function(pres){
											if(pres) {
												found = true;
												if(shouldClick) {
													if(className) {
														var elementWithClass = elementToClick.element(by.xpath("..")).element(by.className(className));
														clickElement(elementWithClass);
													} else if(rowOption) {
														findRecordByRowLevel(elementName, text, rowOption, level, callback);
													} else {
														clickElement(elementToClick).then(function(){
															x = count + 1; //break loop, forcing protractor to finish the promise
														});
													}
												} else {
													x = count + 1;
												}
											} else {
												browser.executeScript("arguments[0].scrollIntoView(true);", elementToScrollTo.getWebElement()).then(function(){
													browser.sleep(500);
												})
											}
										});
									}
								});
							}).then(function(){
								if(!found){
									groupingGridTableScroll(elementName, text, callback, shouldClick, className, rowOption, level);
								}
							})
						});
					});
				}
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	}).then(function(){
		if(found) {
			wrapUp(callback, "scrollEvent");
		}
	}).catch(function (error) {
		console.log(error.message);
		tierdown(true);
	});
}

function findRecordByRowLevel(elementName, recordText, rowOption, level, callback) {
	var found = false;
	var table = element.all(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"));
	browser.wait(EC.visibilityOf(element(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"))), 30 * 1000, 'Table not found!').then(function () {
		table.each(function (row) {
			var elementToClick = row.all(by.xpath('//*[text()="' + recordText + '"]'));
			browser.wait(elementToClick.first().isPresent()).then(function (isPresent) {
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
					}
				}
			});
		}).then(function () {
			if (!found) {
				groupingGridTableScroll(elementName, recordText, callback, true, null, rowOption, level);
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

function setCalendar(day, month, year, callback) {
	var calendar = element(by.xpath("//div[contains(@class, 'bootstrap-datetimepicker-widget')]"));
	var monthList = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
	var monthTo = monthList.indexOf(month.toLowerCase());
	var calMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	var yearTo = year;
	var dateHeaderText = calendar.element(by.xpath("//th[@class='picker-switch']"));
	browser.wait(EC.presenceOf(dateHeaderText), 15 * 1000, 'Header text not visible!').then(function () {
		dateHeaderText.getText().then(function (calYear) {
			var yearFrom = calYear.split(" ")[1];
			if (yearFrom != yearTo) { //switch years if end dates aint equal
				clickElement(calendar.element(by.xpath("//div[@class='datepicker-days']/table/thead/tr/th[2]"))).then(function () {
					if (yearFrom < yearTo) {
						for (var x = 0; x < (yearTo - yearFrom); x++) {
							clickElement(calendar.element(by.xpath("//div[@class='datepicker-months']/table/thead/tr/th[3]")));
						}
					} else {
						for (var x = 0; x < (yearFrom - yearTo); x++) {
							clickElement(calendar.element(by.xpath("//div[@class='datepicker-months']/table/thead/tr/th[1]")));
						}
					}
				}).then(function () {
					clickElement(calendar.element(by.xpath("//div[@class='datepicker-months']")).element(by.xpath("//span[.='" + calMonths[monthTo] + "']"))).then(function () {
						return clickElement(calendar.element(by.xpath("//div[@class='datepicker-days']")).element(by.xpath("//td[.='" + day + "' and not(contains(@class, 'cw')) and not(contains(@class, 'old'))]")));
					});
				});
			} else {
				clickElement(calendar.element(by.xpath("//div[@class='datepicker-days']/table/thead/tr/th[2]"))).then(function () {
					return clickElement(calendar.element(by.xpath("//div[@class='datepicker-months']")).element(by.xpath("//span[.='" + calMonths[monthTo] + "']"))).then(function () {
						return clickElement(calendar.element(by.xpath("//div[@class='datepicker-days']")).element(by.xpath("//td[.='" + day + "' and not(contains(@class, 'cw')) and not(contains(@class, 'old'))]")));
					});
				});
			}
		}).then(function () {
			clickElement(calendar.element(by.xpath("//span[contains(@class, 'glyphicon-ok')]"))).then(function() {
				wrapUp(callback, "Calendar event");			
			});
		});
	}).catch(function(error){
		console.log(error.message);
		tierdown(true)
	});	
}

function pressKey(browserAction) {
	var deferred = protractor.promise.defer();
	browserAction = browserAction.toLowerCase();
	switch (browserAction) {
		case "enter":
			return browser.actions().sendKeys(protractor.Key.ENTER).perform();
		case "control":
			return browser.actions().sendKeys(protractor.Key.CONTROL).perform()
		case "tab":
			return browser.actions().sendKeys(protractor.Key.TAB).perform();
		case "escape":
			return browser.actions().sendKeys(protractor.Key.ESCAPE).perform();
		case "backspace":
			return browser.actions().sendKeys(protractor.Key.BACK_SPACE).perform()
		case "delete":
			return browser.actions().sendKeys(protractor.Key.DELETE).perform();
		case "space":
			return browser.actions().sendKeys(protractor.Key.SPACE).perform();
		case "page up":
		case "pageup":
			return browser.actions().mouseMove(element(by.xpath("//body")), { x: 0, y: 0 }).perform().then(function () {
				return browser.actions().click().perform().then(function () {
					return browser.actions().sendKeys(protractor.Key.PAGE_UP).perform();
				})
			});
		case "page down":
		case "pagedown":
			return browser.actions().mouseMove(element(by.xpath("//body")), { x: 0, y: 0 }).perform().then(function () {
				return browser.actions().click().perform().then(function () {
					return browser.actions().sendKeys(protractor.Key.PAGE_DOWN).perform();
				})
			});
		case "end":
			return browser.actions().sendKeys(protractor.Key.END).perform();
		case "home":
			return browser.actions().sendKeys(protractor.Key.HOME).perform();;
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