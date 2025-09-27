import PageHeader from '@/components/PageHeader';
import { Package, Clock, CreditCard, AlertCircle } from 'lucide-react';

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Return"
        titleHighlight="Policy"
        subtitle="Easy returns and exchanges for your peace of mind"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Overview Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">30-Day Returns</h3>
            <p className="text-gray-600">Return most items within 30 days of delivery</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <Package className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Free Return Shipping</h3>
            <p className="text-gray-600">We provide prepaid return labels for your convenience</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <CreditCard className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Refunds</h3>
            <p className="text-gray-600">Refunds processed within 3-5 business days</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="prose prose-lg max-w-none">
            <p className="text-sm text-gray-500 mb-8">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Return Promise</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                At Axion, we want you to be completely satisfied with your purchase. If you&apos;re not happy with your order 
                for any reason, we offer a hassle-free return policy to ensure your shopping experience is exceptional.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Return Timeframe</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                You have <strong>30 days</strong> from the date of delivery to return most items. The return period 
                begins on the day you receive your order. For gift purchases, the return period begins on the date 
                the gift was delivered to the recipient.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Important Note</h4>
                    <p className="text-blue-800 text-sm">
                      Some items have different return periods. Please check the specific product page for details.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Return Conditions</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                To be eligible for a return, items must meet the following conditions:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                <li>Items must be in original, unused condition</li>
                <li>Original packaging and tags must be intact</li>
                <li>Items must be free from damage not caused by defect</li>
                <li>All accessories and components must be included</li>
                <li>Items must not show signs of wear or use</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Items That Cannot Be Returned</h3>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                <li>Personalized or customized items</li>
                <li>Perishable goods or items with expiration dates</li>
                <li>Digital downloads or software</li>
                <li>Gift cards and promotional items</li>
                <li>Items marked as Final Sale</li>
                <li>Intimate apparel and swimwear (for hygiene reasons)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Return an Item</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Online Returns (Recommended)</h3>
              <ol className="list-decimal list-inside text-gray-600 mb-6 space-y-3">
                <li>Log into your account and go to Order History</li>
                <li>Find your order and click Return Items</li>
                <li>Select the items you want to return and provide a reason</li>
                <li>Print the prepaid return shipping label</li>
                <li>Package the items securely in the original packaging</li>
                <li>Attach the return label and drop off at any authorized location</li>
              </ol>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">In-Store Returns</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                You can also return eligible items to any of our retail locations. Bring your order confirmation 
                and a valid ID. Our store associates will be happy to process your return immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Refund Process</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Processing Time</h3>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                <li><strong>Inspection:</strong> 1-2 business days after we receive your return</li>
                <li><strong>Refund Processing:</strong> 3-5 business days after approval</li>
                <li><strong>Bank Processing:</strong> 5-10 business days (varies by bank)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Refund Method</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Refunds will be issued to your original payment method:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                <li>Credit/Debit Cards: Refunded to the original card</li>
                <li>PayPal: Refunded to your PayPal account</li>
                <li>Gift Cards: Refunded as store credit</li>
                <li>Cash Purchases: Refunded in cash (in-store only)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Exchanges</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We currently don&apos;t offer direct exchanges. If you need a different size, color, or model:
              </p>
              <ol className="list-decimal list-inside text-gray-600 mb-6 space-y-2">
                <li>Return the original item following our return process</li>
                <li>Place a new order for the item you want</li>
                <li>We&apos;ll process your refund and new order simultaneously</li>
              </ol>
              <p className="text-gray-600 leading-relaxed mb-4">
                This ensures you get the item you want as quickly as possible and aren&apos;t charged twice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Damaged or Defective Items</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you receive a damaged or defective item, please contact us immediately. We will:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                <li>Provide a prepaid return label at no cost to you</li>
                <li>Expedite the return process</li>
                <li>Offer a full refund or replacement</li>
                <li>Cover any additional shipping costs</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                Please take photos of the damage and include them when contacting customer service to help us 
                resolve the issue quickly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">International Returns</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                International customers can return items, but please note:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                <li>Return shipping costs are the customer&apos;s responsibility</li>
                <li>Items must be returned within 30 days of delivery</li>
                <li>Customs duties and taxes are non-refundable</li>
                <li>Processing may take additional time due to customs</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Return Shipping</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Free Return Shipping</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We provide free return shipping labels for most returns within the United States. Simply print 
                the label from your account and attach it to your package.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Package Safely</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Please package items carefully to prevent damage during return shipping. We recommend:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                <li>Using the original packaging when possible</li>
                <li>Wrapping fragile items in bubble wrap or padding</li>
                <li>Sealing the package securely with tape</li>
                <li>Keeping your tracking number for reference</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have any questions about returns or need assistance with your return, our customer service 
                team is here to help:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600 mb-2"><strong>Email:</strong> returns@axion.com</p>
                <p className="text-gray-600 mb-2"><strong>Phone:</strong> 1-800-AXION-HELP</p>
                <p className="text-gray-600 mb-2"><strong>Live Chat:</strong> Available 24/7 on our website</p>
                <p className="text-gray-600"><strong>Hours:</strong> Monday-Friday 8AM-8PM, Saturday-Sunday 9AM-6PM EST</p>
              </div>
            </section>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Need Help?</h3>
              <p className="text-green-800 mb-4">
                Our customer service team is ready to assist you with any return questions or concerns.
              </p>
              <a
                href="/contact"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}