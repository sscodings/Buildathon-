import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import AnimationWrapper from "../common/page-animation";
import { api } from "../common/api";
import { isLoggedIn } from "../common/session";

const RequestNGOPage = () => {
  const [organisations, setOrganisations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrganisations();
  }, []);

  const fetchOrganisations = async () => {
    setLoading(true);
    try {
      const data = await api.get("/organisation/all");
      setOrganisations(data);
    } catch (err) {
      toast.error(err.message || "Failed to load organisations");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRedirect = (orgId) => {
    if (!isLoggedIn()) {
      toast("Please sign in to submit a request", { icon: "🔒" });
      navigate("/signin");
      return;
    }
    navigate(`/request-ngo/form/${orgId}`);
  };

  const filteredOrgs = organisations.filter((org) => {
    const name = org.name?.toLowerCase() || "";
    const type = org.type?.toLowerCase() || "";
    const city = org.address?.city?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return name.includes(query) || type.includes(query) || city.includes(query);
  });

  return (
    <AnimationWrapper>
      <Toaster position="top-center" />
      <section className="py-10 min-h-screen">
        {/* Header */}
        <div className="max-w-[1000px] mx-auto px-6 mb-12">
          <div className="text-center max-w-[650px] mx-auto mb-10">
            <h1 className="display-font text-5xl font-black text-gray-900 leading-tight">
              Request an <span className="text-green-600">NGO Partnership</span>
            </h1>
            <p className="text-gray-500 mt-4 text-lg font-medium">
              Find verified NGOs to collaborate on your college fests, community drives, or charity events.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative max-w-[700px] mx-auto">
            <i className="fi fi-rr-search absolute left-6 top-1/2 -translate-y-1/2 text-green-500 text-xl"></i>
            <input
              type="text"
              placeholder="Search NGOs by name, cause type, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-[2rem] pl-16 pr-6 py-5 border-2 border-transparent bg-gray-50 focus:outline-none focus:border-green-200 focus:bg-white shadow-sm text-gray-800 text-lg transition-all"
            />
          </div>
        </div>

        {/* List Grid */}
        <div className="max-w-[1000px] mx-auto px-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="card p-8 animate-pulse bg-gray-50/50 rounded-[2.5rem] h-64 border-gray-100 shadow-none"
                ></div>
              ))}
            </div>
          ) : filteredOrgs.length === 0 ? (
            <div className="text-center py-20 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-200 max-w-[600px] mx-auto">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl shadow-xl">
                <i className="fi fi-rr-building text-green-200"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No NGOs Found</h3>
              <p className="text-gray-400">Try refining your search terms or view all registered ones.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
              {filteredOrgs.map((org) => (
                <div
                  key={org._id}
                  className="card p-6 flex flex-col gap-4 hover:border-green-200 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center text-3xl font-extrabold text-green-700 shrink-0 select-none">
                      {org.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                          {org.type || "Cause"}
                        </span>
                        {org.isVerified && (
                          <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1">
                            <i className="fi fi-rr-shield-check"></i> Verified
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-xl text-gray-900 leading-snug group-hover:text-green-700 transition-colors truncate">
                        {org.name}
                      </h3>
                      {org.address?.city && (
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mt-1">
                          <i className="fi fi-rr-marker text-green-500"></i>
                          {org.address.city}, {org.address.state}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
                    {org.description || "Dedicated to building support for communities in need and creating a sustainable impact."}
                  </p>

                  <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-100/50">
                    <Link
                      to={`/organisation/${org._id}`}
                      className="flex-1 py-3 text-center rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-xs uppercase tracking-wider transition-colors"
                    >
                      View Profile
                    </Link>
                    <button
                      onClick={() => handleRequestRedirect(org._id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl shadow-md shadow-green-100 active:scale-95 transition-all"
                    >
                      Request NGO
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </AnimationWrapper>
  );
};

export default RequestNGOPage;
