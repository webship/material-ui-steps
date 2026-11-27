'use strict';

// Tables: Material UI's Data Grid (role=grid, its rows role=row, its column headers with aria-sort) and its Table (an
// HTML table): how many rows a table shows, a row and what it shows, the column it is sorted by, a column sorted, and
// a button pressed in a row (a row's actions, named "Edit" or "Delete", often only by their aria-label).
//
// A table is named by its own name (aria-label, aria-labelledby, its caption) or by the heading just before it, the way
// a person reads a page; "the table" is the only one of the page. A row is the one that shows a text (its name, an id).

const { When, Then } = require('@cucumber/cucumber');
const h = require('./material-ui-helpers');

async function tableNamed(world, name) {
  const t = await h.table(world, name);
  if (await t.count() === 0) {
    throw h.failure(world.page, name ? `Expected a table named "${name}", but the page has none.` : 'Expected a table, but the page has none.', {
      hint: 'a table is named by its aria-label, its caption, or the heading just before it.',
    });
  }
  return t.first();
}

async function rowOf(world, t, text) {
  const r = h.rowsOf(t).filter({ hasText: h.textRe(text) });
  if (await r.count() === 0) throw h.failure(world.page, `Expected the table to have a row showing "${text}", but it has none.`);
  return r.first();
}

/**
 * How many rows a table shows (its rows that hold no column header).
 *
 * Example #1: Then the "Employees" table should show 3 rows
 * Example #2: And the table should show 1 row
 * Example #3: Then the "Employees" table should show no rows
 * Example #4: Then the "Employees" table should show 2 rows
 * Example #5: And the "Customers" table should show 25 rows
 *
 */
Then(/^the (?:"([^"]*)" )?table should show (\d+|no) rows?$/, async function (name, count) {
  const t = await tableNamed(this, name);
  const want = count === 'no' ? 0 : parseInt(count, 10);
  const end = Date.now() + h.WAIT.value;
  let n = -1;
  while (Date.now() < end) {
    n = await h.rowsOf(t).count();
    if (n === want) return;
    await h.sleep(60);
  }
  throw h.failure(this.page, `Expected the table to show ${want} row(s), but it shows ${n}.`);
});

/**
 * A table has a row showing a text, or none.
 *
 * Example #1: Then the "Employees" table should have a row "Edward Perry"
 * Example #2: And the table should not have a row "Edward Perry"
 * Example #3: Then the "Employees" table should not have a row "Edward Perry"
 * Example #4: And the "Customers" table should have a row "Josephine Drake"
 * Example #5: Then the table should have a row "Homepage Overview"
 *
 */
Then(/^the (?:"([^"]*)" )?table should( not)? have a row "([^"]*)"$/, async function (name, not, text) {
  const t = await tableNamed(this, name);
  const end = Date.now() + h.WAIT.value;
  let has = false;
  while (Date.now() < end) {
    has = await h.rowsOf(t).filter({ hasText: h.textRe(text) }).count() > 0;
    if (has === !not) return;
    await h.sleep(60);
  }
  throw h.failure(this.page, `Expected the table ${not ? 'not ' : ''}to have a row "${text}", but it ${has ? 'has' : 'has not'}.`);
});

/**
 * What a row of a table shows in one of its cells.
 *
 * Example #1: Then the row "Edward Perry" of the "Employees" table should show "Finance"
 * Example #2: And the row "Josephine Drake" of the table should not show "Finance"
 * Example #3: Then the row "Cody Phillips" of the "Employees" table should show "Development"
 * Example #4: And the row "Homepage Overview" of the table should show "Online"
 * Example #5: Then the row "Edward Perry" of the "Employees" table should not show "Market"
 *
 */
Then(/^the row "([^"]*)" of the (?:"([^"]*)" )?table should( not)? show "([^"]*)"$/, async function (rowText, name, not, text) {
  const t = await tableNamed(this, name);
  const row = await rowOf(this, t, rowText);
  const shows = await row.evaluate((el, src) => new RegExp(src.source, src.flags).test(el.innerText), { source: h.textRe(text).source, flags: h.textRe(text).flags });
  if (shows === !!not) throw h.failure(this.page, `Expected the row "${rowText}" ${not ? 'not ' : ''}to show "${text}", but it ${shows ? 'does' : 'does not'}.`);
});

