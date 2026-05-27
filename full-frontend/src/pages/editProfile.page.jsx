import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import AnimationWrapper from "../common/page-animation";
import InputBox from "../components/input.component";
import MapPicker from "../components/mapPicker.component";
import { api } from "../common/api";
import { getUser } from "../common/session";

const EditProfilePage = () => {
    const navigate = useNavigate();
    const user = getUser();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({});
    
    // Form state for location fields that need manual sync with map
    const [locationData, setLocationData] = useState({
        city: "",
        state: "",
        country: "India"
    });

    useEffect(() => {
        if (!user) {
            navigate("/signin");
            return;
        }
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const endpoint = user.role === "Organisation" 
                ? `/organisation/profile/${user.id}` 
                : `/user/profile/${user.id}`;
            const data = await api.get(endpoint);
            setProfile(data);
            
            if (user.role === "Organisation" && data.address) {
                setLocationData({
                    city: data.address.city || "",
                    state: data.address.state || "",
                    country: data.address.country || "India"
                });
            } else if (user.role === "volunteer" && data.location) {
                // If volunteer has "City, State" string, we just keep it
            }
        } catch (err) {
            toast.error("Could not fetch profile details");
        } finally {
            setLoading(false);
        }
    };

    const handleLocationSelect = (data) => {
        setLocationData({
            city: data.city || "",
            state: data.state || "",
            country: data.country || "India"
        });
        toast.success(`Location picked: ${data.city || data.display_name.split(',')[0]}`, { icon: "📍" });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);

        const form = new FormData(e.currentTarget);
        const data = Object.fromEntries(form.entries());

        // For NGO address structure
        if (user.role === "Organisation") {
            data.address = {
                street: data.street,
                city: locationData.city || data.city, // Prefer state from map picker
                state: locationData.state || data.state,
                pincode: data.pincode,
                country: locationData.country || data.country
            };
            delete data.street;
            delete data.city;
            delete data.state;
            delete data.pincode;
            delete data.country;
        }

        // For Volunteer skills (comma separated string to array)
        if (user.role === "volunteer") {
            if (typeof data.skills === "string") {
                data.skills = data.skills.split(",").map(s => s.trim()).filter(s => s.length > 0);
            }
            // Use picked location if available
            if (locationData.city) {
                data.location = `${locationData.city}, ${locationData.state}`;
            }
            // The textarea is named "description" in the form but the backend field is "bio"
            if ("description" in data) {
                data.bio = data.description;
                delete data.description;
            }
        }

        try {
            const endpoint = user.role === "Organisation" ? "/organisation/profile" : "/user/profile";
            await api.authPost(endpoint, data, "PATCH");

            toast.success("Profile updated!");
            
            setTimeout(() => {
                navigate(user.role === "Organisation" ? `/organisation/${user.id}` : `/user/${user.id}`);
            }, 1000);

        } catch (err) {
            toast.error(err.message || "Something went wrong");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="py-20 text-center flex flex-col items-center gap-4">
            <span className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></span>
            <p className="text-gray-500 font-medium font-inter">Loading profile...</p>
        </div>;
    }

    return (
        <AnimationWrapper>
            <Toaster position="top-center" />
            <section className="py-10 min-h-[calc(100vh-80px)] flex flex-col items-center">
                <div className="w-full max-w-[700px] px-6">
                    <div className="mb-10 text-center sm:text-left">
                        <h1 className="text-4xl font-extrabold text-gray-900 display-font">Edit Profile</h1>
                        <p className="text-gray-500 mt-2 font-medium">Keep your identity and location up to date.</p>
                    </div>

                    <form onSubmit={handleUpdate} className="space-y-8">
                        <div className="card p-8 lg:p-10 space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4 mb-6 flex items-center gap-2">
                                <i className="fi fi-rr-settings text-green-600"></i> Basic Information
                            </h2>

                            <InputBox name="name" type="text" placeholder="Full Name" defaultValue={profile.name} icon="fi-rr-user" />
                            
                            <div className="relative w-full">
                                <textarea 
                                    name="description" 
                                    placeholder={user.role === "Organisation" ? "Our Mission & Story" : "Your Bio"} 
                                    defaultValue={user.role === "Organisation" ? profile.description : profile.bio}
                                    className="input-box pl-12 h-36 resize-none pt-4 bg-gray-50/50"
                                />
                                <i className="fi fi-rr-info input-icon top-4"></i>
                            </div>

                            <InputBox name="phone" type="tel" placeholder="Contact Phone" defaultValue={profile.phone} icon="fi-rr-phone-call" />

                            <div className="pt-6 border-t border-gray-50">
                                <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4 mb-6 flex items-center gap-2">
                                    <i className="fi fi-rr-marker text-green-600"></i> Location Details
                                </h2>
                                
                                <p className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-widest px-1">Pick on Map</p>
                                <MapPicker onLocationSelect={handleLocationSelect} />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
                                    <InputBox name="city" type="text" placeholder="City" value={locationData.city} onChange={(e) => setLocationData({...locationData, city: e.target.value})} icon="fi-rr-city" />
                                    <InputBox name="state" type="text" placeholder="State" value={locationData.state} onChange={(e) => setLocationData({...locationData, state: e.target.value})} icon="fi-rr-map" />
                                </div>
                                {user.role === "Organisation" && (
                                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
                                        <InputBox name="street" type="text" placeholder="Street Address" defaultValue={profile.address?.street} icon="fi-rr-marker" />
                                        <InputBox name="pincode" type="text" placeholder="Pincode" defaultValue={profile.address?.pincode} icon="fi-rr-hashtag" />
                                   </div>
                                )}
                            </div>

                            {user.role === "volunteer" ? (
                                <div className="pt-6 border-t border-gray-50">
                                    <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4 mb-6 flex items-center gap-2">
                                        <i className="fi fi-rr-graduation-cap text-green-600"></i> Qualifications
                                    </h2>
                                    <div className="space-y-5">
                                        <InputBox name="education" type="text" placeholder="Education" defaultValue={profile.education} icon="fi-rr-book-alt" />
                                        <InputBox name="profession" type="text" placeholder="Current Profession" defaultValue={profile.profession} icon="fi-rr-briefcase" />
                                        <InputBox name="skills" type="text" placeholder="Skills (comma separated, e.g. Teaching, Coding)" defaultValue={profile.skills?.join(", ")} icon="fi-rr-star" />
                                    </div>
                                </div>
                            ) : (
                                <div className="pt-6 border-t border-gray-50">
                                    <p className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-widest px-1">NGO Type</p>
                                    <select name="type" defaultValue={profile.type} className="input-box bg-gray-50 font-medium">
                                        <option value="Education">Education</option>
                                        <option value="Healthcare">Healthcare</option>
                                        <option value="Environment">Environment</option>
                                        <option value="Animal Welfare">Animal Welfare</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button 
                                type="submit" 
                                disabled={saving} 
                                className="btn-primary flex-1 py-5 text-xl shadow-lg shadow-green-100"
                            >
                                {saving ? (<span className="flex items-center justify-center gap-2">
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Saving Changes...
                                </span>) : "Update Profile"}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => navigate(-1)} 
                                className="bg-gray-100 text-gray-600 px-10 py-5 rounded-2xl font-bold hover:bg-gray-200 transition-all border border-gray-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </section>
        </AnimationWrapper>
    );
};

export default EditProfilePage;
