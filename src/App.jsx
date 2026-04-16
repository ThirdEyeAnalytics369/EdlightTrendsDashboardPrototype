import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import DistrictView from './pages/DistrictView';
import SchoolView from './pages/SchoolView';
import { FilterProvider } from './context/FilterContext';

export default function App() {
  return (
    <FilterProvider>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Routes>
            <Route path="/" element={<DistrictView />} />
            <Route path="/school/:schoolSlug" element={<SchoolView />} />
          </Routes>
        </div>
      </div>
    </FilterProvider>
  );
}
