import { redirect } from "react-router-dom";
import { getUser } from "../../appwrite/Auth";

export const AdminLoader = async () => {
  const user = await getUser();

  console.log("DATABASE USER:", user);

  if (!user) {
    console.error("Could not get/create database user");
    return redirect("/sign-in");
  }

  if (user.role === "customer") {
    return redirect("/CustomerSection");
  }

  return user;
};

const AdminLayout = () => {
  return <div>hey</div>;
};

export default AdminLayout;