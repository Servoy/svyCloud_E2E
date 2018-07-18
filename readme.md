## End to end testing

End to end instructions to get it to work locally, which steps are currently supported + examples and explanation

Local installation guide:
# Cloning the jenkins-scripts repo
To get the tests to work locally, the jenkins-repository has to be cloned (https://source.servoy.com/projects/SC/repos/qapaas-e2e/browse). Be sure to clone the master branch.

# NodeJS installation 
After the repository has been cloned, NodeJS has to be installed (https://nodejs.org/en/). Once installed add an environmental variable. This variable has to point to the root of the NodeJS installation folder (e.g: C:\Program Files\nodejs).

Once this is done, open a command prompt or any similar application and test if NodeJS works by running the 'node --version' command. If this works, then NodeJS has successfully recognized the installation of NodeJS.

# Setup E2E environment
Navigate the command prompt to the E2E folder of the jenkins-scripts repository and type in the following commands: 'npm install'. This will install all node packages that are in the package.
After this is done, execute the following command: 'npm install -g protractor@5.1.1'. This will enable the usage of the webdriver (see next step) and starting the test from any location.

# Starting the webdriver
Start another command prompt or similar application and type in the following commands:
 - webdriver-manager update
 - webdriver-manager start

The 'update' command gets the latest drivers for the most common browsers (Firefox and Chrome)
The 'start' command starts the webdriver. The tests cannot run without the webdriver since the webdriver is a communication hatch between the protractor tests and the browser. Without it, the browser cannot receieve commands

# Writing a test
To start the test, a .feature file has to be created. An example has been put in the features folder.

# Starting the tests
Once all these steps are finished, the test can start by navigating to the E2E folder and running the command 'protractor singleConfig_chrome.config'.

# Supported components
List of all currently supported steps to test servoy components and to navigate to an URL. Each step will be given one or more examples.
Each step starts with the word 'Given', 'Then' or 'When', followed by the name of the component and the data-svy-name (most of the times). 
After this part the step describes what it will do.
There are several steps which do not test a component (like navigation, pressing a button (like ENTER or TAB)), thus not requiring a data-svy-name.

NOTE
- Everything between brackets '{}' will be considered a variable. This variable can contain any text but must not be surrounded by quotes or double quotes
- Supported browsers: Chrome / Firefox (partially)
- Most step have a variable called 'elementName'. This variable is the data-svy-name of the component. The data-svy-name is only visible if the solution is deployed with test mode enabled and is always equal to the formname.elementName.
Targetting an element by data-svy-name prevents targetting the wrong element since it is always unique.
- For now, certain tests are case sensitive, meaning, the word protractor is not equal to the word Protractor. Most tests do have partial text 
recognition meaning the word tractor will be found in the word protractor
- Including a seperate test (like a login test) into a test file is not supported
- This list is not final. Based upon new requirements, new tests will be created
- Custom components are currently not supported
- In certain situations, the data-svy-name of a component is not required. This happens (among others) when clicking on an element inside a  combobox or typeahead component. If either of these components is selected, a container with a specific class is created. The tests use these containers to find the correct item. Once the test no longer has one of these components selected, the containers disappear. 
- If a page that contain angular, the test will crash unless the 'ignoreSynchronization' option is set to true. ignoreSynchronization is an option that allows protractor to wait for Angular promises such as timeouts of http requests. To allow protractor to test a non-angular application, change the onPrepare function of the configuration file to the following:
```
    browser.driver.executeScript(function () {
      return {
        width: window.screen.availWidth,
        height: window.screen.availHeight
      };
    }).then(function (result) {
      browser.driver.manage().window().setSize(result.width, result.height);
    }).then(function(){
      browser.ignoreSynchronization = true;
    });
```

___
**URL navigation**
___

Navigates to the given url.
```
Given I go to {URL}
```
Example:
```
Given I go to https://www.servoy.com
```

During the deployment of the application, the URL of the application gets passed as a parameter. This parameter ensures that the test will always navigate to the URL of the deployed application.
```
Given I go to the test domain
```

This step compares the current URL with the given URL
```
Then I expect the url to be {browserUrl}
```
Example:
```
Then I expect the url to be https://www.servoy.com
```


This step presses the 'back' button. Browser navigates back to the previous page
```
Then I want to navigate back
```


This step presses 'F5' and refreshes the page
```
Then I want to refresh the page
```


___
END URL navigation 
___

___
Calendar component 
___

Clicks the calendar component with the given name
```
When servoy calendar component with name {elementName} is clicked
```
Example:
```
When servoy calendar component with name contacts.dateCreated is clicked
```

Navigates through the calendar component and selects the given date
**Note**: this test will not work without clicking on the calendar component. 
```
When servoy calendar component I want to select {day} {month} {year}
```
Examples:
```
When servoy calendar component I want to select 15 june 2017
When servoy calendar component I want to select 15 August 2012
When servoy calendar component I want to select 31 july 2020
```

Clicks the given day.
**Note**: this test will not work without clicking on the calendar component. 
```
When servoy calendar component I want to select day {day}
```
Example:
When servoy calendar component I want to select day 12


___
END Calendar component
___


___
Sidenav component
___

This step clicks on a tab of the side navigation component (data-servoyextra-sidenav)
```
When servoy sidenav component with name {elementName} tab {tabName} is clicked
```
Example:
```
When servoy sidenav component with name sideNavForm.sideNavName tab Home is clicked
```

___
END Sidenav component
___

___
Generic test steps
___
This test pauses the test for x seconds
```
Then I want to sleep for {second} second(s)
```
Examples:
```
Then I want to sleep for 5 seconds
Then I want to sleep for 1 second
```


This presses a button on the keyboard (not case sensitive)
As of 12th of july 2017 , the current keys are supported:
 - ENTER
 - TAB
```
When I press {browserAction}
```
Examples:
```
When I press enter
When I press tab
```

This zooms the current browser out/in to a given percentage (only a number is required)
```
Then I want to zoom the page out to {percentage} percent
```
Examples:
```
Then I want to zoom the page out to 95 percent
Then I want to zoom the page out to 110 percent
```

Closes the community edition popup (the popup that is displayed if the user is using a free edition of Servoy)
```
Then I want to close the community edition popup
```


___
END Generic test steps 
___


___
select2tokenizer component
___
Clicks the tokenizer component
```
When servoy select2tokenizer component with name {elementName} is clicked
```
Example:
```
When servoy select2tokenizer component with name orders.tokenizerName is clicked
```


The previous step clicks on the tokenizer. This will open a container with a specific class (select2-container--open among others)
This container does not have a data-svy-name, nor is it nested in the select2tokenizer HTML. Meaning, no data-svy-name is required for this step. After that it will click on the given row.
```
When servoy select2tokenizer component record number {rowNumber} is clicked
```
Examples:
```
When servoy select2tokenizer component record number 1 is clicked
When servoy select2tokenizer component record number 9 is clicked
```


Looks inside the tokenizer container and gets the text from row X. The result gets compared with the given text
```
Then servoy select2tokenizer component record number {rowNumber} equals {recordText}
```
Example:
```
Then servoy select2tokenizer component record number 5 equals recordFiveText
```

Inserts the given text inside the component.
```
When servoy select2tokenizer component with name {elementName} the text {recordText} is inserted
```
Examples:
```
When servoy select2tokenizer component with name orders.tokenizerName the text searchText is inserted
When servoy select2tokenizer component with name orders.tokenizerName the text 123 is inserted
When servoy select2tokenizer component with name orders.tokenizerName the text abds12!@servoy.com is inserted
When servoy select2tokenizer component with name orders.tokenizerName the text This is a very long string which can also be inserted is inserted
```

___
End select2tokenizer component
___



___
Basic Servoy Table
___

Protractor works similar to humans. It can only interact with elements that are loaded in the viewport. This function scrolls the table until it has found a record with the give text. This will always be the first record that matches the String. 
Note: this test is case sensitive
```
When servoy table component with name {elementName} I scroll to the record with {text} as text
```
Example:
```
When servoy table component with name customers.customerTable I scroll to the record with Protractor test as text
```


This step does the same as the previous step, minus the scrolling.
**Note**: this test is case sensitive
```
When servoy table component with name {elementName} I want to validate that a record with the text {text} exists
```
Example:
```
When servoy table component with name customers.customerTable I want to validate that a record with the text Protractor test exists
```


This step requires 2x a data-svy-name. This is because the basic Servoy table uses components. This test clicks on the component with the given name inside the table
Components inside the table component have a longer name than other components. 
```
When servoy table component with name {tableName} I want to select element number {number} with name {elementName}
```
Example:
```
When servoy table component with name customers.customerTable I want to select element number 5 with name customers.svy_lvp_customers.customerName
```


Sometimes a table is too wide to be fully viewed in the viewport. This test scrolls horizontally until the header can be seen.
```
When servoy table component with name {elementName} I want to scroll the table to the right to an element with the name {headerElementName}
```
Example:
```
When servoy table component with name customers.customerTable I want to scroll the table to the right to an element with the name customers.dateCreation
```

___
End Basic Servoy Table
___

___
Servoy extra Table
___
Scrolls to the first element with the given text inside the table 
Note: this test is case sensitive
```
When servoy extra table component with name {elementName} I scroll to the record with {string} as text
```
Examples:
```
When servoy extra table component with name companies.companyTable I scroll to the record with Pete as text
When servoy extra table component with name companies.companyTable I scroll to the record with this is a sentence as text
```


Selects the given row inside the table that is currently visible. Trying to target a row outside of the viewport will trigger an out of bounce error
```
When servoy extra table component with name {elementName} I want to select row number {rowNumber}
```
Example:
```
When servoy extra table component with name companies.companyTable I want to select row number 5
```

Validates that a record with the given that is currently in the viewport of the extra table exists
```
When servoy extra table component with name {elementName} I want to validate that a record with the text {text} exists
```
Example:
```
When servoy extra table component with name companies.companyTable I want to validate that a record with the text testText exists
```

Counts the rows of the extra table that are currently visible in the viewport
```
When servoy extra table component with name {elementName} I want to validate that there are {rowCount} row(s)
```
Examples:
```
When servoy extra table component with name companies.companyTable I want to validate that there are 2 rows
When servoy extra table component with name companies.companyTable I want to validate that there is 2 row
```

Scrolls to a record with the given text within the table
**Note**: this test is case sensitive
```
When servoy extra table component with name {elementName} I want to scroll and select the row with text {rowText}
```
Example:
```
When servoy extra table component with name companies.companyTable I want to scroll and select the row with text Servoy BV
```


Since it's possible to add style class dataproviders to table columns, this test has been made to be able to look for a column with the given text and select the column with the given class on the same row. This is especially useful in tables which have a button that goes to the detail page. 
**Note**: only 1 class can be passed in this test
```
When servoy extra table component with name {elementName} I want to click on the icon with the class {className} on the row with the text {text}
```
Example
```
When servoy extra table component with name companies.companyTable I want to click on the icon with the class fa-arrow-right on the row with the text Servoy BV
```


Clicks on one of the headers of the extra table with the given text 
**Note**: this test is case sensitive
```
When servoy extra table component with name {elementName} I want to sort the table by {tableHeader}
```
Example:
```
When servoy extra table component with name companies.companyTable I want to sort the table by ID
```


___
End Servoy extra Table
___

___
Typeahead component
___

Clicks on the typeahead component
```
When servoy default typeahead component with name {elementName} is clicked
```
Example:
```
When servoy default typeahead component with name companies.companyType is clicked
```


Inserts the given text in the typeahead component 
```
When servoy default typeahead component with name {elementName} the text {text} is inserted
```
Example:
```
When servoy default typeahead component with name books.typeaheadName the text bookName is inserted
```


Looks inside the container of the typeahead, selects the row and compares the text with the given text
Note: this test is NOT case sensitive
```
When servoy default typeahead component I want row {rowNumber} to equal {text}
```
Example:
```
When servoy default typeahead component I want row fruits.typeaheadName to equal apple
```


Selects the given row inside the typeahead component
```
When servoy default typeahead component I want to select row number {rowNumber}
```
Example:
```
When servoy default typeahead component I want to select row number 10
```

Validates the value of the typeahead component
```
Then servoy default typeahead component with name {elementName} I want to validate that the typeahead equals the text {text}
```
Example:
```
Then servoy default typeahead with name companies.companyType I want to validate that the typeahead equals the text ISV
```

___
End typeahead component
___

___
Input fields
___

Inserts the given text in a basic text field component
```
When servoy default input component with name {elementName} the text {input} is inserted
```
Example:
```
When servoy default input component with name fruits.textfieldName the text grape is inserted
```


Clears the textfield of all input
```
When servoy default input component with name {elementName} I want to clear the text field
```
Example:
```
When servoy default input component with name fruits.textfieldName I want to clear the text field
```


Gets the text of the input field with the given name and compares the result with the given text
Note: this test is NOT case sensitive
```
Then servoy default input component with name {elementName} I want to validate that the input field equals the text {text}
```
Example:
```
Then servoy default input component with name fruits.textfieldName I want to validate that the input field equals the text grape
```


Changes the state of the checkbox to be either checked or unchecked
**Note**: {checkboxState} can only be replaced by the word 'checked' or 'unchecked'. Not case sensitive
```
When servoy data-servoydefault-check component with name {elementName} I want it to be {checkboxOption}
```
Examples:
```
When servoy data-servoydefault-check component with name fruits.isAFruit I want it to be checked
When servoy data-servoydefault-check component with name fruits.isAFruit I want it to be unchecked
```

Checks whether the state of the checkbox equals the input
Note: {checkboxState} can only be replaced by the word 'checked' or 'unchecked'. Not case sensitive
```
When servoy data-servoydefault-check component with name {elementName} I want to validate that the checkbox is {checkBoxState}
```
Examples:
```
When servoy data-servoydefault-check component with name orders.isValidated I want to validate that the checkbox is checked
When servoy data-servoydefault-check component with name orders.isValidated I want to validate that the checkbox is unchecked
```


Inserts the given text into the password input component
```
When servoy data-servoydefault-password component with name {elementName} the text {password} is inserted
```
Example:
```
When servoy data-servoydefault-password component with name login.passwordField the text mySecretPassword is inserted
```

Clicks on the combobox with the given name
```
When servoy combobox component with name {elementName} is clicked
```
Example:
```
When servoy combobox component with name fruits.fruitList is clicked
```


Looks inside the combobox container and selects item number x
```
- Then servoy combobox component I want to select number {comboboxNumber} in the combobox
```
Example:
```
Then servoy combobox component I want to select number 5 in the combobox
```

Selects an item in the combobox by text
```
Then servoy combobox component I want to select the combobox item with the text {text}
```
Example:
```
Then servoy combobox component I want to select the combobox item with the text grapes
```


Validates that the combobox with the given name has the item with the given text selected
Note: this test is case sensitive
```
When servoy combobox component with name {elementName} I want to validate that the combobox item with text {text} is selected
```
Example:
```
When servoy combobox component with name companies.companyCountry I want to validate that the combobox item with text The Netherlands is selected
```


Important to know is that the combobox first has to be clicked. The input field only appears once the combobox is selected.
When servoy combobox component the text banana is inserted
**Note**: this step will change. Use the 2 following steps to achieve the same result:
```
When servoy combobox component the text {text} is inserted
```
Examples:
```
When servoy combobox component with name {elementName} is clicked
Then servoy combobox component I want to select the combobox item with the text {text}
```


Default button click
```
When servoy button component with name {elementName} is clicked
```
Example:
```
When servoy button component with name orders.confirmOrder is clicked
```


Inserts the given text in the textarea component
```
When default textarea component with name {elementName} the text {text} is inserted
```
Example:
```
When default textarea component with name products.productDescription the text this is a product description is inserted
```


Validates that the value of the textarea component equals the given text
```
Then default textarea component with name {elementName} I want to validate that the input field equals the text {text}
```
Example:
```
Then default textarea component with name products.productDescription I want to validate that the input field equals the text this is a product description
```


Sometimes the value of an input changes after loading data. This can mess up the test since protractor returns the value before it is changed. This test will wait for the value of the input field to equal the give text
```
Then servoy default input component with name {elementName} I want to wait until the value equals {newValue}
```
Example:
```
Then servoy default input component with name orders.orderTotal I want to wait until the value equals 500.000
```


___
End Input fields
___

___ 
Label fields
___
Clicks on a default label with the given name
```
When servoy data-servoydefault-label component with name {elementName} is clicked
```
Example:
```
When servoy data-servoydefault-label component with name orders.infoDialog is clicked
```


Gets the text of the default label and compares it with the given text
```
Then servoy data-servoydefault-label component with name {elementName} I want to validate that the label equals the text {text}
```
Examples:
```
Then servoy data-servoydefault-label component with name orders.totalPrice I want to validate that the label equals the text 40.000
Then servoy data-servoydefault-label component with name orders.totalPrice I want to validate that the label equals the text $500
```


___
End label fields
___

___
Bootstrap components
___
Inserts the given text inside the bootstrap textbox component with the given name 
```
When bootstrap data-bootstrapcomponents-textbox component with name {elementName} the text {text} is inserted
```
Example:
```
When bootstrap data-bootstrapcomponents-textbox component with name contacts.firstName the text Protractor is inserted
```


Clicks the bootstrap button component with the given name 
```
When bootstrap data-bootstrapcomponents-button component with name {elementName} is clicked
```
Example:
```
When bootstrap data-bootstrapcomponents-button component with name orders.confirmOrder is clicked
```


Clicks the bootstrap select component with the given name
```
When bootstrap data-bootstrapcomponents-select component with name {elementName} is clicked
```
Example:
```
When bootstrap data-bootstrapcomponents-select component with name addresses.countries is clicked
```

Selects the row with the given text in the select component with the given name
```
When bootstrap data-bootstrapcomponents-select component with name {elementName} I want to select the row with {text} as text
```
Example:
```
When bootstrap data-bootstrapcomponents-select component with name countries.countries I want to select the row with Canada as text
```


Selects the given row in the select component with the given name
```
When bootstrap data-bootstrapcomponents-select component with name {elementName} I want to select row number {rowNumber}
```
Example:
```
When bootstrap data-bootstrapcomponents-select component with name countries.countries I want to select row number 5
```


Inserts the given text into the bootstrap select component with the given name
```
When bootstrap data-bootstrapcomponents-select component with name {elementName} I want to insert {text}
```
Example:
```
When bootstrap data-bootstrapcomponents-select component with name orders.orderType I want to insert Financial
```


Inserts the given text into the bootstrap textarea component with the given name
```
When bootstrap data-bootstrapcomponents-textarea component with name {elementName} the text {text} is inserted
```
Example:
```
When bootstrap data-bootstrapcomponents-textarea component with name orders.description the text order description is inserted
```

Changes the state of the checkbox to be either checked or unchecked
**Note**: {checkboxState} can only be replaced by the word 'checked' or 'unchecked'. Not case sensitive
```
When bootstrap data-bootstrapcomponents-checkbox component with name {elementName} I want it to be {checkboxState}
```
Example:
```
When bootstrap data-bootstrapcomponents-checkbox component with name fruits.isAFruit I want it to be unchecked
```


Clicks on the bootstrap data-bootstrapextracomponents-badge component with the given name
```
When bootstrap data-bootstrapextracomponents-badge component with name {elementName} is clicked
```
Example:
```
When bootstrap data-bootstrapextracomponents-badge component with name orders.badgeName is clicked
```

___
End Bootstrap components
___


___
Aggrid table component
___

**Important note**: scrolling through an aggrid table does not work while the table is grouped

Scrolls the table to a record with the given text
```
When servoy data-aggrid-groupingtable component with name {elementName} I scroll to the record with {string} as text
```
Examples:
```
When servoy data-aggrid-groupingtable component with name companies.companyTable I scroll to the record with Servoy as text
When servoy data-aggrid-groupingtable component with name companies.companyTable I scroll to the record with Servoy BV as text
```


Since the grouping table can be grouping, this test searches for a row in the table that matches the given text. After that it will either expand or collapse the row. Row levels are required to expand/collapse the correct row level (1 indexed)
Note: the table first has to be grouped before this test works. rowOption has to be replaced by either 'collapse' or 'expand'
```
When servoy data-aggrid-groupingtable component with name {elementName} I want to {rowOption} row level {rowLevel} with {rowText} as text
```
Examples:
```
When servoy data-aggrid-groupingtable component with name companies.groupingTable I want to expand row level 1 with ISV as text
When servoy data-aggrid-groupingtable component with name companies.groupingTable I want to collapse row level 3 with ISV as text
```

Sorts the grouping grid by a header with the given text
**Note**: this test is NOT case sensitive
```
When servoy data-aggrid-groupingtable component with name {elementName} I want to sort the table by {sortBy}
```
Example: 
```
When servoy data-aggrid-groupingtable component with name companies.groupingTable I want to sort the table by Company Name
```


Groups the grouping table by the given text
Note: this test is case sensitive
```
When servoy data-aggrid-groupingtable component with name {elementName} I want to group the table by {tableHeaderText}
```
Example:
```
When servoy data-aggrid-groupingtable component with name customers.groupingTable I want to group the table by manager
```


Ungroups the grouping table by the given text
**Note**: this test is case sensitive
```
When servoy data-aggrid-groupingtable component with name {elementName} I want to ungroup the table by {tableHeaderText}
```
Example:
```
When servoy data-aggrid-groupingtable component with name customers.groupingTable I want to ungroup the table by manager
```

Changes the order in which way the grouping table is grouped. This drags the given grouped header with the given and moves it as the main grouping header
**Note**: on the currently released version (12th of july 2018), this step does not work yet
```
When servoy data-aggrid-groupingtable component with name {elementName} I want to drag the grouping item with {groupingText} as text to the start
```
Example:
```
When servoy data-aggrid-groupingtable component with name companies.groupingTable I want to drag the grouping item with State as text to the start
```

Scrolls the grouping table back to the top
```
When servoy data-aggrid-groupingtable component with name {elementName} I want to scroll to the top
```
Example:
```
When servoy data-aggrid-groupingtable component with name companies.groupingTable I want to scroll to the top
```

Selects the nth row of the table currently visible in the viewport
```
When servoy data-aggrid-groupingtable component with name {elementName} I want to select row number {rowNumber}
```
Example: 
```
When servoy data-aggrid-groupingtable component with name companies.groupingTable I want to select row number 5
```


Selects the row with the given text in the table currently visible in the viewport
**Note**: this test is case sensitive
```
When servoy data-aggrid-groupingtable component with name {elementName} I want to select the record with the text {text}
```
Example: 
```
When servoy data-aggrid-groupingtable component with name fruits.groupingTable I want to select the record with the text apple
```

Validates that a record with the given text exists within the viewport, within the table. 
**Note**: this test is case sensitive
```
When servoy data-aggrid-groupingtable component with name {elementName} I want to validate that a record with the text {text} exists
```
Example: 
```
When servoy data-aggrid-groupingtable component with name contacts.groupingTable I want to validate that a record with the text Pete exists
```

Finds a record in the table that matches the given text and clicks it
```
When servoy data-aggrid-groupingtable component with name {elementName} I want to scroll and select the row with the text {rowText}
```
Example: 
```
When servoy data-aggrid-groupingtable component with name companies.groupingTable I want to scroll and select the row with the text Servoy BV
```

Finds a record in the grouping table that matches the given text
```
When servoy data-aggrid-groupingtable component with name {elementName} I want to scroll to the row with text {rowText}
```
Example:
```
When servoy data-aggrid-groupingtable component with name companies.groupingTable I want to scroll to the row with text Servoy BV
```

Finds a record in the grouping table that matches the given text and clicks on the class with the given class name which is located on the same row
```
When servoy data-aggrid-groupingtable component with name {elementName} I want to scroll and select the row with text {rowText} and click the element which contains the class {className}
```
Example: 
```
When servoy data-aggrid-groupingtable component with name companies.groupingTable I want to scroll and select the row with text Servoy BV and click the element which contains the class fa-times
```

Finds a record in the grouping table that matches the given text and clicks on the class with the given class name which is located on the same row. This will not scroll the grid!
```
When servoy data-aggrid-groupingtable component with name {elementName} I want to click on the element which contains the class {className} on the row with the text {text}
```
Example:
```
When servoy data-aggrid-groupingtable component with name companies.groupingTable I want to click on the element which contains the class fa-times on the row with the text Servoy
```

Clicks on the given class of the given row in the grouping table 
```
When servoy data-aggrid-groupingtable component with name {elementName} I want to click on the element which contains the class {className} in row number {rowNumber}
```
Example:
```
When servoy data-aggrid-groupingtable component with name companies.groupingTable I want to click on the element which contains the class fa-arrow-right in row number 12
```

Validates that the grouping table consists of x rows. Do note that it only counts the rows currently visible in the viewport.
```
- Then servoy data-aggrid-groupingtable component with name {elementName} I want to validate that there are/is {rowNumber} row(s)
```
Examples:
```
Then servoy data-aggrid-groupingtable component with name {elementName} I want to validate that there are 3 rows
Then servoy data-aggrid-groupingtable component with name {elementName} I want to validate that there is 1 row
```
___
End Aggrid table component
___

___
Toast component
___
The toast tests are NOT case sensitive
Validates that there is a toast with the given type present
{toastType} should be replaced by one of the following in the tests:
 - info
 - success
 - warning
 - error

```
Then default toast component I want to validate that there is a(n) {toastType} toast present
```
Examples: 
```
Then default toast component I want to validate that there is an info  toast present
Then default toast component I want to validate that there is a warning toast present
Then default toast component I want to validate that there is an info toast present
Then default toast component I want to validate that there is an error toast present
```

Validates that the toast component with the given type its text equals the given text
```
Then default toast component I want to validate that the text of the {toastType} toast equals {toastMessage}
```
Example:
```
Then default toast component I want to validate that the text of the info toast equals This is an info message
```

___
End toast component
___


___
Modal-dialog component
___

Presses the modal-dialog button with the given text 
Note: this test is case sensitive
```
When default modal-dialog component the button with the text {text} is pressed
```
Examples:
```
When default modal-dialog component the button with the text Yes is pressed
When default modal-dialog component the button with the text Cancel is pressed
```



Certain dialogs cover the rest of the application with a gray overlay. If the test tries to interact with any component while this is active, an error will be given. To prevent such errors from happening, this test will wait until the overlay is gone. Example:
```
When default modal-dialog I want to wait untill the modal-dialog view is gone
```


Validation that the modal-dialog has an element with the given text.
Note: no exact text is required. Meaning the text 'delete' will match the text 'delete this order'
```
Then default modal-dialog component I want to validate that the text {dialogText} is present
```
Example:
```
Then default modal-dialog component I want to validate that the text Do you want to delete this order? is present
```


If the text of the dialog popup is dynamic, this is a good replacement. Browser expects that a dialog appears. Example:
```
Then I expect a monal-dialog popup to appear
```

___
End modal-dialog component
___

___
Window component
___

This involves the 'application.createWindow(...) component 
Waits until the window component has disappeared. Example:
```
When servoy window component I want to wait untill the window disappears
```

___
End window component
___

___
Tabpanel component
___
Clicks the tab with the given text in the tabpanel component
**Note**: this text is case sensitive. Partial match works
```
When servoy data-servoydefault-tabpanel component with name {elementName} the tab with the text {text} is clicked
```
Example:
```
When servoy data-servoydefault-tabpanel component with name tabpanels.tabpanelName the tab with the text Orders is clicked
```

Clicks the tab with the exact text in the tabpanel component
Note: this text is case sensitive. This test expects an exact match with the tab its text
```
When servoy data-servoydefault-tabpanel component with name {elementName} the tab with the exact text {text} is clicked
```
Example:
```
When servoy data-servoydefault-tabpanel component with name tabpanels.tabpanelName the tab with the text Orders is clicked
```

___
End tabpanel component
___

___
HTML view component
___
Validates that the given text partialy (or exact) matches the value of the HTML view component
```
Then servoy htmlview component with name {elementName} I want to validate that the htmlview contains the text {text}
```
Example:
```
Then servoy htmlview component with name orders.htmlView I want to validate that the htmlview contains the text 5 licenses
```
___
End HTML view component
___