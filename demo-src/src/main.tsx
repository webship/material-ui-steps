// The entry of the pack's demo: Material UI's own Vite starter (examples/material-ui-vite-ts), with its free templates
// copied into src/templates/ as the templates page says to ("Import and use the <Template> component"), and a page of
// its documentation's demos (ComponentsPage). This file only picks the page a path names; the starter's own page is at
// /starter. Roboto comes from @fontsource/roboto, as Material UI's installation guide gives it, not from a font CDN: the
// demo makes no call out.
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import App from './App.tsx';
import ComponentsPage from './ComponentsPage.tsx';
import SignIn from './templates/sign-in/SignIn.tsx';
import SignInSide from './templates/sign-in-side/SignInSide.tsx';
import SignUp from './templates/sign-up/SignUp.tsx';
import Checkout from './templates/checkout/Checkout.tsx';
import Dashboard from './templates/dashboard/Dashboard.tsx';
import MarketingPage from './templates/marketing-page/MarketingPage.tsx';
import Blog from './templates/blog/Blog.tsx';
import CrudDashboard from './templates/crud-dashboard/CrudDashboard.tsx';

const pages: Array<[string, string, React.ComponentType]> = [
  ['/components', 'Components', ComponentsPage],
  ['/sign-in', 'Sign in', SignIn],
  ['/sign-in-side', 'Sign in (side)', SignInSide],
  ['/sign-up', 'Sign up', SignUp],
  ['/checkout', 'Checkout', Checkout],
  ['/dashboard', 'Dashboard', Dashboard],
  ['/marketing-page', 'Marketing page', MarketingPage],
  ['/blog', 'Blog', Blog],
  ['/crud-dashboard', 'CRUD dashboard', CrudDashboard],
  ['/starter', 'The starter', App],
];

function Index() {
  return (
    <Container maxWidth="sm" sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Material UI demo
      </Typography>
      <List aria-label="Pages">
        {pages.map(([path, title]) => (
          <ListItemButton key={path} component="a" href={path}>
            <ListItemText primary={title} />
          </ListItemButton>
        ))}
      </List>
    </Container>
  );
}

const found = pages.find(([path]) => window.location.pathname === path || window.location.pathname === `${path}/`);
const Page = found ? found[2] : Index;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>,
);
