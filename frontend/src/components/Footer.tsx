import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-teal-950 text-slate-200 border-t border-teal-900/60 font-sans">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xl leading-none">E</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-white">EDUsphere</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              Smart virtual assessment platform designed to deliver secure, reliable, and scalable online examination experiences for institutions worldwide.
            </p>
          </div>
          
          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-white mb-4 tracking-wider uppercase text-xs">Product</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link href="/coming-soon" className="hover:text-teal-400 transition-colors">Features</Link></li>
              <li><Link href="/coming-soon" className="hover:text-teal-400 transition-colors">Security</Link></li>
              <li><Link href="/coming-soon" className="hover:text-teal-400 transition-colors">Pricing</Link></li>
              <li><Link href="/coming-soon" className="hover:text-teal-400 transition-colors">Integrations</Link></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="font-semibold text-white mb-4 tracking-wider uppercase text-xs">Resources</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link href="/coming-soon" className="hover:text-teal-400 transition-colors">Documentation</Link></li>
              <li><Link href="/coming-soon" className="hover:text-teal-400 transition-colors">Help Center</Link></li>
              <li><Link href="/coming-soon" className="hover:text-teal-400 transition-colors">API Reference</Link></li>
              <li><Link href="/coming-soon" className="hover:text-teal-400 transition-colors">Status</Link></li>
            </ul>
          </div>

          {/* Contact / Social */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white mb-4 tracking-wider uppercase text-xs">Get in Touch</h4>
            <p className="text-sm text-slate-400">Have questions? Reach out to our dedicated support team.</p>
            <div className="text-sm font-semibold text-teal-400 hover:underline">
              <a href="mailto:support@edusphere.com">support@edusphere.com</a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-teal-900/60 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} EDUsphere. All rights reserved.
          </div>
          <div className="flex gap-6">
            <Link href="/coming-soon" className="hover:text-teal-400 transition-colors">Privacy Policy</Link>
            <Link href="/coming-soon" className="hover:text-teal-400 transition-colors">Terms of Service</Link>
            <Link href="/coming-soon" className="hover:text-teal-400 transition-colors">Cookie Settings</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
