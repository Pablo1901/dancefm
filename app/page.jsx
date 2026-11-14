import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/Hero";
import Ticker from "@/components/Ticker";
import Schedule from "@/components/Schedule";
import News from "@/components/News";
import About from "@/components/About";
import Footer from "@/components/Footer";
import MiniPlayer from "@/components/MiniPlayer";
import { getNews } from "@/lib/news";

export const revalidate = 600;

export default async function HomePage() {
  const news = await getNews(9);

  return (
    <>
      <SiteHeader />
      <main id="top">
        <Hero />
        <Ticker />
        <Schedule />
        <News articles={news} />
        <About />
      </main>
      <Footer />
      <MiniPlayer />
    </>
  );
}
