import { account, database, appwriteConfig } from "./Client";
import { OAuthProvider, Query , ID } from "appwrite";

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
    console.log("STORE USER: started");

    const sessionUser = await getCurrentUser();

    console.log("STORE USER: auth user =", sessionUser);

    if (!sessionUser) {
      console.error("STORE USER: no authenticated user");
      return null;
    }

    const userData = {
      accountId: sessionUser.$id,
      name: sessionUser.name || "",
      email: sessionUser.email || "",
      role: "customer",
      phoneNumber: sessionUser.phone || "",
    };

    console.log("STORE USER: data =", userData);

    const existingDocs = await database.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", sessionUser.$id)]
    );

    console.log("STORE USER: existing docs =", existingDocs.documents);

    if (existingDocs.documents.length > 0) {
      const docId = existingDocs.documents[0].$id;

      console.log("STORE USER: updating document =", docId);

      const updated = await database.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        docId,
        userData
      );

      console.log("STORE USER: update successful =", updated);

      return updated;
    }

    console.log("STORE USER: creating new document");

    const created = await database.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      userData
    );

    console.log("STORE USER: CREATE SUCCESS =", created);

    return created;
  } catch (error) {
    console.error("STORE USER: APPWRITE ERROR =", error);
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

    const response = await database.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", sessionUser.$id)]
    );

    if (response.documents.length > 0) {
      return response.documents[0];
    }

    // User has authenticated but doesn't have a database document yet.
    return await storeUserData();

  } catch (error) {
    console.error("Failed to fetch or create user document:", error);
    return null;
  }
}




export const getExistingUser = async () => {
  try {
    const currentAccount = await account.get();
    if (!currentAccount) return null;

    const { documents } = await database.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    if (documents.length === 0) return null;
    return documents[0];
  } catch (error) {
    console.error("Google getExistingUser failed:", error);
    return null;
  }
};