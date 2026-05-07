"use client";

import { Button } from "@/components/ui/button";
import {
    ArrowLeftIcon,
    ShieldCheckIcon,
    GlobeIcon,
    TwitterLogoIcon,
    XCircleIcon,
    CheckCircleIcon,
    SpinnerIcon,
    WarningCircleIcon,
} from "@phosphor-icons/react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { useWalletAddress } from "@/lib/hooks/useWalletAddress";

export default function ApplicationDetails() {
    const params = useParams();
    const router = useRouter();
    const walletAddress = useWalletAddress();
    const [reviewNote, setReviewNote] = useState("");
    const [isReviewing, setIsReviewing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const application = useQuery(
        api.applications.getById,
        params.id
            ? { applicationId: params.id as Id<"applications"> }
            : "skip"
    );

    const reviewMutation = useMutation(api.applications.review);
    const revokeMutation = useMutation(api.applications.revoke);

    async function handleReview(decision: "approved" | "rejected") {
        if (!params.id) return;
        setError(null);
        setIsReviewing(true);
        try {
            if (!walletAddress) throw new Error("Wallet not connected");
            await reviewMutation({
                walletAddress,
                applicationId: params.id as Id<"applications">,
                decision,
                reviewNote: reviewNote || undefined,
            });
            const message = decision === "approved"
                ? "Application approved! Creator status granted."
                : "Application rejected.";
            toast.success(message);
            setTimeout(() => router.push("/admin/applications"), 1000);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Review failed";
            setError(message);
            toast.error("Review failed", { description: message });
        } finally {
            setIsReviewing(false);
        }
    }

    async function handleRevoke() {
        if (!params.id) return;
        setError(null);
        setIsReviewing(true);
        try {
            if (!walletAddress) throw new Error("Wallet not connected");
            await revokeMutation({
                walletAddress,
                applicationId: params.id as Id<"applications">,
                reason: reviewNote || undefined,
            });
            toast.success("Creator status revoked");
            setTimeout(() => router.push("/admin/applications"), 1000);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Revoke failed";
            setError(message);
            toast.error("Revoke failed", { description: message });
        } finally {
            setIsReviewing(false);
        }
    }

    if (application === undefined) {
        return (
            <div className="flex items-center justify-center h-64">
                <SpinnerIcon size={24} className="animate-spin text-zinc-300" />
            </div>
        );
    }

    if (!application) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="font-pixel text-[10px] uppercase tracking-widest text-zinc-400">Application not found</p>
            </div>
        );
    }

    const isReviewed = application.status === "approved" || application.status === "rejected";
    const submittedDate = new Date(application.submittedAt).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });

    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <header className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-3 text-zinc-400 hover:text-black transition-colors"
                >
                    <ArrowLeftIcon size={18} />
                    <span className="text-[10px] font-pixel uppercase tracking-widest leading-none">Return to Registry</span>
                </button>

                {error && (
                    <div className="flex items-center gap-2 px-4 py-2 border border-red-100 rounded-xl bg-red-50/50">
                        <WarningCircleIcon size={14} className="text-red-400 shrink-0" />
                        <p className="font-pixel text-[9px] uppercase tracking-widest text-red-600">{error}</p>
                    </div>
                )}

                {!isReviewed && (
                    <div className="flex gap-4">
                        <Button
                            variant="destructive"
                            size="main"
                            onClick={() => handleReview("rejected")}
                            disabled={isReviewing}
                        >
                            <XCircleIcon size={16} weight="bold" />
                            Execute Denial
                        </Button>
                        <Button
                            variant="primary"
                            size="main"
                            onClick={() => handleReview("approved")}
                            disabled={isReviewing}
                        >
                            <CheckCircleIcon size={16} weight="bold" />
                            Authorize Entry
                        </Button>
                    </div>
                )}

                {isReviewed && (
                    <div className="flex items-center gap-4">
                        <span className={`px-4 py-2 rounded font-pixel text-[10px] uppercase tracking-widest ${
                            application.status === "approved"
                                ? "bg-green-50 text-green-600 border border-green-200"
                                : "bg-red-50 text-red-600 border border-red-200"
                        }`}>
                            {application.status === "approved" ? "Approved" : "Rejected"}
                        </span>
                        {application.status === "approved" && (
                            <Button
                                variant="destructive"
                                size="main"
                                onClick={() => handleRevoke()}
                                disabled={isReviewing}
                            >
                                <XCircleIcon size={16} weight="bold" />
                                Revoke Status
                            </Button>
                        )}
                    </div>
                )}
            </header>

            <section className="p-12 border border-zinc-100 rounded-[48px] bg-white space-y-16 shadow-2xl shadow-black/2">
                {/* Identity Header */}
                <div className="flex items-start justify-between">
                    <div className="space-y-6">
                        <div className="w-20 h-20 rounded-[32px] bg-zinc-50 border border-zinc-100 flex items-center justify-center text-3xl font-pixel shadow-inner uppercase">
                            {application.walletAddress.slice(0, 2)}
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-4">
                                <h2 className="text-4xl font-medium tracking-tighter">{application.twitterHandle}</h2>
                                <span className="px-3 py-1 bg-black/5 rounded font-pixel text-[10px] uppercase tracking-widest text-zinc-500">
                                    Creator Application
                                </span>
                            </div>
                            <p className="text-sm font-mono text-zinc-400 italic">
                                {application.walletAddress.slice(0, 6)}...{application.walletAddress.slice(-6)}
                            </p>
                        </div>
                    </div>
                    <div className="text-right space-y-1">
                        <p className="text-[10px] font-pixel uppercase tracking-widest text-zinc-300">Status</p>
                        <p className="text-base font-medium capitalize">{application.status}</p>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    <div className="space-y-8">
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-pixel uppercase tracking-[0.2em] text-zinc-400">Artist Statement</h3>
                            <p className="text-base font-light leading-relaxed text-zinc-600 italic">&quot;{application.artistStatement}&quot;</p>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-[10px] font-pixel uppercase tracking-[0.2em] text-zinc-400">External Relays</h3>
                            <div className="flex flex-wrap gap-3">
                                <a
                                    href={application.portfolioLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl hover:border-black/10 transition-all"
                                >
                                    <GlobeIcon size={16} weight="thin" />
                                    <span className="text-[11px] font-mono">Portfolio</span>
                                </a>
                                <span className="flex items-center gap-2 px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl">
                                    <TwitterLogoIcon size={16} weight="thin" />
                                    <span className="text-[11px] font-mono">{application.twitterHandle}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Review note input for pending applications */}
                        {!isReviewed && (
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-pixel uppercase tracking-[0.2em] text-zinc-400">Review Note (optional)</h3>
                                <textarea
                                    rows={4}
                                    value={reviewNote}
                                    onChange={(e) => setReviewNote(e.target.value)}
                                    placeholder="Add a note for the applicant..."
                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl p-4 text-sm focus:outline-none focus:border-black/20 transition-colors resize-none"
                                />
                            </div>
                        )}

                        {/* Revocation note input for approved applications */}
                        {isReviewed && application.status === "approved" && (
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-pixel uppercase tracking-[0.2em] text-zinc-400">Revocation Reason (optional)</h3>
                                <textarea
                                    rows={4}
                                    value={reviewNote}
                                    onChange={(e) => setReviewNote(e.target.value)}
                                    placeholder="Explain the reason for revoking creator status..."
                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl p-4 text-sm focus:outline-none focus:border-black/20 transition-colors resize-none"
                                />
                            </div>
                        )}

                        {/* Show review note if already reviewed */}
                        {isReviewed && application.reviewNote && (
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-pixel uppercase tracking-[0.2em] text-zinc-400">Review Note</h3>
                                <p className="text-base font-light leading-relaxed text-zinc-600">{application.reviewNote}</p>
                            </div>
                        )}

                        {/* User info */}
                        {application.user && (
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-pixel uppercase tracking-[0.2em] text-zinc-400">Account Info</h3>
                                <div className="p-4 bg-zinc-50/50 rounded-2xl border border-zinc-50 space-y-2">
                                    {application.user.email && (
                                        <p className="text-sm font-medium">{application.user.email}</p>
                                    )}
                                    <p className="text-[10px] font-pixel uppercase text-zinc-400">
                                        Role: {application.user.role}
                                    </p>
                                    <p className="text-[10px] font-pixel uppercase text-zinc-400">
                                        Joined: {new Date(application.user.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Audit Information */}
                <div className="pt-12 border-t border-zinc-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <ShieldCheckIcon size={20} weight="thin" className="text-black/20" />
                        <span className="text-[9px] font-pixel uppercase tracking-[0.2em] text-zinc-400">
                            ID: {application._id.slice(0, 12)}...
                        </span>
                    </div>
                    <p className="text-[9px] font-pixel uppercase tracking-widest text-zinc-400">Submitted {submittedDate}</p>
                </div>
            </section>
        </div>
    );
}
