import ExamshalaHero from '@/components/ExamshalaHero';
import ExamshalaFeatures from '@/components/ExamshalaFeatures';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <ExamshalaHero />
      <main className="flex-grow">
        
        <ExamshalaFeatures />
      </main>
      <Footer />
    </div>
  );
}
