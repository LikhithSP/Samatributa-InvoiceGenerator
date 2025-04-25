import React, { createContext, useState, useContext } from 'react';

const ErrorContext = createContext({
  error: null,
  setError: () => {},
  clearError: () => {}
});

export const ErrorProvider = ({ children }) => {
  const [error, setError] = useState(null);
  
  const clearError = () => setError(null);
  
  return (
    <ErrorContext.Provider value={{ error, setError, clearError }}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = () => useContext(ErrorContext);

export default ErrorContext;