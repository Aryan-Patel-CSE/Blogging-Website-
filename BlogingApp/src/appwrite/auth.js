import config from 'conf/config.js'
import { Client, Account , ID } from 'appwrite'

export class Auth {
    constructor() {
        this.client = new Client()
            .setEndpoint(config.appwriteUrl)
            .setProject(config.appwriteProjectId);
        this.account = new Account(this.client);
    }

    async createAccount({ email, password, name }) {
        try{
           const user = await this.account.create(ID.unique(), email, password, name);
           if(user) {
             return this.login({ email, password });
           }else {
            throw new Error('User creation failed');
           }
        }
        catch (error) {
            console.error('Error creating account:', error);
            throw error;
        }
    }

    async login({ email, password }) {
        try {
            return await this.account.createEmailPasswordSession(email, password);
        }
        catch (error) {
            console.error('Error logging in:', error);
            throw error;
        }   
    }

    async getCurrentUser() {
        try {
            return await this.account.get();
        }
        catch (error) {
            console.error('Error getting current user:', error);
            throw error;
        }

        return null;
    }

    async logout() {
        try {
            return await this.account.deleteSessions();
        }
        catch (error) {
            console.error('Error logging out:', error);
            throw error;
        }   
    }

}

const authService = new Auth()


export default authService