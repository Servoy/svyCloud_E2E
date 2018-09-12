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

defineSupportCode(({ Given, Then, When, Before, After }) => {
	Given('I go to {url}', { timeout: 60 * 1000 }, function (url, callback) {
		browser.get(browser.params.testDomainURL).then(function () {
			browser.driver.getCapabilities().then(function (caps) {
				console.log(caps.get('browserName'));
				if (caps.get('browserName') === 'firefox') {
					browser.driver.navigate().refresh().then(function () {
						wrapUp(callback, "navigateURLEvent");
					});
				}
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	Then('I want to refresh the page', { timeout: 15 * 1000 }, function () {
		browser.sleep(1500).then(function () {
			browser.driver.navigate().refresh();
			browser.sleep(2000);
		});
	});

	Given('I setup the environment', { timeout: 30 * 1000 }, function (callback) {
		createDirIfNotExists(browser.params.htmlDirectory);
		createDirIfNotExists(browser.params.screenshotDirectory);
		removeHtmlReports(browser.params.htmlDirectory); //remove html reports from previous tests
		removeScreenshots(browser.params.screenshotDirectory);
		wrapUp(callback, 'setupEnvironment');
	});

	Then('I want to sleep', { timeout: 60 * 1000 }, function (callback) {
		browser.sleep(10000).then(function () {
			callback();
		});
	});

	//SERVOY AGGRID COMPONENT
	When('servoy data-aggrid-groupingtable component with name {elementName} I scroll to the record with {string} as text', { timeout: 60 * 1000 }, function (elementName, recordText, callback) {
		findRecordAgTableComponent(elementName, recordText, callback);
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to {rowOption} row level {int} with {rowText} as text', { timeout: 20 * 1000 }, function (elementName, rowOption, rowLevel, rowText, callback) {
		findRecord(elementName, rowText, rowOption, rowLevel - 1, callback);
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to scroll to the top', { timeout: 60 * 1000 }, function (elementName, callback) {
		scrollToTop(elementName, callback);
	});

	function scrollToTop(elementName, callback) {
		var table = element(by.xpath("//div[@class='ag-body-container']"));
		browser.executeScript("arguments[0].scrollIntoView(true);", table.getWebElement()).then(function () {
			wrapUp(callback, "tableScrollEvent");
		});
	}

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to sort the table by {sortBy}', { timeout: 20 * 1000 }, function (elementName, sortBy, callback) {
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

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to group the table by {tableHeaderText}', { timeout: 20 * 1000 }, function (elementName, tableHeaderText, callback) {
		var tableHeaderCount = 0;
		var grid = element.all(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"));
		grid.each(function (menuItems) {
			menuItems.all(by.css(".ag-header-cell.ag-header-cell-sortable.ag-table-header")).each(function (tableHeader) {
				tableHeader.element(by.cssContainingText("span", tableHeaderText)).isPresent().then(function (result) {
					tableHeaderCount++;
					if (result) {
						var orderByIconLocation = tableHeader.all(by.xpath("//span[@ref='eMenu']")).get(tableHeaderCount);
						browser.executeScript("arguments[0].click()", orderByIconLocation).then(function () {
							clickElement(menuItems.element(by.cssContainingText("span", "Group by " + tableHeaderText))).then(function () {
								wrapUp(callback, "tableGroupingEvent");
							});
						});
					}
				});
			});
		});
	});

	When('servoy data-aggrid-groupingtable component with name {elementName} I want to ungroup the table by {tableHeaderText}', { timeout: 20 * 1000 }, function (elementName, filterTableText, callback) {
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
				} else {
					if (clearGrouping()) {
						wrapUp(callback, "removeTableFilterEvent");
					}
				}
			}).then(function () {
				wrapUp(callback, "removeTableFilterEvent");
			});
		});
	});
	// servoy data-aggrid-groupingtable component with name agGridOrders.groupingtable_1 I want to drag the grouping item with Customer to the start
	When('servoy data-aggrid-groupingtable component with name {elementName} I want to drag the grouping item with {groupingText} as text to the start', { timeout: 20 * 1000 }, function (elementName, groupingText, callback) {
		element.all(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']")).each(function (gridItems) {
			var dropElement = element(by.xpath("//img[@role='presentation' and @class='ag-column-drop-icon']"));
			var groupItem = element(by.css(".ag-column-drop.ag-font-style.ag-column-drop-horizontal.ag-column-drop-row-group"))
				.element(by.xpath("//span[@class='ag-column-drop-cell-text' and .='" + groupingText + "']"));

			browser.actions().mouseMove(groupItem).mouseDown().mouseMove(dropElement).mouseUp().perform().then(function () {
				wrapUp(callback, "aggridDragEvent");
			});
		});
	});
	var rowCount = 0;
	var lastRow = 0;
	Then('servoy data-aggrid-groupingtable component with name {elementName} I expect there will be {orderCount} orders placed', { timeout: 20 * 1000 }, function (elementName, orderCount, callback) {
		element.all(by.css('.ag-column-drop-cell')).count().then(function (count) {
			return count;
		}).then(function (count) {
			browser.sleep(2000).then(function () {
				calcRows(elementName, count, orderCount, callback);
			});
		});
	});

	Then('servoy data-aggrid-groupingtable component with name {elementName} I expect there will be {orderCount} orders placed by {customerName}', { timeout: 20 * 1000 }, function (elementName, orderCount, customerName, callback) {
		element.all(by.css('.ag-column-drop-cell')).count().then(function (count) {
			return count;
		}).then(function (count) {
			browser.sleep(2000).then(function () {
				calcRows(elementName, count, orderCount, callback);
			});
		});
	});

	var rowCount = 0;
	var lastRow = 0;
	function calcRows(elementName, count, orderCount, callback) {
		var grid = element.all(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"));
		grid.each(function (menuItems) {
			//if there are no level n nodes visible, the browser has to scroll
			menuItems.all(by.xpath("//div[contains(@class, 'ag-row-level-" + count + "')]")).count().then(function (amount) {
				if (amount === 0) {
					browser.executeScript("arguments[0].scrollIntoView(true);", element.all(by.xpath("//div[@role='row']")).last()).then(function () {
						calcRows(elementName, count, orderCount, callback);
					});
				} else {
					//calcs the amount of child rows currently visible
					var firstRow = menuItems.all(by.xpath("//div[contains(@class, 'ag-row-level-" + count + "') and @row > " + lastRow + "]")).first(); //it needs to start calculating from where it left of
					var lastRowElement = menuItems.all(by.xpath("//div[contains(@class, 'ag-row-level-" + count + "') and @row > " + lastRow + "]")).last();
					firstRow.getAttribute('row').then(function (firstNumber) {
						lastRowElement.getAttribute('row').then(function (lastNumber) {
							rowCount += lastNumber - firstNumber + 1;
							lastRow = lastNumber;
							//all elements are calculated now. Now calculate if the scroll function is required
							var lastElementCheck = menuItems.all(by.xpath("//div[@role='row']")).last();
							lastElementCheck.getAttribute('class').then(function (elemClass) {
								//last element contains the same row, scroll again
								if (elemClass.indexOf("ag-row-level-" + count) !== -1) {
									scroll(elementName, lastRowElement, count, orderCount, callback);
								} else { //all elements have been checked. Validate and finalize the step
									if (rowCount == orderCount) {
										wrapUp(callback, "validatingChildRows");
									} else {
										console.log("Elements found: " + rowCount);
										console.log("Elements expected: " + orderCount);
									}
								}
							});
						});
					});
				}
			});
		});
	}

	function scroll(elementName, elem, count, orderCount, callback) {
		browser.executeScript("arguments[0].scrollIntoView(true);", elem.getWebElement()).then(function () {
			calcRows(elementName, count, orderCount, callback);
		});
	}

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
	When('servoy sidenav component with name {elementName} tab {tabName} is clicked', { timeout: 15 * 1000 }, function (elementName, tabName, callback) {
		var menuItems = element.all(by.xpath("//data-servoyextra-sidenav[@data-svy-name='" + elementName + "']"));
		menuItems.each(function (menuItem) {
			browser.wait(EC.visibilityOf(menuItem.element(by.xpath("//*[text()='" + tabName + "'] | //*[contains(text(), '" + tabName + "')]")))).then(function () {
				var elem = menuItem.element(by.xpath("//*[text()='" + tabName + "'] | //*[contains(text(), '" + tabName + "')]"));
				elem.isPresent().then(function (isPresent) {
					if (isPresent) {
						elem.click().then(function () {
							wrapUp(callback, "Click event");
						});
					}
				});
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});
	//END SERVOY SIDENAV COMPONENT

	When('servoy calendar component with name {month} is clicked', { timeout: 60 * 1000 }, function (elementName, callback) {
		clickElement(element(by.xpath("//data-servoydefault-calendar[@data-svy-name='" + elementName + "']/div/span[1]"))).then(function () {
			wrapUp(callback, "Click event");
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	When('servoy calendar component I want to select {day} {month} {year}', { timeout: 60 * 1000 }, function (day, month, year, callback) {
		var monthList = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
		var monthTo = monthList.indexOf(month.toLowerCase());
		var calMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		var yearFrom = new Date().getFullYear();
		var monthFrom = new Date().getMonth();
		var yearTo = year;
		var differenceInMonths;
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
				clickElement(element(by.xpath("//div[@class='datepicker-months']/table/tbody/tr/td/span[" + (monthTo + 1) + "]"))).then(function () {
					return clickElement(element(by.xpath("//div[@class='datepicker-days']")).element(by.xpath("//td[.='" + day + "' and not(contains(@class, 'cw')) and not(contains(@class, 'old'))]")));
				});
			}).then(function () {
				wrapUp(callback, "Calendar event");
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		} else {
			clickElement(element(by.xpath("//div[@class='datepicker-days']/table/thead/tr/th[2]"))).then(function () {
				return clickElement(element(by.xpath("//div[@class='datepicker-months']/table/tbody/tr/td/span[" + (monthTo + 1) + "]"))).then(function () {
					return clickElement(element(by.xpath("//div[@class='datepicker-days']")).element(by.xpath("//td[.='" + day + "' and not(contains(@class, 'cw')) and not(contains(@class, 'old'))]")));
				});
			}).then(function () {
				wrapUp(callback, "Calendar event")
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		}
	});

	When('servoy calendar component day {day} is clicked', { timeout: 15 * 1000 }, function (day, callback) {
		browser.wait(EC.presenceOf(element(by.cssContainingText("td", day)))).then(function () {
			browser.wait(EC.elementToBeClickable(element(by.cssContainingText("td", day)))).then(function () {
				clickElement(element(by.cssContainingText("td.day", day))).then(function () {
					wrapUp(callback, "Click event");
				});
			});
		}).catch(function (error) {
			console.log('error.message');
			tierdown(true);
		})
	});

	When('servoy select2tokenizer component with name {elementName} is clicked', { timeout: 60 * 1000 }, function (elementName, callback) {
		clickElement(element(by.xpath("//data-servoyextra-select2tokenizer[@data-svy-name='" + elementName + "']/div/span/span/span/ul/li/input"))).then(function () {
			wrapUp(callback, "Click event");
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	When('servoy select2tokenizer component with class name {elementClass} record number {rowNumber} is clicked', { timeout: 60 * 1000 }, function (elementClass, recordNumber, callback) {
		element.all(by.xpath("//ul[@class='" + elementClass + "']")).each(function (childElement) {
			return clickElement(childElement.all(by.css('li')).get(recordNumber - 1));
		}).then(function () {
			wrapUp(callback, "Click event");
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	//cheat manier. De typeahead zoekt records gebaseerd op input, de stap is hier te snel voor dus is er een pause van 2 seconden
	Then('servoy select2tokenizer component with class name {elementClass} record number {rowNumber} equals {recordText}', { timeout: 60 * 1000 }, function (elementClass, recordNumber, text, callback) {
		browser.sleep(2000).then(function () {
			element.all(by.xpath("//ul[@class='" + elementClass + "']")).each(function (childElement) {
				childElement.all(by.css('li')).get(recordNumber - 1).getText().then(function (textToCompare) {
					validate(textToCompare.toLowerCase(), text.toLowerCase());
				});
			}).then(function () {
				wrapUp(callback, "Click event");
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
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

	When('I press {browserAction}', { timeout: 60 * 1000 }, function (browserAction, callback) {
		browserAction = browserAction.toLowerCase();
		switch (browserAction) {
			case "enter":
				browser.actions().sendKeys(protractor.Key.RETURN).perform().then(function () {
					wrapUp(callback, "Browser action event");
				}).catch(function (error) {
					console.log(error.message);
					tierdown(true);
				});
				break;
			case "tab":
				browser.actions().sendKeys(protractor.Key.TAB).perform().then(function () {
					wrapUp(callback, "Browser action event");
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

	When('servoy table component with name {elementName} I scroll to the record with {string} as text', { timeout: 60 * 1000 }, function (elementName, recordText, callback) {
		findRecordTableComponent(elementName, recordText, callback);
	});

	//SERVOY EXTRA TABLE COMPONENT
	When('servoy extra table component with name {elementName} I scroll to the record with {string} as text', { timeout: 60 * 1000 }, function (elementName, recordText, callback) {
		findRecordTableExtraComponent(elementName, recordText, callback);
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

	When('servoy data-servoyextra-table component with name {elementName} I want to validate that there are {rowCount} row(s)', { timeout: 30 * 1000 }, function (elementName, rowCount, callback) {
		element.all(by.xpath("//data-servoyextra-table[@data-svy-name='" + elementName + "']/div/table/tbody/tr")).count().then(function(count){
			console.log('Records found: ' + count);
			if(count == rowCount){
				console.log("Count matches with the amount of rows");
				wrapUp(callback, "validateEvent");
			} else {
				console.log("Amount of rows does not equal " + rowCount + "!");
			}
		});
	});

	When('servoy data-servoyextra-table component with name {elementName} I want to scroll and select the row with text {rowText}', { timeout: 60 * 1000}, function(elementName, text, callback){
		dataServoyExtraTableScroll(elementName, text, callback);
	});

	//recursive function that keeps scrolling until it finds the element
	function dataServoyExtraTableScroll(elementName, text, callback){
		//Step 1 - Wait untill the table component is visible
		browser.wait(EC.visibilityOf(element(by.xpath("//data-servoyextra-table[@data-svy-name='" + elementName + "']"))), 30 * 1000, 'Element not visible').then(function () {			
			element.all(by.xpath("//data-servoyextra-table[@data-svy-name='" + elementName + "']")).each(function (rowItems) {
				//Step 2a - Loop through the table and find the element
				var elementToScrollTo = rowItems.element(by.xpath('//div[text()="'+text+'"]'));
				//Step 2b - Define the last TR that is currently loaded in the table. This will always be a different element		
				var lastRow = rowItems.all(by.xpath("//tr[last()]")).last();

				//Step 2c - Try and locate the required element with isPresent
				browser.wait(elementToScrollTo.isPresent()).then(function(isPresent){
					//Step 3a - Check if the element is present
					if(isPresent) {
						//Step 3b - Element has been found. Conclude the test
						clickElement(elementToScrollTo).then(function(){
							wrapUp(callback, "scrollEvent");
						});
					} else {
						//Step 3c - Element has not been found. Table has to scroll to the last TR loaded
						browser.executeScript("arguments[0].scrollIntoView();", lastRow.getWebElement()).then(function(){
							dataServoyExtraTableScroll(elementName, text, callback)
						});
					}
				});
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		});
	}

	//END SERVOY EXTRA TABLE COMPONENT

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
	
	//END FOUNDSET SAMPLE GALERY FUNCTIONS//

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
	//SERVOY TYPEAHEAD 
	When('servoy default typeahead component with name {elementName} the text {text} is inserted', { timeout: 60 * 1000 }, function (elementName, text, callback) {
		browser.sleep(2000).then(function () {
			sendKeys(element(by.xpath("//input[@data-svy-name='" + elementName + "']")), text).then(function () {
				wrapUp(callback, "Insert value event");
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		});
	});

	When('servoy default typeahead component I want row {rowNumber} to equal {text}', { timeout: 30 * 1000 }, function (rowNumber, text, callback) {
		element.all(by.xpath("//ul[contains(concat(' ', @class, ' '), ' dropdown-menu ') and contains(concat(' ', @class, ' '), ' ng-isolate-scope ') and not(contains(concat(' ', @class, ' '), ' ng-hide '))]")).each(function (typeaheadSelectOptions) {
			typeaheadSelectOptions.all(by.xpath("//li[contains(@class, 'uib-typeahead-match') and contains(@class, 'ng-scope')]/a")).get(rowNumber - 1).getText().then(function (liText) {
				if (text == liText) {
					wrapUp(callback, "validationEvent");
				}
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
	//END SERVOY TYPEAHEAD

	//SERVOY COMBOBOX
	When('servoy combobox component with name {elementName} is clicked', { timeout: 60 * 1000 }, function (elementName, callback) {
		clickElement(element(by.xpath("//data-servoydefault-combobox[@data-svy-name='" + elementName + "']/div/div/span"))).then(function () {
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
		});
	});

	When('servoy combobox component the text {text} is inserted', { timeout: 60 * 1000 }, function (text, callback) {
		sendKeys(element(by.xpath("//div[contains(@class, 'ui-select-container')]/input")), text).then(function () {
			wrapUp(callback, "Insert value event");
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
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
		browser.sleep(4000).then(function () {
			clickElement(element(by.xpath("//data-bootstrapcomponents-button[@data-svy-name='" + elementName + "']/button"))).then(function () {
				wrapUp(callback, "clickEvent");
			}).catch(function (error) {
				console.log(error.message);
				tierdown(true);
			});
		});
	});

	When('bootstrap data-bootstrapcomponents-select component with name {elementName} is clicked', { timeout: 15 * 1000 }, function (elementName, callback) {
		clickElement(element(by.xpath("//data-bootstrapcomponents-select[@data-svy-name='" + elementName + "']/select"))).then(function () {
			wrapUp(callback, "clickEvent");
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	When('bootstrap data-bootstrapcomponents-select component with name {elementName} I want to select the row with {text} as text', { timeout: 45 * 1000 }, function (elementName, text, callback) {
		element.all(by.xpath("//data-bootstrapcomponents-select[@data-svy-name='" + elementName + "']")).each(function (selectOptions) {
			clickElement(selectOptions.element(by.xpath('//option[text()=\"' + text + '\"]'))).then(function () {
				wrapUp(callback, "clickEvent");
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		})
	});

	When('bootstrap data-bootstrapcomponents-select component with name {elementName} I want to select row number {rowNumber}', { timeout: 45 * 1000 }, function (elementName, rowNumber, callback) {
		element.all(by.xpath("//data-bootstrapcomponents-select[@data-svy-name='" + elementName + "']/select")).each(function (selectOptions) {
			clickElement(selectOptions.all(by.xpath("//option")).get(rowNumber)).then(function () {
				wrapUp(callback, "clickEvent");
			});
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		})
	});

	When('bootstrap data-bootstrapcomponents-textarea component with name {elementName} the text {text} is inserted', { timeout: 30 * 1000 }, function (elementName, text, callback) {
		sendKeys(element(by.xpath("//data-bootstrapcomponents-textarea[@data-svy-name='" + elementName + "']/textarea")), text).then(function () {
			wrapUp(callback, "insertEvent");
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		})
	});

	When('bootstrap data-bootstrapcomponents-checkbox component with name {elementName} I want it to be {checkboxOption}', { timeout: 30 * 1000 }, function (elementName, checkboxOption, callback) {
		var checkbox = element(by.xpath("//data-bootstrapcomponents-checkbox[@data-svy-name='" + elementName + "']/div/label/input"));
		checkbox.isSelected().then(function (isChecked) {
			console.log(isChecked);
			if (isChecked && checkboxOption === "unchecked" || !isChecked && checkboxOption === "checked") {
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
	//END BOOTSTRAP COMPONENTS

	//URL VALIDATION
	Then('I expect the url to be {browserUrl}', { timeout: 30 * 1000 }, function (url, callback) {
		browser.getCurrentUrl().then(function (browserUrl) {
			expect(url).toEqual('http://tomcat.timesheet.servoy-cloud.eu/solutions/servoyTimesheets/index.html?f=loginPage');
		});
		protractor.promise.controlFlow()
			.execute(function () { return protractor.promise.fulfilled() }, 'wait for control flow')
			.then(function () {
				wrapUp(callback, "urlValidationEvent");
			});
	})
	//END URL VALIDATION

	//DIALOG POPUP COMPONENT
	Then('default div dialog popup I want to validate that the text {dialogText} is present', { timeout: 15 * 1000 }, function (dialogText, callback) {
		element.all(by.xpath("//div[@class='modal-dialog']")).each(function (popupMenu) {
			element(by.xpath("//div[text()='" + dialogText + "']")).isPresent().then(function (isPresent) {
				if (isPresent) {
					wrapUp(callback, "validateDialogTextEvent");
				}
			})
		}).catch(function (error) {
			console.log(error.messsage);
			tierdown(true);
		});
	});

	Then('default div dialog popup I want to click the button with {buttonText} as text', { timeout: 15 * 1000 }, function (buttonText, callback) {
		element.all(by.xpath("//div[@class='modal-dialog']")).each(function (popupMenu) {
			clickElement(popupMenu.element(by.xpath("//button[text()='" + buttonText + "']"))).then(function () {
				wrapUp(callback, "clickEvent");
			});
		}).catch(function (error) {
			console.log(error.messsage);
			tierdown(true);
		});
	});
	//END DIALOG POPUP COMPONENT

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

	//SERVOY TOAST COMPONENT
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
		element(by.xpath("//div[@id='toast-container']")).element(by.xpath("//div[@class='toast toast-" + toastType + "']")).element(by.xpath("//div[@class='toast-message']")).getText().then(function (text) {
			if (text === toastMessage) {
				wrapUp(callback, "toastValidateTextEvent");
			}
		});
	});
	//END SERVOY TOAST COMPONENT

	When('default textarea component with name {elementName} the text {text} is inserted', { timeout: 60 * 1000 }, function (elementName, text, callback) {
		sendKeys(element(by.xpath("//textarea[@data-svy-name='" + elementName + "']")), text).then(function () {
			wrapUp(callback, "Insert value event");
		}).catch(function (error) {
			console.log(error.message);
			tierdown(true);
		});
	});

	When('I want to log the time it toke to do the {event} event', { timeout: 60 * 1000 }, function (event, callback) {
		var duration = calcBlockDuration(new Date());
		console.log('The ' + event + ' event toke ' + duration + ' miliseconds');
		analytics.event('Scenario 1', "Performance", event, duration).send();
		callback();
	});

	When('default textfield component with name {elementName} I want to insert {text}', { timeout: 20 * 1000 }, function (elementName, text, callback) {
		sendKeys(element(by.xpath("//input[@data-svy-name='" + elementName + "']")), text).then(function () {
			wrapUp(callback, "insertValueEvent");
		});
	});

	When('default label component with name {elementName} I expect the text to equal {labelText}', { timeout: 15 * 1000 }, function (elementName, labelText, callback) {
		element(by.xpath("//data-servoydefault-label[@data-svy-name='" + elementName + "']/div/div/span[2]")).getText().then(function (text) {
			if (labelText === text) {
				wrapUp(callback, "labelTextValidatingEvent");
			}
		});
	});

	//ENDCRYPTOGRAPHY SAMPLE GALERY FUNCTIONS//

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
	expect(input).toBe(inputToCompare);
}

function wrapUp(callback, performanceEvent) {
	var duration = calcStepDuration(new Date());
	console.log('Step toke ' + duration + ' miliseconds');
	// analytics.event('Scenario 1', "Performance", performanceEvent, duration).send();
	callback();
}

function clickElement(elem) {
	return browser.wait(EC.presenceOf(elem).call(), 30000, 'Element not visible').then(function () {
		return browser.wait(EC.elementToBeClickable(elem), 30000, 'Element not clickable').then(function () {
			return elem.click();
		});
	});
}

function sendKeys(elem, input) {
	return browser.wait(EC.visibilityOf(elem).call(), 30000, 'Element not visible').then(function () {
		return elem.clear().then(function () {
			return elem.sendKeys(input);
		});
	});
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

function findRecord(elementName, recordText, rowOption, level, callback) {
	var found = false;
	var grid = element.all(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']"));
	grid.each(function (menuItems) {
		menuItems.all(by.css(".ag-row-level-" + level + "")).each(function (row) {
			row.element(by.cssContainingText('span', recordText)).isPresent().then(function (result) {
				if (result) {
					if (rowOption == 'expand') {
						clickElement(row.element(by.css(".glyphicon.glyphicon-plus.ag-icon"))).then(function () {
							found = true;
							wrapUp(callback, "gridExpand");
						});
					} else {
						clickElement(row.element(by.css(".glyphicon.glyphicon-minus.ag-icon"))).then(function () {
							found = true;
							wrapUp(callback, "gridCollapse");
						});
					}
				}
			});
		});
	}).then(function () {
		if (!found) {
			scrollToElement(elementName, recordText, rowOption, level, callback);
		}
	});
}

function scrollToElement(elementName, recordText, rowOption, level, callback) {
	element.all(by.xpath("//data-aggrid-groupingtable[@data-svy-name='" + elementName + "']")).each(function (childElement) {
		var elem = childElement.all(by.xpath("//div[@role='row']")).last();
		browser.executeScript("arguments[0].scrollIntoView(true);", elem.getWebElement()).then(function () {
			findRecord(elementName, recordText, rowOption, level, callback);
		});
	});
}

//deletes previously used reports and files

function removeHtmlReports(htmlDirectory) {
	var files = find.fileSync(/\.html/, htmlDirectory);
	files.map(function (file) {
		fs.unlinkSync(file);
	});
}

function removeScreenshots(screenshotDirectory) {
	var files = find.fileSync(/\.png/, screenshotDirectory);
	files.map(function (file) {
		fs.unlinkSync(file);
	});
}

function createDirIfNotExists(dir) {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
}

function clearGrouping() {
	$$('.ag-column-drop-cell-button').count().then(function (limit) {
		if (limit > 0) {
			$$('.ag-column-drop-cell-button').get(limit - 1).click().then(function () {
				clearGrouping();
			});
		} else {
			return true;
		}
	});
}

function findRecordTableComponent(elementName, recordText, callback) {
	var found = false;
	element.all(by.xpath("//div[@data-svy-name='" + elementName + "']")).each(function (tableItems) {
		tableItems.all(by.xpath("//div[@class='ui-grid-row ng-scope']")).each(function (tableRows) {
			tableRows.element(by.xpath("//span[text()='" + recordText + "']")).isPresent().then(function (result) {
				if (result) {
					clickElement(tableRows.element(by.xpath("//span[text()='" + recordText + "']"))).then(function () {
						found = true;
						wrapUp(callback, "scrollEvent");
					});
				}
			});
		});
	}).then(function () {
		if (!found) {
			scrollToElementTableComponent(elementName, recordText, callback);
		}
	}).catch(function (error) {
		console.log(error.message);
		tierdown(true);
	});
}

function scrollToElementTableComponent(elementName, recordText, callback) {
	element.all(by.xpath("//div[@data-svy-name='" + elementName + "']")).each(function (childElement) {
		var elem = childElement.all(by.xpath("//div[@class='ui-grid-row ng-scope']")).last();
		browser.executeScript("arguments[0].scrollIntoView(true);", elem.getWebElement()).then(function () {
			findRecordTableComponent(elementName, recordText, callback);
		});
	});
}

// SERVOY EXTRA TABLE
function findRecordTableExtraComponent(elementName, recordText, callback) {
	var found = false;
	element.all(by.xpath("//*[@data-svy-name='" + elementName + "']")).each(function (tableItems) {
		tableItems.all(by.xpath("//td/div[text()='" + recordText + "']")).each(function (tableRows) {
			tableRows.getText().then(function (text) {
				console.log('found ' + text);
				if (text.indexOf(recordText) > -1) {
					found = true;
					// TODO click last td (to be found)
					clickElement(element(by.cssContainingText("div", recordText))).then(function () {
						console.log('clicked');
						wrapUp(callback, "Scroll event");
					});
				}
			});
		});

		// tableItems.all(by.xpath("//td/div")).each(function (tableRows) {
		// 	tableRows.getText().then(function (text) {
		// 		if (text.indexOf(recordText) > -1) {
		// 			found = true;
		// 			clickElement(element(by.cssContainingText("div", recordText))).then(function () {
		// 				wrapUp(callback, "Scroll event");
		// 			});
		// 		}
		// 	});
		// });
	}).then(function () {
		if (!found) {
			console.log('not found');
			scrollToElementTableExtraComponent(elementName, recordText, callback);
		}
	});
}

// SERVOY AG TABLE
function scrollToElementTableExtraComponent(elementName, recordText, callback) {
	element.all(by.xpath("//*[@data-svy-name='" + elementName + "']")).each(function (childElement) {
		var elem = childElement.all(by.xpath("//tr")).last();
		browser.executeScript("arguments[0].scrollIntoView(true);", elem.getWebElement()).then(function () {
			findRecordTableExtraComponent(elementName, recordText, callback);
		});
	});
}

function findRecordAgTableComponent(elementName, recordText, callback) {
	var found = false;
	element.all(by.xpath("//*[@data-svy-name='" + elementName + "']")).each(function (tableItems) {
		tableItems.all(by.xpath("//div[text()='" + recordText + "']")).each(function (tableRows) {
			tableRows.getText().then(function (text) {
				console.log('AG found ' + text);
				if (text.indexOf(recordText) > -1) {
					found = true;
					// TODO click last td (to be found)
					clickElement(element(by.cssContainingText("div", recordText))).then(function () {
						console.log('clicked');
						wrapUp(callback, "Scroll event");
					});
				}
			});
		});
	}).then(function () {
		if (!found) {
			console.log('ag not found');
			scrollToElementAgTableComponent(elementName, recordText, callback);
		}
	});
}

function scrollToElementAgTableComponent(elementName, recordText, callback) {
	element.all(by.xpath("//*[@data-svy-name='" + elementName + "']")).each(function (childElement) {
		var elem = childElement.all(by.css(".ag-row")).get(-3);
		browser.executeScript("arguments[0].scrollIntoView(true);", elem.getWebElement()).then(function () {
			findRecordAgTableComponent(elementName, recordText, callback);
		});
	});
}
