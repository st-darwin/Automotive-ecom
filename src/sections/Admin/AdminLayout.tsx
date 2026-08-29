import { Outlet, redirect, useLoaderData } from "react-router-dom";
import { getUser } from "../../appwrite/Auth";
import AdminSidebar from "../../components/AdminNavBar";
export const AdminLoader = async () => {
  const user = await getUser();


  if (!user) {
    console.error("Could not get/create database user");
    return redirect("/sign-in");
  }

  if (user.role === "customer") {
    return redirect("/Customer");
  }

  return user;
};

const AdminLayout = () => {
  const user = useLoaderData();

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800">
      {/* Floating Sidebar Component */}
      <AdminSidebar />
      
      {/* Main Content Area Offset for Floating Card */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
