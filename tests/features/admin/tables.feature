Feature: A real app on Material UI 7: the tables of react-admin's e-commerce demo
  react-admin's "Posters Galore" demo, built on Material UI 7, with its own fake API in the browser: its tables (an HTML
  Table with sort labels and a pagination), the tabs of a poster's form, the notification after a save, and its user
  menu. The data is made up at each load of the app, so the scenarios read what does not change: the names of things.

  Background:
    Given I go to "/#/login"
    When I fill in "username" with "demo"
    And I fill in "password" with "demo"
    And I press "Sign in"
    Then I should see "Welcome to the react-admin e-commerce demo"

  Scenario: A table: its rows, its pagination, a column sorted
    When I go to "/#/customers"
    Then the "Customers" table should show 25 rows
    And the current page of the pagination should be "1"
    And the "Go to previous page" link of the pagination should be disabled
    When I press "2"
    Then the current page of the pagination should be "2"
    When I sort the "Customers" table by "Name"
    Then the "Customers" table should be sorted by "Name" ascending
    When I sort the "Customers" table by "Name" descending
    Then the "Customers" table should be sorted by "Name" descending
