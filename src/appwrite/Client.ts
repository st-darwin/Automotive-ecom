import { Client, Account } from 'appwrite';




export const appwriteConfig = {

    endpointUrl: import.meta.env.VITE_APPWRITE_API_ENDPOINT ,
       project: import.meta.env.VITE_APPWRITE_PROJECT_ID,
}

const client = new Client()
.setEndpoint(appwriteConfig.endpointUrl)
.setProject(appwriteConfig.project)



const account = new Account(client);

export {account , client}