import { Client, Account , Databases } from 'appwrite';




export const appwriteConfig = {

       endpointUrl: import.meta.env.VITE_APPWRITE_ENDPOINT ,
       project: import.meta.env.VITE_APPWRITE_PROJECT_ID,
       userCollectionId : import.meta.env.VITE_APPWRITE_USER_COLLECTION_ID,
       databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
}

const client = new Client()
.setEndpoint(appwriteConfig.endpointUrl)
.setProject(appwriteConfig.project)



const account = new Account(client);
const database = new Databases(client)

export {account , client , database}