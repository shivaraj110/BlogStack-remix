import { Link } from "@remix-run/react";
import { Facebook, Instagram, Twitter, Mail, Github } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="bg-[#111111] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <Link
              to="/"
              className="inline-block text-white font-bold text-xl mb-4"
            >
              BlogStack
            </Link>
            <p className="text-white/70 mb-4">
              A modern blogging platform for developers, designers, and
              creators.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-white/60 hover:text-white transition-colors"
              >
                <Facebook size={20} />
                <span className="sr-only">Facebook</span>
              </a>
              <a
                href="#"
                className="text-white/60 hover:text-white transition-colors"
              >
                <Twitter size={20} />
                <span className="sr-only">Twitter</span>
              </a>
              <a
                href="#"
                className="text-white/60 hover:text-white transition-colors"
              >
                <Instagram size={20} />
                <span className="sr-only">Instagram</span>
              </a>
              <a
                href="https://github.com/BlogStack110"
                className="text-white/60 hover:text-white transition-colors"
              >
                <Github size={20} />
                <span className="sr-only">GitHub</span>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Explore</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/blog"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  All Posts
                </Link>
              </li>
              <li>
                <Link
                  to="/blog?tag=Technology"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Technology
                </Link>
              </li>
              <li>
                <Link
                  to="/blog?tag=Design"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Design
                </Link>
              </li>
              <li>
                <Link
                  to="/blog?tag=Business"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Business
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/about"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  to="/careers"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Subscribe</h3>
            <p className="text-white/70 mb-4">
              Stay updated with the latest posts and news.
            </p>
            <form className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-white/50"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/60 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} BlogStack. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link
              to="/terms"
              className="text-white/60 hover:text-white text-sm transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              to="/privacy"
              className="text-white/60 hover:text-white text-sm transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/cookies"
              className="text-white/60 hover:text-white text-sm transition-colors"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
