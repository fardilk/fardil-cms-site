import { RouterProvider } from 'react-router-dom';

// routing
import router from 'routes';

// project imports
import NavigationScroll from 'layout/NavigationScroll';

import ThemeCustomization from 'themes';

// auth provider

// ==============================|| APP ||============================== //


const App: React.FC = () => {
  return (
    <ThemeCustomization>
      <NavigationScroll>
        <RouterProvider router={router} />
      </NavigationScroll>
    </ThemeCustomization>
  );
};

export default App;
