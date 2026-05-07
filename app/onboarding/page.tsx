"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "convex/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/lib/context/UserContext";
import { useWalletAddress } from "@/lib/hooks/useWalletAddress";
import { SealCheckIcon, ArrowRightIcon, PencilSimpleIcon, MegaphoneSimpleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import Link from "next/link";

type ProfileForm = {
  displayName: string;
  avatarUrl: string;
};

type ProfileFormProps = {
  displayName: string;
  avatarUrl: string;
  onSaved: () => void;
};

function ProfileSetupForm({ displayName, avatarUrl, onSaved }: ProfileFormProps) {
  const [error, setError] = useState<string | null>(null);
  const updateProfile = useMutation(api.users.updateProfile);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileForm>({
    defaultValues: { displayName, avatarUrl },
  });

  async function onSubmit(data: ProfileForm) {
    setError(null);
    try {
      await updateProfile({
        displayName: data.displayName || undefined,
        avatarUrl: data.avatarUrl || undefined,
      });
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div>
        <label className="block font-pixel text-[10px] uppercase tracking-widest text-zinc-500 mb-4">
          Display Name <span className="text-zinc-300">(optional)</span>
        </label>
        <input
          type="text"
          placeholder="YOUR CREATOR NAME"
          {...register("displayName", {
            maxLength: { value: 50, message: "Max 50 characters" },
          })}
          className="w-full bg-transparent placeholder:text-zinc-400 border-b border-black/10 py-4 focus:border-black focus:outline-none transition-colors text-xl font-bold uppercase tracking-tighter"
        />
        {errors.displayName && (
          <p className="mt-2 text-xs text-red-500">{errors.displayName.message}</p>
        )}
      </div>

      <div>
        <label className="block font-pixel text-[10px] uppercase tracking-widest text-zinc-500 mb-4">
          Avatar URL <span className="text-zinc-300">(optional, must be https)</span>
        </label>
        <input
          type="url"
          placeholder="HTTPS://EXAMPLE.COM/AVATAR.PNG"
          {...register("avatarUrl")}
          className="w-full bg-transparent placeholder:text-zinc-400 border-b border-black/10 py-4 focus:border-black focus:outline-none transition-colors text-xl font-bold uppercase tracking-tighter"
        />
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 border border-red-100 rounded-xl bg-red-50/50">
          <WarningCircleIcon size={16} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        variant="outline"
        disabled={isSubmitting}
        className="w-full py-5 justify-center"
      >
        {isSubmitting ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
}

export default function OnboardingPage() {
  const { user } = useCurrentUser();
  const walletAddress = useWalletAddress();
  const [saved, setSaved] = useState(false);

  return (
    <main className="min-h-screen">
      <Navbar variant="dark" />

      <div className="max-w-3xl mx-auto px-4 mt-10 lg:mt-20 pb-32">

        {/* Welcome header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-3 mb-8 px-4 py-2 border border-black/10 rounded-full">
            <SealCheckIcon size={16} weight="fill" className="text-black" />
            <span className="font-pixel text-[9px] uppercase tracking-[0.2em]">Creator Access Granted</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase mb-6">
            Welcome,<br />Creator.
          </h1>
          <p className="text-zinc-500 text-lg leading-relaxed max-w-xl">
            Your application has been approved. Set up your profile and start publishing your work on Senimatik.
          </p>
        </div>

        {/* Profile setup */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-8 h-px bg-black/10" />
            <span className="font-pixel text-[10px] uppercase tracking-widest text-zinc-400">Profile Setup</span>
          </div>

          {saved ? (
            <div className="p-6 border border-green-100 rounded-2xl bg-green-50/50 flex items-center gap-4">
              <SealCheckIcon size={20} weight="fill" className="text-green-500 shrink-0" />
              <div>
                <p className="font-medium text-sm">Profile saved</p>
                <p className="text-xs text-zinc-500 mt-0.5">Your creator profile is ready.</p>
              </div>
            </div>
          ) : user !== undefined ? (
            <ProfileSetupForm
              displayName={user?.displayName ?? ""}
              avatarUrl={user?.avatarUrl ?? ""}
              onSaved={() => setSaved(true)}
            />
          ) : null}
        </div>

        {/* What you can do */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-8 h-px bg-black/10" />
            <span className="font-pixel text-[10px] uppercase tracking-widest text-zinc-400">What You Can Do</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: <PencilSimpleIcon size={24} weight="thin" />,
                title: "Publish Artwork",
                description: "Mint your work as a verifiable license on Solana.",
                href: "/create",
                cta: "Start Creating",
              },
              {
                icon: <MegaphoneSimpleIcon size={24} weight="thin" />,
                title: "Your Profile",
                description: "View your public creator profile and portfolio.",
                href: walletAddress ? `/profile/${walletAddress}` : "/discover",
                cta: "View Profile",
              },
            ].map((card, idx) => (
              <Link
                key={idx}
                href={card.href}
                className="group p-8 border border-zinc-100 rounded-3xl hover:border-black/10 hover:shadow-xl hover:shadow-black/5 transition-all flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${idx * 0.1}s`, animationFillMode: "both" }}
              >
                <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-black group-hover:text-white transition-all">
                  {card.icon}
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-lg tracking-tight">{card.title}</p>
                  <p className="text-sm text-zinc-500 leading-relaxed">{card.description}</p>
                </div>
                <div className="flex items-center gap-2 font-pixel text-[10px] uppercase tracking-[0.2em] text-zinc-400 group-hover:text-black transition-colors mt-auto">
                  {card.cta}
                  <ArrowRightIcon size={12} weight="bold" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Continue CTA */}
        <div className="text-center">
          {/* <Button
            variant="default"
            size="main"
            onClick={() => router.push("/create")}
            className="gap-3"
          >
            Continue to Dashboard
            <ArrowRightIcon size={16} weight="bold" />
          </Button> */}
          <p className="mt-4 font-pixel text-[8px] uppercase tracking-widest text-zinc-400">
            You can always update your profile from settings later.
          </p>
        </div>
      </div>

      <Footer variant="dark" />
    </main>
  );
}
