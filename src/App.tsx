
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignIn from './sections/root/sigin';
import AdminLayout from './sections/Admin/AdminLayout';


const App = () => {
  return (
    <Router>
      <Routes>
        {/* Admin Layout wrapping child pages */}
        <Route path="/" element={<AdminLayout />}>
      
        </Route>

        

        {/* Sign In Route */}
        <Route path="/sign-in" element={<SignIn />} />
      </Routes>
    </Router>
  );
};

export default App;