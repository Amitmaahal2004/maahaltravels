"use client";

import React, { useState, useEffect } from "react";
import {
  Globe,
  Save,
  CheckCircle,
  Sparkles,
  Layout,
  FileText,
  Compass,
} from "lucide-react";

interface ContentBlock {
  key: string;
  title: string;
  subtitle?: string;
  content?: string;
  isPublished: boolean;
}

export default function WebsiteCmsClient() {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Form states for predefined sections
  const [hero, setHero] = useState({
    key: "hero_section",
    title: "Unveil the Majesty of the Himalayas",
    subtitle: "Custom-curated treks, expeditions, and luxury mountain getaways in Manali, Ladakh, and Spiti.",
    content: "Explore breathtaking destinations with experienced local guides, 4x4 expedition vehicles, and luxury stays.",
    isPublished: true,
  });

  const [about, setAbout] = useState({
    key: "about_section",
    title: "About Explore My Packages",
    subtitle: "Two Decades of High-Altitude Travel Mastery",
    content: "Founded by Himalayan mountaineers, our agency connects intrepid travelers with authentic mountain cultures, pristine alpine lakes, and rugged valleys.",
    isPublished: true,
  });

  const [contact, setContact] = useState({
    key: "contact_info",
    title: "Get in Touch with Our Mountain Specialists",
    subtitle: "Headquarters: The Mall Road, Manali, Himachal Pradesh 175131",
    content: "Phone: +91 98765 43210 | Email: bookings@himalayanvistas.com | 24/7 Dispatch Desk",
    isPublished: true,
  });

  const fetchContent = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/crm/website_cms");
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setBlocks(data.data);
        const heroData = data.data.find((b: any) => b.key === "hero_section");
        if (heroData) setHero(heroData);
        const aboutData = data.data.find((b: any) => b.key === "about_section");
        if (aboutData) setAbout(aboutData);
        const contactData = data.data.find((b: any) => b.key === "contact_info");
        if (contactData) setContact(contactData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleSaveSection = async (sectionData: ContentBlock) => {
    try {
      setSavingKey(sectionData.key);
      const res = await fetch("/api/crm/website_cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sectionData),
      });
      const data = await res.json();
      if (data.success) {
        alert("Section updated and published to live website!");
        fetchContent();
      } else {
        alert(data.error || "Failed to save section");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving section");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Globe className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Website CMS & Public Content</h1>
          </div>
          <p className="text-sm text-slate-500">
            Control the public-facing travel website homepage banners, storytelling narrative, and contact channels.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading CMS Content from MongoDB Atlas...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 1: Hero Banner */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Layout className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Homepage Hero Banner</h2>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={hero.isPublished}
                  onChange={(e) => setHero({ ...hero, isPublished: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Published Live
              </label>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Headline Text</label>
                <input
                  type="text"
                  value={hero.title}
                  onChange={(e) => setHero({ ...hero, title: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Subtitle / Punchline</label>
                <input
                  type="text"
                  value={hero.subtitle || ""}
                  onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Supporting Overview</label>
                <textarea
                  rows={3}
                  value={hero.content || ""}
                  onChange={(e) => setHero({ ...hero, content: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={savingKey === hero.key}
                  onClick={() => handleSaveSection(hero)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs disabled:opacity-50 transition"
                >
                  <Save className="h-4 w-4" />
                  {savingKey === hero.key ? "Publishing..." : "Update Hero Banner"}
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: About Us */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">Agency About & Heritage</h2>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={about.isPublished}
                  onChange={(e) => setAbout({ ...about, isPublished: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Published Live
              </label>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Section Title</label>
                <input
                  type="text"
                  value={about.title}
                  onChange={(e) => setAbout({ ...about, title: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Tagline</label>
                <input
                  type="text"
                  value={about.subtitle || ""}
                  onChange={(e) => setAbout({ ...about, subtitle: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Agency Story & Mission</label>
                <textarea
                  rows={3}
                  value={about.content || ""}
                  onChange={(e) => setAbout({ ...about, content: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={savingKey === about.key}
                  onClick={() => handleSaveSection(about)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs disabled:opacity-50 transition"
                >
                  <Save className="h-4 w-4" />
                  {savingKey === about.key ? "Publishing..." : "Update About Story"}
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Contact & Support */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-xs lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">Public Contact Details & Headquarters</h2>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={contact.isPublished}
                  onChange={(e) => setContact({ ...contact, isPublished: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Published Live
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Contact Heading</label>
                <input
                  type="text"
                  value={contact.title}
                  onChange={(e) => setContact({ ...contact, title: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">HQ Address</label>
                <input
                  type="text"
                  value={contact.subtitle || ""}
                  onChange={(e) => setContact({ ...contact, subtitle: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-700 font-medium mb-1">Phone, Email, & Emergency Desk</label>
                <input
                  type="text"
                  value={contact.content || ""}
                  onChange={(e) => setContact({ ...contact, content: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={savingKey === contact.key}
                onClick={() => handleSaveSection(contact)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs disabled:opacity-50 transition"
              >
                <Save className="h-4 w-4" />
                {savingKey === contact.key ? "Publishing..." : "Update Public Contact Channels"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
