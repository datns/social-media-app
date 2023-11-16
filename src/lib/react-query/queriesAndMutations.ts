import {useMutation} from "@tanstack/react-query";
import {INewUser} from "@/types";
import {createUserAccount, signInAccount} from "@/lib/appwrite/api.ts";

export const useCreateUserAccount = () => {
	return useMutation({
		mutationFn: (user: INewUser) => createUserAccount(user)
	})
}

export const useSignInAccount = () => {
	return useMutation({
		mutationFn: (user: {
			email: string;
			password: string;
		}) => signInAccount(user)
	})
}
