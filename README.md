# material-ui-steps

Cucumber step definitions for sites and apps built with Material UI, the React components of MUI, for
[webship-js](https://webship.co/docs/webship-js/2.0.x), a BDD browser automation harness built on Playwright and
Cucumber-js.

Material UI draws its dialogs, side panels, menus, select lists, panels, tabs, notifications and tables in React, with
transitions of its own and portals at the end of the page. The steps work on them as a person sees them, by their roles
and their names, and wait on what the components themselves say (their state, their classes, the end of their
transitions), never for a fixed time. No step phrase names the framework.

The steps, their features, the demo app and CI come with the first release, `2.0.0`.
