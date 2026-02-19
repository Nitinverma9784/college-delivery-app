"use client";

import { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Minus, Plus, CheckCircle2, Sparkles } from "lucide-react";
import { GlassHeader } from "@/components/layout/glass-header";
import { PageContainer } from "@/components/layout/page-container";
import { useRequestStore } from "@/lib/stores/request-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { itemSuggestions } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { UrgencyLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

const urgencyOptions: { value: UrgencyLevel; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "bg-muted text-muted-foreground" },
  { value: "medium", label: "Medium", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  { value: "high", label: "Urgent", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
];

function CreateRequestPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createRequest = useRequestStore((s) => s.createRequest);
  const user = useAuthStore((s) => s.user);

  const [itemName, setItemName] = useState(searchParams.get("item") || "");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("");
  const [urgency, setUrgency] = useState<UrgencyLevel>("medium");
  const [notes, setNotes] = useState("");
  const [hostelBlock, setHostelBlock] = useState("Block A");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = itemSuggestions.filter((s) =>
    s.toLowerCase().includes(itemName.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Please login to create a request");
      return;
    }

    setError("");
    setLoading(true);

    const result = await createRequest({
      itemName,
      quantity,
      estimatedPrice: Number(price),
      urgency,
      notes: notes || undefined,
      hostelBlock,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccess(true);
    setTimeout(() => router.push("/hosteller/home"), 1500);
  };

  return (
    <PageContainer>
      <GlassHeader title="New Request" showBack />

      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center gap-4 px-6 py-24"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
            >
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </motion.div>
            <h2 className="text-xl font-bold text-foreground">
              Request Created!
            </h2>
            <p className="text-center text-sm text-muted-foreground">
              A day scholar will pick this up soon
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="space-y-5 px-5 py-5"
          >
            {/* Item Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Item Name
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <Input
                  ref={inputRef}
                  value={itemName}
                  onChange={(e) => {
                    setItemName(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="What do you need?"
                  required
                  className="h-12 rounded-xl bg-card pl-10"
                />
                <AnimatePresence>
                  {showSuggestions && filteredSuggestions.length > 0 && itemName.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute left-0 right-0 top-full z-10 mt-1 rounded-xl border border-border bg-card shadow-lg"
                    >
                      {filteredSuggestions.slice(0, 5).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onMouseDown={() => {
                            setItemName(s);
                            setShowSuggestions(false);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-3 text-sm text-foreground transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-accent"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          {s}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Quantity
              </Label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-accent"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <span className="min-w-[3rem] text-center text-xl font-bold text-foreground">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-accent"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Estimated Price */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Estimated Price
              </Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 150"
                required
                min="1"
                className="h-12 rounded-xl bg-card"
              />
            </div>

            {/* Hostel Block */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Hostel Block
              </Label>
              <Input
                type="text"
                value={hostelBlock}
                onChange={(e) => setHostelBlock(e.target.value)}
                placeholder="e.g. Block A"
                required
                className="h-12 rounded-xl bg-card"
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Reference Image (optional)
              </Label>
              <button
                type="button"
                className="flex h-24 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Camera className="h-5 w-5" />
                Upload Image
              </button>
            </div>

            {/* Urgency */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Urgency
              </Label>
              <div className="flex gap-2">
                {urgencyOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setUrgency(opt.value)}
                    className={cn(
                      "flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                      urgency === opt.value
                        ? cn(opt.color, "ring-2 ring-primary ring-offset-2 ring-offset-background")
                        : "bg-card text-muted-foreground border border-border"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Notes (optional)
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific preferences or instructions..."
                rows={3}
                className="rounded-xl bg-card resize-none"
              />
            </div>

            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading || !itemName || !price || !hostelBlock}
              className="h-12 w-full rounded-xl text-base font-semibold"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="h-5 w-5 rounded-full border-2 border-primary-foreground border-t-transparent"
                />
              ) : (
                "Submit Request"
              )}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}

export default function CreateRequestPage() {
  return (
    <Suspense>
      <CreateRequestPageInner />
    </Suspense>
  );
}