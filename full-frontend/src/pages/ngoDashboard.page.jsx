import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import AnimationWrapper from "../common/page-animation";
import { api } from "../common/api";
import { getUser, isLoggedIn, clearSession } from "../common/session";
import MapPicker from "../components/mapPicker.component";

const CATEGORIES = ["Volunteer", "Donation", "Event", "Other"];

const PostNeedModal = ({ onClose, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", category: "Volunteer",
    city: "", state: "", skillsRequired: "", requiredCount: 1,
    deadline: ""
  });

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleLocationSelect = (data) => {
    setForm(f => ({ ...f, city: data.city, state: data.state }));
    toast.success(`Location set: ${data.city}`, { icon: '📍', id: 'loc' });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.deadline) { toast.error("Please set a deadline"); return; }
    setLoading(true);
    try {
      await api.authPost("/organisation/create", {
        title: form.title,
        description: form.description,
        category: form.category,
        location: { city: form.city, state: form.state },
        skillsRequired: form.skillsRequired.split(",").map(s => s.trim()).filter(Boolean),
        requiredCount: Number(form.requiredCount),
        deadline: form.deadline,
      });
      toast.success("Need posted successfully!");
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.message || "Could not post need");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[540px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-7">
          <div className="flex items-center justify-between mb-6">
            <h2 className="display-font text-2xl font-bold">Post a New Need</h2>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200">
              <i className="fi fi-rr-cross text-sm text-gray-600"></i>
            </button>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Title *</label>
              <input name="title" required value={form.title} onChange={handle} placeholder="e.g. Blood Donation Drive"
                className="input-box pl-4" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Description *</label>
              <textarea name="description" required value={form.description} onChange={handle} rows={3}
                placeholder="Describe the need in detail..." className="input-box pl-4 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Category *</label>
                <select name="category" value={form.category} onChange={handle} className="input-box pl-4">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Volunteers Needed</label>
                <input name="requiredCount" type="number" min={1} value={form.requiredCount} onChange={handle} className="input-box pl-4" />
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-sm font-semibold text-gray-700 block">Pick Location *</label>
              <MapPicker onLocationSelect={handleLocationSelect} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">City</label>
                    <input name="city" value={form.city} onChange={handle} placeholder="City name" className="input-box pl-4" />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">State</label>
                    <input name="state" value={form.state} onChange={handle} placeholder="State name" className="input-box pl-4" />
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Skills Required</label>
              <input name="skillsRequired" value={form.skillsRequired} onChange={handle} placeholder="Teaching, Communication (comma-separated)" className="input-box pl-4" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Deadline *</label>
              <input name="deadline" type="date" required value={form.deadline} onChange={handle}
                min={new Date().toISOString().split("T")[0]} className="input-box pl-4" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 mt-2 disabled:opacity-60">
              {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Posting...</> : "Post Need"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const NGODashboard = () => {
  const [activeTab, setActiveTab] = useState("needs");
  const [needs, setNeeds] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedNeed, setSelectedNeed] = useState(null);
  const [reviewLoading, setReviewLoading] = useState({});
  const [reviewRequestLoading, setReviewRequestLoading] = useState({});
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    if (!isLoggedIn()) { navigate("/signin"); return; }
    if (user?.role !== "Organisation") { navigate("/user-dashboard"); return; }
    fetchNeeds();
    fetchRequests();
  }, []);

  const fetchNeeds = async () => {
    setLoading(true);
    try {
      const data = await api.get("/organisation/my-needs");
      setNeeds(data);
    } catch (err) {
      toast.error("Could not load needs");
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const data = await api.get("/organisation/requests");
      setRequests(data);
    } catch (err) {
      toast.error("Could not load requests");
    } finally {
      setLoadingRequests(false);
    }
  };

  const reviewApplicant = async (needId, userId, status) => {
    const key = `${needId}-${userId}`;
    setReviewLoading(r => ({ ...r, [key]: true }));
    try {
      await api.authPost(`/organisation/needs/${needId}/applicant/${userId}`, { status });
      toast.success(status === "accepted" ? "Volunteer approved!" : "Application declined");
      const updatedNeeds = await api.get("/organisation/my-needs");
      setNeeds(updatedNeeds);
      if (selectedNeed?._id === needId) {
        setSelectedNeed(updatedNeeds.find(n => n._id === needId) || null);
      }
    } catch (err) {
      toast.error(err.message || "Could not update status");
    } finally {
      setReviewLoading(r => ({ ...r, [key]: false }));
    }
  };

  const reviewRequest = async (requestId, status) => {
    setReviewRequestLoading(r => ({ ...r, [requestId]: true }));
    try {
      await api.authPost(`/organisation/requests/${requestId}/status`, { status });
      toast.success(status === "accepted" ? "Request approved!" : "Request declined");
      fetchRequests();
    } catch (err) {
      toast.error(err.message || "Could not update status");
    } finally {
      setReviewRequestLoading(r => ({ ...r, [requestId]: false }));
    }
  };

  const totalApplicants = needs.reduce((s, n) => s + (n.applicants?.length || 0), 0);
  const pendingApplicants = needs.reduce((s, n) => s + (n.applicants?.filter(a => a.status === "pending").length || 0), 0);
  const acceptedApplicants = needs.reduce((s, n) => s + (n.applicants?.filter(a => a.status === "accepted").length || 0), 0);
  const pendingRequests = requests.filter(r => r.status === "pending").length;

  return (
    <AnimationWrapper>
      <Toaster position="top-center" />
      {showModal && <PostNeedModal onClose={() => setShowModal(false)} onCreated={fetchNeeds} />}

      <section className="py-8 min-h-screen">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="display-font text-3xl font-bold text-gray-900">
              {user?.name} Dashboard
            </h1>
            <p className="text-gray-500 mt-1">Manage your needs and volunteers</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2 text-sm py-2.5 px-5 shadow-lg shadow-green-200">
            <i className="fi fi-rr-plus"></i>Post New Need
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Active Needs", value: needs.filter(n => n.status === "Open").length, icon: "fi-rr-list-check", color: "text-green-600 bg-green-50" },
            { label: "Total Applicants", value: totalApplicants, icon: "fi-rr-users", color: "text-blue-600 bg-blue-50" },
            { label: "Pending Volunteers", value: pendingApplicants, icon: "fi-rr-clock", color: "text-yellow-600 bg-yellow-50" },
            { label: "Fest Requests", value: pendingRequests, icon: "fi-rr-star", color: "text-purple-600 bg-purple-50" },
            { label: "Approved Volunteers", value: acceptedApplicants, icon: "fi-rr-check-circle", color: "text-emerald-600 bg-emerald-50" },
          ].map((stat, i) => (
            <div key={i} className="card p-5">
              <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                <i className={`fi ${stat.icon}`}></i>
              </div>
              <div className="text-2xl font-bold text-gray-900">{loading ? "—" : stat.value}</div>
              <div className="text-gray-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-6 border-b border-gray-100 mb-8 pb-px">
          <button
            onClick={() => setActiveTab("needs")}
            className={`pb-4 text-sm font-extrabold uppercase tracking-wider transition-all relative ${
              activeTab === "needs"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Volunteer Openings & Applicants
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`pb-4 text-sm font-extrabold uppercase tracking-wider transition-all relative flex items-center gap-2 ${
              activeTab === "requests"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Fest / Partnership Requests
            {pendingRequests > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                {pendingRequests}
              </span>
            )}
          </button>
        </div>

        {activeTab === "needs" ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Needs list */}
            <div className="lg:col-span-2">
              <h2 className="font-bold text-lg text-gray-900 mb-4">Your Posted Needs</h2>
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="card p-4 h-20 animate-pulse bg-gray-50"></div>)}
                </div>
              ) : needs.length === 0 ? (
                <div className="card p-8 text-center border-dashed border-2">
                  <i className="fi fi-rr-list-check text-green-200 text-3xl mb-3 block"></i>
                  <p className="text-gray-500 text-sm mb-3">You haven't posted any needs yet.</p>
                  <button onClick={() => setShowModal(true)} className="btn-primary text-sm py-2 px-4">Post Your First Need</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {needs.map(need => {
                    const pending = need.applicants?.filter(a => a.status === "pending").length || 0;
                    const isSelected = selectedNeed?._id === need._id;
                    return (
                      <button key={need._id} onClick={() => setSelectedNeed(isSelected ? null : need)}
                        className={`w-full text-left card p-4 transition-all ${isSelected ? "border-green-400 bg-green-50/50 shadow-md" : "hover:border-green-200"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{need.title}</h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="badge-open">{need.category}</span>
                              {need.location?.city && (
                                <span className="text-xs text-gray-400"><i className="fi fi-rr-marker mr-1"></i>{need.location.city}</span>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            {pending > 0 && (
                              <span className="inline-flex items-center justify-center w-6 h-6 bg-yellow-400 text-white text-xs font-bold rounded-full">{pending}</span>
                            )}
                            <div className="text-xs text-gray-400 mt-1">{need.applicants?.length || 0} total</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Applicants panel */}
            <div className="lg:col-span-3">
              <h2 className="font-bold text-lg text-gray-900 mb-4">
                {selectedNeed ? `Applicants for "${selectedNeed.title}"` : "Select a need to see applicants"}
              </h2>

              {!selectedNeed ? (
                <div className="card p-12 text-center flex flex-col items-center gap-3 min-h-[300px] justify-center border-dashed border-2">
                  <i className="fi fi-rr-arrow-left text-green-200 text-3xl"></i>
                  <p className="text-gray-400 text-sm">Click on any posted need to see its applicants and take action.</p>
                </div>
              ) : selectedNeed.applicants?.length === 0 ? (
                <div className="card p-12 text-center min-h-[300px] flex flex-col items-center justify-center">
                  <i className="fi fi-rr-users text-green-200 text-3xl mb-3 block"></i>
                  <p className="text-gray-500 text-sm">No one has applied to this need yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedNeed.applicants.map((app, i) => {
                    const key = `${selectedNeed._id}-${app.user?._id}`;
                    const busy = reviewLoading[key];
                    return (
                      <div key={i} className="card p-5">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-3">
                            <Link to={`/user/${app.user?._id}`} className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center font-bold hover:bg-green-200 transition-colors">
                              {app.user?.name?.[0]?.toUpperCase() || "?"}
                            </Link>
                            <div>
                              <Link to={`/user/${app.user?._id}`} className="font-semibold text-gray-900 hover:text-green-600 hover:underline">{app.user?.name || "Unknown"}</Link>
                              <div className="text-gray-400 text-xs">{app.user?.email}</div>
                              {app.user?.skills?.length > 0 && (
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  {app.user.skills.slice(0, 3).map((s, si) => (
                                    <span key={si} className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-md">{s}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {app.status === "pending" ? (
                              <>
                                <button onClick={() => reviewApplicant(selectedNeed._id, app.user?._id, "accepted")} disabled={busy}
                                  className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center gap-1.5">
                                  {busy ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <i className="fi fi-rr-check"></i>}
                                  Approve
                                </button>
                                <button onClick={() => reviewApplicant(selectedNeed._id, app.user?._id, "rejected")} disabled={busy}
                                  className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-50 flex items-center gap-1.5">
                                  <i className="fi fi-rr-cross"></i>Decline
                                </button>
                              </>
                            ) : (
                              <span className={app.status === "accepted" ? "badge-accepted" : "badge-rejected"}>
                                {app.status === "accepted" ? "Approved" : "Declined"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="font-bold text-lg text-gray-900 mb-4">Fest & Collaboration Requests</h2>
            {loadingRequests ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="card p-8 h-28 animate-pulse bg-gray-50"></div>)}
              </div>
            ) : requests.length === 0 ? (
              <div className="card p-12 text-center border-dashed border-2">
                <i className="fi fi-rr-star text-green-200 text-3xl mb-3 block"></i>
                <p className="text-gray-500 text-sm">No collaboration requests received yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 pb-20">
                {requests.map((req) => {
                  const busy = reviewRequestLoading[req._id];
                  return (
                    <div key={req._id} className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                            {req.typeOfFest}
                          </span>
                          <span className="text-gray-400 text-sm font-semibold flex items-center gap-1.5">
                            <i className="fi fi-rr-calendar text-green-600"></i>
                            {new Date(req.date).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
                          </span>
                        </div>
                        <p className="text-gray-600 text-base leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
                          <strong className="text-gray-800 text-xs block mb-1 uppercase tracking-wider">Requirements & Context:</strong>
                          {req.requirements}
                        </p>
                        <div className="flex items-center gap-2">
                          <Link to={`/user/${req.user?._id}`} className="w-8 h-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center font-bold hover:bg-green-100 text-xs transition-colors">
                            {req.user?.name?.[0]?.toUpperCase()}
                          </Link>
                          <span className="text-gray-500 text-sm font-semibold">
                            Requested by <Link to={`/user/${req.user?._id}`} className="text-green-600 hover:underline">{req.user?.name}</Link> ({req.user?.email})
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-3">
                        {req.status === "pending" ? (
                          <>
                            <button onClick={() => reviewRequest(req._id, "accepted")} disabled={busy}
                              className="bg-green-600 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors shadow-md shadow-green-100 active:scale-95">
                              {busy ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <i className="fi fi-rr-check"></i>}
                              Accept Partnership
                            </button>
                            <button onClick={() => reviewRequest(req._id, "rejected")} disabled={busy}
                              className="bg-red-500 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-50 flex items-center gap-1.5 transition-colors shadow-md shadow-red-100 active:scale-95">
                              <i className="fi fi-rr-cross"></i>Decline
                            </button>
                          </>
                        ) : (
                          <span className={req.status === "accepted" ? "badge-accepted text-base px-4 py-2" : "badge-rejected text-base px-4 py-2"}>
                            {req.status === "accepted" ? "Partnered" : "Declined"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </AnimationWrapper>
  );
};

export default NGODashboard;