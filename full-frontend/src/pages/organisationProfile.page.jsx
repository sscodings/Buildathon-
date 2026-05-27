import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import AnimationWrapper from "../common/page-animation";
import { api } from "../common/api";
import { getUser } from "../common/session";
import { uploadImage } from "../common/cloudinary";

const OrganisationProfilePage = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentUser = getUser();

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/organisation/profile/${id}`);
      setProfile(data);
    } catch (err) {
      toast.error(err.message || "Could not load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    try {
      let imageUrl = "";
      const imageFile = form.get("image_file");
      if (imageFile && imageFile.size > 0) {
        toast.loading("Uploading image...", { id: "upload" });
        imageUrl = await uploadImage(imageFile);
        toast.success("Image uploaded", { id: "upload" });
      }

      const eventData = {
          title: data.title,
          description: data.description,
          image: imageUrl,
          date: data.date
      };

      await api.authPost("/organisation/events", eventData);
      toast.success("Event posted!");
      setShowEventModal(false);
      fetchProfile();
    } catch (err) {
      toast.error(err.message || "Failed to post event", { id: "upload" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPhoto = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const imageFile = new FormData(e.currentTarget).get("photo_file");
      if (!imageFile || imageFile.size === 0) return toast.error("Please select a file");

      toast.loading("Uploading photo...", { id: "upload" });
      const imageUrl = await uploadImage(imageFile);
      
      // Add to photos array in profile update
      const updatedPhotos = [...(profile.photos || []), imageUrl];
      await api.authPost("/organisation/profile", { photos: updatedPhotos }, "PATCH");
      
      toast.success("Photo added to gallery!", { id: "upload" });
      setShowPhotoModal(false);
      fetchProfile();
    } catch (err) {
      toast.error(err.message || "Failed to add photo", { id: "upload" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await api.delete(`/organisation/events/${eventId}`);
      toast.success("Event deleted");
      fetchProfile();
    } catch (err) {
      toast.error(err.message || "Failed to delete");
    }
  };

  if (loading) {
    return (
      <AnimationWrapper>
        <div className="py-12 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <span className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></span>
            <p className="text-gray-500 font-medium">Loading NGO profile...</p>
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
            <i className="fi fi-rr-building text-red-200 text-5xl mb-4 block"></i>
            <h2 className="text-xl font-bold text-gray-900 mb-2">NGO Not Found</h2>
            <p className="text-gray-500 mb-6">The details of this organisation could not be retrieved.</p>
            <Link to="/" className="btn-primary py-2 px-6">
              Go Home
            </Link>
          </div>
        </div>
      </AnimationWrapper>
    );
  }

  const isOwner = currentUser?.role === "Organisation" && currentUser?.id === id;

  return (
    <AnimationWrapper>
      <Toaster position="top-center" />
      <section className="py-10 min-h-screen">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 space-y-6">
          
          {/* Top Profile Card */}
          <div className="card relative overflow-hidden">
            <div className="h-44 bg-gradient-to-r from-emerald-500 to-teal-600 w-full absolute top-0 left-0"></div>
            
            <div className="relative pt-20 px-6 pb-8 sm:px-10 flex flex-col sm:flex-row items-center sm:items-end gap-x-8 text-center sm:text-left">
              <div className="w-44 h-44 rounded-[2rem] bg-white p-2 shadow-2xl shrink-0 z-10 relative -mt-12 sm:-mt-0 border-4 border-white">
                <div className="w-full h-full bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-6xl font-bold text-emerald-700">
                  {profile.name[0].toUpperCase()}
                </div>
              </div>
              
              <div className="flex-1 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <h1 className="text-4xl font-extrabold text-gray-900 display-font">
                    {profile.name}
                  </h1>
                  <span className="w-fit mx-auto sm:mx-0 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                    {profile.type}
                  </span>
                </div>
                
                <div className="flex flex-wrap justify-center sm:justify-start gap-6 mt-4 text-gray-500 font-semibold text-sm">
                  <span className="flex items-center gap-2"><i className="fi fi-rr-envelope text-emerald-500 text-base"></i> {profile.email}</span>
                  <span className="flex items-center gap-2"><i className="fi fi-rr-phone-call text-emerald-500 text-base"></i> {profile.phone}</span>
                  <span className="flex items-center gap-2"><i className="fi fi-rr-marker text-emerald-500 text-base"></i> {profile.address?.city}, {profile.address?.state}</span>
                </div>
              </div>

              {isOwner && (
                <div className="flex gap-2 mb-4">
                    <Link to="/settings/edit-profile" className="btn-primary !bg-white !text-emerald-600 border border-emerald-100 hover:!bg-emerald-50 shadow-sm px-6 py-3 text-sm font-bold">
                        <i className="fi fi-rr-edit mr-2"></i>Edit
                    </Link>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              
              {/* About Section */}
              <div className="card p-10">
                <h3 className="font-bold text-gray-900 mb-6 text-2xl flex items-center gap-3">
                  <i className="fi fi-rr-info text-emerald-500"></i> Our Story
                </h3>
                <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-wrap">
                  {profile.description}
                </p>

                {/* Gallery Section */}
                <div className="mt-12">
                   <div className="flex items-center justify-between mb-6">
                      <h4 className="font-bold text-gray-900 text-xl flex items-center gap-3">
                        <i className="fi fi-rr-picture text-emerald-500"></i> Gallery
                      </h4>
                      {isOwner && (
                        <button onClick={() => setShowPhotoModal(true)} className="text-emerald-600 font-bold text-sm hover:underline">+ Add Photo</button>
                      )}
                   </div>
                   
                   {profile.photos?.length > 0 ? (
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {profile.photos.map((url, i) => (
                           <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-gray-100 group relative">
                              <img src={url} alt="NGO Work" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                              {isOwner && (
                                <button className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <i className="fi fi-rr-trash"></i>
                                </button>
                              )}
                           </div>
                        ))}
                     </div>
                   ) : (
                     <div className="bg-gray-50 rounded-[2rem] p-8 text-center border-2 border-dashed border-gray-200">
                        <p className="text-gray-400">No photos shared yet.</p>
                     </div>
                   )}
                </div>
              </div>

              {/* Events / Posts Section */}
              <div className="space-y-6">
                 <div className="flex items-center justify-between px-2">
                    <h3 className="font-bold text-gray-900 text-2xl flex items-center gap-3">
                        <i className="fi fi-rr-megaphone text-emerald-500"></i> Latest Updates & Events
                    </h3>
                    {isOwner && (
                        <button onClick={() => setShowEventModal(true)} className="btn-primary py-2 px-5 text-sm !rounded-xl">
                            <i className="fi fi-rr-add mr-2"></i>Create Post
                        </button>
                    )}
                 </div>

                 {profile.events?.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                        {profile.events.map((event, i) => (
                            <div key={i} className="card p-0 overflow-hidden group">
                                {event.image && (
                                    <div className="h-56 overflow-hidden">
                                        <img src={event.image} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="" />
                                    </div>
                                )}
                                <div className="p-8">
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-2xl font-bold text-gray-900">{event.title}</h4>
                                        <span className="text-gray-400 text-sm font-medium">{new Date(event.date).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}</span>
                                    </div>
                                    <p className="text-gray-600 leading-relaxed text-lg mb-6">{event.description}</p>
                                    {isOwner && (
                                        <div className="flex justify-end pt-4 border-t border-gray-100">
                                            <button onClick={() => handleDeleteEvent(event._id)} className="text-red-500 font-bold text-sm hover:underline flex items-center gap-2">
                                                <i className="fi fi-rr-trash"></i> Delete Post
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                 ) : (
                    <div className="card p-12 text-center border-dashed border-2">
                        <i className="fi fi-rr-calendar-exclamation text-gray-200 text-4xl mb-3 block"></i>
                        <p className="text-gray-400">No events or updates posted yet.</p>
                    </div>
                 )}
              </div>
            </div>

            <div className="space-y-8">
              {/* Opportunities Card */}
              <div className="card p-8 border-t-8 border-emerald-500">
                <h3 className="font-bold text-gray-900 text-xl mb-6 flex items-center gap-2">
                    <i className="fi fi-rr-users text-emerald-500"></i> Open Needs
                </h3>
                
                {profile.needs?.filter(n => n.status === "Open").length > 0 ? (
                  <div className="space-y-5">
                    {profile.needs.filter(n => n.status === "Open").map((need, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-gray-50 hover:bg-emerald-50 transition-colors">
                        <h4 className="font-bold text-gray-900 text-sm mb-1">{need.title}</h4>
                        <div className="flex items-center gap-4 text-xs uppercase font-extrabold tracking-wider text-emerald-700 mb-3">
                            <span>{need.category}</span>
                            <span>•</span>
                            <span>{need.requiredCount} positions</span>
                        </div>
                        <Link to="/explore" className="text-xs font-bold text-gray-400 hover:text-emerald-600">VIEW DETAILS →</Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 text-sm py-4">No active openings.</p>
                )}
              </div>

              {/* Verification Info */}
              <div className="card p-8 bg-gradient-to-br from-gray-900 to-emerald-950 text-white border-0">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-2xl text-emerald-400">
                    <i className="fi fi-rr-shield-check"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Verified Entity</h4>
                    <p className="text-emerald-400/90 text-xs font-bold tracking-wider uppercase mt-1">Registration # {profile.registrationNumber}</p>
                  </div>
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-6">
                  SevaConnect has verified the legal existence and registration status of this NGO.
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl">
                        <p className="text-xs uppercase font-extrabold text-emerald-400/70 mb-1">Status</p>
                        <p className="text-sm font-bold">{profile.isVerified ? "Verified" : "Pending"}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl">
                        <p className="text-xs uppercase font-extrabold text-emerald-400/70 mb-1">Since</p>
                        <p className="text-sm font-bold">{new Date(profile.createdAt).getFullYear()}</p>
                    </div>
                </div>
              </div>

              {/* Contact Sidebar */}
              <div className="card p-8 bg-emerald-50 border-emerald-100">
                <h3 className="font-bold text-gray-900 mb-6 text-lg">Location</h3>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                    <i className="fi fi-rr-marker"></i>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed font-medium">
                    {profile.address?.street}, {profile.address?.city}<br/>
                    {profile.address?.state}, {profile.address?.pincode}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PHOTO MODAL */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-[500px] shadow-2xl scale-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Add Photo</h2>
                    <button onClick={() => setShowPhotoModal(false)} className="text-gray-400 hover:text-gray-600"><i className="fi fi-rr-cross"></i></button>
                </div>
                <form onSubmit={handleAddPhoto} className="space-y-5">
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-emerald-400 transition-colors cursor-pointer relative">
                        <input name="photo_file" type="file" accept="image/*" required className="absolute inset-0 opacity-0 cursor-pointer" />
                        <i className="fi fi-rr-cloud-upload text-4xl text-emerald-500 mb-2 block"></i>
                        <p className="text-sm font-bold text-gray-500">Click to upload or drag & drop</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP (Max 5MB)</p>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-4 text-lg">
                        {isSubmitting ? "Uploading..." : "Save to Gallery"}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* EVENT MODAL */}
      {showEventModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-[600px] shadow-2xl scale-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Create New Post/Event</h2>
                    <button onClick={() => setShowEventModal(false)} className="text-gray-400 hover:text-gray-600"><i className="fi fi-rr-cross"></i></button>
                </div>
                <form onSubmit={handleAddEvent} className="space-y-5">
                    <div>
                        <p className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">Post Title</p>
                        <input name="title" required className="input-box bg-gray-50" placeholder="Event Name or Heading" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">Description</p>
                        <textarea name="description" required className="input-box bg-gray-50 h-32 resize-none pt-4" placeholder="Tell the community what's happening..."></textarea>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">Image (Optional)</p>
                        <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                            <input name="image_file" type="file" accept="image/*" className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">Event Date</p>
                        <input name="date" type="date" className="input-box bg-gray-50" defaultValue={new Date().toISOString().split('T')[0]} />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-4 text-lg">
                        {isSubmitting ? "Posting..." : "Publish to Profile"}
                    </button>
                </form>
            </div>
        </div>
      )}
    </AnimationWrapper>
  );
};

export default OrganisationProfilePage;
