import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route } from "react-router-dom";

import AdminLayout , {AdminLoader} from './sections/Admin/AdminLayout';
import SignIn , {SignInLoader} from "./sections/root/sigin";
import Dashboard , {Dashboardoader} from "./sections/Admin/Dashboard";
import Inventory from "./sections/Admin/Inventory";
import TyrePage from "./sections/Admin/TyrePage";
import CreateTyre from "./sections/Admin/CreateTyre";


const router = createBrowserRouter(
  createRoutesFromElements(

    <> 
    {/*  ADMIN LAYOUT*/}
    <Route path="/" element={<AdminLayout />} loader={AdminLoader} >
    <Route index element={<Dashboard/>} loader={Dashboardoader} />
    <Route path="inventory" element={<Inventory/>} />
    <Route path="inventory/tyres" element={<TyrePage/>} />
    <Route path="inventory/tyres/create" element={<CreateTyre/>}  />
        
      

    </Route>

     <Route path="/sign-in" element={<SignIn />} loader={SignInLoader} />
    </>


    

  )
)

const App = () => {
 return <RouterProvider router={router} />
}

export default App
