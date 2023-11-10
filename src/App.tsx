import './global.css';
import {Route, Routes} from "react-router-dom";
import SigninForm from "./_auth/forms/SigninForm.tsx";
import SignupForm from "./_auth/forms/SignupForm.tsx";
import {Home} from "./_root/pages";
import AuthLayout from "./_auth/AuthLayout.tsx";
import RootLayout from "./_root/RootLayout.tsx";

const App = () => {
	return (
		<main className="flex h-screen">
			<Routes>
				{/* public routes */}
				<Route element={<AuthLayout />}>
					<Route path="sign-in" element={<SigninForm />} />
					<Route path="sign-up" element={<SignupForm />} />
				</Route>

				{/* private routes */}
				<Route element={<RootLayout />}>
					<Route index element={<Home />} />
				</Route>
			</Routes>
		</main>
	)
}

export default App;
