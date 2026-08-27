import { account } from '../../appwrite/Client';
import { loginWithGoogle } from '../../appwrite/Auth';

export const SignInLoader = async() =>{


  try{
    const user = await account.get();
    if(user.$id) return {user}

  }
  catch(e) {
    console.log("error fetching user session" , e )
  }



}

 const SignIn = () => {

 
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 px-4 py-12 sm:px-6 lg:px-8 overflow-hidden">
      
      {/* Background Decorative Glow Elements */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md space-y-8 rounded-3xl bg-white/80 backdrop-blur-xl p-8 sm:p-10 shadow-2xl shadow-blue-900/10 border border-blue-100/80">
        
        {/* Brand / Header Section */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-4 ring-blue-50">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.75} 
              stroke="currentColor" 
              className="w-8 h-8"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M8.25 18.75a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H8.528c-.714 0-1.363.32-1.78.86-1.865 2.417-3.213 5.48-3.213 9.193-.039.62.469 1.124 1.09 1.124H4.5m15 0v-4.5m-15 4.5v-4.5m15 0V9.375c0-.621-.504-1.125-1.125-1.125H5.625c-.621 0-1.125.504-1.125 1.125v4.5m15 0H4.5" 
              />
            </svg>
          </div>
          
          <div className="space-y-1">
            <span className="inline-block px-3 my-1 py-1 text-xs font-semibold tracking-wider text-blue-700 uppercase bg-blue-100/60 rounded-full mb-1">
              Active Portal
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Kinchris Switch
            </h2>
            <p className="text-sm font-medium text-blue-600">Automotive Store</p>
          </div>

          <p className="text-sm text-slate-500 max-w-xs mx-auto pt-1">
            Sign in to access your garage, track live orders, and explore premium vehicle parts.
          </p>
        </div>

        {/* Action Button Section */}
        <div className="space-y-4 pt-2">
          <button
            onClick={loginWithGoogle}
            type="button"
            className="group relative w-full flex items-center justify-center gap-3.5 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-700 shadow-md shadow-slate-100 hover:bg-slate-50 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 focus:outline-none focus:ring-4 focus:ring-blue-600/10 active:scale-[0.99] transition-all duration-200"
          >
            <svg className="h-5 w-5 transition-transform group-hover:scale-110 duration-200" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Footer Security Note */}
        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 font-medium">
            Secure enterprise authentication powered by Appwrite & Google
          </p>
        </div>

      </div>
    </div>
  );
}
export default SignIn