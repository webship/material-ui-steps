<p align="center"><img src="https://raw.githubusercontent.com/webship/material-ui-steps/2.0.x/assets/logo.svg" alt="Material UI logo" width="96"></p>

# material-ui-steps

Cucumber step definitions for sites and apps built with Material UI, the React components of MUI, for
[webship-js](https://webship.co/docs/webship-js/2.0.x), a BDD browser automation harness built on Playwright and
Cucumber-js.

Material UI draws its dialogs, side panels, menus, select lists, panels, tabs, notifications and tables in React, with
transitions of its own and portals at the end of the page. The steps work on them as a person sees them, by their roles
and their names, and wait on what the components themselves say: their state, their classes, the end of their
transitions. They never wait a fixed time, and no step phrase names the framework.

Proven on Material UI 9.6.0 (the current release), on its own starter with its free templates and documentation demos,
and on Material UI 7.3 (the previous major line), on react-admin's e-commerce demo, a real app built on it.

## Requirements

- Node.js 24 or newer.
- webship-js 2.0.19 or newer.
- A site or an app built with Material UI (`@mui/material` 7 or 9; the Data Grid steps take `@mui/x-data-grid` too).

## Install

```bash
npm install --save-dev @webship-js/material-ui-steps
```

List its step definitions in `cucumber.js`, after webship-js's own:

```js
require: [
  'node_modules/webship-js/tests/step-definitions/**/*.js',
  'node_modules/@webship-js/material-ui-steps/tests/step-definitions/**/*.js',
  'tests/step-definitions/**/*.js',
],
```

With the [Webship Workspace](https://github.com/webship/workspace) and its Material UI plugin
(`@webship.co/workspace-material-ui`), an app is a command away, with this pack in its testing setup.

## Quick start

```gherkin
Feature: Reset a password
  Scenario: The dialog asks for the address, then closes
    Given I go to "/sign-in"
    When I open the "Reset password" dialog with the "Forgot your password?" button
    Then the "Reset password" dialog should show "Enter your account's email address"
    When I press "Cancel" in the "Reset password" dialog
    Then the "Reset password" dialog should not be shown
```

```gherkin
Feature: Delete an employee
  Scenario: The app asks first, then says it is done
    Given I go to "/crud-dashboard"
    When I press "Delete" in the row "Edward Perry" of the "Employees" table
    And I press "Delete" in the "Delete employee?" dialog
    Then I should see a success notification "Employee deleted successfully."
    And the "Employees" table should not have a row "Edward Perry"
    And the "Employee deleted successfully." notification should hide by itself
```

## How the steps find things and wait

- **Names.** A component is named the way a person reads it:
  - a dialog by its title; one with no title by the start of its text;
  - a side panel by its name or a heading in it;
  - a drop-down menu by the button that opens it;
  - a notification, an alert or a tooltip by its text;
  - a field, a select list or a search list by its label;
  - a panel by its summary, and a tab by its text;
  - a table by its name or by the heading just before it, and a row by a text it shows.

  A side panel or a menu with no name of its own takes the name the scenario gives it when it opens it with a named
  button: `When I open the "User" drop-down menu with the "Profile" button`.
- **Select lists.** Material UI names a Select's combobox by its label *and* the option it shows (`aria-labelledby`
  points at both: "Age Twenty"), so the steps find it by its label alone, the asterisk of a required one aside.
- **Portals and the app's root.** Dialogs, side panels, menus, the options of a list, tooltips and notifications are
  drawn in portals at the end of the page. While a modal one is open, the app's root carries `aria-hidden="true"`: the
  rest of the page is hidden from assistive technology, so the steps look inside the open component.
- **Transitions.** Each step waits for the component's own state, then for its transitions to end, read from the browser
  (`Element.getAnimations()`, the CSS transitions Material UI starts):
  - a dialog fades in over about 225 ms and out over about 195 ms, then is removed: shown means its role, its name and
    full opacity; closed means removed;
  - a list's options grow in over about 250 ms; after a choice they fade out while the select list already shows the
    choice, so the step waits for them to be gone before the next step clicks anything;
  - a panel's collapse measures its height: expanded means `MuiCollapse-entered`, collapsed means `MuiCollapse-hidden`;
  - a notification hides after the time the app gives it: the step waits for it to be gone.
- **Steps of a Stepper.** A Stepper has no ARIA for its current step or the ones done: the steps read the classes
  Material UI gives a step's label, `Mui-active` and `Mui-completed`.
- **Sorted columns.** A column is sorted when its header says so with `aria-sort` (a Data Grid, a TableCell given its
  `sortDirection`), or, for a table that sets none, when its `TableSortLabel` is active and its icon points that way.
- **Kinds.** The kinds of a notification or an alert are the words of the other component packs: `success`, `warning`,
  `error`; `danger` is Material UI's error, and `primary` its info.

Every failure says what was expected, what was found, the page, and a hint.

## JavaScript

A Material UI app is drawn by JavaScript: without it there is nothing to test. The suite runs in a browser with
JavaScript, and fails a scenario on any error the page raises.

## Steps

### `material-ui-overlays.steps.js` (12)

| Step | What it does |
| --- | --- |
| `When I open the "…" dialog\|side panel\|drop-down menu [with the "…" button\|link]` | Clicks the opener, waits until it is shown and still |
| `When I close the "…" dialog\|side panel\|drop-down menu\|notification` | Its close button, else Escape; waits until it is gone |
| `When I press Escape in the "…" dialog\|side panel\|drop-down menu` | Escape, then waits for its answer |
| `When I click outside the "…" dialog\|side panel\|drop-down menu` | Clicks the backdrop, then waits for its answer |
| `Then the "…" dialog\|side panel\|drop-down menu\|notification\|tooltip should [not] be shown` | Shown and still, or gone |
| `Then no tooltip\|notification\|dialog\|side panel\|drop-down menu should be shown` | None is |
| `Then the "…" dialog\|side panel\|drop-down menu\|notification\|tooltip\|panel\|tab should [not] show "…"` | Its text, or a control named so |
| `When I press "…" in the "…" dialog\|side panel\|notification` | Presses a button or link in it, waits for its answer |
| `When I choose "…" from the "…" drop-down menu` | Opens it when closed, clicks the item, waits until it is gone |
| `Then "…" should [not] be active\|disabled in the "…" drop-down menu` | `Mui-selected`, `aria-checked`, `aria-disabled` |
| `When I hover over the "…" button\|link` | Shows its tooltip |
| `When I wait for the transitions to finish` | No CSS transition running in the page |

### `material-ui-forms.steps.js` (9)

| Step | What it does |
| --- | --- |
| `Then the "…" field should be shown as valid\|invalid` | `aria-invalid` |
| `Then the "…" field should show the message "…"` | The text it points at with `aria-describedby` |
| `Then <n>\|no fields should be shown as invalid` | Counts the visible fields with `aria-invalid="true"` |
| `When I choose "…" in the "…" select list` | Opens the select list, clicks the option, waits until its options are gone |
| `Then the "…" select list should show "…"` | The option it shows |
| `Then the "…" select list should [not] offer "…"` | Opens it, reads its options, closes it |
| `When I type "…" in the "…" search list and choose "…"` | Types, waits for the options, clicks one, waits until they are gone |
| `Then the "…" search list should [not] offer "…"` | The options shown for what was typed |
| `Then the "…" search list should show "…"` | The text of its field |

### `material-ui-disclosure.steps.js` (9)

| Step | What it does |
| --- | --- |
| `When I expand\|collapse the "…" panel` | Clicks its summary, waits for the collapse to end |
| `Then the "…" panel should be expanded\|collapsed` | `aria-expanded` and the collapse's class |
| `When I switch to the "…" tab` | Waits until it is selected and its content shown |
| `Then the "…" tab should [not] be active` | `aria-selected` |
| `When I expand\|collapse the "…" item of the ["…"] tree` | Waits for `aria-expanded` and the end of its transition |
| `Then the "…" item of the ["…"] tree should be expanded\|collapsed` | `aria-expanded` |
| `Then the ["…"] tree should [not] show "…"` | A shown item (one inside a collapsed item is not) |
| `Then the "…" step should [not] be the current one` | `Mui-active` on its label |
| `Then the "…" step should [not] be done` | `Mui-completed` on its label |

### `material-ui-feedback.steps.js` (13)

| Step | What it does |
| --- | --- |
| `Then I should [not] see a [kind] notification "…"` | A Snackbar with this text, and its Alert's kind |
| `Then the "…" notification should hide by itself` | Waits until it is gone (up to 20 s) |
| `Then I should [not] see the\|an [kind] alert "…"` | An Alert outside a notification |
| `When I dismiss the alert "…"` | Its close button, then waits until it is gone |
| `Then the alert "…" should [not] be dismissible` | It has a close button |
| `Then I should [not] see a loading spinner` | A progressbar with no value |
| `When I wait for the loading spinner(s) to disappear` | Up to 30 s |
| `Then the ["…"] progress bar should be at <n>%` | `aria-valuenow` in its range |
| `Then the ["…"] progress bar should reach <n>%` | Waits until it is there or past it |
| `Then the "…" button\|link\|heading\|menu item\|tab should [not] show the badge "…"` | The Badge around it |
| `Then the current page of the ["…"] pagination\|breadcrumb should be "…"` | `aria-current`, or a breadcrumb's last item |
| `Then the "…" link of the ["…"] pagination should [not] be disabled` | A pagination's named button |
| `Then the ["…"] breadcrumb should read "… > …"` | Its items in order (`>` or `/`) |

### `material-ui-tables.steps.js` (6)

| Step | What it does |
| --- | --- |
| `Then the ["…"] table should show <n>\|no rows` | Its rows that hold no column header |
| `Then the ["…"] table should [not] have a row "…"` | A row that shows the text |
| `Then the row "…" of the ["…"] table should [not] show "…"` | What the row shows |
| `When I press "…" in the row "…" of the ["…"] table` | A row's action, named by its text or aria-label |
| `When I sort the ["…"] table by "…" [ascending\|descending]` | Clicks the header until it says so |
| `Then the ["…"] table should be sorted by "…" ascending\|descending` | `aria-sort`, or its sort label |

`tests/step-definitions/material-ui-helpers.js` holds the plumbing a project can require for its own steps: finding a
component the way a person reads it, and waiting for it (`waitShown`, `waitGone`, `waitStill`).

## Phrases shared with other packs

The pack shares its phrases on purpose with the Bootstrap and UIkit packs (`@webship-js/bootstrap-steps`,
`@webship-js/uikit-steps`): the component packs speak the same words, so a scenario reads the same whatever library
draws the page. Dialogs, side panels and drop-down menus opened, answered and closed; tooltips; notifications; alerts;
spinners and progress bars; badges; panels and tabs; fields shown as valid or invalid; pagination and breadcrumbs: 32
phrases with UIkit's pack, and 31 with Bootstrap's (all but `I should see a notification "…"`). A project loads the one
pack of the library its site is built with, never two of them.

No phrase is shared with any other published pack. The select lists' phrases say "select list"
(`When I choose "Twenty" in the "Age" select list`), so they stay apart from the records list of the Filament pack
(`the "Addresses" list should show "…"`).

## Findings

The free templates of Material UI 9.6.0 are used as MUI ships them: a demo with a fix of ours would hide what a project
that copies a template meets. These are left as they are, and not filed:

1. **The CRUD dashboard hides its whole app from assistive technology at 900 px and wider.** Its phone's side panel (a
   temporary drawer kept in the page, `keepMounted`) takes its open state from the desktop's (`expanded` is
   `isDesktopNavigationExpanded` on a wide screen), so it is "open" but not displayed. As a modal, it puts
   `aria-hidden="true"` on the app's root, so the app's buttons, fields and table are hidden from a screen reader and
   from role queries. Below 900 px they are not. The suite runs the CRUD dashboard's scenarios at 899 px wide for that
   reason.
