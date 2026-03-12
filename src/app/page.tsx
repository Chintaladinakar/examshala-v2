import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import FeatureCard from '@/components/FeatureCard';
import Footer from '@/components/Footer';

export default function Home() {
  const features = [
    {
      icon: '🔒',
      title: 'Secure Exams',
      description: 'Advanced security features to prevent cheating and ensure exam integrity',
    },
    {
      icon: '👁️',
      title: 'Real-time Monitoring',
      description: 'Monitor student activity and track progress in real-time',
    },
    {
      icon: '⚡',
      title: 'Instant Results',
      description: 'Automated grading with instant result generation',
    },
    {
      icon: '✏️',
      title: 'Easy Test Creation',
      description: 'Intuitive interface to create and manage tests effortlessly',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
              Platform Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Create Test</h3>
                <p className="text-gray-600">Set up your exam with questions and options</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Students Attempt</h3>
                <p className="text-gray-600">Students take the test within the time limit</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Get Results</h3>
                <p className="text-gray-600">View detailed results and analytics instantly</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
