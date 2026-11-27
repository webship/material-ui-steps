Feature: Dialogs
  Material UI's dialogs as its own documentation demo and its templates draw them: opened with their button, named by
  their title, faded in and out, answered with one of their buttons, closed with Escape or a click outside.

  Scenario: A dialog opened with its button, answered with one of its own
    Given I go to "/components"
    When I open the "Use Google's location service?" dialog with the "Open alert dialog" button
    Then the "Use Google's location service?" dialog should be shown
    And the "Use Google's location service?" dialog should show "Let Google help apps determine location."
    When I press "Agree" in the "Use Google's location service?" dialog
    Then the "Use Google's location service?" dialog should not be shown
    And no dialog should be shown

  # webship-js's own press does not wait for the dialog's fade: the next step reads it once its transitions are done.
  Scenario: A dialog opened with a press of webship-js's own, read once its transitions have finished
    Given I go to "/components"
    When I press "Open alert dialog"
    And I wait for the transitions to finish
    Then the "Use Google's location service?" dialog should be shown
    When I press "Disagree" in the "Use Google's location service?" dialog
    Then no dialog should be shown

  Scenario: A dialog closed with Escape, then with a click outside it
    Given I go to "/components"
    When I open the "Use Google's location service?" dialog with the "Open alert dialog" button
    And I press Escape in the "Use Google's location service?" dialog
    Then the "Use Google's location service?" dialog should not be shown
    When I open the "Use Google's location service?" dialog with the "Open alert dialog" button
    And I click outside the "Use Google's location service?" dialog
    Then no dialog should be shown

  Scenario: The sign-in template's dialog, opened by a link-styled button, its field focused, closed with its own button
    Given I go to "/sign-in"
    When I open the "Reset password" dialog with the "Forgot your password?" button
    Then the "Reset password" dialog should show "Enter your account's email address"
    When I press "Cancel" in the "Reset password" dialog
    Then the "Reset password" dialog should not be shown

  # The CRUD template is used below 900 px wide: at 900 px and wider its phone's side panel is open but not displayed,
  # and, as a modal, it hides the whole app from assistive technology (see Findings in the README).
  Scenario: A question the CRUD template asks before it deletes, its answer, and what the app says after
    Given I go to "/"
    And local storage is cleared
    And I set the viewport width to 899
    And I go to "/crud-dashboard"
    Then the "Employees" table should show 3 rows
    When I press "Delete" in the row "Edward Perry" of the "Employees" table
    Then the "Delete employee?" dialog should show "Do you wish to delete Edward Perry?"
    When I press "Delete" in the "Delete employee?" dialog
    Then the "Delete employee?" dialog should not be shown
    And I should see a success notification "Employee deleted successfully."
    And the "Employees" table should show 2 rows
    And the "Employees" table should not have a row "Edward Perry"
    And the "Employee deleted successfully." notification should hide by itself
    And local storage is cleared
