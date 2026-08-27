import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route } from "react-router-dom";

import AdminLayout , {AdminLoader} from './sections/Admin/AdminLayout';
import SignIn , {SignInLoader} from "./sections/root/sigin";



const router = createBrowserRouter(
  createRoutesFromElements(

    <> 
    {/*  ADMIN LAYOUT*/}
    <Route path="/" element={<AdminLayout />} loader={AdminLoader} >
        
     

    </Route>

     <Route path="/sign-in" element={<SignIn />} loader={SignInLoader} />
    </>


    

  )
)

const App = () => {
 return <RouterProvider router={router} />
}

export default App
