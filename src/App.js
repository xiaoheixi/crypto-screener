import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCcw, Loader2, TrendingUp, TrendingDown, ChevronUp, ChevronDown, Download } from 'lucide-react';

// Main App component
const App = () => {
  const [cryptos, setCryptos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currency, setCurrency] = useState('usd');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');

  // Function to fetch cryptocurrency data from CoinGecko API, wrapped in useCallback
  const fetchCryptoData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch top 100 cryptocurrencies (page 1)
      const response1 = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h%2C7d%2C30d%2C1y`
      );

      // Fetch next 100 cryptocurrencies (page 2)
      const response2 = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=100&page=2&sparkline=false&price_change_percentage=24h%2C7d%2C30d%2C1y`
      );

      if (!response1.ok || !response2.ok) {
        throw new Error(`HTTP error! status: ${response1.status || response2.status}`);
      }

      const data1 = await response1.json();
      const data2 = await response2.json();

      // Combine the data from both pages
      const combinedData = [...data1, ...data2];

      setCryptos(combinedData);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Failed to fetch cryptocurrency data:", err);
      setError("Failed to load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [currency]);

  // useEffect hook to fetch data when the component mounts or currency changes
  useEffect(() => {
    fetchCryptoData();
  }, [fetchCryptoData]);

  // Function to format market cap and volume numbers for display
  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Function to format percentage values for display
  const formatPercentage = (percentage) => {
    if (percentage === null || percentage === undefined) return 'N/A';
    const colorClass = percentage >= 0 ? 'text-green-500' : 'text-red-500';
    const icon = percentage >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />;
    return (
      <span className={`flex items-center gap-1 ${colorClass}`}>
        {icon}
        {percentage.toFixed(2)}%
      </span>
    );
  };

  // Function to handle sorting when a column header is clicked
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('desc');
    }
  };

  // Sort the cryptocurrencies based on the current sortColumn and sortOrder
  const sortedCryptos = [...cryptos].sort((a, b) => {
    if (!sortColumn) return 0;

    const valueA = a[sortColumn] || 0;
    const valueB = b[sortColumn] || 0;

    if (sortOrder === 'asc') {
      return valueA - valueB;
    } else {
      return valueB - valueA;
    }
  });

  // Filter for Majors (ranks 1-8) and Altcoins (ranks 9-200) from the sorted list
  const majors = sortedCryptos.filter(crypto => crypto.market_cap_rank >= 1 && crypto.market_cap_rank <= 8);
  const altcoins = sortedCryptos.filter(crypto => crypto.market_cap_rank >= 9 && crypto.market_cap_rank <= 200);


  // Helper function to render sort icons
  const renderSortIcon = (column) => {
    if (sortColumn === column) {
      return sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
    }
    return null;
  };

  // Function to export data to CSV
  const exportToCSV = () => {
    if (sortedCryptos.length === 0) {
      console.log("No data to export.");
      return;
    }

    // Define CSV headers
    const headers = [
      'Rank', 'Coin Name', 'Symbol', 'Price', 'Market Cap', 'Volume (24h)',
      'Short', 'Medium', 'Long'
    ];

    // Map crypto data to CSV rows (using the combined sortedCryptos)
    const csvRows = sortedCryptos.map(crypto => {
      // Helper to get raw numeric value for export
      const getNumericValue = (value) => (value === null || value === undefined ? '' : value);

      return [
        crypto.market_cap_rank,
        `"${crypto.name.replace(/"/g, '""')}"`,
        crypto.symbol.toUpperCase(),
        getNumericValue(crypto.current_price),
        getNumericValue(crypto.market_cap),
        getNumericValue(crypto.total_volume),
        getNumericValue(crypto.price_change_percentage_24h_in_currency),
        getNumericValue(crypto.price_change_percentage_7d_in_currency),
        getNumericValue(crypto.price_change_percentage_30d_in_currency)
      ].join(',');
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...csvRows
    ].join('\n');

    // Create a Blob and URL for download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Create a temporary link element and trigger download
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `crypto_performance_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 font-inter">
      <div className="max-w-7xl mx-auto bg-gray-800 rounded-lg shadow-xl p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-blue-400 mb-6">
          Crypto Performance Screener (Ranks 1-200)
        </h1>

        {/* Controls and Status */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="currency-select" className="text-gray-300">Display in:</label>
            <select
              id="currency-select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="usd">USD</option>
              <option value="eur">EUR</option>
              <option value="gbp">GBP</option>
              <option value="jpy">JPY</option>
              <option value="aud">AUD</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {lastUpdated && (
              <span className="text-sm text-gray-400">Last updated: {lastUpdated}</span>
            )}
            <button
              onClick={fetchCryptoData}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCcw size={20} />
                  Refresh Data
                </>
              )}
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={loading || cryptos.length === 0}
            >
              <Download size={20} />
              Export to CSV
            </button>
          </div>
        </div>

        {/* Loading and Error Messages */}
        {loading && (
          <div className="flex items-center justify-center py-10 text-blue-400">
            <Loader2 className="animate-spin mr-3" size={32} />
            <p className="text-lg">Loading cryptocurrency data...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-md text-center">
            <p>{error}</p>
          </div>
          )}

        {/* Majors Table (Ranks 1-8) */}
        {!loading && !error && (
          <>
            <h2 className="text-2xl md:text-3xl font-bold text-center text-blue-300 my-6">Majors (Ranks 1-8)</h2>
            <div className="overflow-x-auto rounded-lg border border-gray-700 mb-8">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tl-lg">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Coin
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Market Cap
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Volume (24h)
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors duration-200"
                      onClick={() => handleSort('price_change_percentage_24h_in_currency')}
                    >
                      <div className="flex items-center justify-between">
                        Short {renderSortIcon('price_change_percentage_24h_in_currency')}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors duration-200"
                      onClick={() => handleSort('price_change_percentage_7d_in_currency')}
                    >
                      <div className="flex items-center justify-between">
                        Medium {renderSortIcon('price_change_percentage_7d_in_currency')}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors duration-200"
                      onClick={() => handleSort('price_change_percentage_30d_in_currency')}
                    >
                      <div className="flex items-center justify-between">
                        Long {renderSortIcon('price_change_percentage_30d_in_currency')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {majors.map((crypto) => (
                    <tr key={crypto.id} className="hover:bg-gray-700 transition-colors duration-200">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        {crypto.market_cap_rank}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-100">
                        <div className="flex items-center">
                          <img
                            src={crypto.image}
                            alt={crypto.name}
                            className="w-6 h-6 rounded-full mr-2"
                            onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/24x24/333/FFF?text=${crypto.symbol.toUpperCase().charAt(0)}`; }}
                          />
                          <span className="font-medium">{crypto.name}</span>
                          <span className="ml-2 text-gray-400 uppercase text-xs">
                            {crypto.symbol}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200">
                        {formatNumber(crypto.current_price)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200">
                        {formatNumber(crypto.market_cap)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200">
                        {formatNumber(crypto.total_volume)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {formatPercentage(crypto.price_change_percentage_24h_in_currency)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {formatPercentage(crypto.price_change_percentage_7d_in_currency)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {formatPercentage(crypto.price_change_percentage_30d_in_currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Altcoins Table (Ranks 9-200) */}
        {!loading && !error && (
          <>
            <h2 className="text-2xl md:text-3xl font-bold text-center text-blue-300 my-6">Altcoins (Ranks 9-200)</h2>
            <div className="overflow-x-auto rounded-lg border border-gray-700">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tl-lg">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Coin
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Market Cap
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Volume (24h)
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors duration-200"
                      onClick={() => handleSort('price_change_percentage_24h_in_currency')}
                    >
                      <div className="flex items-center justify-between">
                        Short {renderSortIcon('price_change_percentage_24h_in_currency')}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors duration-200"
                      onClick={() => handleSort('price_change_percentage_7d_in_currency')}
                    >
                      <div className="flex items-center justify-between">
                        Medium {renderSortIcon('price_change_percentage_7d_in_currency')}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors duration-200"
                      onClick={() => handleSort('price_change_percentage_30d_in_currency')}
                    >
                      <div className="flex items-center justify-between">
                        Long {renderSortIcon('price_change_percentage_30d_in_currency')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {altcoins.map((crypto) => (
                    <tr key={crypto.id} className="hover:bg-gray-700 transition-colors duration-200">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        {crypto.market_cap_rank}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-100">
                        <div className="flex items-center">
                          <img
                            src={crypto.image}
                            alt={crypto.name}
                            className="w-6 h-6 rounded-full mr-2"
                            onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/24x24/333/FFF?text=${crypto.symbol.toUpperCase().charAt(0)}`; }}
                          />
                          <span className="font-medium">{crypto.name}</span>
                          <span className="ml-2 text-gray-400 uppercase text-xs">
                            {crypto.symbol}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200">
                        {formatNumber(crypto.current_price)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200">
                        {formatNumber(crypto.market_cap)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200">
                        {formatNumber(crypto.total_volume)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {formatPercentage(crypto.price_change_percentage_24h_in_currency)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {formatPercentage(crypto.price_change_percentage_7d_in_currency)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {formatPercentage(crypto.price_change_percentage_30d_in_currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <p className="text-center text-gray-500 text-xs mt-8">
          Data provided by CoinGecko. Prices may be delayed.
        </p>
      </div>
    </div>
  );
};

export default App;