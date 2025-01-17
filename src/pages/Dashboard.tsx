import React from 'react';

function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Recent Decks</h2>
          <p className="text-gray-600">No recent decks</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Recent Tests</h2>
          <p className="text-gray-600">No recent tests</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Study Progress</h2>
          <p className="text-gray-600">No progress data available</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 