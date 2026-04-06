import { Headset } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-locus-navy text-locus-gray-400 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-locus-blue/20 flex items-center justify-center">
              <Headset className="w-3.5 h-3.5 text-locus-blue" />
            </div>
            <span className="text-sm text-locus-gray-200 font-medium">
              Locus Robotics Support Portal
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <a
              href="https://locusrobotics.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-locus-blue transition-colors"
            >
              locusrobotics.com
            </a>
            <a
              href="https://locusrobotics.com/company/contact-us"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-locus-blue transition-colors"
            >
              Contact Us
            </a>
            <span>&copy; {new Date().getFullYear()} Locus Robotics. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
