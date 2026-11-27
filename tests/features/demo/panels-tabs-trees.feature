Feature: Panels, tabs, trees and steps
  Accordion panels that collapse by measuring their height, tabs and their content, the items of a tree, and the steps
  of a Stepper (which Material UI marks with classes only: no ARIA says the current step).

  Scenario: Panels expanded and collapsed
    Given I go to "/components"
    Then the "Accordion 1" panel should be collapsed
    When I expand the "Accordion 1" panel
    Then the "Accordion 1" panel should be expanded
    And the "Accordion 1" panel should show "Lorem ipsum dolor sit amet"
    When I collapse the "Accordion 1" panel
    Then the "Accordion 1" panel should be collapsed
    And the "Accordion 1" panel should not show "Lorem ipsum dolor sit amet"

  Scenario: The marketing template's questions
    Given I go to "/marketing-page"
    When I expand the "How do I contact customer support if I have a question or issue?" panel
    Then the "How do I contact customer support if I have a question or issue?" panel should be expanded
    And the "How do I contact customer support if I have a question or issue?" panel should show "support@email.com"

  Scenario: Tabs and their content
    Given I go to "/components"
    Then the "Item One" tab should be active
    When I switch to the "Item Two" tab
    Then the "Item Two" tab should be active
    And the "Item One" tab should not be active
    And the "Item Two" tab should show "Item Two"

  Scenario: The items of the dashboard template's tree
    Given I go to "/dashboard"
    Then the "Blog" item of the tree should be collapsed
    And the tree should not show "Announcements"
    When I expand the "Blog" item of the tree
    Then the "Blog" item of the tree should be expanded
    And the tree should show "Announcements"

  Scenario: The steps of the checkout template
    Given I go to "/checkout"
    Then the "Shipping address" step should be the current one
    And the "Shipping address" step should not be done
    When I press "Next"
    Then the "Payment details" step should be the current one
    And the "Shipping address" step should be done
    And the "Review your order" step should not be done
