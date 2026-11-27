# Each scenario fails at its last step by design. They change nothing outside the browser of the scenario.
@must-fail
Feature: react-admin's demo, asserted wrong
  Each scenario asserts something about react-admin's e-commerce demo that is not true, at its last step.

  Background:
    Given I go to "/#/login"
    When I fill in "username" with "demo"
    And I fill in "password" with "demo"
    And I press "Sign in"
    Then I should see "Welcome to the react-admin e-commerce demo"

  Scenario: A row count the page of the table does not have
    Fails with: Expected the table to show 30 row(s), but it shows 25.
    When I go to "/#/customers"
    Then the "Customers" table should show 30 rows

  Scenario: A sort the table does not have
    Fails with: Expected the table to be sorted by "Name" ascending, but its sort is none.
    When I go to "/#/customers"
    Then the "Customers" table should be sorted by "Name" ascending

  Scenario: A tab that is not the selected one
    Fails with: Expected the "Details" tab to be active, but it is not.
    When I go to "/#/products/1"
    Then the "Details" tab should be active

  Scenario: A notification no save gave
    Fails with: Expected a notification "Poster deleted", but it is not in the page
    When I go to "/#/products/1"
    Then I should see a notification "Poster deleted"
