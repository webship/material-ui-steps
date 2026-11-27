# Each scenario fails at its last step by design. They change nothing outside the browser of the scenario.
@must-fail
Feature: The components of the demo, asserted wrong
  Each scenario asserts something about a component of the demo that is not true, at its last step.

  Scenario: A dialog that is not open
    Fails with: Expected the "Use Google's location service?" dialog to be shown, but it is not in the page
    Given I go to "/components"
    Then the "Use Google's location service?" dialog should be shown

  Scenario: A dialog that stays open
    Fails with: Expected the "Use Google's location service?" dialog to be closed, but it is shown
    Given I go to "/components"
    When I open the "Use Google's location service?" dialog with the "Open alert dialog" button
    Then the "Use Google's location service?" dialog should not be shown

  Scenario: A text the dialog does not show
    Fails with: Expected the "Use Google's location service?" dialog to show "Let Microsoft help", but it does not.
    Given I go to "/components"
    When I open the "Use Google's location service?" dialog with the "Open alert dialog" button
    Then the "Use Google's location service?" dialog should show "Let Microsoft help"

  Scenario: A button the dialog does not have
    Fails with: Expected the "Use Google's location service?" dialog to have a button or a link named "Maybe", but it has none.
    Given I go to "/components"
    When I open the "Use Google's location service?" dialog with the "Open alert dialog" button
    And I press "Maybe" in the "Use Google's location service?" dialog

  Scenario: An item the side panel does not show
    Fails with: Expected the "Mailboxes" side panel to show "Archive", but it does not.
    Given I go to "/components"
    When I open the "Mailboxes" side panel with the "Open drawer" button
    Then the "Mailboxes" side panel should show "Archive"

  Scenario: An item the drop-down menu does not have
    Fails with: Expected the "Dashboard" drop-down menu to have an item "Settings", but it has none.
    Given I go to "/components"
    When I choose "Settings" from the "Dashboard" drop-down menu

  Scenario: An option the select list does not offer
    Fails with: Expected the "Age" select list to offer "Forty", but it offers "Ten", "Twenty", "Thirty".
    Given I go to "/components"
    When I choose "Forty" in the "Age" select list

  Scenario: An option the select list does not show
    Fails with: Expected the "Age" select list to show "Ten", but it shows ""
    Given I go to "/components"
    Then the "Age" select list should show "Ten"

  Scenario: An option the search list does not offer for what is typed
    Fails with: Expected the "Movie" search list to offer "Pulp Fiction" for "Godf"
    Given I go to "/components"
    When I type "Godf" in the "Movie" search list and choose "Pulp Fiction"

  Scenario: A panel that is collapsed
    Fails with: Expected the "Accordion 1" panel to be expanded, but it is collapsed.
    Given I go to "/components"
    Then the "Accordion 1" panel should be expanded

  Scenario: A tab that is not the selected one
    Fails with: Expected the "Item Two" tab to be active, but it is not.
    Given I go to "/components"
    Then the "Item Two" tab should be active

  Scenario: A notification of another kind
    Fails with: Expected the notification "Note archived" to be a success one, but it is of no kind.
    Given I go to "/components"
    When I press "Open Snackbar"
    Then I should see a success notification "Note archived"

  Scenario: An alert with no close button, dismissed
    Fails with: Expected the alert "This Alert uses a Button component for its action." to have a close button, but it has none: it is not dismissible.
    Given I go to "/components"
    When I dismiss the alert "This Alert uses a Button component for its action."

  Scenario: A loading spinner that stays
    Fails with: Expected the loading spinners to disappear within 30 seconds, but one is shown.
    Given I go to "/components"
    When I press "Loading"
    Then I should see a loading spinner
    When I wait for the loading spinner to disappear

  Scenario: A progress bar at another value
    Fails with: Expected the progress bar to be at 35%, but it is at 50%.
    Given I go to "/dashboard"
    Then the "Number of users by country" progress bar should be at 35%

  Scenario: A tooltip that is not shown
    Fails with: Expected the "Delete" tooltip to be shown, but it is not in the page
    Given I go to "/components"
    Then the "Delete" tooltip should be shown

  Scenario: A page the pagination is not on
    Fails with: Expected the current page of the pagination to be "2", but it is "1".
    Given I go to "/components"
    Then the current page of the pagination should be "2"

  Scenario: A breadcrumb that reads otherwise
    Fails with: Expected the breadcrumb to read "MUI > Breadcrumbs", but it reads "MUI > Core > Breadcrumbs".
    Given I go to "/components"
    Then the breadcrumb should read "MUI > Breadcrumbs"
