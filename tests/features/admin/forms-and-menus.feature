Feature: A real app on Material UI 7: the forms and menus of react-admin's e-commerce demo
  react-admin's "Posters Galore" demo, built on Material UI 7, with its own fake API in the browser: its tables (an HTML
  Table with sort labels and a pagination), the tabs of a poster's form, the notification after a save, and its user
  menu. The data is made up at each load of the app, so the scenarios read what does not change: the names of things.

  Background:
    Given I go to "/#/login"
    When I fill in "username" with "demo"
    And I fill in "password" with "demo"
    And I press "Sign in"
    Then I should see "Welcome to the react-admin e-commerce demo"

  Scenario: The tabs of a poster's form, and the notification after a save
    When I go to "/#/products/1"
    Then the "Image" tab should be active
    When I switch to the "Description" tab
    Then the "Description" tab should be active
    And the "Image" tab should not be active
    When I switch to the "Details" tab
    Then the "Details" tab should be active
    And the "Details" tab should show "Price"
    When I fill in "stock" with "12"
    And I press "Save"
    Then I should see a notification "Poster updated"
    And the "Poster updated" notification should show "UNDO"
    And the "Poster updated" notification should hide by itself

  Scenario: The user menu, which has no name of its own: opened with its button, then its item chosen
    When I open the "User" drop-down menu with the "Profile" button
    Then the "User" drop-down menu should show "Logout"
    When I choose "Logout" from the "User" drop-down menu
    Then I should see "Sign in"
