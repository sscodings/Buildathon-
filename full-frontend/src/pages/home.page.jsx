import { Link } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";

const stats = [
  { value: "500+", label: "NGOs Registered" },
  { value: "12k+", label: "Volunteers Connected" },
  { value: "8k+", label: "Tasks Completed" },
];

const steps = [
  { icon: "fi-rr-search", title: "Discover", desc: "Browse needs posted by verified NGOs across education, healthcare, environment and more.", color: "bg-green-50 text-green-600" },
  { icon: "fi-rr-paper-plane", title: "Apply", desc: "Send your application for tasks that match your skills. One click is all it takes.", color: "bg-emerald-50 text-emerald-600" },
  { icon: "fi-rr-star", title: "Impact", desc: "NGOs review and approve volunteers. Together you create lasting change in communities.", color: "bg-teal-50 text-teal-600" },
];

const categories = [
  { icon: "fi-rr-book", label: "Education", color: "bg-blue-50 text-blue-600" },
  { icon: "fi-rr-heart", label: "Healthcare", color: "bg-red-50 text-red-600" },
  { icon: "fi-rr-leaf", label: "Environment", color: "bg-green-50 text-green-600" },
  { icon: "fi-rr-paw", label: "Animal Welfare", color: "bg-orange-50 text-orange-600" },
  { icon: "fi-rr-hand-holding-heart", label: "Community", color: "bg-purple-50 text-purple-600" },
  { icon: "fi-rr-donate", label: "Donations", color: "bg-yellow-50 text-yellow-600" },
];

const testimonials = [
  { name: "Priya Sharma", role: "Volunteer", text: "SevaConnect helped me find meaningful work that matched exactly what I was good at. Within a week I was teaching kids in my neighborhood!", avatar: "P" },
  { name: "Green Earth NGO", role: "Organisation", text: "We used to struggle finding the right volunteers. Now we post a need and get qualified applicants within hours. Incredible platform.", avatar: "G" },
];

const HomePage = () => {
  return (
    <AnimationWrapper>
      {/* Hero */}
      <section className="h-cover flex flex-col items-center justify-center text-center pt-12 pb-16">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 rounded-full px-4 py-1.5 text-sm font-medium mb-8 border border-green-200">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Over 500 NGOs are looking for volunteers right now
        </div>

        <h1 className="display-font text-5xl md:text-7xl font-bold leading-[1.1] mb-6 max-w-[820px] text-gray-900">
          Bridge the Gap Between{" "}
          <span className="text-green-600 italic">Kindness</span> and{" "}
          <span className="text-green-600 italic">Action</span>
        </h1>

        <p className="text-xl text-gray-500 mb-10 max-w-[560px] leading-relaxed">
          Connect with NGOs that need your unique skills. Join thousands of volunteers making a real difference every day.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <Link to="/signup" className="btn-primary text-base px-8 py-3.5 shadow-lg shadow-green-200">
            Start Volunteering
          </Link>
          <Link to="/explore" className="btn-outline text-base px-8 py-3.5">
            Explore Opportunities
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 max-w-[560px] w-full">
          {stats.map((s, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="display-font text-4xl font-bold text-green-600 mb-1">{s.value}</div>
              <div className="text-gray-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-[900px] mx-auto text-center">
          <h2 className="display-font text-4xl font-bold mb-4">Find Your Cause</h2>
          <p className="text-gray-500 mb-10">Pick a category that resonates with you</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((c, i) => (
              <Link to={`/explore?category=${c.label}`} key={i}
                className="card p-6 flex items-center gap-4 hover:border-green-200 hover:shadow-green-50 group">
                <div className={`w-12 h-12 rounded-xl ${c.color} flex items-center justify-center text-xl`}>
                  <i className={`fi ${c.icon}`}></i>
                </div>
                <span className="font-semibold text-gray-800 group-hover:text-green-600">{c.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-14">
            <h2 className="display-font text-4xl font-bold mb-4">How SevaConnect Works</h2>
            <p className="text-gray-500 text-lg">Three simple steps to start making an impact</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-green-200 z-0"></div>
                )}
                <div className="relative z-10">
                  <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl`}>
                    <i className={`fi ${step.icon}`}></i>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center mx-auto mb-4 font-bold">{i + 1}</div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-green-600 py-16">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="display-font text-4xl font-bold text-white mb-12">What People Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-left">
                <p className="text-white/90 mb-5 leading-relaxed italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">{t.avatar}</div>
                  <div>
                    <div className="text-white font-semibold text-sm">{t.name}</div>
                    <div className="text-green-200 text-xs">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="display-font text-4xl font-bold mb-4">Ready to Make a Difference?</h2>
          <p className="text-gray-500 mb-8 text-lg">Whether you're a volunteer or an NGO, your journey starts here.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/signup" className="btn-primary px-8 py-3.5 shadow-lg shadow-green-200">Join as Volunteer</Link>
            <Link to="/signup?role=org" className="btn-outline px-8 py-3.5">Register Your NGO</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="bg-green-600 w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm">S</div>
          <span className="text-white font-semibold">SevaConnect</span>
        </div>
        <p>Bridging NGOs and volunteers for a better tomorrow.</p>
        <p className="mt-2">© 2025 SevaConnect. All rights reserved.</p>
      </footer>
    </AnimationWrapper>
  );
};

export default HomePage;
