import { Link } from "@remix-run/react";
import PublicNavbar from "~/components/PublicNavbar";
import PublicFooter from "~/components/PublicFooter";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "About BlogStack - Our Story and Mission" },
    {
      name: "description",
      content:
        "Learn about BlogStack's mission to provide a modern blogging platform for writers and readers. Discover our story, values, and commitment to the blogging community.",
    },
    {
      property: "og:title",
      content: "About BlogStack - Our Story and Mission",
    },
    {
      property: "og:description",
      content:
        "Learn about BlogStack's mission to provide a modern blogging platform for writers and readers. Discover our story, values, and commitment to the blogging community.",
    },
    { property: "og:type", content: "website" },
    { property: "og:image", content: "/logo.png" },
    { property: "og:image:width", content: "256" },
    { property: "og:image:height", content: "256" },
    { name: "twitter:card", content: "summary_large_image" },
    {
      name: "twitter:title",
      content: "About BlogStack - Our Story and Mission",
    },
    {
      name: "twitter:description",
      content:
        "Learn about BlogStack's mission to provide a modern blogging platform for writers and readers. Discover our story, values, and commitment to the blogging community.",
    },
    { name: "twitter:image", content: "/logo.png" },
  ];
};

export default function About() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <PublicNavbar />

      <div className="flex-grow">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-blue-700 to-purple-700 py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              About BlogStack
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              A modern blogging platform built for writers and readers alike
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="prose prose-lg prose-invert max-w-none">
            <h2>Our Mission</h2>
            <p>
              At BlogStack, we believe in the power of words to inspire,
              educate, and connect. Our mission is to provide a platform where
              writers can easily share their thoughts and readers can discover
              content that matters to them.
            </p>

            <h2>The BlogStack Story</h2>
            <p>
              Founded in 2023, BlogStack was born out of a simple observation:
              while there are many blogging platforms available, few offer the
              perfect balance of simplicity, functionality, and community that
              modern writers need.
            </p>
            <p>
              Our team of passionate developers and content creators set out to
              build a platform that puts the focus back on what matters most -
              the content itself. Whether you're a professional writer, a
              hobbyist, or somewhere in between, BlogStack is designed to help
              you share your voice with the world.
            </p>

            <h2>Our Values</h2>
            <div className="grid md:grid-cols-2 gap-8 mt-8">
              <div className="bg-[#111111] p-6 rounded-xl border border-white/5">
                <h3 className="text-xl font-bold mb-2 text-blue-400">
                  Simplicity
                </h3>
                <p className="text-white/80">
                  We believe that the best tools get out of your way. BlogStack
                  is designed to be intuitive and straightforward, so you can
                  focus on writing.
                </p>
              </div>
              <div className="bg-[#111111] p-6 rounded-xl border border-white/5">
                <h3 className="text-xl font-bold mb-2 text-blue-400">
                  Community
                </h3>
                <p className="text-white/80">
                  Writing doesn't have to be solitary. We're building a
                  community where writers can connect, collaborate, and grow
                  together.
                </p>
              </div>
              <div className="bg-[#111111] p-6 rounded-xl border border-white/5">
                <h3 className="text-xl font-bold mb-2 text-blue-400">
                  Quality
                </h3>
                <p className="text-white/80">
                  We're committed to providing a high-quality experience for
                  both writers and readers, with features that help good content
                  shine.
                </p>
              </div>
              <div className="bg-[#111111] p-6 rounded-xl border border-white/5">
                <h3 className="text-xl font-bold mb-2 text-blue-400">
                  Innovation
                </h3>
                <p className="text-white/80">
                  The digital landscape is always evolving, and so are we. We're
                  constantly looking for ways to improve and enhance the
                  BlogStack experience.
                </p>
              </div>
            </div>

            <h2 className="mt-12">Join Our Community</h2>
            <p>
              Whether you're here to write, read, or both, we're glad to have
              you as part of the BlogStack community. Together, we're building a
              space where ideas can flourish and connections can form.
            </p>
            <div className="mt-8 text-center">
              <Link
                to="/blog"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg mr-4 transition-colors"
              >
                Explore Blogs
              </Link>
              <Link
                to="/dashboard"
                className="inline-block px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
