// The page of the demo for the components the templates do not show, one section each: Material UI's own demos from
// its documentation (docs/data/material/components/<component>/<Demo>.tsx of the release the demo is built from, MIT),
// copied into src/docs-demos/ by demo-src/assemble.sh and used as they are. This file only lays them out.
import * as React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import BasicTabs from './docs-demos/tabs/BasicTabs';
import BasicTooltip from './docs-demos/tooltips/BasicTooltip';
import ComboBox from './docs-demos/autocomplete/ComboBox';
import ActionAlerts from './docs-demos/alert/ActionAlerts';
import TransitionAlerts from './docs-demos/alert/TransitionAlerts';
import SimpleSnackbar from './docs-demos/snackbars/SimpleSnackbar';
import TemporaryDrawer from './docs-demos/drawers/TemporaryDrawer';
import PaginationControlled from './docs-demos/pagination/PaginationControlled';
import ActiveLastBreadcrumb from './docs-demos/breadcrumbs/ActiveLastBreadcrumb';
import DelayingAppearance from './docs-demos/progress/DelayingAppearance';
import LinearWithValueLabel from './docs-demos/progress/LinearWithValueLabel';
import SimpleBadge from './docs-demos/badges/SimpleBadge';
import DeletableChips from './docs-demos/chips/DeletableChips';
import AlertDialog from './docs-demos/dialogs/AlertDialog';
import BasicMenu from './docs-demos/menus/BasicMenu';
import BasicSelect from './docs-demos/selects/BasicSelect';
import AccordionUsage from './docs-demos/accordion/AccordionUsage';
import HorizontalLinearStepper from './docs-demos/steppers/HorizontalLinearStepper';

const sections: Array<[string, React.ComponentType]> = [
  ['Dialog', AlertDialog],
  ['Side panel', TemporaryDrawer],
  ['Menu', BasicMenu],
  ['Select', BasicSelect],
  ['Autocomplete', ComboBox],
  ['Accordion', AccordionUsage],
  ['Tabs', BasicTabs],
  ['Tooltip', BasicTooltip],
  ['Snackbar', SimpleSnackbar],
  ['Alert', ActionAlerts],
  ['Alert that closes', TransitionAlerts],
  ['Progress', DelayingAppearance],
  ['Progress bar', LinearWithValueLabel],
  ['Badge', SimpleBadge],
  ['Chips', DeletableChips],
  ['Pagination', PaginationControlled],
  ['Breadcrumbs', ActiveLastBreadcrumb],
  ['Stepper', HorizontalLinearStepper],
];

export default function ComponentsPage() {
  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Material UI components
      </Typography>
      {sections.map(([title, Demo]) => (
        <Box component="section" key={title} sx={{ mb: 5 }} aria-labelledby={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}>
          <Typography variant="h5" component="h2" id={`section-${title.replace(/\s+/g, '-').toLowerCase()}`} sx={{ mb: 2 }}>
            {title}
          </Typography>
          <Demo />
        </Box>
      ))}
    </Container>
  );
}
