import PageHeader from '@/components/PageHeader';
// Icons removed as the simplified policy page doesn't use them

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen mt-10 sm:mt-0">
      <PageHeader
        title="Shipping & Return Policy"
        subtitle="Our shipping coverage in Pakistan, free delivery, and easy returns"
      />

      <div className="max-w-[85rem] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="p-0 sm:p-8">
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Shipping</h2>
              <p className="text-gray-600 leading-relaxed">
                Any product you purchase from Axion through any platform, including website,
                Facebook, and Instagram, will come with free shipping. We offer shipping services
                throughout Pakistan and you are automatically eligible for free shipping upon
                ordering any product(s).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Return policy</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If any product arrives to you damaged or discolored, you can file for return. Do
                note that the return filing should be immediate upon receiving the parcel. The
                company will look into the matter and facilitate accordingly. We are open to any
                returns if the product you receive does not satisfy its description.
              </p>
              <p className="text-gray-700 font-medium">Do note the following when ordering:</p>
              <ol className="list-decimal list-inside text-gray-600 mt-2 space-y-1">
                <li>
                  The color of the item may vary slightly because of various factors including your
                  screen colors and monitor brightness.
                </li>
                <li>We request you to allow for slight deviation in measurement data.</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Support</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have any query regarding your orders or you are having trouble dealing with a
                parcel/shipment, you can contact us at{' '}
                <span className="font-semibold">(+92) 343 9227883</span>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
