import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import AnimationWrapper from "../common/page-animation";
import { api } from "../common/api";
import { getUser, isLoggedIn, clearSession } from "../common/session";

const StatusBadge = ({ status }) => {
  const map = { pending: "badge-pending", accepted: "badge-accepted", rejected: "badge-rejected" };
  return <span className={map[status] || "badge-pending"}>{status?.charAt(0).toUpperCase() + status?.slice(1) || "Pending"}</span>;
};

const UserDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("applications");
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    if (!isLoggedIn()) { navigate("/signin"); return; }
    if (user?.role === "Organisation") { navigate("/ngo-dashboard"); return; }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [apps, opps] = await Promise.all([
        api.get("/user/my-applications"),
        api.get("/user/all"),
      ]);
      setApplications(apps);
      setOpportunities(opps.slice(0, 6));
    } catch (err) {
      toast.error("Could not load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (needId) => {
    try {
      await api.authPost(`/user/apply/${needId}`, {});
      toast.success("Applied successfully!");
      fetchData();
    } catch (err) {
      toast.error(err.message || "Could not apply");
    }
  };

  const appliedIds = new Set(applications.map(a => a.need?._id));
  const approved = applications.filter(a => a.status === "accepted").length;
  const pending = applications.filter(a => a.status === "pending").length;

  return (
    <AnimationWrapper>
      <Toaster position="top-center" />
      <section className="py-8 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="display-font text-3xl font-bold text-gray-900">
              Welcome back, {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-gray-500 mt-1">Your volunteer journey at a glance</p>
          </div>
          <Link to="/explore" className="btn-primary text-sm py-2.5 px-5">
            <i className="fi fi-rr-search mr-2"></i>Find Opportunities
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Applied", value: applications.length, icon: "fi-rr-paper-plane", color: "text-blue-600 bg-blue-50" },
            { label: "Approved", value: approved, icon: "fi-rr-check-circle", color: "text-green-600 bg-green-50" },
            { label: "Pending", value: pending, icon: "fi-rr-clock", color: "text-yellow-600 bg-yellow-50" },
            { label: "Completed", value: approved, icon: "fi-rr-star", color: "text-purple-600 bg-purple-50" },
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

        {/* Tab Switch */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
          {["applications", "explore"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {t === "applications" ? "My Applications" : "Browse Needs"}
            </button>
          ))}
        </div>

        {/* Applications Tab */}
        {tab === "applications" && (
          loading ? (
            <div className="card overflow-hidden">
              <div className="animate-pulse p-6 space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg"></div>)}
              </div>
            </div>
          ) : applications.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
                <i className="fi fi-rr-paper-plane text-green-300"></i>
              </div>
              <h3 className="font-bold text-gray-700 mb-2">No applications yet</h3>
              <p className="text-gray-400 text-sm mb-5">Start exploring and apply to opportunities that match your skills.</p>
              <Link to="/explore" className="btn-primary text-sm py-2.5 px-5 inline-block">Explore Now</Link>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-5 py-4 font-semibold text-gray-700">Opportunity</th>
                      <th className="px-5 py-4 font-semibold text-gray-700">NGO</th>
                      <th className="px-5 py-4 font-semibold text-gray-700">Category</th>
                      <th className="px-5 py-4 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-5 py-4 font-medium text-gray-900">{app.need?.title || "—"}</td>
                        <td className="px-5 py-4 text-gray-500">{app.need?.organisation?.name || "—"}</td>
                        <td className="px-5 py-4"><span className="badge-open">{app.need?.category || "—"}</span></td>
                        <td className="px-5 py-4"><StatusBadge status={app.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* Browse Tab */}
        {tab === "explore" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading ? (
              [1,2,3,4,5,6].map(i => (
                <div key={i} className="card p-5 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-1/3 mb-3"></div>
                  <div className="h-5 bg-gray-100 rounded w-3/4 mb-2"></div>
                  <div className="h-10 bg-gray-100 rounded mb-4"></div>
                  <div className="h-9 bg-gray-100 rounded-xl"></div>
                </div>
              ))
            ) : opportunities.map((need, i) => {
              const applied = appliedIds.has(need._id);
              return (
                <div key={i} className="card p-5 flex flex-col gap-3">
                  <span className="badge-open w-fit">{need.category}</span>
                  <h3 className="font-bold text-gray-900">{need.title}</h3>
                  <p className="text-gray-500 text-sm line-clamp-2 flex-1">{need.description}</p>
                  <div className="text-xs text-green-700 font-medium">{need.organisation?.name}</div>
                  <button onClick={() => !applied && handleApply(need._id)} disabled={applied}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${applied ? "bg-gray-100 text-gray-400 cursor-default" : "bg-green-600 text-white hover:bg-green-700"}`}>
                    {applied ? "Already Applied" : "Apply Now"}
                  </button>
                </div>
              );
            })}
            <div className="card p-5 border-dashed border-2 flex flex-col items-center justify-center gap-2 text-center min-h-[180px]">
              <i className="fi fi-rr-search text-green-300 text-2xl"></i>
              <p className="text-gray-500 text-sm">See all available opportunities</p>
              <Link to="/explore" className="text-green-600 font-semibold text-sm hover:underline">View All →</Link>
            </div>
          </div>
        )}
      </section>
    </AnimationWrapper>
  );
};

export default UserDashboard;
