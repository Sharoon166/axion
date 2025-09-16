'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Percent, Calendar, Tag, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Discount {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minAmount?: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
}

export default function DiscountsManagement() {
  const { user } = useAuth();
  const [discounts, setDiscounts] = useState<Discount[]>([
    {
      id: '1',
      code: 'SUMMER25',
      description: 'Summer Sale - 25% off on all products',
      type: 'percentage',
      value: 25,
      minAmount: 1000,
      maxDiscount: 5000,
      startDate: '2025-06-01',
      endDate: '2025-08-31',
      usageLimit: 100,
      usedCount: 45,
      isActive: true
    },
    {
      id: '2',
      code: 'NEWUSER',
      description: 'New User Discount - Rs.500 off',
      type: 'fixed',
      value: 500,
      minAmount: 2000,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      usageLimit: 1000,
      usedCount: 234,
      isActive: true
    },
    {
      id: '3',
      code: 'FLASH50',
      description: 'Flash Sale - 50% off limited time',
      type: 'percentage',
      value: 50,
      minAmount: 5000,
      maxDiscount: 10000,
      startDate: '2025-03-15',
      endDate: '2025-03-20',
      usageLimit: 50,
      usedCount: 50,
      isActive: false
    }
  ]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    minAmount: '',
    maxDiscount: '',
    startDate: '',
    endDate: '',
    usageLimit: '',
    isActive: true
  });

  // Filter discounts based on search
  const filteredDiscounts = discounts.filter(discount => 
    discount.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    discount.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newDiscount: Discount = {
      id: editingDiscount?.id || Date.now().toString(),
      code: formData.code,
      description: formData.description,
      type: formData.type,
      value: parseFloat(formData.value),
      minAmount: formData.minAmount ? parseFloat(formData.minAmount) : undefined,
      maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
      startDate: formData.startDate,
      endDate: formData.endDate,
      usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
      usedCount: editingDiscount?.usedCount || 0,
      isActive: formData.isActive
    };

    if (editingDiscount) {
      setDiscounts(discounts.map(d => d.id === editingDiscount.id ? newDiscount : d));
    } else {
      setDiscounts([...discounts, newDiscount]);
    }

    // Reset form
    setFormData({
      code: '', description: '', type: 'percentage', value: '', minAmount: '',
      maxDiscount: '', startDate: '', endDate: '', usageLimit: '', isActive: true
    });
    setShowAddDialog(false);
    setEditingDiscount(null);
  };

  // Handle edit
  const handleEdit = (discount: Discount) => {
    setEditingDiscount(discount);
    setFormData({
      code: discount.code,
      description: discount.description,
      type: discount.type,
      value: discount.value.toString(),
      minAmount: discount.minAmount?.toString() || '',
      maxDiscount: discount.maxDiscount?.toString() || '',
      startDate: discount.startDate,
      endDate: discount.endDate,
      usageLimit: discount.usageLimit?.toString() || '',
      isActive: discount.isActive
    });
    setShowAddDialog(true);
  };

  // Handle delete
  const handleDelete = (discountId: string) => {
    {
      setDiscounts(discounts.filter(d => d.id !== discountId));
    }
  };

  // Toggle active status
  const toggleActive = (discountId: string) => {
    setDiscounts(discounts.map(d => 
      d.id === discountId ? { ...d, isActive: !d.isActive } : d
    ));
  };

  const getStatusColor = (discount: Discount) => {
    if (!discount.isActive) return 'bg-gray-100 text-gray-800';
    
    const now = new Date();
    const endDate = new Date(discount.endDate);
    const startDate = new Date(discount.startDate);
    
    if (now > endDate) return 'bg-red-100 text-red-800';
    if (now < startDate) return 'bg-yellow-100 text-yellow-800';
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) return 'bg-red-100 text-red-800';
    
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (discount: Discount) => {
    if (!discount.isActive) return 'Inactive';
    
    const now = new Date();
    const endDate = new Date(discount.endDate);
    const startDate = new Date(discount.startDate);
    
    if (now > endDate) return 'Expired';
    if (now < startDate) return 'Scheduled';
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) return 'Limit Reached';
    
    return 'Active';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Discounts & Promotions</h2>
          <p className="text-gray-600">Manage discount codes and promotional offers</p>
        </div>
        {user?.isAdmin && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Tag className="w-4 h-4 mr-2" />
                Add Discount
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingDiscount ? 'Edit Discount' : 'Create New Discount'}</DialogTitle>
                <DialogDescription>
                  {editingDiscount ? 'Update discount details' : 'Create a new discount code or promotion'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Code</label>
                    <Input
                      required
                      placeholder="e.g., SUMMER25"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                    <Select value={formData.type} onValueChange={(value: 'percentage' | 'fixed') => setFormData({...formData, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount (Rs.)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <Textarea
                    required
                    placeholder="Brief description of the discount"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.type === 'percentage' ? 'Percentage (%)' : 'Amount (Rs.)'}
                    </label>
                    <Input
                      required
                      type="number"
                      placeholder={formData.type === 'percentage' ? '25' : '500'}
                      value={formData.value}
                      onChange={(e) => setFormData({...formData, value: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount (Rs.)</label>
                    <Input
                      type="number"
                      placeholder="1000"
                      value={formData.minAmount}
                      onChange={(e) => setFormData({...formData, minAmount: e.target.value})}
                    />
                  </div>
                  {formData.type === 'percentage' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (Rs.)</label>
                      <Input
                        type="number"
                        placeholder="5000"
                        value={formData.maxDiscount}
                        onChange={(e) => setFormData({...formData, maxDiscount: e.target.value})}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <Input
                      required
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <Input
                      required
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit (Optional)</label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="rounded"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Active (users can use this discount)
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingDiscount ? 'Update Discount' : 'Create Discount'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Discounts</p>
                <p className="text-2xl font-bold text-gray-900">{discounts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {discounts.filter(d => d.isActive && new Date() <= new Date(d.endDate)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Percent className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Usage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {discounts.reduce((sum, d) => sum + d.usedCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-gray-900">
                  {discounts.filter(d => new Date() > new Date(d.endDate)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Discounts Table */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Discount Codes</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search discounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Code</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Value</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Usage</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Valid Until</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDiscounts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500">
                      <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No discounts found</p>
                      <p className="text-sm">Create your first discount code to get started</p>
                    </td>
                  </tr>
                ) : (
                  filteredDiscounts.map((discount) => (
                  <tr key={discount.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded text-sm w-fit">
                        {discount.code}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-900 max-w-xs truncate">{discount.description}</td>
                    <td className="py-4 px-4 text-gray-600 capitalize">{discount.type}</td>
                    <td className="py-4 px-4 font-semibold text-gray-900">
                      {discount.type === 'percentage' ? `${discount.value}%` : `Rs.${discount.value}`}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {discount.usedCount}{discount.usageLimit ? `/${discount.usageLimit}` : ''}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {new Date(discount.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={`${getStatusColor(discount)} w-fit`}>
                        {getStatusText(discount)}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(discount)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant={discount.isActive ? "outline" : "default"}
                          size="sm"
                          onClick={() => toggleActive(discount.id)}
                        >
                          {discount.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(discount.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}