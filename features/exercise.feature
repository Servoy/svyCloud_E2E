Feature: Testing the Sample Gallery
    Scenario Outline: Doing everything!

Given I go to {url}
When servoy sidenav component with name {elementName} tab {tabText} is clicked
When servoy sidenav component with name {elementName} tab {tabText} is clicked
When servoy combobox component with name {elementName} is clicked
Then servoy combobox component I want to select number {comboboxNumber} in the combobox

@data_table_servoy
Examples:
||
||