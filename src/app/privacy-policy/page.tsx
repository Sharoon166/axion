import PageHeader from '@/components/PageHeader';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen mt-10 sm:mt-0">
      <PageHeader
        title="Privacy Policy"
        subtitle="Overview of what we collect, how we use it, and your rights"
      />

     <div className="max-w-[85rem] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="p-0 sm:p-8">
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Privacy Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                This privacy policy is an overview of the information we collect and use about our visitors from our site. It is subject to change at any time without prior notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Personal information</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                When you visit the site, we collect some information regarding your device and location. The information may also include—but is not limited to—the web activities you perform on our site, pages you visit, and products you search. For the most part, this is known as the “device information.”
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our information collection technologies</h2>
              <p className="text-gray-600 leading-relaxed mb-4">Primarily we use three different technologies for the collection of information. These include:</p>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                <li>
                  <strong>Cookies:</strong> These are files placed on your computer and have a unique identifier. You can learn more about cookies at{' '}
                  <a href="http://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">http://www.allaboutcookies.org</a> and how to disable them if required.
                </li>
                <li>
                  <strong>Log files:</strong> Another way of tracking users is log files. They help determine your IP address and browser along with similar browsing information. Moreover, the date and time stamps are also recorded for exit and entry points.
                </li>
                <li>
                  <strong>Web beacons and tags:</strong> These are also technologies we use to collect your browsing details.
                </li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                Apart from the above, we may also collect information about your activities (e.g., login times and details) and data including your name, shipping details, and address for maintaining records and delivering orders appropriately. This type of information is referred to as “order information.”
              </p>
              <p className="text-gray-600 leading-relaxed">
                Collectively, order and device information are referred to as the personal information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">How we use your personal information?</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                The personal information of individuals is used for a number of reasons. Our primary purpose for collecting this data is to optimize our services and make this website a better place for you. We collect this information to:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                <li>Communicate with you</li>
                <li>Deliver your orders</li>
                <li>Avoid any frauds and risks</li>
                <li>Provide better advertisement of our services and products</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Sharing your information</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Axion knows that your privacy matters, so we do our best to protect the data we record. We might be required to share information with third-party sources in order to improve our website and optimize our services. For instance, Google Analytics is a software which helps us analyze the behavior of our users. So, the information from our website is processed by Google Analytics, and we get an overview of what pages are underperforming and where we need to work and make things better.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Moreover, your information might be shared with legal authorities if required and is necessary.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Do not track</h2>
              <p className="text-gray-600 leading-relaxed">
                Upon the “do not track” signal from your browser, the site’s data collection and usage practices are not altered.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your rights</h2>
              <p className="text-gray-600 leading-relaxed">
                It is your right to ask for the removal of data if you have any problem or if you are feeling insecure. The company will comply with your requirements and may delete the information upon request. Moreover, if you have any further queries about the usage of data, feel it is being misused, or you are being misguided, you can always contact us and we will be here to resolve the matter.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600 mb-2"><strong>Email:</strong> privacy@axion.com</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}