Feature: Side panels
  A temporary drawer, Material UI's modal side panel: opened with its button, given a name by the scenario (it has none
  of its own), closed with Escape, a click outside, or one of its items.

  Scenario: A side panel opened with its button, closed with Escape
    Given I go to "/components"
    When I open the "Mailboxes" side panel with the "Open drawer" button
    Then the "Mailboxes" side panel should be shown
    And the "Mailboxes" side panel should show "Starred"
    When I press Escape in the "Mailboxes" side panel
    Then the "Mailboxes" side panel should not be shown

  Scenario: A side panel closed with a click outside it, then with one of its items
    Given I go to "/components"
    When I open the "Mailboxes" side panel with the "Open drawer" button
    And I click outside the "Mailboxes" side panel
    Then no side panel should be shown
    When I open the "Mailboxes" side panel with the "Open drawer" button
    And I press "Inbox" in the "Mailboxes" side panel
    Then no side panel should be shown
