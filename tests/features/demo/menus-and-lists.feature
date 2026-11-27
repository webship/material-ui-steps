Feature: Drop-down menus, select lists and search lists
  A menu named by the button that opens it; a select list whose options grow in and fade out after a choice; a search
  list the person types in and chooses from.

  Scenario: A drop-down menu: opened, read, an item chosen, closed
    Given I go to "/components"
    When I open the "Dashboard" drop-down menu
    Then the "Dashboard" drop-down menu should show "My account"
    And "Logout" should not be disabled in the "Dashboard" drop-down menu
    When I choose "My account" from the "Dashboard" drop-down menu
    Then the "Dashboard" drop-down menu should not be shown

  Scenario: A drop-down menu closed with Escape, then chosen from while closed
    Given I go to "/components"
    When I open the "Dashboard" drop-down menu
    And I press Escape in the "Dashboard" drop-down menu
    Then no drop-down menu should be shown
    When I choose "Profile" from the "Dashboard" drop-down menu
    Then no drop-down menu should be shown

  Scenario: A select list: an option chosen, then the next one at once
    Given I go to "/components"
    And the "Age" select list should offer "Thirty"
    And the "Age" select list should not offer "Forty"
    When I choose "Twenty" in the "Age" select list
    Then the "Age" select list should show "Twenty"
    When I choose "Thirty" in the "Age" select list
    Then the "Age" select list should show "Thirty"

  Scenario: A search list: typed in, its options, a choice
    Given I go to "/components"
    When I fill in "Movie" with "Godf"
    Then the "Movie" search list should offer "The Godfather: Part II"
    And the "Movie" search list should not offer "Pulp Fiction"
    When I type "God" in the "Movie" search list and choose "The Godfather"
    Then the "Movie" search list should show "The Godfather"

  Scenario: The dashboard template's select list of companies
    Given I go to "/dashboard"
    When I choose "Sitemark-Store" in the "Select company" select list
    Then the "Select company" select list should show "Sitemark-Store"
