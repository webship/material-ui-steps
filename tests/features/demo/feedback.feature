Feature: Notifications, alerts, progress, badges, pagination and breadcrumbs
  A notification at the edge of the window that hides by itself, alerts that can be dismissed, a spinner while a load
  is simulated, progress bars, a tooltip, a badge, a pagination and a breadcrumb trail.

  Scenario: A notification shown, answered, and one that hides by itself
    Given I go to "/components"
    When I press "Open Snackbar"
    Then I should see a notification "Note archived"
    And the "Note archived" notification should show "UNDO"
    When I close the "Note archived" notification
    Then no notification should be shown
    When I press "Open Snackbar"
    Then the "Note archived" notification should hide by itself

  Scenario: Alerts: one dismissible, one with an action of its own
    Given I go to "/components"
    Then I should see the warning alert "This Alert displays the default close icon."
    And the alert "This Alert displays the default close icon." should be dismissible
    And the alert "This Alert uses a Button component for its action." should not be dismissible
    When I dismiss the alert "Click the close icon to see the Collapse transition in action!"
    Then I should not see an alert "Click the close icon to see the Collapse transition in action!"

  Scenario: A spinner while a load is simulated, gone once it is done; a progress bar that moves
    Given I go to "/components"
    Then I should not see a loading spinner
    When I press "Simulate a load"
    Then I should see a loading spinner
    When I wait for the loading spinner to disappear
    Then I should see "Success!"
    And the progress bar should reach 50%

  Scenario: The dashboard template's progress bars of users by country
    Given I go to "/dashboard"
    Then the "Number of users by country" progress bar should be at 50%

  Scenario: A tooltip on hover, gone once the pointer moves on
    Given I go to "/components"
    Then no tooltip should be shown
    When I hover over the "Delete" button
    Then the "Delete" tooltip should be shown
    When I hover over the "Open alert dialog" button
    Then the "Delete" tooltip should not be shown

  Scenario: A badge, a pagination and a breadcrumb trail
    Given I go to "/components"
    Then the "show 4 unread messages" button should show the badge "4"
    And the current page of the pagination should be "1"
    And the "Go to previous page" link of the pagination should be disabled
    When I press "2"
    Then the current page of the pagination should be "2"
    And the "Go to previous page" link of the pagination should not be disabled
    And the breadcrumb should read "MUI > Core > Breadcrumbs"
    And the current page of the breadcrumb should be "Breadcrumbs"
