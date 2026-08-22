export default function Rewards() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 w-full pt-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Your Rewards</h1>
        <p className="text-gray-500 text-lg">Earn Aura Points on every booking and unlock exclusive discounts.</p>
      </div>

      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between shadow-xl">
        <div>
          <h2 className="text-lg font-medium text-indigo-100">Current Balance</h2>
          <div className="text-5xl font-extrabold mt-2">1,250 <span className="text-2xl font-bold text-indigo-200">pts</span></div>
        </div>
        <div className="mt-6 md:mt-0">
          <button className="bg-white text-indigo-600 px-6 py-3 rounded-full font-bold hover:bg-indigo-50 transition-colors shadow-lg">
            Redeem Points
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4 mt-8">Available Offers</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-2xl p-6 flex items-start gap-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
            <div className="w-12 h-12 bg-red-100 text-bms-red rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
              %
            </div>
            <div>
              <h4 className="font-bold text-gray-900">15% Off Movies</h4>
              <p className="text-sm text-gray-500 mt-1">Valid on minimum booking of 2 tickets. Max discount ₹150.</p>
              <div className="mt-3 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-block">500 pts</div>
            </div>
          </div>
          <div className="border border-gray-200 rounded-2xl p-6 flex items-start gap-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
              ₹
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Flat ₹200 Off Concerts</h4>
              <p className="text-sm text-gray-500 mt-1">Applicable on all live music events and concerts this weekend.</p>
              <div className="mt-3 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-block">1000 pts</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
