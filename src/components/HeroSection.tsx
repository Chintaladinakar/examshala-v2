import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Smart Online Examination Platform
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Create, manage, and conduct online exams with ease. Secure, reliable, and feature-rich platform for educators and institutions.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/signin" className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700">
            Sign In
          </Link>
          <Link href="/signup" className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50">
            Get Started
          </Link>
        </div>
      </div>
    </section>
  );
}
