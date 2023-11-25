import {useGetUsers} from "@/lib/react-query/queriesAndMutations.ts";
import {useToast} from "@/components/ui/use-toast.ts";
import Loader from "@/components/shared/Loader.tsx";
import UserCard from "@/components/shared/UserCard.tsx";

const AllUsers = () => {
	const {toast} = useToast();
	const { data: creators, isPending, isError} = useGetUsers();

	if (isError) {
		toast({ title: 'Something went wrong.' })
	}

	return (
		<div className="common-container">
			<div className="user-container">
				<h2 className="h3-bold md:h2-bold text-left w-full">All Users</h2>
				{isPending && !creators ? (
					<Loader />
				) : (
					<ul className="user-grid">
						{creators?.pages.map(item => item?.documents.map(creator => (
							<li key={creator.$id} className="flex-1 min-w-[200px] w-full">
								<UserCard user={creator} />
							</li>
						)))}
					</ul>
				)}
			</div>
		</div>
	)
}

export default AllUsers;
