import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route } from "react-router-dom";

import AdminLayout , {AdminLoader} from './sections/Admin/AdminLayout';
import SignIn , {SignInLoader} from "./sections/root/sigin";
import Dashboard , {Dashboardoader} from "./sections/Admin/Dashboard";
import Inventory from "./sections/Admin/Inventory";
import TyrePage from "./sections/Admin/TyrePage";
import CreateTyre from "./sections/Admin/CreateTyre";
import GreasePage from "./sections/Admin/GreasePage";
import CreateGrease from "./sections/Admin/CreateGrease";
import MotorPartsPage from "./sections/Admin/MotorPartsPage";
import CreateMotorParts from "./sections/Admin/CreateMotorParts";
import OrdersPage from "./sections/Admin/Order";
import TyreOrder from "./sections/Admin/TyreOrder";
import GreaseOrder from "./sections/Admin/GreaseOrder";
import MotorPartsOrder from "./sections/Admin/MotorPartsOrder";
import CustomerPage from "./sections/Admin/CustomerPage";


const router = createBrowserRouter(
  createRoutesFromElements(

    <> 
    {/*  ADMIN LAYOUT*/}
    <Route path="/" element={<AdminLayout />} loader={AdminLoader} >
    <Route index element={<Dashboard/>} loader={Dashboardoader} />
    <Route path="inventory" element={<Inventory/>} />
    <Route path="inventory/tyres" element={<TyrePage/>} />
    <Route path="inventory/grease" element={<GreasePage/>} />
    <Route  path="inventory/MotorParts" element={<MotorPartsPage/>}/> 
    <Route path="inventory/tyres/create" element={<CreateTyre/>}  />
    <Route path="inventory/grease/create" element={<CreateGrease/>} />
    <Route  path="inventory/motor-parts" element={<MotorPartsPage/>}/> 
    <Route  path="inventory/motor-parts/create" element={<CreateMotorParts/>}/>
    <Route path="orders" element={<OrdersPage/>}/>
    <Route path="orders/tyres" element={<TyreOrder/>}/>
    <Route  path="orders/grease" element={<GreaseOrder/>} />
    <Route  path="orders/motor-parts" element={<MotorPartsOrder/>}/>
    <Route path="customers" element={<CustomerPage/>} />


      

    </Route>

     <Route path="/sign-in" element={<SignIn />} loader={SignInLoader} />
    </>


    

  )
)

const App = () => {
 return <RouterProvider router={router} />
}

export default App
