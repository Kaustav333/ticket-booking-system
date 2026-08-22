import { useState } from 'react';

export default function Support() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-12 w-full">
      <div className="text-center space-y-4 pt-8">
        <h1 className="text-4xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-500 text-lg">We're here to help you with your bookings and queries.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Form */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Us</h2>
          {submitted ? (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200">
              Your message has been sent successfully! Our team will get back to you within 24 hours.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:border-bms-red" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" required className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:border-bms-red" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue / Query</label>
                <textarea required rows={4} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:border-bms-red"></textarea>
              </div>
              <button type="submit" className="w-full bg-bms-red text-white font-bold py-3 rounded-xl hover:bg-bms-hover transition-colors">
                Send Message
              </button>
            </form>
          )}
        </div>

        {/* FAQs */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900">How do I cancel my booking?</h3>
              <p className="text-gray-500 text-sm mt-2">Currently, all bookings are final and non-refundable. Please ensure your availability before confirming the payment.</p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900">I didn't receive my booking confirmation.</h3>
              <p className="text-gray-500 text-sm mt-2">Check your 'My Bookings' section from the top navigation. Your booking reference and details will always be available there.</p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900">How can I list my own show?</h3>
              <p className="text-gray-500 text-sm mt-2">Create an account and sign up as an 'Organiser'. Once approved, you will have access to the Organiser Dashboard to create and manage events.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
