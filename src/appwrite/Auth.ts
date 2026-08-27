import { account, database, appwriteConfig } from "./Client";
import { OAuthProvider, Query } from "appwrite";

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

/**
 * Stores or updates the authenticated user's info in the Appwrite database collection.
 */
export async function storeUserData() {
    try {
        const sessionUser = await getCurrentUser();
        if (!sessionUser) return null;

        const userData = {
            accountId: sessionUser.$id,
            name: sessionUser.name,
            email: sessionUser.email,
            role: "customer",
            phone: sessionUser.phone || "",
        };

        const existingDocs = await database.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal("accountId", sessionUser.$id)]
        );

        if (existingDocs.documents.length > 0) {
            const docId = existingDocs.documents[0].$id;
            return await database.updateDocument(
                appwriteConfig.databaseId,
                appwriteConfig.userCollectionId,
                docId,
                userData
            );
        } else {
            return await database.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.userCollectionId,
                sessionUser.$id,
                userData
            );
        }
    } catch (error) {
        console.error("Failed to store user data in database:", error);
        return null;
    }
}

/**
 * Fetches the user's custom document. If it doesn't exist yet, 
 * it automatically triggers storeUserData() to create it.
 */
export async function getUser() {
    try {
        const sessionUser = await getCurrentUser();
        if (!sessionUser) return null;

        try {
            const response = await database.getDocument(
                appwriteConfig.databaseId,
                appwriteConfig.userCollectionId,
                sessionUser.$id
            );
            return response;
        } catch (fetchError) {
            // Document doesn't exist yet, fall back to creating it
            console.log("User document not found in database, creating one now..." , fetchError);
            return await storeUserData();
        }
    } catch (error) {
        console.error("Failed to fetch or create user document:", error);
        return null;
    }
}