"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import {
  MintFormProvider,
  useFormContext,
  getMintFormDeployError,
  isStepValid,
} from "./MintFormProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useWalletAddress } from "@/lib/hooks/useWalletAddress";
import { motion, AnimatePresence } from "framer-motion";
import { Step1Artwork } from "./steps/Step1Artwork";
import { Step2Details } from "./steps/Step2Details";
import { Step3Collection } from "./steps/Step3Collection";
import { Step4License } from "./steps/Step4License";
import { Step5Royalty } from "./steps/Step5Royalty";
import { Step6Review } from "./steps/Step6Review";
import {
  ArrowRightIcon,
  PaintBrushIcon,
  TextAaIcon,
  FolderIcon,
  ShieldCheckIcon,
  CoinsIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

const STEPS = [
  { id: 1, title: "Artwork", icon: PaintBrushIcon, component: Step1Artwork },
  { id: 2, title: "Details", icon: TextAaIcon, component: Step2Details },
  { id: 3, title: "Collection", icon: FolderIcon, component: Step3Collection },
  { id: 4, title: "License", icon: ShieldCheckIcon, component: Step4License },
  { id: 5, title: "Royalties", icon: CoinsIcon, component: Step5Royalty },
  { id: 6, title: "Review", icon: CheckCircleIcon, component: Step6Review },
];

function CreateFormContent() {
  const router = useRouter();
  const { form } = useFormContext();
  const walletAddress = useWalletAddress();
  const [currentStep, setCurrentStep] = useState(1);
  const [highestStepReached, setHighestStepReached] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const createArtwork = useMutation(api.artworks.createArtwork);
  const generateUploadUrl = useMutation(api.r2.generateArtworkUploadUrl);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      const next = Math.min(prev + 1, STEPS.length);
      setHighestStepReached((h) => Math.max(h, next));
      return next;
    });
  }, []);
  const prevStep = useCallback(
    () => setCurrentStep((prev) => Math.max(prev - 1, 1)),
    []
  );

  const ActiveStepComponent = STEPS[currentStep - 1].component;
  const isLastStep = currentStep === STEPS.length;

  const deployError = submitting ? null : getMintFormDeployError(form.getValues());
  const canDeploy = !deployError && !submitting;

  const handleDeploy = useCallback(async () => {
    setSubmitting(true);
    try {
      if (!walletAddress) {
        toast.error("Wallet not connected");
        setSubmitting(false);
        return;
      }

      const values = form.getValues();

      // Validate required image
      if (!values.pendingPrimaryImage) {
        toast.error("Image upload required", {
          description: "Please upload an image in Step 1 before deploying.",
        });
        setSubmitting(false);
        return;
      }

      // Helper to convert filename to .webp extension
      const toWebpFileName = (name: string) =>
        name.replace(/\.[^.]+$/, ".webp");

      // 1. Upload primary image to R2
      toast.info("Uploading primary image...");
      const primaryUploadRes = await generateUploadUrl({
        walletAddress,
        type: "preview",
        fileName: toWebpFileName(values.pendingPrimaryImage.fileName),
      });

      const primaryUploadResp = await fetch(primaryUploadRes.url, {
        method: "PUT",
        body: values.pendingPrimaryImage.blob,
        headers: { "Content-Type": "image/webp" },
      });

      if (!primaryUploadResp.ok) {
        throw new Error(`Primary image upload failed: ${primaryUploadResp.statusText}`);
      }

      const r2PreviewKey = primaryUploadRes.key;

      // 2. Upload supplementary images to R2
      const supplementaryImages: Array<{
        file: string;
        type: string;
        size: number;
        r2Key: string;
      }> = [];

      if (values.pendingSupplementaryImages?.length > 0) {
        toast.info("Uploading supplementary images...");

        for (const img of values.pendingSupplementaryImages) {
          const uploadRes = await generateUploadUrl({
            walletAddress,
            type: "details",
            fileName: toWebpFileName(img.fileName),
          });

          const uploadResp = await fetch(uploadRes.url, {
            method: "PUT",
            body: img.blob,
            headers: { "Content-Type": "image/webp" },
          });

          if (!uploadResp.ok) {
            throw new Error(`Supplementary image upload failed: ${uploadResp.statusText}`);
          }

          supplementaryImages.push({
            file: img.fileName,
            type: "image/webp",
            size: img.blob.size,
            r2Key: uploadRes.key,
          });
        }
      }

      // 3. Check if any physical license is selected (for shipping/print data)
      const hasPhysicalLicense = values.licenseOptions?.some(
        opt => opt.licenseType !== "commercial_digital"
      ) ?? false;

      // 4. Create artwork in Convex
      toast.info("Creating artwork...");
      await createArtwork({
        walletAddress,
        // Step 1: Artwork
        r2PreviewKey,
        supplementaryImages: supplementaryImages.length > 0 ? supplementaryImages : undefined,
        // Step 2: Details
        name: values.name,
        symbol: values.symbol,
        description: values.description,
        detailsDescription: values.detailsDescription,
        originalFileUrl: values.originalFileUrl,
        attributes: values.attributes,
        tags: values.tags,
        // Step 3: Collection — normalize "new" to "none" if name is missing
        collectionMode: (values.collectionMode === "new" && !values.newCollection?.name) ||
          (values.collectionMode === "existing" && !values.collectionId)
          ? "none"
          : values.collectionMode,
        collectionId: values.collectionId,
        newCollection: values.collectionMode === "new" && values.newCollection?.name
          ? { name: values.newCollection.name, description: values.newCollection.description || "" }
          : undefined,
        // Step 4: License (multi-license)
        licenseOptions: values.licenseOptions,
        printSizes: hasPhysicalLicense ? values.printSizes : [],
        shippingRates: hasPhysicalLicense ? values.shippingRates : undefined,
        // Step 5: Royalty
        royaltyBasisPoints: values.royaltyBasisPoints,
        royaltyRecipients: values.royaltyRecipients,
      });

      toast.success("Artwork created successfully", {
        description: `${values.name} is now live on the marketplace.`,
      });

      router.push(`/profile/${walletAddress}`);
    } catch (err) {
      toast.error("Deployment failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
      console.error("Deploy failed:", err);
    } finally {
      setSubmitting(false);
    }
  }, [form, walletAddress, router, createArtwork, generateUploadUrl]);

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar variant="dark" />

      <div className="flex-1 max-w-7xl mx-auto w-full mt-10 lg:mt-20 px-4 lg:px-12 xl:px-0">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-16 lg:gap-20">
          {/* Stepper Sidebar */}
          <aside className="hidden lg:flex flex-col gap-12 shrink-0">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight text-black">
                Create Your Artwork
              </h1>
              <p className="text-muted text-base font-light leading-relaxed">
                Upload your art and set up all the details. Complete each step to create your listing.
              </p>
            </div>

            <nav className="space-y-2">
              {STEPS.map((step) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isVisited = step.id <= highestStepReached;
                const stepValid = isStepValid(step.id, form.getValues());

                const canNavigate = isVisited;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => canNavigate && setCurrentStep(step.id)}
                    disabled={!canNavigate}
                    className={`flex items-center gap-5 py-3 relative transition-all w-full text-left ${
                      isActive ? "text-primary" : "text-muted"
                    } ${canNavigate ? "cursor-pointer hover:text-primary/80" : "cursor-not-allowed opacity-60"}`}
                  >
                    <div
                      className={`w-9 h-9 border flex items-center justify-center transition-all duration-500 ${
                        isActive
                          ? "border-primary bg-primary text-white shadow-lg shadow-primary/10"
                          : isVisited && stepValid
                            ? "border-green-500 bg-green-500/10 text-green-500"
                            : isVisited && !stepValid
                              ? "border-red-500 bg-red-500/5 text-red-500"
                              : "border-black/10 text-muted"
                      }`}
                    >
                      <Icon size={18} weight={isActive ? "bold" : "light"} />
                    </div>
                    <span
                      className={`text-base uppercase tracking-[0.25em] font-pixel transition-all duration-500 ${
                        isActive ? "translate-x-1" : "translate-x-0"
                      }`}
                    >
                      {step.title}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="stepIndicator"
                        className="absolute -left-8 w-1 h-9 bg-primary rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Step Content */}
          <section className="flex flex-col min-h-150">
            {/* Mobile Header */}
            <div className="lg:hidden mb-16 space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-px bg-primary" />
                <span className="text-sm font-pixel text-primary uppercase tracking-widest">
                  Phase {currentStep} / {STEPS.length}
                </span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-primary uppercase leading-none mt-10">
                {STEPS[currentStep - 1].title}
              </h2>
            </div>

            <div className="flex-1 relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full flex flex-col"
                >
                  <div className="flex-1">
                    <ActiveStepComponent />
                  </div>

                  {/* Navigation Controls */}
                  <div className="mt-24 pt-12 border-t border-black/3 flex justify-between items-center mb-20">
                    <Button
                      variant="outline"
                      size="main"
                      onClick={prevStep}
                      disabled={currentStep === 1}
                      className={`${
                        currentStep === 1
                          ? "opacity-0! pointer-events-none"
                          : "opacity-100"
                      }`}
                    >
                      Back
                    </Button>

                    <div className="flex flex-col items-end gap-2">
                      <Button
                        onClick={isLastStep ? handleDeploy : nextStep}
                        variant="default"
                        size="main"
                        disabled={isLastStep ? !canDeploy : submitting}
                      >
                        {isLastStep
                          ? submitting
                            ? "Uploading…"
                            : "Uploading Artwork"
                          : "Proceed"}
                        {!isLastStep && <ArrowRightIcon size={14} />}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </section>
        </div>
      </div>

      <Footer variant="dark" />
    </main>
  );
}

export default function CreatePage() {

  return (
    <MintFormProvider>
      <CreateFormContent />
    </MintFormProvider>
  );
}
