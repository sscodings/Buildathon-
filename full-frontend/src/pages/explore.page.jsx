import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import AnimationWrapper from "../common/page-animation";
import { api } from "../common/api";
import { isLoggedIn, getUser } from "../common/session";

const CATEGORIES = ["All", "Volunteer", "Donation", "Event", "Other"];

const NeedCard = ({ need, onApply, onView }) => {
  const daysLeft = need.deadline ? Math.max(0, Math.ceil((new Date(need.deadline) - Date.now()) / 86400000)) : null;
  return (
    <div className="card p-6 flex flex-col gap-4 hover:border-emerald-200 transition-all group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-open">{need.category}</span>
            {daysLeft !== null && (
                <span className={`text-xs px-2.5 py-1 rounded-md font-extrabold uppercase tracking-wider ${daysLeft < 3 ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"}`}>
                    {daysLeft === 0 ? "Ends today" : `${daysLeft} days left`}
                </span>
            )}
          </div>
          <h3 className="font-bold text-xl text-gray-900 leading-tight group-hover:text-emerald-700 transition-colors cursor-pointer" onClick={() => onView(need)}>
            {need.title}
          </h3>
          <Link to={`/organisation/${need.organisation?._id}`} className="inline-flex items-center gap-1.5 text-emerald-600 text-sm font-bold mt-2 hover:underline">
            <i className="fi fi-rr-building text-xs"></i>
            {need.organisation?.name}
          </Link>
        </div>
      </div>

      <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
        {need.description}
      </p>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100/50">
        <div className="flex items-center gap-4 text-xs text-gray-500 font-bold uppercase tracking-wider">
          {need.location?.city && (
            <span className="flex items-center gap-1.5"><i className="fi fi-rr-marker text-emerald-600 text-sm"></i>{need.location.city}</span>
          )}
          <span className="flex items-center gap-1.5"><i className="fi fi-rr-users text-emerald-600 text-sm"></i>{need.requiredCount} needed</span>
        </div>
        <div className="flex gap-2">
            <button onClick={() => onView(need)} className="p-2.5 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors">
                <i className="fi fi-rr-eye"></i>
            </button>
            <button onClick={() => onApply(need._id)} className="bg-emerald-600 text-white text-xs px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 shadow-md shadow-emerald-100 transition-all active:scale-95">
                Apply Now
            </button>
        </div>
      </div>
    </div>
  );
};

