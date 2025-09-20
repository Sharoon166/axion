import PageHeader from '@/components/PageHeader';
import Link from 'next/link';

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen mt-10 sm:mt-0">
      <PageHeader
        title="Terms & Conditions"
        subtitle="Terms governing the use of Axion and its services"
      />

      <div className="max-w-[85rem] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="p-0 sm:p-8">
          <div className="prose prose-lg max-w-none">

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
              <p className="text-gray-600 leading-relaxed">
                This page guides our users/traffic/visitors about our terms and policies. The words “our,” “us,” “we,” “website,” “company,” and “site” are referring to <strong>axion</strong>. By using this site, you agree to comply with the Terms and Conditions, Privacy Policy, Return Policy, and Shipping Policies. These Terms and Conditions are subject to change at any time without prior notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Site’s Usage</h2>
              <p className="text-gray-600 leading-relaxed">
                Our website hereby permits its users to purchase any product they like for their personal use. We do not promote purchases for third parties or commercial use. If anything goes wrong as you purchase for a third party or for commercial purposes, you are solely responsible and liable for any outcome. If you breach any of the terms and conditions listed here, your access may be revoked and you may be terminated and banned from using this site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Products</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                The contents given on our site reflect our products—serving as a catalog to showcase what we have to offer. Because of digital displays and photography, products may appear slightly different. You can log in, log out, and add items to your cart and wishlist any time you like.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Do note that exploiting any loopholes and misusing any feature of the website is criminal. You are advised to avoid abusing any feature or individual on this site. Doing so may invoke legal actions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Orders, Delivery, and Pricing</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong>Axion</strong> reserves the right to process orders and deliver them at its preference. We hold the right to refuse and cancel any order at any time and shall not be held liable. We do our best to process your orders and deliver the goods on time.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Users might be asked to provide additional information along with the basic information required at the time of the order. This is to assure the security of the order and to prevent fraudulent activities.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Pricing is subject to change. We reserve the right to modify, increase, or decrease any price at any hour of the day without prior notice. For details about returns, please see our <Link href="/shipping-policy" className="text-blue-600 underline">Shipping & Return Policy</Link> page.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Use of Intellectual Property</h2>
              <p className="text-gray-600 leading-relaxed">
                Any intellectual property or trademark falling under <strong>Axion</strong> should not be misused, copied, or altered by any means. Such actions may constitute intellectual property theft or misuse, and legal actions might be pursued accordingly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Dispute Resolution</h2>
              <p className="text-gray-600 leading-relaxed">
                It is clarified that <strong>Axion</strong> works hard to assure smooth operations and flow of goods. In case of any dispute, you should contact the management. As the company reserves rights to orders, deliveries, pricing, payment terms, and goods—and they are subject to change at any time—the company cannot be held liable by any means on legal forums. Any dispute shall be resolved between management and customers. We assure you that the management will cooperate and rectify any problems you may face. However, upon finding any fraudulent activity or misuse at the user’s end, the company reserves the right to pursue legal actions and court cases.
              </p>
            </section>

            <section className="mb-2">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact</h2>
              <p className="text-gray-600 leading-relaxed">
                For questions about these Terms & Conditions, please contact us via the details on our <a href="/privacy-policy" className="text-blue-600 underline">Privacy Policy</a> page or the <a href="/shipping-policy" className="text-blue-600 underline">Shipping & Return Policy</a> page.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}