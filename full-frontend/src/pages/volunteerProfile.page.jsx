import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import AnimationWrapper from "../common/page-animation";
import { api } from "../common/api";
import { getUser } from "../common/session";

const VolunteerProfilePage = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUser = getUser();

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/user/profile/${id}`);
      setProfile(data);
    } catch (err) {
      toast.error(err.message || "Could not load profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AnimationWrapper>
        <div className="py-12 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <span className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></span>
            <p className="text-gray-500 font-medium">Loading profile...</p>
          </div>
        </div>
      </AnimationWrapper>
    );
  }

  if (!profile) {
    return (
      <AnimationWrapper>
        <div className="py-12 min-h-screen flex items-center justify-center">
          <div className="card p-12 text-center border-dashed border-2 m-auto max-w-lg">
            <i className="fi fi-rr-user-x text-red-200 text-5xl mb-4 block"></i>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
            <p className="text-gray-500 mb-6">The details of this volunteer (ID: {id}) could not be retrieved.</p>
            <Link to={currentUser?.role === "Organisation" ? "/ngo-dashboard" : "/"} className="btn-primary py-2 px-6">
              Go Back
            </Link>
          </div>
        </div>
      </AnimationWrapper>
    );
  }

  return (
    <AnimationWrapper>
      <Toaster position="top-center" />
      <section className="py-10 min-h-screen">
        <div className="max-w-[900px] mx-auto space-y-6">
          
          {/* Top Profile Card */}
          <div className="card relative overflow-hidden">
            {/* Header background banner */}
            <div className="h-32 bg-gradient-to-r from-green-400 to-green-600 w-full absolute top-0 left-0"></div>
            
            <div className="relative pt-16 px-6 pb-6 sm:px-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
              {/* Avatar */}
              <div className="w-32 h-32 rounded-2xl bg-white p-1.5 shadow-xl shrink-0 z-10 relative">
                <div className="w-full h-full bg-green-50 rounded-xl flex items-center justify-center text-4xl font-bold text-green-700">
                  {profile.name?.[0]?.toUpperCase() || "?"}
                </div>
              </div>
              
              {/* Main Info */}
              <div className="flex-1 pb-2">
                <h1 className="text-3xl font-extrabold text-gray-900 display-font mt-2 sm:mt-0">
                  {profile.name}
                </h1>
                <p className="text-gray-500 font-medium flex items-center justify-center sm:justify-start gap-2 mt-1">
                  <i className="fi fi-rr-envelope text-green-500"></i> {profile.email}
                </p>
                {profile.phone && (
                  <p className="text-gray-500 font-medium flex items-center justify-center sm:justify-start gap-2 mt-1">
                    <i className="fi fi-rr-phone-call text-green-500"></i> {profile.phone}
                  </p>
                )}
              </div>
              
              {/* Roles / Badges */}
              <div className="hidden sm:flex flex-col items-end gap-2 pb-2">
                <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5">
                  <i className="fi fi-rr-badge-check"></i> Volunteer
                </span>
                <div className="flex items-center gap-1 text-yellow-500 font-bold">
                  <i className="fi fi-sr-star"></i> {profile.rating > 0 ? profile.rating : "New"}
                </div>
              </div>

              {currentUser?.role === "volunteer" && currentUser?.id === id && (
                <Link to="/settings/edit-profile" className="mb-2 btn-primary !bg-white !text-green-600 border border-green-100 hover:!bg-green-50 shadow-sm px-5 py-2.5 text-sm self-center sm:self-end">
                  <i className="fi fi-rr-edit mr-2"></i>Edit Profile
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Details Sidebar */}
            <div className="space-y-6">
              
              {/* Stats Card */}
              <div className="card p-6">
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Impact Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-black text-blue-600 mb-1">{profile.appliedNeeds?.length || 0}</div>
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Applied</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-black text-green-600 mb-1">{profile.completedNeeds?.length || 0}</div>
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Completed</div>
                  </div>
                </div>
              </div>

              {/* Skills Card */}
              <div className="card p-6">
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Skills</h3>
                {profile.skills && profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm italic">No skills listed yet.</p>
                )}
              </div>
              
              {/* Joined Date */}
              <div className="card p-5 flex items-center gap-3 text-sm text-gray-500">
                <i className="fi fi-rr-calendar-clock text-green-500 text-lg"></i>
                <span>Joined {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Background Details Card */}
              <div className="card p-6 lg:p-8">
                <h3 className="font-bold text-gray-900 mb-5 text-xl flex items-center gap-2">
                  <i className="fi fi-rr-graduation-cap text-green-500"></i> Background & Contact
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Education */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Education</h4>
                    {profile.education ? (
                      <p className="font-medium text-gray-900 flex items-start gap-2">
                        <i className="fi fi-rr-book-alt text-green-400 mt-1"></i> {profile.education}
                      </p>
                    ) : (
                      <p className="text-gray-400 italic text-sm">Not Available</p>
                    )}
                  </div>
                  
                  {/* Profession */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Profession</h4>
                    {profile.profession ? (
                      <p className="font-medium text-gray-900 flex items-start gap-2">
                        <i className="fi fi-rr-briefcase text-green-400 mt-1"></i> {profile.profession}
                      </p>
                    ) : (
                      <p className="text-gray-400 italic text-sm">Not Available</p>
                    )}
                  </div>

                  {/* Location */}
                  <div className="sm:col-span-2">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Location</h4>
                    {profile.location ? (
                      <p className="font-medium text-gray-900 flex items-start gap-2">
                        <i className="fi fi-rr-marker text-green-400 mt-1"></i> {profile.location}
                      </p>
                    ) : (
                      <p className="text-gray-400 italic text-sm">Not Available</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Bio Card */}
              <div className="card p-6 lg:p-8">
                <h3 className="font-bold text-gray-900 mb-4 text-xl flex items-center gap-2">
                  <i className="fi fi-rr-info text-green-500"></i> About
                </h3>
                {profile.bio ? (
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                ) : (
                  <div className="text-center py-6">
                    <span className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mx-auto mb-3">
                      <i className="fi fi-rr-comment-alt"></i>
                    </span>
                    <p className="text-gray-400">This volunteer hasn't added a bio yet.</p>
                  </div>
                )}
              </div>

              {/* Completed Needs List */}
              <div className="card p-6 lg:p-8">
                <h3 className="font-bold text-gray-900 mb-4 text-xl flex items-center gap-2">
                  <i className="fi fi-rr-list-check text-green-500"></i> Past Contributions
                </h3>
                {profile.completedNeeds && profile.completedNeeds.length > 0 ? (
                  <div className="space-y-4">
                    {profile.completedNeeds.map((need, i) => (
                      <div key={i} className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-green-100 hover:bg-green-50/50 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                          <i className="fi fi-rr-star"></i>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{need.title}</h4>
                          <div className="flex gap-3 text-xs text-gray-500 mt-1.5 flex-wrap">
                            <span className="flex items-center gap-1">
                              <i className="fi fi-rr-building"></i> {need.organisation?.name || "Unknown NGO"}
                            </span>
                            <span className="flex items-center gap-1">
                              <i className="fi fi-rr-tag"></i> {need.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">
                    <p className="text-gray-400">No completed contributions yet.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </section>
    </AnimationWrapper>
  );
};

export default VolunteerProfilePage;
