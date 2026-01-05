import React, { useState, useEffect } from 'react';
import { Search, Filter, Clock, Calendar, DollarSign, X, Save, Play, Pause, Plus, Copy, Check, ArrowUpCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { generateSecretCode } from '../../lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  nationality: string;
  created_at: string;
  secret_code: string;
}

interface SearchResult {
  id: string;
  status: string;
  search_started_at: string;
  search_completed_at: string;
  tier: string;
}

interface Transaction {
  id: string;
  amount: number;
  date: string;
}

export function Customers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSearch, setUserSearch] = useState<SearchResult | null>(null);
  const [userTransaction, setUserTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showNewCodeModal, setShowNewCodeModal] = useState(false);
  const [newSecretCodes, setNewSecretCodes] = useState<string[]>([]);
  const [searchDuration, setSearchDuration] = useState(6);
  const [newAmount, setNewAmount] = useState('');
  const [copied, setCopied] = useState<Record<string, boolean>>({});
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(users || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const handleUserClick = async (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
    setError(null);

    try {
      // Fetch search results
      const { data: searchData } = await supabase
        .from('search_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Fetch transaction
      const { data: transactionData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setUserSearch(searchData);
      setUserTransaction(transactionData);
      
      if (transactionData) {
        setNewAmount(transactionData.amount.toString());
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      setError('Failed to fetch user details');
    }
  };

  const generateNewCodes = async () => {
    try {
      const codes = Array.from({ length: 10 }, () => generateSecretCode());
      
      // Store the codes in temp_codes table
      const { error } = await supabase
        .from('temp_codes')
        .insert(
          codes.map(code => ({
            code: code,
            used: false
          }))
        );

      if (error) {
        console.error('Error storing codes:', error);
        throw error;
      }

      setNewSecretCodes(codes);
      setShowNewCodeModal(true);
      setCopied({});
    } catch (error) {
      console.error('Error generating codes:', error);
      setError('Failed to generate new codes');
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(prev => ({ ...prev, [code]: true }));
    setTimeout(() => setCopied(prev => ({ ...prev, [code]: false })), 2000);
  };

  const updateSearchTimes = async () => {
    if (!selectedUser || !userSearch) return;
    setUpdating(true);
    setError(null);

    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + (searchDuration * 60 * 60 * 1000));

      // Call the update_search_duration function
      const { data, error } = await supabase
        .rpc('update_search_duration', {
          search_id: userSearch.id,
          new_end_time: endTime.toISOString()
        });

      if (error) throw error;

      if (data === false) {
        throw new Error('Invalid search duration for current tier');
      }

      // Update local state
      setUserSearch({
        ...userSearch,
        search_completed_at: endTime.toISOString()
      });
    } catch (error) {
      console.error('Error updating search times:', error);
      setError('Failed to update search duration. Please check tier limits.');
    } finally {
      setUpdating(false);
    }
  };

  const updateTransactionAmount = async () => {
    if (!selectedUser || !userTransaction) return;
    setUpdating(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          amount: parseFloat(newAmount)
        })
        .eq('id', userTransaction.id);

      if (error) throw error;

      setUserTransaction({
        ...userTransaction,
        amount: parseFloat(newAmount)
      });
    } catch (error) {
      console.error('Error updating transaction amount:', error);
      setError('Failed to update transaction amount');
    } finally {
      setUpdating(false);
    }
  };

  const upgradeToProTier = async () => {
    if (!selectedUser || !userTransaction) return;
    setUpgrading(true);
    setError(null);

    try {
      // Create a payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: selectedUser.id,
          payment_id: `ADMIN_${Date.now()}`,
          amount: 150, // Pro tier price
          currency: 'EUR',
          status: 'confirmed',
          tier: 'pro',
          payment_method: 'ADMIN',
          is_upgrade: true
        });

      if (paymentError) throw paymentError;

      // Wait a moment for the trigger to process
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fetch updated search results
      const { data: searchData } = await supabase
        .from('search_results')
        .select('*')
        .eq('user_id', selectedUser.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setUserSearch(searchData);
      
    } catch (error) {
      console.error('Error upgrading user:', error);
      setError('Failed to upgrade user to Pro tier');
    } finally {
      setUpgrading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.secret_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="text-gray-800">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Users</h1>
        <button
          onClick={generateNewCodes}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Generate New Codes
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Secret Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registration Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr 
                  key={user.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleUserClick(user)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-600 font-medium">
                          {user.name?.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.nationality}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">{user.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-mono text-gray-900">{user.secret_code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">User Details</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              {/* User Information */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-500">Name</label>
                      <p className="text-gray-900">{selectedUser.name}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Email</label>
                      <p className="text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Phone</label>
                      <p className="text-gray-900">{selectedUser.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Address</label>
                      <p className="text-gray-900">{selectedUser.address}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Nationality</label>
                      <p className="text-gray-900">{selectedUser.nationality}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Transaction Details</h3>
                  {userTransaction && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-500">Amount</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={newAmount}
                            onChange={(e) => setNewAmount(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                          />
                          <button
                            onClick={updateTransactionAmount}
                            disabled={updating}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm text-gray-500">Date</label>
                        <p className="text-gray-900">
                          {format(new Date(userTransaction.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  )}

                  <h3 className="text-lg font-semibold mt-6 mb-4">Search Control</h3>
                  {userSearch && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-500">Current Tier</label>
                        <p className="text-gray-900 capitalize mb-2">{userSearch.tier}</p>
                        {userSearch.tier === 'free' && (
                          <button
                            onClick={upgradeToProTier}
                            disabled={upgrading}
                            className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <ArrowUpCircle className="w-4 h-4" />
                            {upgrading ? 'Upgrading...' : 'Upgrade to Pro'}
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="text-sm text-gray-500">Search Duration (hours)</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="1"
                            max="24"
                            value={searchDuration}
                            onChange={(e) => setSearchDuration(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                          />
                          <button
                            onClick={updateSearchTimes}
                            disabled={updating}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {userSearch.status === 'searching' ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm text-gray-500">Search Status</label>
                        <p className="text-gray-900 capitalize">{userSearch.status}</p>
                      </div>

                      <div>
                        <label className="text-sm text-gray-500">Started At</label>
                        <p className="text-gray-900">
                          {format(new Date(userSearch.search_started_at), 'MMM d, yyyy HH:mm:ss')}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm text-gray-500">Completes At</label>
                        <p className="text-gray-900">
                          {format(new Date(userSearch.search_completed_at), 'MMM d, yyyy HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Codes Modal */}
      {showNewCodeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold mb-4">New Secret Codes Generated</h2>
            <p className="text-gray-600 mb-4">
              Share these codes with users to start their verification process:
            </p>
            
            <div className="space-y-3 mb-6">
              {newSecretCodes.map((code, index) => (
                <div
                  key={code}
                  className="bg-gray-100 p-4 rounded-lg flex items-center justify-between"
                >
                  <code className="text-lg font-mono text-indigo-600">{code}</code>
                  <button
                    onClick={() => copyToClipboard(code)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {copied[code] ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowNewCodeModal(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}