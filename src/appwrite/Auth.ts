import { account } from "./Client";
import { OAuthProvider } from "appwrite";

export const loginWithGoogle = async () => {
  try {
    const successUrl = `${window.location.origin}/`;
    const failureUrl = `${window.location.origin}/sign-in`;

    await account.createOAuth2Session(
      OAuthProvider.Google,
      successUrl,
      failureUrl
    );
  } catch (error) {
    console.error("Google login failed:", error);
  }
};

export const logoutUser = async () => {
  try {
    await account.deleteSession("current");
    window.location.hash = ""; 
    return true; 
  } catch (error) {
    console.error("Logout failed", error);
    return false;
  }
};
export async function getCurrentUser() {
    try {
        return await account.get();
    } catch (error) {
        console.error("No active session found:", error);
        return null;
    }
}


