import PropTypes from 'prop-types';
import { createContext } from 'react';

// project imports
import defaultConfig from 'config';
import useLocalStorage from 'hooks/useLocalStorage';

// initial state
type ConfigContextType = typeof defaultConfig & {
  onChangeFontFamily: (fontFamily: string) => void;
  onChangeBorderRadius: (event: Event, newValue: number) => void;
  onReset: () => void;
};

const initialState: ConfigContextType = {
  ...defaultConfig,
  onChangeFontFamily: (_fontFamily: string) => {},
  onChangeBorderRadius: (_event: Event, _newValue: number) => {},
  onReset: () => {}
};

// ==============================|| CONFIG CONTEXT & PROVIDER ||============================== //

const ConfigContext = createContext<ConfigContextType>(initialState);

type Props = { children: React.ReactNode };
function ConfigProvider({ children }: Props) {
  const [config, setConfig] = useLocalStorage('berry-config-vite-ts', {
    fontFamily: initialState.fontFamily,
    borderRadius: initialState.borderRadius
  });

  const onChangeFontFamily = (fontFamily: string) => {
    setConfig({
      ...config,
      fontFamily
    });
  };

  const onChangeBorderRadius = (event: Event, newValue: number) => {
    setConfig({
      ...config,
      borderRadius: newValue
    });
  };

  const onReset = () => {
    setConfig({ ...defaultConfig });
  };

  return (
    <ConfigContext.Provider
      value={{
        ...config,
        onChangeFontFamily,
        onChangeBorderRadius,
        onReset
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export { ConfigProvider, ConfigContext };

ConfigProvider.propTypes = { children: PropTypes.node };
