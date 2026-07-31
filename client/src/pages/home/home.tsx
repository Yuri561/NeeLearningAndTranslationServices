import HeroSection from "../../components/homeComponents/hero-section/HeroSection";
import VideoSection from "../../components/homeComponents/VideoSection";
import ServicesSection from "../../components/homeComponents/ServicesSection";
import WhyChooseSection from "../../components/homeComponents/WhyChooseSection";
import FactSection from "../../components/homeComponents/FactSection";
import ProcessSection from "../../components/homeComponents/ProcessSection";
import OptimizeSection from "../../components/homeComponents/OptimizeSection";
import TutorsSection from "../../components/homeComponents/TutorsSection";
import ContactSection from "../../components/homeComponents/ContactSection";
import TickerForLanguage from "../../components/homeComponents/TickerForLanguage";

const Home = () => {
  return (
    <main className="flex flex-col">
      <HeroSection />
      <TickerForLanguage />
      <VideoSection />
      <ServicesSection />
      <WhyChooseSection />
      <FactSection />
      <ProcessSection />
      <OptimizeSection />
      <TutorsSection />
      <ContactSection />
    </main>
  );
};

export default Home;
