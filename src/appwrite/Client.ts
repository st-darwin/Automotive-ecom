import { Client, Account , Databases , Storage } from 'appwrite';




export const appwriteConfig = {

       endpointUrl: import.meta.env.VITE_APPWRITE_ENDPOINT ,
       project: import.meta.env.VITE_APPWRITE_PROJECT_ID,
       userCollectionId : import.meta.env.VITE_APPWRITE_USER_COLLECTION_ID,
       databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
       tyreColection:import.meta.env.VITE_APPWRITE_TYRE_COLLECTION_ID,
       storageId: import.meta.env.VITE_APPWRITE_STORAGE_ID,
       greaseCollection: import.meta.env.VITE_APPWRITE_GREASE_COLLECTION_ID
}

const client = new Client()
.setEndpoint(appwriteConfig.endpointUrl)
.setProject(appwriteConfig.project)



const account = new Account(client);
const database = new Databases(client)
const storage = new Storage(client)

export {account , client , database , storage}