
import { Outlet, useNavigate , redirect } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import { getUser, logoutUser } from '../../appwrite/Auth';

export const UserLayoutLoader = async () => {
    try {
        const user = await getUser();
        if (!user) redirect("sign-in") ;
        return user;
    } catch (e) {
        console.log("unable to get user in the user section ", e);
        return null;
    }
};

export default function UserLayout() {

    const navigate = useNavigate();


    const handleLogout = async () => {
        try {
            await logoutUser();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out:", error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col font-sans">
            <UserNavbar
                cartCount={0}
                onCartClick={() => navigate('/Customer/cart')}
                onOrdersClick={() => navigate('/Customer/orders')}
                onLogout={handleLogout}
            />

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
                <Outlet />
            </main>
        </div>
    );
}