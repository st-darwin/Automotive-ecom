
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignIn from './sections/root/sigin'; // Adjust path if your SignIn file is in a different folder

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Route for the Sign In page */}
        <Route path="/sign-in" element={<SignIn />} />
        
        {/* Optional fallback route for the root/homepage */}
        <Route path="/" element={<SignIn />} />
      </Routes>
    </Router>
  );
};

export default App;