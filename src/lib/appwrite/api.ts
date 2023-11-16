import {INewUser} from "@/types";
import {account, appwriteConfig, avatars, databases} from "@/lib/appwrite/config.ts";
import {ID, Query} from "appwrite";

export async function createUserAccount(user: INewUser) {
	try {
		const newAccount = await account.create(
			ID.unique(),
			user.email,
			user.password,
			user.name
		)

		if (!newAccount) throw Error;

		const avatarUrl = avatars.getInitials(user.name);

		const newUser = await saveUserToDB({
			accountId: newAccount.$id,
			name: newAccount.name,
			email: newAccount.email,
			username: user.username,
			imageUrl: avatarUrl
		})

		return newUser;
	} catch (error) {
		console.log(error);
		return error;
	}
}

export async function saveUserToDB(user: {
	accountId: string;
	email: string;
	name: string;
	imageUrl: URL;
	username?: string;
}) {
	try {
		const newUser = databases.createDocument(appwriteConfig.databaseId, appwriteConfig.usersCollectionId, ID.unique(), user)
		return newUser;
	} catch (e) {
		console.log(e)
	}
}

export async function signInAccount(user: { email: string; password: string}) {
	try {
		const session = await account.createEmailSession(user.email, user.password);
		return session;
	} catch (e) {
		console.log(e);
	}
}

export async function signOutAccount() {
	try {
		const session = await account.deleteSession("current");
		return session;
	} catch (e) {
		console.log(e);
	}
}

export async function getCurrentUser() {
	try {
		const currentAccount = await account.get();
		if (!currentAccount) throw Error;

		const currentUser = await databases.listDocuments(
			appwriteConfig.databaseId,
			appwriteConfig.usersCollectionId,
			[Query.equal('accountId', currentAccount.$id)]
		)

		if (!currentUser) throw Error;

		return currentUser.documents[0]
	} catch (e) {
		console.log(e);
		return null;
	}
}
