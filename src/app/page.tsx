// Landing page components
import {
  BlogSection,
  CollectionSection as Collections,
  ExploreSection,
  FeaturedProducts as Featured,
  HeroSection,
  HowItWorksSection,
  NewsletterSection,
  OnSale as SaleSection,
  TeamSection,
  TestimonialsSection,
} from '@/features/landing-page';

export default function App() {
  return (
    <>
      <HeroSection />
      <div className="max-w-[85rem] mx-auto px-4 sm:px-6">
        <ExploreSection />
        <Collections />
      </div>
      <Featured />
      <SaleSection />
      <TestimonialsSection />
      <HowItWorksSection />
      <BlogSection />
      <TeamSection />
      <div className="max-w-[85rem] mx-auto px-4 sm:px-6">
        <NewsletterSection />
      </div>
    </>
  );
}
