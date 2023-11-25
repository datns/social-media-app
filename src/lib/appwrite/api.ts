import {INewPost, INewUser, IUpdatePost, IUpdateUser} from "@/types";
import {account, appwriteConfig, avatars, databases, storage} from "@/lib/appwrite/config.ts";
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

export async function signInAccount(user: { email: string; password: string }) {
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


export async function uploadFile(file: File) {
	try {
		const uploadedFile = await storage.createFile(appwriteConfig.storageId, ID.unique(), file);

		return uploadedFile;
	} catch (e) {
		console.log(e)
	}
}

export function getFilePreview(fileId: string) {
	try {
		const fileUrl = storage.getFilePreview(
			appwriteConfig.storageId,
			fileId,
			2000,
			2000,
			"top",
			100
		)

		return fileUrl;
	} catch (e) {
		console.log(e);
	}
}

export async function deleteFile(filedId: string) {
	try {
		await storage.deleteFile(appwriteConfig.storageId, filedId);
		return {status: 'ok'}
	} catch (e) {
		console.log(e);
	}
}

// =========================== USER ===========================
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

export async function getInfiniteUsers({pageParam}: { pageParam: number }) {
	const queries: string[] = [Query.orderDesc('$createdAt'), Query.limit(10)]

	if (pageParam) {
		queries.push(Query.cursorAfter(pageParam.toString()))
	}

	try {
		const users = await databases.listDocuments(
			appwriteConfig.databaseId,
			appwriteConfig.usersCollectionId,
			queries
		)

		if (!users) throw Error;

		return users;
	} catch (e) {
		console.log(e);
	}
}

export async function getUserById(userId: string) {
	try {
		const user = await databases.getDocument(
			appwriteConfig.databaseId,
			appwriteConfig.usersCollectionId,
			userId
		);

		if (!user) throw Error;

		return user;
	} catch (e) {
		console.log(e);
	}
}

// =========================== POST ===========================
export async function createPost(post: INewPost) {
	try {
		// Upload image
		const uploadedFile = await uploadFile(post.file[0]);

		if (!uploadedFile) throw Error;

		const fileUrl = getFilePreview(uploadedFile.$id);

		if (!fileUrl) {
			deleteFile(uploadedFile.$id);
			throw Error;
		}

		const tags = post.tags?.replace(/ /g, '').split('.') || [];

		const newPost = await databases.createDocument(
			appwriteConfig.databaseId,
			appwriteConfig.postsCollectionId,
			ID.unique(),
			{
				creator: post.userId,
				caption: post.caption,
				imageUrl: fileUrl,
				imageId: uploadedFile.$id,
				location: post.location,
				tags: tags,
			}
		)

		if (!newPost) {
			await deleteFile(uploadedFile.$id);
			throw Error;
		}
		return newPost;

	} catch (error) {
		console.log(error);
	}
}

export async function getRecentPosts() {
	const posts = await databases.listDocuments(
		appwriteConfig.databaseId,
		appwriteConfig.postsCollectionId,
		[Query.orderDesc('$createdAt'), Query.limit(20)]
	)

	if (!posts) throw Error;

	return posts;
}

export async function likePost(postId: string, likesArray: string[]) {
	try {
		const updatedPost = await databases.updateDocument(
			appwriteConfig.databaseId,
			appwriteConfig.postsCollectionId,
			postId,
			{
				likes: likesArray
			}
		)

		if (!updatedPost) throw Error;

		return updatedPost
	} catch (e) {
		console.log(e)
	}
}

export async function savePost(postId: string, userId: string) {
	try {
		const updatedPost = await databases.createDocument(
			appwriteConfig.databaseId,
			appwriteConfig.savesCollectionId,
			ID.unique(),
			{
				user: userId,
				post: postId,
			}
		)

		if (!updatedPost) throw Error;

		return updatedPost
	} catch (e) {
		console.log(e)
	}
}

export async function deleteSavedPost(savedRecordId: string) {
	try {
		const statusCode = await databases.deleteDocument(
			appwriteConfig.databaseId,
			appwriteConfig.savesCollectionId,
			savedRecordId,
		)

		if (!statusCode) throw Error;

		return {status: 'ok'}
	} catch (e) {
		console.log(e)
	}
}

export async function getPostById(postId: string) {
	try {
		const post = await databases.getDocument(
			appwriteConfig.databaseId,
			appwriteConfig.postsCollectionId,
			postId
		)

		return post;
	} catch (e) {
		console.log(e);
	}
}

export async function updatePost(post: IUpdatePost) {
	const hasFileToUpdate = post.file.length > 0;
	try {
		let image = {
			imageUrl: post.imageUrl,
			imageId: post.imageId,
		}

		if (hasFileToUpdate) {
			const uploadedFile = await uploadFile(post.file[0])

			// Upload image

			if (!uploadedFile) throw Error;

			const fileUrl = getFilePreview(uploadedFile.$id);

			if (!fileUrl) {
				deleteFile(uploadedFile.$id);
				throw Error;
			}

			image = {...image, imageUrl: fileUrl, imageId: uploadedFile.$id}
		}

		const tags = post.tags?.replace(/ /g, '').split('.') || [];

		const updatedPost = await databases.updateDocument(
			appwriteConfig.databaseId,
			appwriteConfig.postsCollectionId,
			post.postId,
			{
				caption: post.caption,
				imageUrl: image.imageUrl,
				imageId: image.imageId,
				location: post.location,
				tags: tags,
			}
		)

		if (!updatedPost) {
			if (hasFileToUpdate) {
				await deleteFile(image.imageId);
			}
			throw Error;
		}

		if (hasFileToUpdate) {
			await deleteFile(post.imageId);
		}

		return updatedPost;

	} catch (error) {
		console.log(error);
	}
}

export async function deletePost(postId: string, imageId: string) {
	if (!postId || !imageId) throw Error;

	try {
		const statusCode = await databases.deleteDocument(
			appwriteConfig.databaseId,
			appwriteConfig.postsCollectionId,
			postId
		)

		if (!statusCode) throw Error;

		await deleteFile(imageId);

		return {status: "Ok"};

	} catch (e) {
		console.log(e);
	}

}

export async function getInfinitePosts({pageParam}: { pageParam: number }) {
	const queries: string[] = [Query.orderDesc('$updatedAt'), Query.limit(10)]

	if (pageParam) {
		queries.push(Query.cursorAfter(pageParam.toString()))
	}

	try {
		const posts = await databases.listDocuments(
			appwriteConfig.databaseId,
			appwriteConfig.postsCollectionId,
			queries
		)

		if (!posts) throw Error;

		return posts;
	} catch (e) {
		console.log(e);
	}
}

export async function searchPost(searchTerm: string) {
	try {
		const posts = await databases.listDocuments(
			appwriteConfig.databaseId,
			appwriteConfig.postsCollectionId,
			[Query.search('caption', searchTerm)]
		)

		if (!posts) throw Error;

		return posts;
	} catch (e) {
		console.log(e);
	}
}

export async function getSavedPost(userId: string) {
	try {
		const savedPosts = await databases.listDocuments(
			appwriteConfig.databaseId,
			appwriteConfig.savesCollectionId,
			[
				Query.equal('user', [userId])
			]
		)

		return savedPosts
	} catch (e) {
		console.log(e);
	}
}

export async function updateUser(user: IUpdateUser) {
	const hasFileToUpdate = user.file.length > 0;
	try {
		let image = {
			imageUrl: user.imageUrl,
			imageId: user.imageId,
		};

		if (hasFileToUpdate) {
			const uploadedFile = await uploadFile(user.file[0]);
			if (!uploadedFile) throw Error;

			const fileUrl = getFilePreview(uploadedFile.$id);
			if (!fileUrl) {
				await deleteFile(uploadedFile.$id);
				throw Error;
			}

			image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id }
		}

		const updateUser = await databases.updateDocument(
			appwriteConfig.databaseId,
			appwriteConfig.usersCollectionId,
			user.userId,
			{
				name: user.name,
				bio: user.bio,
				imageUrl: image.imageUrl,
				imageId: image.imageId
			}
		);

		if (!updateUser) {
			if (hasFileToUpdate) {
				await deleteFile(image.imageId);
			}

			throw Error;
		}

		if (user.imageId && hasFileToUpdate) {
			await deleteFile(user.imageId);
		}

		return updateUser;
	} catch (e) {
		console.log(e);
	}
}
