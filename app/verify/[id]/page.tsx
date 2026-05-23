"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircleIcon, XCircleIcon, SealCheckIcon } from "@phosphor-icons/react";

const R2_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function LicenseLabel(type: string) {
  const map: Record<string, string> = {
    personal_use: "Personal Use",
    commercial_digital: "Commercial Digital",
    limited_print: "Limited Print Edition",
  };
  return map[type] ?? type.replace(/_/g, " ");
}

function DeliveryLabel(type: string) {
  const map: Record<string, string> = {
    digital: "Digital Download",
    physical: "Physical Art",
    both: "Digital + Physical",
  };
  return map[type] ?? type;
}

export default function VerifyPage() {
  const params = useParams();
  const verificationId = params.id as string;

  const license = useQuery(api.purchases.verifyLicense, { verificationId });

  return (
    <main className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
      <Navbar variant="dark" />

      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Loading */}
        {license === undefined && (
          <div className="py-40 flex items-center justify-center">
            <p className="font-pixel text-base uppercase tracking-widest text-muted">
              Verifying...
            </p>
          </div>
        )}

        {/* Not found */}
        {license === null && (
          <div className="py-40 flex flex-col items-center gap-4 text-center">
            <XCircleIcon size={40} weight="fill" className="text-red-400" />
            <p className="text-xl font-bold tracking-tight">License not found</p>
            <p className="text-base text-muted">
              The verification ID{" "}
              <span className="font-mono">{verificationId}</span> does not match
              any license in our system.
            </p>
            <Link
              href="/discover"
              className="text-sm underline underline-offset-4 opacity-60 hover:opacity-100"
            >
              Browse artworks
            </Link>
          </div>
        )}

        {/* Certificate */}
        {license && (
          <div className="flex flex-col gap-8">
            {/* Status header */}
            <div className="flex items-center gap-3">
              {license.isActive ? (
                <CheckCircleIcon size={24} weight="fill" className="text-green-500" />
              ) : (
                <XCircleIcon size={24} weight="fill" className="text-red-400" />
              )}
              <div>
                <p className="font-bold text-lg">
                  {license.isActive ? "Valid License" : "Revoked License"}
                </p>
                <p className="text-base text-muted">
                  {license.isActive
                    ? "This license is active and legally binding."
                    : "This license has been revoked."}
                </p>
              </div>
            </div>

            {/* Certificate card */}
            <div className="border border-black/10 overflow-hidden">
              {/* Artwork preview */}
              {license.artworkPreviewKey && (
                <div className="relative w-full aspect-video bg-zinc-100">
                  <Image
                    src={`${R2_URL}/${license.artworkPreviewKey}`}
                    alt={license.artworkName}
                    fill
                    sizes="(max-width: 672px) 100vw, 672px"
                    className="object-cover"
                  />
                </div>
              )}

              <div className="px-4 md:px-8 py-8 flex flex-col gap-6">
                {/* Title + seal */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-pixel text-xs uppercase tracking-widest text-muted mb-1">
                      Licensed Artwork
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight">
                      {license.artworkName}
                    </h1>
                  </div>
                  <SealCheckIcon
                    size={36}
                    weight="fill"
                    className={license.isActive ? "text-green-400 shrink-0" : "text-zinc-200 shrink-0"}
                  />
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CertField label="License Type" value={LicenseLabel(license.licenseType)} />
                  <CertField label="Delivery" value={DeliveryLabel(license.deliveryType)} />
                  <CertField label="Issued" value={formatDate(license.issuedAt)} />
                  <CertField label="Status">
                    <span
                      className={`font-medium text-base ${license.isActive ? "text-green-600" : "text-red-500"
                        }`}
                    >
                      {license.isActive ? "Active" : "Revoked"}
                    </span>
                  </CertField>
                  {license.printEditionNumber && (
                    <CertField label="Edition" value={license.printEditionNumber} />
                  )}
                  <CertField label="Buyer" value={license.buyerDisplayName || license.buyerWallet} />
                  {license.creatorDisplayName && (
                    <CertField label="Creator" value={license.creatorDisplayName} />
                  )}
                </div>

                {/* Verification ID */}
                <div className="bg-zinc-50 border border-black/5 p-4">
                  <p className="font-pixel text-xs uppercase tracking-widest text-muted mb-2">
                    Verification ID
                  </p>
                  <p className="font-mono text-base font-bold break-all">{license.verificationId}</p>
                </div>

                <p className="text-xs text-muted text-center">
                  This certificate is publicly verifiable at{" "}
                  <span className="font-mono">senimatik.com/verify/{license.verificationId}</span>
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Link
                href="/discover"
                className="text-sm font-medium underline underline-offset-4 opacity-60 hover:text-primary"
              >
                Browse artworks
              </Link>
            </div>
          </div>
        )}
      </div>

      <Footer variant="dark" />
    </main>
  );
}

function CertField({
  label,
  value,
  mono,
  children,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <p className="font-pixel text-xs uppercase tracking-widest text-muted mb-1">
        {label}
      </p>
      {children ?? (
        <p className={`text-base font-medium ${mono ? "font-mono" : ""}`}>{value}</p>
      )}
    </div>
  );
}