2. **The marketing page's menu, at a phone's width, makes the app unmount.** Its menu button opens a drawer of
   MenuItems outside any Menu or MenuList; Material UI 9 throws "MUI: MenuListContext is missing. MenuItems must be
   placed within Menu or MenuList." and the page goes blank.
3. **Some controls have no name:** the colour mode select list of the sign-in and sign-up templates, the dashboard's
   colour mode button, the sign-in template's buttons to sign in with Google and Facebook, and the dashboard's date
   picker (its popper has no name).
4. **The checkout's "Payment options" is a radio group of buttons.** Its choices are card buttons ("Card", "Bank
   account"), not radios.

## Material UI's own tests and this pack

Material UI's repository has end-to-end tests that drive its components in a browser with Playwright (`test/e2e`, MIT):
the focus trapped in an open dialog, the arrow keys of a rating, the option under the pointer in a search list, a click
on a field's label, and a select list opened with the mouse or the keyboard, chosen from by a click, or by a press, a
drag and a release on an option. They were read for their flows: the steps here wait the same way for a list's options
to show and to go, and look for the focus inside the component that holds it. Nothing of them is in this repository.

## Testing this package

Two sites, each made at the run from its own release and served from its production build, in a Node.js 24 container
pinned by its digest:

| Site | Made by | Served by | What it is |
| --- | --- | --- | --- |
| `demo` (default), `http://127.0.0.1:8503` | `.github/scripts/build-demo.sh` | `.github/scripts/serve-demo.sh` | Material UI 9.6.0's own Vite starter, its free templates and its documentation demos |
| `admin`, `http://127.0.0.1:8504` | `.github/scripts/build-admin.sh` | `.github/scripts/serve-admin.sh` | react-admin's e-commerce demo, a real app on Material UI 7 |

