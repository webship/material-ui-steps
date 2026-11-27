Feature: Fields and tables
  The sign-in template's fields, marked invalid with their messages when the form is sent empty and valid once filled
  in; and the CRUD template's table (a Data Grid): its rows, a row's cells, a column sorted.

  Scenario: A form sent empty, its fields shown invalid with their messages, then filled in
    Given I go to "/sign-in"
    Then no fields should be shown as invalid
    When I press "Sign in"
    Then 2 fields should be shown as invalid
    And the "Email" field should be shown as invalid
    And the "Email" field should show the message "Please enter a valid email address."
    And the "Password" field should show the message "Password must be at least 6 characters long."
    When I fill in "Email" with "webship.test@example.com"
    And I fill in "Password" with "webship-test-password"
    And I press "Sign in"
    Then no fields should be shown as invalid
    And the "Email" field should be shown as valid

  # Below 900 px wide: see the dialogs feature.
  Scenario: A table's rows, a row's cells and a column sorted
    Given I go to "/"
    And local storage is cleared
    And I set the viewport width to 899
    And I go to "/crud-dashboard"
    Then the "Employees" table should show 3 rows
    And the "Employees" table should have a row "Josephine Drake"
    And the row "Edward Perry" of the "Employees" table should show "Finance"
    And the row "Edward Perry" of the "Employees" table should not show "Market"
    When I sort the "Employees" table by "Age" descending
    Then the "Employees" table should be sorted by "Age" descending
    When I sort the "Employees" table by "Name"
    Then the "Employees" table should be sorted by "Name" ascending
