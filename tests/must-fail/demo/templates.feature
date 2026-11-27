# Each scenario fails at its last step by design. They change nothing outside the browser of the scenario.
@must-fail
Feature: The templates of the demo, asserted wrong
  Each scenario asserts something about a template of the demo that is not true, at its last step.

  Scenario: A field the form has not marked
    Fails with: Expected the "Email" field to be shown as invalid, but it is valid.
    Given I go to "/sign-in"
    Then the "Email" field should be shown as invalid

  Scenario: A step that is not the current one
    Fails with: Expected the "Payment details" step to be the current one, but it is not.
    Given I go to "/checkout"
    Then the "Payment details" step should be the current one

  Scenario: An item the collapsed tree does not show
    Fails with: Expected the tree to show "Announcements", but it does not.
    Given I go to "/dashboard"
    Then the tree should show "Announcements"

  # Below 900 px wide: see the dialogs feature.
  Scenario: A row count the table does not have
    Fails with: Expected the table to show 4 row(s), but it shows 3.
    Given I go to "/"
    And local storage is cleared
    And I set the viewport width to 899
    And I go to "/crud-dashboard"
    Then the "Employees" table should show 4 rows

  Scenario: A cell the row does not show
    Fails with: Expected the row "Edward Perry" to show "Market", but it does not.
    Given I go to "/"
    And local storage is cleared
    And I set the viewport width to 899
    And I go to "/crud-dashboard"
    Then the row "Edward Perry" of the "Employees" table should show "Market"
