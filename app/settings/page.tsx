"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AvatarUpload } from "@/components/ui/AvatarUpload";

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-pixel text-[9px] uppercase tracking-[0.3em] text-zinc-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-black transition-colors placeholder:text-zinc-300"
      />
    </div>
  );
}

export default function SettingsPage() {
  const { connected: isConnected } = useWallet();
  const me = useQuery(api.users.getMe);
  const updateProfile = useMutation(api.users.updateProfile);

  const [form, setForm] = useState({
    displayName: "",
    bio: "",
    socialUrl: "",
    avatarUrl: "",
    fullName: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);

  type MeType = {
    bio?: string;
    socialUrl?: string;
    shippingAddress?: {
      fullName: string;
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      phone?: string;
    };
    phone?: string;
  };

  useEffect(() => {
    if (!me) return;
    const user = me as MeType;
    setForm({
      displayName: me.displayName ?? "",
      bio: user.bio ?? "",
      socialUrl: user.socialUrl ?? "",
      avatarUrl: me.avatarUrl ?? "",
      fullName: user.shippingAddress?.fullName ?? "",
      street: user.shippingAddress?.street ?? "",
      city: user.shippingAddress?.city ?? "",
      state: user.shippingAddress?.state ?? "",
      zipCode: user.shippingAddress?.zipCode ?? "",
      country: user.shippingAddress?.country ?? "",
      phone: user.shippingAddress?.phone ?? user.phone ?? "",
    });
  }, [me]);

  const hasShippingAddress = !!(
    form.fullName &&
    form.street &&
    form.city &&
    form.state &&
    form.zipCode &&
    form.country &&
    form.phone
  );

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({
        displayName: form.displayName || undefined,
        bio: form.bio,
        socialUrl: form.socialUrl,
        avatarUrl: form.avatarUrl,
        shippingAddress: hasShippingAddress
          ? {
              fullName: form.fullName,
              street: form.street,
              city: form.city,
              state: form.state,
              zipCode: form.zipCode,
              country: form.country,
              phone: form.phone,
            }
          : undefined,
      });
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-white text-black font-sans">
        <Navbar variant="dark" />
        <div className="max-w-7xl mx-auto px-4 py-40 flex flex-col items-center gap-4">
          <p className="font-pixel text-[10px] uppercase tracking-[0.3em] opacity-40">
            Connect wallet to manage settings
          </p>
        </div>
        <Footer variant="dark" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
      <Navbar variant="dark" />

      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tighter mb-1">Settings</h1>
          <p className="text-sm text-zinc-500">Manage your profile and shipping details</p>
        </div>

        {!me ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-zinc-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {/* Profile */}
            <section>
              <h2 className="text-base font-bold tracking-tight mb-6">Profile</h2>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="font-pixel text-[9px] uppercase tracking-[0.3em] text-zinc-400">
                    Avatar
                  </label>
                  <AvatarUpload
                    currentAvatar={form.avatarUrl}
                    onUploadComplete={(key) =>
                      setForm((prev) => ({ ...prev, avatarUrl: key }))
                    }
                    onClear={() => setForm((prev) => ({ ...prev, avatarUrl: "" }))}
                    onUploadError={(err) => toast.error(err)}
                    size="lg"
                  />
                </div>
                <InputField
                  label="Display Name"
                  value={form.displayName}
                  onChange={(v) => setForm((prev) => ({ ...prev, displayName: v }))}
                  placeholder="Your name"
                  maxLength={50}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="font-pixel text-[9px] uppercase tracking-[0.3em] text-zinc-400">Bio</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell buyers about yourself..."
                    maxLength={500}
                    rows={3}
                    className="border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-black transition-colors placeholder:text-zinc-300 resize-none"
                  />
                  <p className="text-[10px] text-zinc-300 text-right">{form.bio.length}/500</p>
                </div>
                <InputField
                  label="Social URL"
                  value={form.socialUrl}
                  onChange={(v) => setForm((prev) => ({ ...prev, socialUrl: v }))}
                  placeholder="https://twitter.com/username"
                  type="url"
                />
              </div>
            </section>

            {/* Shipping Address */}
            <section>
              <div className="mb-6">
                <h2 className="text-base font-bold tracking-tight">Default Shipping Address</h2>
                <p className="text-xs text-zinc-400 mt-1">Pre-filled automatically when purchasing physical artworks</p>
              </div>
              <div className="flex flex-col gap-4">
                <InputField
                  label="Full Name"
                  value={form.fullName}
                  onChange={(v) => setForm((prev) => ({ ...prev, fullName: v }))}
                  placeholder="Your full name"
                />
                <InputField
                  label="Street Address"
                  value={form.street}
                  onChange={(v) => setForm((prev) => ({ ...prev, street: v }))}
                  placeholder="123 Main Street"
                />
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="City"
                    value={form.city}
                    onChange={(v) => setForm((prev) => ({ ...prev, city: v }))}
                    placeholder="Kuala Lumpur"
                  />
                  <InputField
                    label="State / Region"
                    value={form.state}
                    onChange={(v) => setForm((prev) => ({ ...prev, state: v }))}
                    placeholder="Selangor"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Postcode"
                    value={form.zipCode}
                    onChange={(v) => setForm((prev) => ({ ...prev, zipCode: v }))}
                    placeholder="50000"
                  />
                  <InputField
                    label="Country"
                    value={form.country}
                    onChange={(v) => setForm((prev) => ({ ...prev, country: v }))}
                    placeholder="Malaysia"
                  />
                </div>
                <InputField
                  label="Phone"
                  value={form.phone}
                  onChange={(v) => setForm((prev) => ({ ...prev, phone: v }))}
                  placeholder="+60 12 345 6789"
                  type="tel"
                  maxLength={20}
                />
              </div>
            </section>

            {/* Save */}
            <div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-black text-white font-medium py-3 hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer variant="dark" />
    </main>
  );
}
