import { createRoot } from 'react-dom/client';
import { Provider } from 'urql';
import { SongLoader } from './App';
import './globalStyles.css';
import { client } from './lib/urql';
import { Leaderboard } from './Leaderboard';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

const container = document.getElementById('root')!;
const root = createRoot(container);

const router = createBrowserRouter([
  {
    path: '/leaderboard',
    Component: Leaderboard,
  },
  {
    path: '/',
    // @ts-ignore
    Component: SongLoader,
  },
]);

root.render(
  <Provider value={client}>
    <RouterProvider router={router} />
  </Provider>,
);
