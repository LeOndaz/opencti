import React from 'react';

export const ConnectorsContext = React.createContext({});
export const ConnectorsSetContext = React.createContext(() => { });

ConnectorsContext.displayName = 'ConnectorsContext';
ConnectorsSetContext.displayName = 'ConntectorsSetContext';

export function useConnectors() {
  return React.useContext(ConnectorsContext);
}

export function useSetConnectors() {
  return React.useContext(ConnectorsSetContext);
}