```bash
npm ci
npx playwright install chromium
bash .github/scripts/build-demo.sh && bash .github/scripts/serve-demo.sh &   # then:
npx cucumber-js                                     # the demo's suite
npm run test:must-fail                              # the assertions that must fail
SITE=admin npx cucumber-js                          # react-admin's demo (build-admin.sh, serve-admin.sh first)
npm run test:examples                               # every example and feature step resolves to one definition
npm run test:paths                                  # a feature named on the command line runs alone
```

CI does the same for each site: the suite twice, then the assertions that must fail, each failing at its last step with
the message it announces and a hint.

## The demo

`demo-src/assemble.sh` assembles the demo the way Material UI's templates page says to: "These templates can be
combined with one of the example projects to form a complete starter app"; `.github/scripts/build-demo.sh` then installs
it from its lock and builds it.
- It takes Material UI 9.6.0's own Vite starter, `examples/material-ui-vite-ts`, with its free templates copied in
  unchanged (`docs/data/material/getting-started/templates`: sign-in, sign-in-side, sign-up, checkout, dashboard,
  marketing-page, blog, crud-dashboard and their shared theme).
- Its `/components` page lays out Material UI's own documentation demos, copied unchanged into the demo's build from
  `docs/data/material/components/`: `dialogs/AlertDialog`, `drawers/TemporaryDrawer`, `menus/BasicMenu`,
  `selects/BasicSelect`, `autocomplete/ComboBox` (with `top100Films`), `accordion/AccordionUsage`, `tabs/BasicTabs`,
  `tooltips/BasicTooltip`, `snackbars/SimpleSnackbar`, `alert/ActionAlerts`, `alert/TransitionAlerts`,
  `progress/DelayingAppearance`, `progress/LinearWithValueLabel`, `badges/SimpleBadge`, `chips/DeletableChips`,
  `pagination/PaginationControlled`, `breadcrumbs/ActiveLastBreadcrumb` and `steppers/HorizontalLinearStepper`.
