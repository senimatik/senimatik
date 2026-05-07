import Navbar from "@/components/Navbar";
import Gallery from "@/components/Gallery";

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col justify-between bg-gradient-custom text-white">
      <Navbar />

      {/* Central Gallery Section */}
      <section className="flex-1 flex items-center justify-center w-full">
        <Gallery />
      </section>

      {/* Bottom Info Section */}
      <div className="flex justify-between items-end w-full px-4 pb-4">
        {/* Left Bottom: Title */}
        <div className="max-w-md">
          <h1 className="text-2xl md:text-5xl font-bold uppercase leading-[0.8] tracking-tighter">
            Verified<br />Creators.
          </h1>
        </div>

        {/* Right Bottom: Sub Description */}
        <div className="max-w-xs text-right">
          <p className="text-sm leading-relaxed text-white">
            The first verified creator licensing marketplace.
          </p>
        </div>
      </div>
    </main>
  );
}
