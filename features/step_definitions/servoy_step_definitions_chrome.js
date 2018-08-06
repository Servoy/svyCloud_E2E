'use strict';
var proc = require('process');
var { defineSupportCode } = require('../../lib/cucumberLoader').load();
var EC = protractor.ExpectedConditions;
var element = browser.element;
var expect = require('expect');
var startDate = new Date();
var tempDate;
var startBlockDate = new Date();
var tempBlockDate;
var hasErrorDuringSuite = false;
var userAnalytics = require('universal-analytics');
var analytics = userAnalytics('UA-93980847-1');
var find = require('find');
var fs = require('fs-extra');
var timeoutAgAction = 60 * 1000;

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

	//URL VALIDATION
	Then('I expect the url to be {browserUrl}', { timeout: 30 * 1000 }, function (url, callback) {
		browser.getCurrentUrl().then(function (browserUrl) {
			if(browserUrl === url) {
				wrapUp(callback, "validateEvent");
			}
		});
	});
	//END URL VALIDATION

	Then('I want to navigate back', {timeout: 15 * 1000}, function(callback){
		browser.navigate().back().then(function(){
			wrapUp(callback, "navigateEvent");
		});
	});

	Given('I go to the test domain', { timeout: 60 * 1000}, function(callback) {
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
	//END SERVOY SIDENAV COMPONENT

	//SERVOY CALENDAR COMPONENT
	When('servoy calendar component with name {elementName} is clicked', { timeout: 60 * 1000 }, function (elementName, callback) {
		clickElement(element(by.xpath("//data-servoydefault-calendar[@data-svy-name='" + elementName + "']/div/span[1]"))).then(function () {
			wrapUp(callback, "Click event");
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	Then('I want to sleep for {second} second(s)', {timeout: 30 * 1000}, function (timer, callback) {
		browser.sleep((parseInt(timer) * 1000)).then(function () {
			wrapUp(callback, "Sleep");
		});
	});

	When('servoy calendar component I want to select {day} {month} {year}', { timeout: 120 * 1000 }, function (day, month, year, callback) {
		var monthList = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
		var monthTo = monthList.indexOf(month.toLowerCase());
		var calMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		var yearTo = year;
		element(by.xpath("//th[@class='picker-switch']")).getText().then(function(calYear){
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
				})/*.then(function () {
					wrapUp(callback, "Calendar event");
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});*/
			} else {
				clickElement(element(by.xpath("//div[@class='datepicker-days']/table/thead/tr/th[2]"))).then(function () {
					return clickElement(element(by.xpath("//div[@class='datepicker-months']")).element(by.xpath("//span[.='" + calMonths[monthTo] + "']"))).then(function () {
						return clickElement(element(by.xpath("//div[@class='datepicker-days']")).element(by.xpath("//td[.='" + day + "' and not(contains(@class, 'cw')) and not(contains(@class, 'old'))]")));
					});
				})/*.then(function () {
					wrapUp(callback, "Calendar event")
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});*/
			}
		}).then(function(){
			element(by.xpath("//th[@class='picker-switch']")).getText().then(function(calYear){
				if(calYear.toLowerCase() === month.toLowerCase() + " " + year) {
					wrapUp(callback, "Calendar event")
				}
			});
		})
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
		})
	});
	//END SERVOY CALENDAR COMPONENT

	//SERVOY SELECT2TOKENIZER COMPONENT
	When('servoy select2tokenizer component with name {elementName} is clicked', { timeout: 60 * 1000 }, function (elementName, callback) {
		clickElement(element(by.xpath("//data-servoyextra-select2tokenizer[@data-svy-name='" + elementName + "']/div/span/span/span/ul/li/input"))).then(function () {
			wrapUp(callback, "Click event");
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	When('servoy select2tokenizer component record number {rowNumber} is clicked', { timeout: 60 * 1000 }, function (rowNumber, callback) {
		browser.sleep(500).then(function(){
			var container = element.all(by.xpath("//span[contains(@class, 'select2-results')]"));
			var containerUl = container.all(by.xpath("//ul[@aria-expanded='true']"));
			var rows = containerUl.all(by.xpath("//li[contains(@class, 'select2-results__option')]"));
			var searchRow = rows.get(0);
			searchRow.getText().then(function(text){
				browser.wait(EC.not(EC.textToBePresentInElementValue(searchRow, 'Searching...'))).then(function(hasChanged){
					if(hasChanged || text !== 'Searching...'){
						clickElement(rows.get(rowNumber - 1)).then(function(){
							wrapUp(callback, "clickEvent");
						})
					}
				});
			});
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

	When('servoy select2tokenizer component with name {elementName} the text {recordText} is inserted', { timeout: 60 * 1000 }, function (elementName, text, callback) {
		var elem = element(by.xpath("//data-servoyextra-select2tokenizer[@data-svy-name='" + elementName + "']/div/span/span/span/ul/li/input"));
		sendKeys(elem, text).then(function () {
			wrapUp(callback, "Click event");
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});
	//END SERVOY SELECT2TOKENIZER COMPONENT

	//BROWSER ACTION
	When('I press {browserAction}', { timeout: 60 * 1000 }, function (browserAction, callback) {
		browserAction = browserAction.toLowerCase();
		switch (browserAction) {
			case "enter":
				browser.actions().sendKeys(protractor.Key.ENTER).perform().then(function () {
					wrapUp(callback, "keypressEvent");
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});
				break;
			case "tab":
				browser.actions().sendKeys(protractor.Key.TAB).perform().then(function () {
					wrapUp(callback, "keypressEvent");
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});
				break;
			case "escape":
				browser.actions().sendKeys(protractor.Key.ESCAPE).perform().then(function () {
					wrapUp(callback, "keypressEvent");
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});
				break;
			case "backspace":
				browser.actions().sendKeys(protractor.Key.BACK_SPACE).perform().then(function () {
					wrapUp(callback, "keypressEvent");
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});
				break;
			case "delete":
				browser.actions().sendKeys(protractor.Key.DELETE).perform().then(function () {
					wrapUp(callback, "keypressEvent");
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});
				break;
			case "space":
				browser.actions().sendKeys(protractor.Key.SPACE).perform().then(function () {
					wrapUp(callback, "keypressEvent");
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});
				break;
			case "page up":
			case "pageup":
				element(by.xpath("//body")).click().then(function(){
					browser.actions().sendKeys(protractor.Key.PAGE_UP).perform().then(function () {
						wrapUp(callback, "keypressEvent");
					}).catch(function (error) {
						console.log(error.message);
						tierdown(true);
					});
				});
				break;
			case "page down":
			case "pagedown":
				element(by.xpath("//body")).click().then(function(){
					browser.actions().sendKeys(protractor.Key.PAGE_DOWN).perform().then(function () {
						wrapUp(callback, "keypressEvent");
					}).catch(function (error) {
						console.log(error.message);
						tierdown(true);
					});
				});
				break;
			case "end":
				browser.actions().sendKeys(protractor.Key.END).perform().then(function () {
					wrapUp(callback, "keypressEvent");
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});
				break;
			case "home":
				browser.actions().sendKeys(protractor.Key.HOME).perform().then(function () {
					wrapUp(callback, "keypressEvent");
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});
				break;
			case "f1":
				browser.actions().sendKeys(protractor.Key.F1).perform().then(function () {
					wrapUp(callback, "keypressEvent");
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});
				break;
			case "f2":
				browser.actions().sendKeys(protractor.Key.F2).perform().then(function () {
					wrapUp(callback, "keypressEvent");
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});
				break;
			case "f3":
				browser.actions().sendKeys(protractor.Key.F3).perform().then(function () {
					wrapUp(callback, "keypressEvent");
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});
				break;
			case "f4":
				browser.actions().sendKeys(protractor.Key.F4).perform().then(function () {
					wrapUp(callback, "keypressEvent");
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});
				break;
			case "f5":
				browser.actions().sendKeys(protractor.Key.F5).perform().then(function () {
					wrapUp(callback, "keypressEvent");
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});
				break;
			case "f6":
				browser.actions().sendKeys(protractor.Key.F6).perform().then(function () {
					wrapUp(callback, "keypressEvent");
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});
				break;
			case "f7":
				browser.actions().sendKeys(protractor.Key.f7).perform().then(function () {
					wrapUp(callback, "keypressEvent");
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});
				break;
			case "f8":
				browser.actions().sendKeys(protractor.Key.F8).perform().then(function () {
					wrapUp(callback, "keypressEvent");
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});
				break;
			case "f9":
				browser.actions().sendKeys(protractor.Key.F9).perform().then(function () {
					wrapUp(callback, "keypressEvent");
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});
				break;
			case "f10":
				browser.actions().sendKeys(protractor.Key.F10).perform().then(function () {
					wrapUp(callback, "keypressEvent");
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});
				break;
			case "f11":
				browser.actions().sendKeys(protractor.Key.F11).perform().then(function () {
					wrapUp(callback, "keypressEvent");
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});
				break;
			case "f12":
				browser.actions().sendKeys(protractor.Key.F12).perform().then(function () {
					wrapUp(callback, "keypressEvent");
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});
				break;
			default:
				console.log("Unknown browser action");
				tierdown(true);
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

	When('servoy table component with name {elementName} I want to validate that a record with the text {text} exists', {timeout: 90 * 1000}, function(elementName, text, callback){
		var found = false;
		var table = element.all(by.xpath("//div[@data-svy-name='"+elementName+"']"));
		table.each(function(tableItems){
			//wait untill the table is loaded
			var waitForInputField = tableItems.element(by.css('input'));
			browser.wait(EC.visibilityOf(waitForInputField)).then(function(){
				var inputList = tableItems.all(by.css('input'));
				inputList.each(function(input){
					input.getAttribute('value').then(function(result){
						if(result === text) {
							found = true;
						}
					});
				});
			});
		}).then(function(){
			if(found) {
				wrapUp(callback, 'validationEvent');
			} else {
				tierdown(true);
			}
		});
	});

	When('servoy table component with name {elementName} I want to select element number {number} with name {elemName}',{timeout: 30 * 1000} ,function(elementName, rowNumber, elemName, callback){
		var table = element.all(by.xpath("//div[@data-svy-name='"+elementName+"']"));
		browser.wait(EC.visibilityOf(table.first()), 30 * 1000, 'Table not found!').then(function(){
			var elem = table.all(by.xpath("//*[@data-svy-name='"+elemName+"']")).get(rowNumber - 1);
			clickElement(elem).then(function(){
				wrapUp(callback, "clickEvent");
			});
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
		element.all(by.xpath("//data-servoyextra-table[@data-svy-name='" + elementName + "']/div/table/tbody/tr")).count().then(function(count){
			console.log('Records found: ' + count);
			if(count == rowCount){
				console.log("Count matches with the amount of rows");
				wrapUp(callback, "validateEvent");
			}
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
		clickElement(element(by.xpath("//div[@data-svy-name='" + elementName + "']/div/div[8]"))).then(function () {
			clickElement(element(by.xpath("//div[@data-svy-name='" + elementName + "']/div/div[11]"))).then(function () {
				return navigateCalendar(elementName, month, year);
			}).then(function (done) {
				if (done) {
					wrapUp(callback, "calendarEvent");
				}
			});
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
		sendKeys(element(by.xpath("//input[@data-svy-name='" + elementName + "']")), text).then(function () {
			wrapUp(callback, "Insert value event");
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
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	When('servoy data-servoydefault-check component with name {elementName} I want to validate that the checkbox is {checkBoxState}', { timeout: 30 * 1000 }, function (elementName, checkBoxState, callback) {
		var checkbox = element(by.xpath("//data-servoydefault-check[@data-svy-name='" + elementName + "']/label/input"));
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
	});

	//SERVOY PASSWORD FIELD
	When('servoy data-servoydefault-password component with name {elementName} the text {password} is inserted', {timeout: 30 * 1000}, function(elementName, text, callback){
		var inputField = element(by.xpath("//data-servoydefault-password[@data-svy-name='"+elementName+"']/input"));
		sendKeys(inputField, text).then(function(){
			wrapUp(callback, 'insertEvent');
		}).catch(function(error){
			tierdown(error)
		});
	});
	//END SERVOY PASSWORD FIELD

	//SERVOY COMBOBOX
	When('servoy combobox component with name {elementName} is clicked', { timeout: 60 * 1000 }, function (elementName, callback) {
		clickElement(element(by.xpath("//data-servoydefault-combobox[@data-svy-name='" + elementName + "']"))).then(function () {
			wrapUp(callback, "Click event");
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
		});
	});
	//END SERVOY COMBOBOX

	//SERVOY BUTTON
	When('servoy button component with name {elementName} is clicked', { timeout: 60 * 1000 }, function (elementName, callback) {
		clickElement(element(by.xpath("//data-servoydefault-button[starts-with(@data-svy-name, '" + elementName + "')]/button"))).then(function () {
			wrapUp(callback, "Click event");
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
				var label = element(by.xpath("//data-servoydefault-label[@data-svy-name='"+elementName+"']/div/div/span[2]"));
				browser.wait(EC.visibilityOf(label), 10 * 1000, 'Label not found!').then(function(){
					clickElement(label).then(function(){
						wrapUp(callback, "clickEvent");
					}).catch(function(error){
						tierdown(error)
					});
				});
			}
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
		});
	})
	//END SERVOY LABEL

	//BOOTSTRAP COMPONENTS
	When('bootstrap data-bootstrapcomponents-textbox component with name {elementName} the text {text} is inserted', { timeout: 30 * 1000 }, function (elementName, text, callback) {
		browser.wait(EC.visibilityOf(element(by.xpath("//data-bootstrapcomponents-textbox[@data-svy-name='" + elementName + "']/input"))), 30 * 1000, 'Element not found!').then(function () {
			sendKeys(element(by.xpath("//data-bootstrapcomponents-textbox[@data-svy-name='" + elementName + "']/input")), text).then(function () {
				wrapUp(callback, "insertTextEvent");
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		});
	});

	When('bootstrap data-bootstrapcomponents-button component with name {elementName} is clicked', { timeout: 30 * 1000 }, function (elementName, callback) {
		clickElement(element(by.xpath("//data-bootstrapcomponents-button[@data-svy-name='" + elementName + "']/button"))).then(function () {
			wrapUp(callback, "clickEvent");
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	When('bootstrap data-bootstrapcomponents-select component with name {elementName} is clicked', { timeout: 30 * 1000 }, function (elementName, callback) {
		clickElement(element(by.xpath("//data-bootstrapcomponents-select[@data-svy-name='" + elementName + "']"))).then(function () {
			wrapUp(callback, "clickEvent");
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
		})

	});

	When('bootstrap data-bootstrapcomponents-select component with name {elementName} I want to select row number {rowNumber}', { timeout: 45 * 1000 }, function (elementName, rowNumber, callback) {
		var table = element.all(by.xpath("//data-bootstrapcomponents-select[@data-svy-name='" + elementName + "']/select"));
		if (rowNumber) {
			table.all(by.tagName('option')).then(function (options) {
				options[rowNumber].click().then(function () {
					wrapUp(callback, "clickEvent");
				})
			});
		}
	});

	When('bootstrap data-bootstrapcomponents-textarea component with name {elementName} the text {text} is inserted', { timeout: 30 * 1000 }, function (elementName, text, callback) {
		sendKeys(element(by.xpath("//data-bootstrapcomponents-textarea[@data-svy-name='" + elementName + "']/textarea")), text).then(function () {
			wrapUp(callback, "insertEvent");
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		})
	});

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

	When('bootstrap data-bootstrapextracomponents-badge component with name {elementName} is clicked', { timeout: 30 * 1000 }, function (elementName, callback) {
		browser.wait(EC.visibilityOf(element(by.xpath("//data-bootstrapextracomponents-badge[@data-svy-name='" + elementName + "']")))).then(function () {
			element(by.xpath("//data-bootstrapextracomponents-badge[@data-svy-name='" + elementName + "']")).click().then(function () {
				wrapUp(callback, "clickEvent");
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		});
	});	


	//BOOTSTRAP COMPONENTS INSIDE A FORMCOMPONENT
	When('formcomponent with the name {formComponentName} a bootstrap data-bootstrapcomponents-textbox component with name {elementName} the text {text} is inserted', { timeout: 30 * 1000 }, function (formComponentName, elementName, text, callback) {
		var fComponent = element(by.xpath("//data-bootstrapcomponents-formcomponent[@data-svy-name='" + formComponentName + "']"));
		browser.wait(EC.presenceOf(fComponent), 30 * 1000, 'Formcomponent not visible!').then(function () {
			browser.wait(EC.presenceOf(fComponent.element(by.css("data-bootstrapcomponents-textbox[data-svy-name='" + elementName + "']"))), 30 * 1000, 'Element not found!').then(function () {
				var tField = fComponent.element(by.css("data-bootstrapcomponents-textbox[data-svy-name='" + elementName + "']")).element(by.css("input"));
				browser.wait(EC.visibilityOf(tField), 30 * 1000, 'Textfield not found!').then(function(){
					console.log('Text input component found');
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

	When('formcomponent with the name {formComponentName} a bootstrap data-bootstrapcomponents-button component with name {elementName} is clicked', { timeout: 30 * 1000 }, function (formComponentName, elementName, callback) {
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

	When('formcomponent with the name {formComponentName} a bootstrap data-bootstrapcomponents-select component with name {elementName} is clicked', { timeout: 30 * 1000 }, function (formComponentName, elementName, callback) {
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

	When('formcomponent with the name {formComponentName} a bootstrap data-bootstrapcomponents-select component with name {elementName} I want to select the row with {text} as text', { timeout: 45 * 1000 }, function (formComponentName, elementName, text, callback) {
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
	//END BOOTSTRAP COMPONENTS INSIDE A FORMCOMPONENT
	//END BOOTSTRAP COMPONENTS

	//SERVOY GROUPING GRID COMPONENT
	When('servoy data-aggrid-groupingtable component with name {elementName} I scroll to the record with {string} as text', { timeout: 120 * 1000 }, function (elementName, recordText, callback) {
		groupingGridTableScroll(elementName, recordText, callback);
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to {rowOption} row level {rowLevel} with {rowText} as text', { timeout: timeoutAgAction }, function (elementName, rowOption, rowLevel, rowText, callback) {
		findRecordByRowLevel(elementName, rowText, rowOption, rowLevel - 1, callback);
	});

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

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to sort the table by {sortBy}', { timeout: timeoutAgAction }, function (elementName, sortBy, callback) {
		var grid = element.all(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"));
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
		})
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
		var table = element.all(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(element(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"))), 30 * 1000, 'Table not found!').then(function(){
			table.each(function(tableItems){
				//Rows are generated multiple times in the aggrid structure. The displayed rows are in the following wrapper
				var rowContainer = tableItems.all(by.xpath("//div[@class='ag-body-viewport-wrapper']"));
				rowContainer.each(function(rowElements){
					//Get all the rows
					var rows = rowElements.all(by.css("div[role=row]"));
					//Get the element by text
					var elementWithText = rows.all(by.xpath("//*[text()='"+text+"']")).first();
					//Check if the element is present
					elementWithText.isPresent().then(function(isPresent){
						if(isPresent) {
							//The element we want to click is not a child of the element by text. Meaning, the parent row has to be called
							//.. means the parent of the element
							var elem = elementWithText.element(by.xpath("..")).element(by.className(className))
							elem.isPresent().then(function(isElemPresent){
								if(isElemPresent) {
									clickElement(elem).then(function(){
										wrapUp(callback,"clickEvent");
									});
								}
							})
						}
					});
				});
			});			
		});
	});
	
	When('servoy data-aggrid-groupingtable component with name {elementName} I want to click on the element which contains the class {className} in row number {rowNumber}', {timeout: 45 * 1000}, function(elementName, className, rowNumber, callback){
		var table = element.all(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"));
		browser.wait(EC.visibilityOf(element(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"))), 30 * 1000, 'Table not found!').then(function(){
			table.each(function(tableItems){
				//Rows are generated multiple times in the aggrid structure. The displayed rows are in the following wrapper
				var rowContainer = tableItems.all(by.xpath("//div[@class='ag-body-viewport-wrapper']"));
				rowContainer.each(function(rowElements){
					//Get all the rows
					var selectedRow = rowElements.all(by.css("div[role=row]")).get(rowNumber - 2);
					clickElement(selectedRow.element(by.className(className))).then(function(){
						wrapUp(callback, "clickEvent");
					})
				});
			});			
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
		});
	});
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
		});
	});

	Then('I expect a modal-dialog popup to appear', { timeout: 15 * 1000 }, function (callback) {
		element(by.xpath("//div[@class='modal-content']")).isPresent().then(function(isPresent){
			if(isPresent) {
				wrapUp(callback, "monalDialogEvent");
			}
		}).catch(function(error){
			console.log(error.message);
			tierdown(true)
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

function validate(input, inputToCompare) {
	return expect(input).toBe(inputToCompare);
}

function wrapUp(callback, performanceEvent) {
	var duration = calcStepDuration(new Date());
	console.log('Step took ' + duration + ' miliseconds');
	analytics.event('Scenario 1', "Performance", performanceEvent, duration).send();
	callback();
}

function clickElement(elem) {
	return browser.wait(EC.presenceOf(elem).call(), 30000, 'Element not visible').then(function () {
		return browser.wait(EC.elementToBeClickable(elem), 30000, 'Element not clickable').then(function () {
			return elem.click();
		});
	});
}

function clickElementByLocation(elem) {
	return browser.wait(EC.presenceOf(elem).call(), 30 * 1000, 'Element not found!').then(function () {
		return elem.getLocation().then(function (location) {
			console.log('x: ' + location.x);
			console.log('y: ' + location.y);
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
	});
}

// SERVOY TABLE
function findRecordTableComponent(elementName, recordText, shouldClick, callback) {
	var found = false;
	var baseTable = element.all(by.xpath("//div[@data-svy-name='" + elementName + "']"));
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

// SERVOY EXTRA TABLE
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
	});
}