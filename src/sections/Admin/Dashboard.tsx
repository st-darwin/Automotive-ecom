
import { useLoaderData } from 'react-router-dom'
import Header from '../../components/Header'
import { getUser } from '../../appwrite/Auth'

export const Dashboardoader = async () => {
    try {
        const user = await getUser()
        return user
    }
    catch (e) {
        console.log("Unable to get user details", e)
        return null
    }
}

const Dashboard = () => {
    const user = useLoaderData() as {name : string}
    const userName = user?.name ? user.name.split(' ')[0]  : 'Admin'

    return (
        <div>
            <Header
                title={`Welcome back, ${userName} 👋`}
                description="Your automotive command center is primed. Monitor real-time store inventory, track performance metrics, and keep Kinchris Switch running at peak velocity."
                ctaText="View Products"
                ctaUrl="/inventory"
            />
        </div>
    )
}

export default Dashboard
