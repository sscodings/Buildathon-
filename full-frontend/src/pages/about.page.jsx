import { Link } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";

const AboutPage = () => (
  <AnimationWrapper>
    <section className="py-16 min-h-screen">
      <div className="max-w-[800px] mx-auto">
        <div className="text-center mb-14">
          <h1 className="display-font text-5xl font-bold mb-4">Our Mission</h1>
          <p className="text-gray-500 text-xl leading-relaxed">
            SevaConnect bridges the gap between passionate volunteers and NGOs working to create meaningful change.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-14">
          {[
            { icon: "fi-rr-users", title: "For Volunteers", desc: "Discover opportunities aligned with your skills and passions. Track applications, get approved, and build your impact story." },
            { icon: "fi-rr-building", title: "For NGOs", desc: "Post specific needs, receive qualified applications, and manage your volunteer pipeline in one organised place." },
            { icon: "fi-rr-shield-check", title: "Verified & Safe", desc: "NGOs go through a registration verification process. Volunteers can trust the organisations they're working with." },
            { icon: "fi-rr-chart-line-up", title: "Measurable Impact", desc: "Track the difference you're making with dashboards showing applications, approvals, and completed tasks." },
          ].map((item, i) => (
            <div key={i} className="card p-7">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center text-xl mb-4">
                <i className={`fi ${item.icon}`}></i>
              </div>
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-green-600 rounded-3xl p-10 text-center text-white">
          <h2 className="display-font text-3xl font-bold mb-3">Join the Movement</h2>
          <p className="text-green-100 mb-7">Be part of a community that's creating real change every day.</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/signup" className="bg-white text-green-700 font-bold px-7 py-3 rounded-xl hover:bg-green-50 transition-all">
              Sign Up Free
            </Link>
            <Link to="/explore" className="border-2 border-white/50 text-white font-bold px-7 py-3 rounded-xl hover:bg-white/10 transition-all">
              Explore Needs
            </Link>
          </div>
        </div>
      </div>
    </section>
  </AnimationWrapper>
);

export default AboutPage;
