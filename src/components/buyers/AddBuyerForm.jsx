import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { motion } from "framer-motion";

export default function AddBuyerForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    investment_type: "",
    price_cap: "",
    preferred_zipcodes: [],
    max_rehab_budget: "",
    rehab_level: ""
  });
  const [zipInput, setZipInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      price_cap: parseFloat(formData.price_cap) || 0,
      max_rehab_budget: parseFloat(formData.max_rehab_budget) || 0
    });
  };

  const addZipCode = () => {
    if (zipInput && !formData.preferred_zipcodes.includes(zipInput)) {
      setFormData({
        ...formData,
        preferred_zipcodes: [...formData.preferred_zipcodes, zipInput]
      });
      setZipInput("");
    }
  };

  const removeZipCode = (zipToRemove) => {
    setFormData({
      ...formData,
      preferred_zipcodes: formData.preferred_zipcodes.filter(zip => zip !== zipToRemove)
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <Card className="w-full max-w-2xl glass-effect shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Add New Cash Buyer</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="investment_type">Investment Type *</Label>
                <Select value={formData.investment_type} onValueChange={(value) => setFormData({...formData, investment_type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fix & Flip">Fix & Flip</SelectItem>
                    <SelectItem value="Buy & Hold">Buy & Hold</SelectItem>
                    <SelectItem value="Wholesale">Wholesale</SelectItem>
                    <SelectItem value="BRRRR">BRRRR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="rehab_level">Rehab Level</Label>
                <Select value={formData.rehab_level} onValueChange={(value) => setFormData({...formData, rehab_level: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Light">Light Rehab</SelectItem>
                    <SelectItem value="Medium">Medium Rehab</SelectItem>
                    <SelectItem value="Heavy">Heavy Rehab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price_cap">Max Purchase Price</Label>
                <Input
                  id="price_cap"
                  type="number"
                  value={formData.price_cap}
                  onChange={(e) => setFormData({...formData, price_cap: e.target.value})}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="max_rehab_budget">Max Rehab Budget</Label>
                <Input
                  id="max_rehab_budget"
                  type="number"
                  value={formData.max_rehab_budget}
                  onChange={(e) => setFormData({...formData, max_rehab_budget: e.target.value})}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label>Preferred ZIP Codes</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={zipInput}
                  onChange={(e) => setZipInput(e.target.value)}
                  placeholder="Enter ZIP code"
                  className="flex-1"
                />
                <Button type="button" onClick={addZipCode} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.preferred_zipcodes.map((zip, index) => (
                  <Badge key={index} variant="outline" className="pr-1">
                    {zip}
                    <button
                      type="button"
                      onClick={() => removeZipCode(zip)}
                      className="ml-2 hover:bg-slate-200 rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600">
                Add Buyer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}