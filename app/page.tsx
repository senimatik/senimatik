import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HeroMobile from "@/components/Hero-Mobile";
import ProblemStatement from "@/components/ProblemStatement";
import HowItWorks from "@/components/HowItWorks";
import EmergingArtists from "@/components/EmergingArtists";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relativ">
      <div className="bg-gradient-custom">
        <Navbar />
        <div className="md:block hidden w-full">
          <Hero />
        </div>
        <div className="md:hidden block">
          <HeroMobile />
        </div>
      </div>

      <ProblemStatement />

      <HowItWorks />

      <EmergingArtists />

      <CTASection />

      <Footer variant="dark" />
    </main>
  );
}
