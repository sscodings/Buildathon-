import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import AnimationWrapper from "../common/page-animation";
import InputBox from "../components/input.component";
import { api } from "../common/api";
import { storeSession } from "../common/session";

const UserAuthForm = ({ type }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const defaultRole =
    searchParams.get("role") === "org" ? "organisation" : "volunteer";

  const [role, setRole] = useState(defaultRole);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ FIX: always use currentTarget (the form)
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    setLoading(true);

    try {
      if (type === "sign-in") {
        const endpoint =
          role === "volunteer" ? "/user/login" : "/organisation/login";

        const res = await api.post(endpoint, {
          email: data.email,
          password: data.password,
        });

        storeSession(res);
        toast.success("Welcome back!");

        navigate(
          role === "volunteer" ? "/user-dashboard" : "/ngo-dashboard"
        );
      } else {
        // SIGN UP
        if (role === "volunteer") {
          const res = await api.post("/user/signup", {
            name: data.name,
            email: data.email,
            password: data.password,
            phone: data.phone || "0000000000",
          });

          storeSession(res);
          toast.success("Account created!");
          navigate("/user-dashboard");
        } else {
          // NGO validation
          if (!data.registrationNumber || data.registrationNumber.length < 3) {
            toast.error("Enter a valid registration number");
            setLoading(false);
            return;
          }

          const res = await api.post("/organisation/signup", {
            name: data.name,
            email: data.email,
            password: data.password,
            phone: data.phone,
            description:
              data.description ||
              "An NGO dedicated to social causes.",
            registrationNumber: data.registrationNumber,
          });

          storeSession(res);
          toast.success("NGO registered!");
          navigate("/ngo-dashboard");
        }
      }
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimationWrapper keyValue={type + role}>
      <Toaster position="top-center" />

      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 py-10">
        <div className="w-[90%] max-w-[460px]">

          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="bg-green-600 w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                S
              </div>
              <span className="font-bold text-2xl tracking-tight">
                Seva<span className="text-green-600">Connect</span>
              </span>
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <h1 className="display-font text-3xl font-bold text-center mb-1">
              {type === "sign-in" ? "Welcome Back" : "Create Account"}
            </h1>

            <p className="text-center text-gray-500 mb-7 text-sm">
              {type === "sign-in"
                ? "Login to continue your journey"
                : "Join the movement for social change"}
            </p>

            {/* Role Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-7 gap-1">
              <button
                type="button"
                onClick={() => setRole("volunteer")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  role === "volunteer"
                    ? "bg-white shadow-sm text-green-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <i className="fi fi-rr-user mt-0.5"></i> Volunteer
              </button>

              <button
                type="button"
                onClick={() => setRole("organisation")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  role === "organisation"
                    ? "bg-white shadow-sm text-green-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <i className="fi fi-rr-building mt-0.5"></i> NGO / Org
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit}>
              {type === "sign-up" && (
                <>
                  <InputBox
                    name="name"
                    type="text"
                    placeholder={
                      role === "volunteer"
                        ? "Full Name"
                        : "Organisation Name"
                    }
                    icon="fi-rr-user"
                  />

                  {role === "organisation" && (
                    <>
                      <InputBox
                        name="phone"
                        type="tel"
                        placeholder="Phone Number (10 digits)"
                        icon="fi-rr-phone-call"
                      />

                      <InputBox
                        name="registrationNumber"
                        type="text"
                        placeholder="Registration Number"
                        icon="fi-rr-file-certificate"
                      />

                      <div className="relative w-full mb-4">
                        <textarea
                          name="description"
                          placeholder="Brief description of your organisation"
                          rows={3}
                          className="input-box pl-12 resize-none"
                        />
                        <i className="fi fi-rr-info input-icon text-gray-400"></i>
                      </div>
                    </>
                  )}
                </>
              )}

              <InputBox
                name="email"
                type="email"
                placeholder="Email address"
                icon="fi-rr-envelope"
              />

              <InputBox
                name="password"
                type="password"
                placeholder="Password"
                icon="fi-rr-key"
              />

              {type === "sign-up" && (
                <div className="flex items-start gap-2 text-sm mt-1 mb-5">
                  <input
                    type="checkbox"
                    required
                    className="mt-0.5 accent-green-600"
                  />
                  <p className="text-gray-500">
                    I agree to the{" "}
                    <span className="text-green-600 cursor-pointer">
                      Terms of Service
                    </span>{" "}
                    and{" "}
                    <span className="text-green-600 cursor-pointer">
                      Privacy Policy
                    </span>
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3.5 rounded-xl font-semibold hover:bg-green-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Please wait...
                  </>
                ) : type === "sign-in" ? (
                  `Login as ${
                    role === "volunteer" ? "Volunteer" : "Organisation"
                  }`
                ) : (
                  `Create ${
                    role === "volunteer" ? "Volunteer" : "Organisation"
                  } Account`
                )}
              </button>
            </form>

            <p className="text-center text-sm mt-5 text-gray-500">
              {type === "sign-in" ? (
                <>
                  Don't have an account?{" "}
                  <Link
                    to="/signup"
                    className="text-green-600 font-semibold hover:underline"
                  >
                    Sign up
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Link
                    to="/signin"
                    className="text-green-600 font-semibold hover:underline"
                  >
                    Login
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>
      </section>
    </AnimationWrapper>
  );
};

export default UserAuthForm;