const NeedDetailModal = ({ need, onClose, onApply }) => {
    if (!need) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-[2.5rem] w-full max-w-[650px] overflow-hidden shadow-2xl scale-in" onClick={e => e.stopPropagation()}>
                <div className="relative h-32 bg-gradient-to-r from-emerald-500 to-teal-600">
                    <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors">
                        <i className="fi fi-rr-cross"></i>
                    </button>
                </div>
                
                <div className="px-10 pb-10 -mt-10 relative">
                    <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-3xl mb-6">
                        <div className="w-full h-full rounded-2xl bg-emerald-50 flex items-center justify-center font-bold text-emerald-600">
                            {need.category[0]}
                        </div>
                    </div>

                    <div className="flex justify-between items-start gap-4 mb-4">
                        <h2 className="text-3xl font-extrabold text-gray-900 leading-tight">{need.title}</h2>
                        <span className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shrink-0">
                            {need.category}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 text-emerald-600 mb-8">
                        <Link to={`/organisation/${need.organisation?._id}`} className="flex items-center gap-2 font-bold hover:underline">
                            <i className="fi fi-rr-building"></i> {need.organisation?.name}
                        </Link>
                        <span className="text-gray-200">|</span>
                        <span className="flex items-center gap-2 text-gray-500 font-medium text-sm">
                            <i className="fi fi-rr-calendar"></i> Posted {new Date(need.createdAt).toLocaleDateString()}
                        </span>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <p className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3">Goal & Description</p>
                            <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-wrap">{need.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6 bg-gray-50 rounded-3xl p-6">
                            <div>
                                <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">Target Count</p>
                                <p className="font-bold text-gray-900 text-base">{need.requiredCount} positions</p>
                            </div>
                            <div>
                                <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">Location</p>
                                <p className="font-bold text-gray-900 text-base">{need.location?.city}, {need.location?.state}</p>
                            </div>
                            <div>
                                <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">Deadline</p>
                                <p className="font-bold text-red-500 text-base">{new Date(need.deadline).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">Verification</p>
                                <p className="font-bold text-emerald-600 text-base">Active Listing</p>
                            </div>
                        </div>

                        {need.skillsRequired?.length > 0 && (
                            <div>
                                <p className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3">Skills Desired</p>
                                <div className="flex flex-wrap gap-2">
                                    {need.skillsRequired.map((s, i) => (
                                        <span key={i} className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold">{s}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 mt-10">
                        <button onClick={() => onApply(need._id)} className="flex-1 btn-primary py-4 text-lg shadow-xl shadow-emerald-100">
                           <i className="fi fi-rr-paper-plane mr-2"></i> Apply Now
                        </button>
                        <Link to={`/organisation/${need.organisation?._id}`} className="px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors">
                            View NGO Profile
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ExplorePage = () => {
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedNeed, setSelectedNeed] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "All");

  useEffect(() => {
    fetchNeeds();
  }, [search]);

  const fetchNeeds = async () => {
    setLoading(true);
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const data = await api.get(`/user/all${params}`);
      setNeeds(data);
    } catch (err) {
      toast.error("Could not load opportunities");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (needId) => {
    if (!isLoggedIn()) {
      toast("Please login to apply", { icon: "🔒" });
      navigate("/signin");
      return;
    }
    const user = getUser();
    if (user?.role === "Organisation") {
      toast.error("Organisations cannot apply to needs");
      return;
    }
    try {
      await api.authPost(`/user/apply/${needId}`, {});
      toast.success("Applied successfully!", { icon: "🚀" });
      setSelectedNeed(null);
      fetchNeeds();
    } catch (err) {
      toast.error(err.message || "Could not apply");
    }
  };

  const filtered = activeCategory === "All" ? needs : needs.filter(n => n.category === activeCategory);

  return (
    <AnimationWrapper>
      <Toaster position="top-center" />
      
      {selectedNeed && (
          <NeedDetailModal 
            need={selectedNeed} 
            onClose={() => setSelectedNeed(null)} 
            onApply={handleApply} 
          />
      )}

      <section className="py-10 min-h-screen">
        {/* Header */}
        <div className="max-w-[1000px] mx-auto px-6 mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="max-w-[500px]">
                <h1 className="display-font text-5xl font-black text-gray-900 leading-tight">Explore the <span className="text-emerald-600">Impact</span></h1>
                <p className="text-gray-500 mt-4 text-lg font-medium">Join hands with verified NGOs and create lasting change in society.</p>
              </div>
              <div className="flex gap-2 bg-gray-50 p-1.5 rounded-2xl">
                 {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)}
                        className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeCategory === cat ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400 hover:text-emerald-700"}`}>
                        {cat}
                    </button>
                ))}
              </div>
          </div>

          {/* Search */}
          <div className="relative mt-8">
            <i className="fi fi-rr-search absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500 text-xl"></i>
            <input
              type="text"
              placeholder="Search causes, skills, or organisations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-[2rem] pl-16 pr-6 py-6 border-2 border-transparent bg-gray-50 focus:outline-none focus:border-emerald-200 focus:bg-white shadow-sm text-gray-800 text-lg transition-all"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="max-w-[1000px] mx-auto px-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="card p-8 animate-pulse bg-gray-50/50 rounded-[2.5rem] h-64 shadow-none border-gray-100"></div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-200">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl shadow-xl">
                <i className="fi fi-rr-search text-emerald-200"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No matching causes</h3>
              <p className="text-gray-400">Try refining your search or changing the category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
              {filtered.map(need => (
                <NeedCard key={need._id} need={need} onApply={handleApply} onView={(n) => setSelectedNeed(n)} />
              ))}
            </div>
          )}
        </div>
      </section>
    </AnimationWrapper>
  );
};

export default ExplorePage;
