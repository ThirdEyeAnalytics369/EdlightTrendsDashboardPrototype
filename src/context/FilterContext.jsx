import { createContext, useContext, useState, useCallback } from 'react';

const FilterContext = createContext(null);

export function FilterProvider({ children }) {
  const [timeRange, setTimeRange] = useState(null); // null = "All"

  const handleTimeRangeChange = useCallback((newRange) => {
    setTimeRange(newRange);
  }, []);

  return (
    <FilterContext.Provider value={{ timeRange, setTimeRange: handleTimeRangeChange }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilter must be used inside <FilterProvider>');
  return ctx;
}
