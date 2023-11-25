import {useGetSavedPost} from "@/lib/react-query/queriesAndMutations.ts";
import {useUserContext} from "@/context/AuthContext.tsx";
import Loader from "@/components/shared/Loader.tsx";
import GridPostList from "@/components/shared/GridPostList.tsx";

const AllUsers = () => {
	const { user } = useUserContext();
	const { data: savedPosts, isPending } = useGetSavedPost(user.id)
	console.log('data', savedPosts);

	return (
		<div className="saved-container">
			<div className="flex gap-2 w-full max-w-5xl">
				<img
					src="/assets/icons/save.svg"
					width={36}
					height={36}
					alt="edit"
					className="invert-white"
				/>
				<h2 className="h3-bold md:h2-bold text-left w-full">Saved Posts</h2>
			</div>

			{!isPending && !savedPosts ? (
				<Loader />
			) : (
				<ul className="w-full flex justify-center max-w-5xl gap-9">
					{savedPosts && savedPosts.total === 0 ? (
						<p className="text-light-4">No available posts</p>
					) : (
						<GridPostList posts={savedPosts?.documents.map(item => ({
							...item.post,
							creator: item.user
						}))} showStats={false} />
					)}
				</ul>
			)}
		</div>
	)
}

export default AllUsers;
