"use client";

import { useEffect } from "react";
import { useFieldArray, useWatch } from "react-hook-form";
import { useFormContext } from "../MintFormProvider";
import { useWalletAddress } from "@/lib/hooks/useWalletAddress";
import {
  PlusIcon,
  TrashIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export function Step5Royalty() {
  const { form } = useFormContext();
  const { register, control, setValue, getValues } = form;
  const walletAddress = useWalletAddress();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "royaltyRecipients",
  });

  // Initialize with user's wallet address on first load
  useEffect(() => {
    const recipients = getValues("royaltyRecipients") || [];
    if (recipients.length === 0 && walletAddress) {
      append({ address: walletAddress, share: 100 });
    }
  }, [walletAddress, append, getValues]);

  const basisPoints = useWatch({ control, name: "royaltyBasisPoints", defaultValue: 0 }) || 0;
  const royaltyPct = (basisPoints / 100).toFixed(1);
  const recipients = useWatch({ control, name: "royaltyRecipients", defaultValue: [] }) || [];
  const totalShares = recipients.reduce(
    (sum: number, r: { address: string; share: number }) => sum + (Number(r.share) || 0),
    0,
  );

  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <h3 className="text-2xl font-medium tracking-tight">
          Royalty & Revenue Share
        </h3>
        <p className="text-zinc-500 text-sm font-light leading-relaxed max-w-md">
          Set the royalty percentage and decide who gets paid from secondary sales.
          Payments are automatic and split according to your distribution.
        </p>
      </div>

      <div className="px-4 py-10 lg:px-10 lg:py-10 border border-zinc-100 bg-zinc-50/10 space-y-12">
        {/* Basis Points Range */}
        <div className="space-y-8">
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <label className="text-base font-pixel uppercase tracking-widest text-black">
                Royalty
              </label>
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-5xl font-medium tracking-tighter">
                  {royaltyPct}
                </span>
                <span className="text-xl text-zinc-400 font-light">%</span>
              </div>
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={5000}
            step={50}
            {...register("royaltyBasisPoints", { valueAsNumber: true })}
            className="w-full h-1 bg-zinc-100 rounded-full appearance-none cursor-pointer accent-black"
          />
          <div className="flex justify-between text-xs font-pixel uppercase tracking-[0.2em] text-black">
            <span>Min_0%</span>
            <span>Med_25%</span>
            <span>Max_50%</span>
          </div>
        </div>

        {/* Recipients */}
        <div className="space-y-8 pt-8 border-t border-black/3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label className="text-lg font-pixel uppercase tracking-widest text-black">
                Share Distribution
              </label>
              <p className="text-sm text-zinc-400">
                To add more recipients, reduce your share percentage first.
              </p>
            </div>
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                if (totalShares < 100) {
                  append({ address: "", share: 100 - totalShares });
                }
              }}
              disabled={totalShares >= 100}
              title={totalShares >= 100 ? "Total shares cannot exceed 100%" : "Add another recipient"}
            >
              <PlusIcon size={14} /> Add Entity
            </Button>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {fields.map((field, index) => (
                <motion.div
                  key={field.id}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="flex flex-col lg:flex-row gap-4 p-4 bg-zinc-50 border border-input group transition-all items-center animate-in fade-in zoom-in-95 duration-300"
                  style={{ animationDelay: `${index * 0.1}s`, animationFillMode: "both" }}
                >
                  <div className="p-2 flex items-center justify-center shrink-0">
                    <UserCircleIcon
                      size={32}
                      weight="thin"
                      className="text-black"
                    />
                  </div>
                  {field.address === walletAddress && field.address ? (
                    <div className="flex-1 text-sm font-mono text-zinc-600 flex items-center justify-start">
                      Yourself
                    </div>
                  ) : (
                    <input
                      {...register(`royaltyRecipients.${index}.address` as const)}
                      placeholder="Authorized Wallet Address"
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-mono truncate outline-none"
                    />
                  )}
                  <div className="w-32 flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      {...register(
                        `royaltyRecipients.${index}.share` as const,
                        { valueAsNumber: true },
                      )}
                      placeholder="100"
                      className="w-full h-10 border-input border bg-white px-3 text-sm text-center font-medium focus:bg-white outline-none"
                    />
                    <span className="text-center text-sm font-pixel uppercase text-zinc-300">
                      %
                    </span>
                  </div>
                  {index > 0 && (
                    <Button
                      variant="ghostDestructive"
                      type="button"
                      onClick={() => remove(index)}
                    >
                      <TrashIcon size={18} weight="thin" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div
            className={`flex items-center justify-between p-6 transition-all duration-500 ${
              totalShares === 100
                ? "bg-green-500/5 text-green-600 border border-green-500/10"
                : "bg-orange-500/5 text-orange-600 border border-orange-500/10"
            }`}
          >
            <span className="text-sm font-pixel uppercase tracking-widest">
              Aggregate Split Status
            </span>
            <div className="flex items-center gap-3">
              <span className="text-base font-medium font-mono">
                {totalShares}%
              </span>
              {totalShares === 100 ? (
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              )}
            </div>
          </div>
        </div>
      </div>

      <Button
        variant="default"
        size="main"
        type="button"
        onClick={() => {
          setValue("royaltyRecipients", [
            { address: walletAddress || "", share: 100 },
          ]);
        }}
        className="w-full justify-center whitespace-normal"
      >
        Assign 100% distribution to your wallet
      </Button>
    </div>
  );
}
