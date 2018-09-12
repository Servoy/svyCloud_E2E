Feature: Testing the Sample Gallery
    Scenario Outline: Doing everything!

Given I go to {url}
When servoy sidenav component with name {elementName} tab {text} is clicked
When servoy sidenav component with name {elementName} tab {text} is clicked
When servoy sidenav component with name {elementName} tab {text} is clicked
When servoy default input component with name {elementName} the text {text} is inserted

@data_table_servoy
Examples:
||
||