import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import AnimationWrapper from "../common/page-animation";
import { api } from "../common/api";

const RequestFormPage = () => {
  const { orgId } = useParams();
  const navigate = useNavigate();

  const [organisation, setOrganisation] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [typeOfFest, setTypeOfFest] = useState("");
  const [date, setDate] = useState("");
  const [requirements, setRequirements] = useState("");

  useEffect(() => {
    fetchOrganisationProfile();
  }, [orgId]);

  const fetchOrganisationProfile = async () => {
    setLoadingProfile(true);
    try {
      const data = await api.get(`/organisation/profile/${orgId}`);
      setOrganisation(data);
    } catch (err) {
      toast.error("Could not fetch organisation details");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!typeOfFest.trim()) {
      return toast.error("Please specify the type of fest");
    }
    if (!date) {
      return toast.error("Please pick an event date");
    }
    if (requirements.trim().length < 10) {
      return toast.error("Please explain requirements in at least 10 characters");
    }

    setSubmitting(true);
    try {
      await api.authPost("/organisation/request", {
        organisationId: orgId,
        typeOfFest,
        date,
        requirements,
      });

      toast.success("Request submitted successfully! 🚀");
      setTimeout(() => {
        navigate("/user-dashboard");
      }, 2000);
    } catch (err) {
      toast.error(err.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProfile) {
    return (
      <AnimationWrapper>
        <div className="py-12 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <span className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></span>
            <p className="text-gray-500 font-medium">Loading details...</p>
          </div>
        </div>
      </AnimationWrapper>
    );
  }

  if (!organisation) {
    return (
      <AnimationWrapper>
        <div className="py-12 min-h-screen flex items-center justify-center">
          <div className="card p-12 text-center border-dashed border-2 m-auto max-w-lg">
            <i className="fi fi-rr-building text-red-200 text-5xl mb-4 block"></i>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Organisation Not Found</h2>
            <p className="text-gray-500 mb-6">The details of this organisation could not be retrieved.</p>
            <Link to="/request-ngo" className="btn-primary py-2 px-6">
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
      <section className="py-12 min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="w-full max-w-[600px] px-4">
          <div className="card p-8 md:p-10 bg-white shadow-xl rounded-[2.5rem] border border-gray-100 relative overflow-hidden">
            {/* Header background glow */}
            <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-600 w-full absolute top-0 left-0"></div>

            {/* Title */}
            <div className="mb-8">
              <Link to="/request-ngo" className="text-sm font-bold text-green-600 hover:underline flex items-center gap-1.5 mb-4 select-none">
                <i className="fi fi-rr-arrow-left text-xs"></i> Back to NGOs
              </Link>
              <h2 className="text-3xl font-extrabold text-gray-900 leading-tight">
                Request Collaboration
              </h2>
              <p className="text-gray-500 mt-2 font-medium">
                You are submitting a partnership request to <span className="text-green-600 font-bold">{organisation.name}</span> ({organisation.type || "NGO"}).
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-black text-gray-500 mb-2 block uppercase tracking-wider">
                  Type of Fest / Event
                </label>
                <div className="relative">
                  <i className="fi fi-rr-star absolute left-4 top-1/2 -translate-y-1/2 text-green-500"></i>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Annual Tech Fest, Charity Drive, Green Camp"
                    value={typeOfFest}
                    onChange={(e) => setTypeOfFest(e.target.value)}
                    className="w-full rounded-xl p-4 bg-gray-50 pl-12 border border-gray-200 focus:bg-white focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100 placeholder:text-gray-400 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-black text-gray-500 mb-2 block uppercase tracking-wider">
                  Proposed Event Date
                </label>
                <div className="relative">
                  <i className="fi fi-rr-calendar absolute left-4 top-1/2 -translate-y-1/2 text-green-500"></i>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-xl p-4 bg-gray-50 pl-12 border border-gray-200 focus:bg-white focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100 text-gray-800 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-black text-gray-500 mb-2 block uppercase tracking-wider">
                  Special Requirements
                </label>
                <textarea
                  required
                  placeholder="Explain event details, volunteer counts, campaign topics, or target audiences requested..."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="w-full h-36 rounded-xl p-4 bg-gray-50 border border-gray-200 focus:bg-white focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100 placeholder:text-gray-400 font-medium resize-none leading-relaxed"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-primary py-4 text-base shadow-lg shadow-green-100 flex items-center justify-center gap-2 active:scale-95"
              >
                {submitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <i className="fi fi-rr-paper-plane"></i> Submit Request
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>
    </AnimationWrapper>
  );
};

export default RequestFormPage;