- This pack's own files are only the glue in `demo-src/`: the entry that picks a page by its path, the components
  page, `index.html`, and `package.json` with its lock. The package ships them, so the Workspace's Material UI plugin
  makes the same demo from this pack's release. Roboto comes from `@fontsource/roboto`, as Material UI's
  installation guide gives it, not from a font CDN: the demo makes no call out.

Material UI's code, its templates and its documentation demos are released under the
[MIT licence](https://github.com/mui/material-ui/blob/v9.6.0/LICENSE) by Call-Em-All and the MUI contributors. They are
fetched and built at each run, inside the demo's build, and are not part of this package or this repository.

`.github/scripts/build-admin.sh` makes the second site: react-admin's e-commerce demo, "Posters Galore"
(`examples/demo` of [react-admin](https://github.com/marmelab/react-admin) 5.15.7, MIT, by Marmelab), on Material UI
7.3, with its own fake API in the browser and no backend; its lock is this pack's (`.github/admin/package-lock.json`).
It is also the example of the Material UI plugin's `--source`: an app of your own, from its repository.

## How the steps were written

Every component a step touches was opened in a real browser first, on the demo, and its state, its classes and its
transitions were read while it moved: when a dialog is in the page and when it has faded in, where the focus goes, how
long a list's options stay after a choice, what a collapse does to its height, when a notification goes. The steps were
written from that, and are proven on Material UI 9.6.0 (the demo) and on Material UI 7.3 (react-admin's demo), in
English, with Chromium.

## License

MIT

## Logo

The logo is MUI's own mark, `docs/public/static/logo.svg` of github.com/mui/material-ui v9.6.0, unmodified. MUI and its
logo are MUI's: the logo names the framework the pack tests. It is not covered by this package's licence.
