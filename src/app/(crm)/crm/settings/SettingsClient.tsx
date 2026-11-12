"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Building,
  Receipt,
  Mail,
  ShieldCheck,
  Save,
  CheckCircle,
  Sparkles,
} from "lucide-react";

export default function SettingsClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    agencyName: "",
    tagline: "",
    supportEmail: "",
    phone: "",
    address: "",
    gstin: "",
    currency: "INR",
    currencySymbol: "₹",
    defaultGstRate: 5,
    invoicePrefix: "INV",
    bookingPrefix: "BK",
    smtpEnabled: true,
  });

  useEffect(() => {
    fetch("/api/crm/settings")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setSettings(res.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch("/api/crm/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        alert("System settings successfully updated in MongoDB Atlas!");
      } else {
        alert(data.error || "Failed to save settings");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs">Loading Settings from MongoDB Atlas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Settings className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System & Agency Configuration</h1>
          </div>
          <p className="text-sm text-slate-500">
            Define corporate travel agency identity, tax compliance codes, and ledger prefixes.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Agency Profile */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Agency Legal Profile</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Company / Agency Name</label>
              <input
                type="text"
                value={settings.agencyName}
                onChange={(e) => setSettings({ ...settings, agencyName: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Corporate Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Support Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Official Helpline Phone</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Headquarters Registered Address</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">GSTIN Tax Registration Number</label>
              <input
                type="text"
                value={settings.gstin}
                onChange={(e) => setSettings({ ...settings, gstin: e.target.value.toUpperCase() })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Financial & Ledger Config */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Receipt className="h-5 w-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Financial & Billing Rules</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Default GST Rate (%)</label>
              <input
                type="number"
                value={settings.defaultGstRate}
                onChange={(e) => setSettings({ ...settings, defaultGstRate: Number(e.target.value) })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Invoice Number Prefix</label>
              <input
                type="text"
                value={settings.invoicePrefix}
                onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value.toUpperCase() })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Booking Reference Prefix</label>
              <input
                type="text"
                value={settings.bookingPrefix}
                onChange={(e) => setSettings({ ...settings, bookingPrefix: e.target.value.toUpperCase() })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Notification Automation */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Mail className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Email & Notifications</h2>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <p className="text-sm font-bold text-slate-900">Automated Booking Confirmations</p>
              <p className="text-xs text-slate-500">
                Send instant email confirmations and digital tax invoices when bookings are created.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.smtpEnabled}
                onChange={(e) => setSettings({ ...settings, smtpEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs disabled:opacity-50 transition"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving Changes..." : "Save System Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