/**
 * Press a button (or a link) of a row, by its name (a row's action, "Edit" or "Delete", named by its aria-label).
 *
 * Example #1: When I press "Delete" in the row "Edward Perry" of the "Employees" table
 * Example #2: And we press "Edit" in the row "Josephine Drake" of the table
 * Example #3: When I press "Edit" in the row "Cody Phillips" of the "Employees" table
 * Example #4: And we press "Delete" in the row "Josephine Drake" of the table
 * Example #5: When I press "Show" in the row "Homepage Overview" of the table
 *
 */
When(/^(?:I |we )?press "([^"]*)" in the row "([^"]*)" of the (?:"([^"]*)" )?table$/, async function (label, rowText, name) {
  const t = await tableNamed(this, name);
  const row = await rowOf(this, t, rowText);
  const target = row.getByRole('button', { name: label, exact: true }).or(row.getByRole('link', { name: label, exact: true })).or(row.getByRole('menuitem', { name: label, exact: true }));
  if (await target.count() === 0) throw h.failure(this.page, `Expected the row "${rowText}" to have a button or a link named "${label}", but it has none.`);
  await target.first().click();
});

// The sort of a column: its header's aria-sort (a Data Grid's, a TableCell given its sortDirection), else what its
// TableSortLabel says (Mui-active, and the direction of its icon), for a table that sets no aria-sort.
async function sortOf(t, column) {
  let header = t.getByRole('columnheader', { name: column, exact: true });
  if (await header.count() === 0) header = t.getByRole('columnheader').filter({ hasText: h.textRe(column, { exact: true }) });
  if (await header.count() === 0) return { header: null, sort: null };
  const sort = await header.first().evaluate((el) => {
    const aria = el.getAttribute('aria-sort');
    if (aria) return aria;
    const label = el.querySelector('.MuiTableSortLabel-root');
    if (!label) return 'none';
    if (!label.classList.contains('Mui-active')) return 'none';
    const icon = label.querySelector('.MuiTableSortLabel-icon');
    return icon && icon.classList.contains('MuiTableSortLabel-iconDirectionAsc') ? 'ascending' : 'descending';
  });
  return { header: header.first(), sort };
}

/**
 * Sort a table by a column, ascending or descending (ascending without a word): its header clicked until its
 * aria-sort says so.
 *
 * Example #1: When I sort the "Employees" table by "Name"
 * Example #2: And we sort the table by "Age" descending
 * Example #3: When I sort the "Employees" table by "Age" ascending
 * Example #4: And I sort the "Employees" table by "Name" descending
 * Example #5: When we sort the table by "Users"
 *
 */
When(/^(?:I |we )?sort the (?:"([^"]*)" )?table by "([^"]*)"(?: (ascending|descending))?$/, async function (name, column, order) {
  const t = await tableNamed(this, name);
  const want = order || 'ascending';
  for (let i = 0; i < 3; i += 1) {
    const { header, sort } = await sortOf(t, column);
    if (!header) throw h.failure(this.page, `Expected the table to have a column "${column}", but it has none.`);
    if (sort === want) return;
    const title = header.locator('.MuiDataGrid-columnHeaderTitleContainer, .MuiTableSortLabel-root, [role=button]').first();
    if (await title.count() > 0) await title.click(); else await header.click();
    const end = Date.now() + h.WAIT.value;
    while (Date.now() < end) {
      if ((await sortOf(t, column)).sort !== sort) break;
      await h.sleep(60);
    }
  }
  const { sort } = await sortOf(t, column);
  if (sort !== want) throw h.failure(this.page, `Expected the table to be sorted by "${column}" ${want}, but its sort is ${sort}.`, { hint: 'a column that cannot be sorted never changes its aria-sort.' });
});

/**
 * The column a table is sorted by, and in which order (its header's aria-sort).
 *
 * Example #1: Then the "Employees" table should be sorted by "Name" ascending
 * Example #2: And the table should be sorted by "Age" descending
 * Example #3: Then the "Employees" table should be sorted by "Age" descending
 * Example #4: And the table should be sorted by "Users" ascending
 * Example #5: Then the "Customers" table should be sorted by "Last seen" descending
 *
 */
Then(/^the (?:"([^"]*)" )?table should be sorted by "([^"]*)" (ascending|descending)$/, async function (name, column, order) {
  const t = await tableNamed(this, name);
  const { header, sort } = await sortOf(t, column);
  if (!header) throw h.failure(this.page, `Expected the table to have a column "${column}", but it has none.`);
  if (sort !== order) throw h.failure(this.page, `Expected the table to be sorted by "${column}" ${order}, but its sort is ${sort}.`);
});
