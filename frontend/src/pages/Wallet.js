import { useState, useEffect } from 'react';
import axios from 'axios';
import { Wallet as WalletIcon, Plus, History, Loader, QrCode, CheckCircle, XCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Wallet({ user }) {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoadWallet, setShowLoadWallet] = useState(false);
  const [loadAmount, setLoadAmount] = useState('');
  const [qrCode, setQrCode] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch balance
      const balanceRes = await axios.get(`${API}/wallet/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setBalance(balanceRes.data.balance);

      // Fetch transaction history
      const historyRes = await axios.get(`${API}/wallet/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTransactions(historyRes.data);
    } catch (err) {
      setError('Error fetching wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);  // Empty dependency array is intentional - only fetch on mount

  const handleGenerateQR = async () => {
    if (!loadAmount || parseFloat(loadAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setError('');
    setProcessingPayment(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/wallet/generate-qr?amount=${parseFloat(loadAmount)}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setQrCode(response.data.qr_code);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error generating QR code');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!transactionId) {
      setError('Please enter transaction ID');
      return;
    }

    setError('');
    setSuccess('');
    setProcessingPayment(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/wallet/add-funds`,
        {
          amount: parseFloat(loadAmount),
          transaction_id: transactionId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccess('Funds added successfully!');
      
      // Refresh wallet data
      await fetchWalletData();
      
      // Reset form
      setLoadAmount('');
      setTransactionId('');
      setQrCode(null);
      setShowLoadWallet(false);
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error adding funds');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Loader className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <WalletIcon className="w-7 h-7" />
          My Wallet
        </h2>
        <p className="text-green-100">Manage your balance and transactions</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-6 h-6" />
          <p className="font-semibold">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <XCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <p className="text-indigo-100">Available Balance</p>
              <WalletIcon className="w-6 h-6" />
            </div>
            <p className="text-4xl font-bold mb-6">₹{balance.toFixed(2)}</p>
            <button
              onClick={() => setShowLoadWallet(!showLoadWallet)}
              className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Load Wallet
            </button>
          </div>

          {/* Load Wallet Form */}
          {showLoadWallet && (
            <div className="mt-4 bg-white rounded-xl shadow-md p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-600" />
                Load Wallet
              </h3>

              {!qrCode ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter Amount
                    </label>
                    <input
                      type="number"
                      value={loadAmount}
                      onChange={(e) => setLoadAmount(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      placeholder="₹ 0.00"
                      min="1"
                      step="0.01"
                    />
                  </div>
                  <button
                    onClick={handleGenerateQR}
                    disabled={processingPayment}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processingPayment ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <QrCode className="w-5 h-5" />
                        Generate QR
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                    <p className="text-sm text-gray-600 mb-2 text-center">Scan to pay ₹{loadAmount}</p>
                    <img src={qrCode} alt="UPI QR Code" className="w-full max-w-xs mx-auto" />
                    <p className="text-xs text-gray-500 text-center mt-2">UPI ID: 7368087310@ybl</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transaction ID (After Payment)
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      placeholder="Enter UPI transaction ID"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setQrCode(null);
                        setTransactionId('');
                      }}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmPayment}
                      disabled={processingPayment}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {processingPayment ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Confirm
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                Transaction History
              </h3>
            </div>

            {transactions.length === 0 ? (
              <div className="p-12 text-center">
                <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No transactions yet</p>
                <p className="text-sm text-gray-500 mt-1">All your activity will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {transactions.map((txn) => (
                  <div key={txn.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          txn.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {txn.type === 'credit' ? (
                            <Plus className={`w-5 h-5 text-green-600`} />
                          ) : (
                            <History className={`w-5 h-5 text-red-600`} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{txn.description}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(txn.created_at).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          txn.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Balance: ₹{txn.balance_after.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-xl">
        <p className="text-sm">
          <strong>Note:</strong> After making a UPI payment, please enter the transaction ID to confirm the payment. Funds will be added to your wallet after verification.
        </p>
      </div>
    </div>
  );
}
