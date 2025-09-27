import PageHeader from '@/components/PageHeader';
import Image from 'next/image';
import Link from 'next/link';
import { Leaf, Lightbulb, Zap, Star, TrendingUp, Eye } from 'lucide-react';

const teamMembers = [
  {
    name: 'Leslie Anderson',
    title: 'Studio Director',
    image: 'https://randomuser.me/api/portraits/women/1.jpg',
  },
  {
    name: 'Sarah Williams',
    title: 'Creative Director',
    image: 'https://randomuser.me/api/portraits/women/2.jpg',
  },
  {
    name: 'David Smith',
    title: 'Product Designer',
    image: 'https://randomuser.me/api/portraits/men/3.jpg',
  },
  {
    name: 'James Turner',
    title: 'Lead Engineer',
    image: 'https://randomuser.me/api/portraits/men/4.jpg',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <PageHeader
        title="About"
        titleHighlight="Axion"
        subtitle="Learn more about Axion Lighting"
      />
      <div className="max-w-[85rem] mx-auto px-8 sm:px-6">
        <section className="py-8 sm:py-20">
          <div className=" grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Story & Text */}
            <div>
              <h2 className="text-xl sm:text-3xl font-bold mb-4 text-[black]">Our Story</h2>
              <div className="space-y-5 text-black/80 text-md sm:text-lg leading-relaxed mb-2 sm:mb-8">
                <p>
                  Axion Lighting was founded to bring modern, world‑class lighting to Pakistan.
                  After experiencing the gap firsthand, our founder—an English graduate—teamed up
                  with her engineer husband and a trusted friend to make cutting‑edge lighting
                  accessible, understandable, and reliable.
                </p>
                <p>
                  From fiber optic star ceilings to aluminum and silicone profiles, Axion introduces
                  global‑grade systems that transform homes, offices, and projects. We’re more than
                  a store—we educate, inspire, and guide customers to make informed choices that
                  balance beauty, comfort, and efficiency.
                </p>
                <p>
                  Our mission is to build lasting relationships through quality products, trusted
                  services, and creative solutions. With Axion, lighting isn’t just about
                  brightness—it’s about creating experiences.
                </p>
              </div>
              {/* Mission, Vision, Values Cards */}
            </div>

            {/* Team Photo */}
            <div className="flex justify-center items-center">
              <Image
                src="https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Axion Team"
                width={500}
                height={350}
                className="rounded-2xl object-cover shadow-xl w-full h-auto max-w-lg"
                priority
              />
            </div>
          </div>
        </section>
        <h3 className="text-center text-black text-2xl sm:text-3xl mt-8 sm:mt-0 font-bold">
          Mission, Vision and Values
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-6 mt-8">
          <div className="bg-white rounded-xl p-6 flex flex-col items-center text-center">
            <TrendingUp className="w-10 h-10 text-[var(--color-logo)] mb-3" />
            <h3 className="text-lg font-semibold text-black mb-2">Mission</h3>
            <p className="text-sm text-[var(--color-secondary-text)]">
              To create innovative, energy-efficient lighting solutions that enhance everyday
              living.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 flex flex-col items-center text-center">
            <Eye className="w-10 h-10 text-[var(--color-logo)] mb-3" />
            <h3 className="text-lg font-semibold text-black mb-2">Vision</h3>
            <p className="text-sm text-[var(--color-secondary-text)]">
              To lead in designing and implementing cutting-edge lighting technology.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 flex flex-col items-center text-center">
            <Leaf className="w-10 h-10 text-[var(--color-logo)] mb-3" />
            <h3 className="text-lg font-semibold text-black mb-2">Values</h3>
            <p className="text-sm text-[var(--color-secondary-text)]">
              Innovation, Quality, Sustainability, Customer Focus{' '}
            </p>
          </div>
        </div>

        {/* Our Team Section */}
        <section className="py-12 sm:py-20 bg-[var(--color-background)]">
          <div className="max-w-[85rem] mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-black mb-2">Our Team</h2>
              <p className="text-base sm:text-lg text-[var(--color-secondary-text)]">
                A passionate group of designers and engineers working together to bring light into
                your life
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 md:gap-10">
              {teamMembers.map((member) => (
                <div key={member.name} className="flex flex-col items-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-3 shadow-lg">
                    <Image
                      src={member.image}
                      alt={member.name}
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="text-sm font-semibold text-[var(--color-main-text)] text-center">
                    {member.name}
                  </div>
                  <div className="text-xs text-[var(--color-secondary-text)] text-center">
                    {member.title}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-12 sm:py-20">
          <div className="max-w-[85rem] mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-black mb-2">Why Choose Us</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-1 sm:gap-6">
              <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl ">
                <Leaf className="w-10 h-10 text-[var(--color-logo)] mb-3" />
                <h3 className="font-semibold text-lg text-black mb-2">Tailored Designs</h3>
                <p className="text-sm text-[var(--color-secondary-text)]">
                  Customized lighting solutions for every need.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl ">
                <Lightbulb className="w-10 h-10 text-[var(--color-logo)] mb-3" />
                <h3 className="font-semibold text-lg text-black mb-2">Modern Aesthetics</h3>
                <p className="text-sm text-[var(--color-secondary-text)]">
                  Sleek, contemporary designs for stylish spaces.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl ">
                <Zap className="w-10 h-10 text-[var(--color-logo)] mb-3" />
                <h3 className="font-semibold text-lg text-black mb-2">Energy Efficient</h3>
                <p className="text-sm text-[var(--color-secondary-text)]">
                  Smart solutions that save energy and reduce costs.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl ">
                <Star className="w-10 h-10 text-[var(--color-logo)] mb-3" />
                <h3 className="font-semibold text-lg text-black mb-2">Proven Expertise</h3>
                <p className="text-sm text-[var(--color-secondary-text)]">
                  A track record of excellence and client satisfaction.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call-to-Action Section with Image & Overlay */}
        <section className="relative py-20 rounded-lg mb-10 overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="/collection-3.jpg"
              alt="Lighting inspiration"
              fill
              className="object-cover brightness-90"
              priority
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/60"></div>
          </div>
          {/* Content Overlay */}
          <div className="relative z-10 max-w-[85rem] mx-auto px-4 sm:px-6 flex flex-col items-center justify-center text-center">
            <h2 className="text-xl text-pretty sm:text-3xl font-bold text-white uppercase mb-6">
              Ready to Brighten Your Space?
            </h2>
            <p className="text-lg sm:text-xl text-pretty text-white/90 mb-8 max-w-2xl mx-auto">
              Discover how Axion can transform your environment with innovative lighting solutions
              tailored to your needs.
            </p>
            <Link
              href="/contact"
              className="bg-[var(--color-logo)] text-white px-8 py-3 rounded-lg font-semibold text-md sm:text-lg text-pretty shadow-lg hover:bg-[var(--color-logo)]/90 transition"
            >
              Start Your Project
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
