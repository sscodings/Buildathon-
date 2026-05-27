import Navbar from "./components/navbar.component";
import { Route, Routes } from "react-router-dom";
import UserAuthForm from "./pages/userAuthForm.page";
import HomePage from "./pages/home.page";
import UserDashboard from "./pages/userDashboard.page";
import NGODashboard from "./pages/ngoDashboard.page";
import ExplorePage from "./pages/explore.page";
import AboutPage from "./pages/about.page";
import VolunteerProfilePage from "./pages/volunteerProfile.page";
import OrganisationProfilePage from "./pages/organisationProfile.page";
import EditProfilePage from "./pages/editProfile.page";
import RequestNGOPage from "./pages/requestNGO.page";
import RequestFormPage from "./pages/requestForm.page";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navbar />}>
        <Route index element={<HomePage />} />
        <Route path="user/:id" element={<VolunteerProfilePage />} />
        <Route path="organisation/:id" element={<OrganisationProfilePage />} />
        <Route path="settings/edit-profile" element={<EditProfilePage />} />
        <Route path="signin" element={<UserAuthForm type="sign-in" />} />
        <Route path="signup" element={<UserAuthForm type="sign-up" />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="request-ngo" element={<RequestNGOPage />} />
        <Route path="request-ngo/form/:orgId" element={<RequestFormPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="user-dashboard" element={<UserDashboard />} />
        <Route path="ngo-dashboard" element={<NGODashboard />} />
      </Route>
    </Routes>
  );
};

export default App;
