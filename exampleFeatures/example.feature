Feature: Testing the Sample Gallery
    Scenario Outline: Doing everything!

Given I go to https://samplegallery-dev.demo.servoy-cloud.eu/solutions/sampleGallery/index.html#galleryMain
When servoy sidenav component with name galleryMain.nav tab Working with Data is clicked
When servoy sidenav component with name galleryMain.nav tab Cryptography is clicked

When servoy combobox component with name exampleCrypto.algorithm is clicked
Then servoy combobox component I want to select number 1 in the combobox

When servoy data-servoydefault-check component with name exampleCrypto.useKey I want it to be checked
When servoy button component with name exampleCrypto.generateKey is clicked

When servoy sidenav component with name galleryMain.nav tab Common Components is clicked
When servoy sidenav component with name galleryMain.nav tab Field Components is clicked
When servoy sidenav component with name galleryMain.nav tab Calendar Field is clicked

When servoy calendar component with name calendarField.field1 is clicked
When servoy calendar component I want to select <dateDay> <dateMonth> <dateYear>
Then I want to sleep for 5 seconds

When servoy sidenav component with name galleryMain.nav tab Password is clicked
When servoy data-servoydefault-password component with name passwordField.fldDefault the text <password> is inserted
When I press enter
Then servoy default input component with name passwordField.fldDataValue1 I want to validate that the input field equals the text <password>
Then servoy default input component with name passwordField.fldDataValue2 I want to validate that the input field equals the text <password>
Then I want to sleep for 5 seconds

@data_table_servoy
Examples:
|password          | customer           | dateYear | dateMonth      | dateDay |
|my secret password| LILA-Supermercado  | 2003     | june           | 19      |