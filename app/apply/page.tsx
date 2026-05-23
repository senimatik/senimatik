"use client";

import { useForm, useWatch } from "react-hook-form";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SpinnerIcon, WarningCircleIcon, SealCheckIcon } from "@phosphor-icons/react";
import { useCurrentUser } from "@/lib/context/UserContext";
import { useWalletAddress } from "@/lib/hooks/useWalletAddress";
import { toast } from "sonner";

type FormData = {
  portfolioLink: string;
  twitterHandle: string;
  artistStatement: string;
};

const STATUS_LABELS: Record<string, { label: string; description: string }> = {
  submitted: {
    label: "Application Submitted",
    description: "Your application is in the queue. Typically reviewed within 48-72 hours.",
  },
  in_review: {
    label: "Under Review",
    description: "Our team is reviewing your application. You will be notified soon.",
  },
  approved: {
    label: "Approved",
    description: "Congratulations! You are now a verified creator.",
  },
  rejected: {
    label: "Not Approved",
    description: "Your application was not approved at this time. You may reapply below.",
  },
};

export default function ApplicationPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { role, isLoading: userLoading } = useCurrentUser();
  const walletAddress = useWalletAddress();
  const application = useQuery(api.applications.getMyApplication);
  const submitApplication = useMutation(api.applications.submit);

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<FormData>();
  const artistStatement = useWatch({ control, name: "artistStatement", defaultValue: "" });

  async function onSubmit(data: FormData) {
    setError(null);
    if (!walletAddress) {
      setError("Wallet not connected");
      return;
    }
    try {
      await submitApplication({ ...data, walletAddress });
      setSubmitted(true);
      toast.success("Application submitted!", {
        description: "We'll review it within 48-72 hours.",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit application";
      setError(message);
      toast.error("Submission failed", { description: message });
    }
  }

  const loading = application === undefined || userLoading;
  const isCreator = role === "creator" || role === "admin" || role === "super_admin";
  const activeApp = application ?? null;
  const rejectedApp = activeApp?.status === "rejected" ? activeApp : null;
  const showStatus = !loading && !isCreator && (submitted || (activeApp && activeApp.status !== "rejected"));
  const showForm = !loading && !isCreator && !showStatus;
  const statusInfo = activeApp ? STATUS_LABELS[activeApp.status] ?? STATUS_LABELS.submitted : null;

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar variant="dark" />

      <div className="max-w-3xl mx-auto px-4 mt-10 lg:mt-12 w-full">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <SpinnerIcon size={24} className="animate-spin text-zinc-300" />
          </div>
        )}

        {/* Already a creator */}
        {!loading && isCreator && (
          <div className="min-h-[60vh] flex flex-col justify-center gap-6">
            <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center shrink-0 mt-1">
              <SealCheckIcon size={24} weight="fill" className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-6xl font-bold uppercase mb-6">
                Already a Creator.
              </h1>
              <p className="text-muted text-base mb-8">
                Your creator status is active. Head to your dashboard to publish work.
              </p>
              <Link href="/create">
                <Button variant="default" size="main">Let&apos;s Create!</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Status view (submitted / in_review / approved) */}
        {showStatus && activeApp && statusInfo && (
          <>
            <div className="mb-8">
              <h1 className="text-4xl md:text-6xl font-bold uppercase mb-6">
                {statusInfo.label}
              </h1>
              <p className="text-muted text-base mb-8">
                {statusInfo.description}
              </p>
              {/* {activeApp.status === "approved" && (
                <div className="mt-8">
                  <Link href="/onboarding">
                    <Button variant="default" size="main">Set Up Your Creator Profile</Button>
                  </Link>
                </div>
              )} */}
            </div>

            <div className="space-y-6 border border-primary rounded-2xl p-8">
              <div>
                <p className="text-md uppercase tracking-widest text-primary font-bold mb-1">Portfolio</p>
                <p className="font-medium">{activeApp.portfolioLink}</p>
              </div>
              <div>
                <p className="text-md uppercase tracking-widest text-primary font-bold mb-1">Twitter / X</p>
                <p className="font-medium">{activeApp.twitterHandle}</p>
              </div>
              <div>
                <p className="text-md uppercase tracking-widest text-primary font-bold mb-1">Statement</p>
                <p className="font-medium">{activeApp.artistStatement}</p>
              </div>
              {activeApp.reviewNote && (
                <div>
                  <p className="text-sm uppercase tracking-widest text-primary font-bold mb-1">Review Note</p>
                  <p className="font-medium">{activeApp.reviewNote}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Application form */}
        {showForm && (
          <>
            {rejectedApp && (
              <div className="mb-12 p-6 border border-red-100 rounded-2xl bg-red-100/50">
                <p className="text-base uppercase tracking-widest text-red-400 font-bold mb-2">Previous Application Not Approved</p>
                <p className="text-sm text-muted">
                  Submitted {new Date(rejectedApp.submittedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </p>
                {rejectedApp.reviewNote && (
                  <p className="text-sm text-muted mt-3 pt-3 border-t border-red-100">
                    <span className="text-sm uppercase tracking-widest text-black block mb-1">Reviewer Note</span>
                    {rejectedApp.reviewNote}
                  </p>
                )}
              </div>
            )}

            <div className="mb-16">
              <h1 className="text-4xl md:text-6xl font-bold uppercase mb-6">
                {rejectedApp ? "Reapply to Create." : "Apply to Create."}
              </h1>
              <p className="text-muted text-lg leading-relaxed">
                Senimatik maintains a curated ecosystem of high-quality creators.
                Submit your portfolio for verification to unlock publishing rights.
              </p>
            </div>

            <form className="space-y-12" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-8">
                <div>
                  <label className="block text-sm uppercase tracking-widest text-primary font-bold mb-4">
                    Portfolio Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://your-portfolio.com"
                    {...register("portfolioLink", { required: "Portfolio link is required" })}
                    className="w-full bg-transparent placeholder:text-muted border-b border-black/10 py-4 focus:border-black focus:outline-none transition-colors text-xl"
                  />
                  {errors.portfolioLink && (
                    <p className="mt-2 text-xs text-red-500">{errors.portfolioLink.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm uppercase tracking-widest text-primary font-bold mb-4">
                    Twitter / X Handle
                  </label>
                  <input
                    type="text"
                    placeholder="@yourname"
                    {...register("twitterHandle", { required: "Twitter handle is required" })}
                    className="w-full bg-transparent placeholder:text-muted border-b border-black/10 py-4 focus:border-black focus:outline-none transition-colors text-xl"
                  />
                  {errors.twitterHandle && (
                    <p className="mt-2 text-xs text-red-500">{errors.twitterHandle.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm uppercase tracking-widest text-primary font-bold mb-4">
                    Artist Statement
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe your creative vision..."
                    {...register("artistStatement", {
                      required: "Artist statement is required",
                      minLength: { value: 50, message: "Please write at least 50 characters" },
                    })}
                    className="w-full bg-transparent placeholder:text-muted border-b border-black/10 py-4 focus:border-black focus:outline-none transition-colors text-xl resize-none"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    {errors.artistStatement ? (
                      <p className="text-xs text-red-500">{errors.artistStatement.message}</p>
                    ) : (
                      <span />
                    )}
                    <span className={`font-pixel text-xs uppercase tracking-widest ${(artistStatement?.length ?? 0) > 1800 ? "text-red-400" : "text-zinc-300"}`}>
                      {artistStatement?.length ?? 0}/2000
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 border border-red-100 rounded-xl bg-red-50/50">
                  <WarningCircleIcon size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                variant="default"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-6 justify-center"
              >
                {isSubmitting ? "Submitting..." : rejectedApp ? "Submit New Application" : "Submit Application"}
              </Button>

              <p className="text-center text-sm text-muted">
                Applications are typically reviewed within 48-72 hours.
              </p>
            </form>
          </>
        )}
      </div>

      <Footer variant="dark" />
    </main>
  );
}
