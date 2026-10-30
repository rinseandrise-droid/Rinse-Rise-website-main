"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AddressForm, type AddressFormHandle } from "@/components/booking/AddressForm";
import { OrderTotals } from "@/components/booking/OrderTotals";
import { QuantityStepper } from "@/components/booking/QuantityStepper";
import { bookingWindowDays, firstOrderOffer, pickupSlots } from "@/data/site";
import { cart, useCart } from "@/lib/cart";
import { calculateOrderTotal, formatINR } from "@/lib/pricing";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { toast } from "@/lib/ui-store";
import { addDays, todayInIndia } from "@/lib/validation";

type Address = {
  id: string;
  label: string;
  name: string;
  line1: string;
  area: string;
  city: string;
  pincode: string;
};

const STEPS = ["Items", "Address", "Schedule", "Review"] as const;

export function BookFlow({ firstOrderEligible }: { firstOrderEligible: boolean }) {
  const router = useRouter();
  const lines = useCart();
  const [step, setStep] = useState(0);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState("");
  const [pickupDate, setPickupDate] = useState(todayInIndia());
  const [pickupSlot, setPickupSlot] = useState(pickupSlots[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const addressFormRef = useRef<AddressFormHandle>(null);

  const totals = useMemo(
    () => calculateOrderTotal({ lines, applyFirstOrderDiscount: firstOrderEligible }),
    [lines, firstOrderEligible]
  );

  const loadAddresses = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    const { data } = await supabase.from("addresses").select("*").order("created_at", { ascending: false });
    setAddresses((data as Address[]) ?? []);
    setAddressId((current) => current || data?.[0]?.id || "");
  }, []);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  if (!lines.length) {
    return (
      <div className="neo mx-auto max-w-lg p-10 text-center">
        <h2 className="font-display text-2xl font-extrabold">Your order is empty.</h2>
        <p className="mt-3 text-muted">Add garments from Services or Pricing, then come back to book a pickup.</p>
        <Link href="/pricing" className="btn btn-primary mt-6">
          Browse pricing
        </Link>
      </div>
    );
  }

  async function confirm() {
    setError("");
    setBusy(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: lines,
        addressId,
        pickupDate,
        pickupSlot,
        notes,
      }),
    });
    const body = (await res.json()) as { error?: string; id?: string };
    setBusy(false);
    if (!res.ok || !body.id) {
      setError(body.error || "Could not place the order.");
      return;
    }
    cart.clear();
    toast("Pickup scheduled");
    router.push(`/orders/${body.id}`);
  }

  const minDate = todayInIndia();
  const maxDate = addDays(minDate, bookingWindowDays);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div>
        <ol className="mb-6 flex gap-2 overflow-x-auto pb-1 text-[0.65rem] font-extrabold uppercase tracking-[0.12em] sm:mb-8 sm:text-xs sm:tracking-[0.14em] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {STEPS.map((label, i) => (
            <li key={label} className={`shrink-0 rounded-full px-3 py-1 ${i === step ? "bg-orange text-white" : "bg-cream text-muted"}`}>
              {i + 1}. {label}
            </li>
          ))}
        </ol>

        {step === 0 && (
          <ul className="space-y-3">
            {totals.lines.map((line) => (
              <li key={line.item.id} className="neo-sm flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-bold">{line.item.name}</p>
                  <p className="text-xs text-muted">
                    {line.item.unit === "kg" ? "Laundry" : line.item.serviceId.replace("-", " ")} · {formatINR(line.item.rate)} / {line.item.unit}
                  </p>
                </div>
                <QuantityStepper
                  item={line.item}
                  value={line.quantity}
                  onChange={(qty) => cart.setQuantity(line.item.id, qty)}
                />
                <p className="w-20 text-right font-extrabold tabular-nums">{formatINR(line.lineTotal)}</p>
                <button type="button" className="text-xs font-bold text-danger" onClick={() => cart.remove(line.item.id)}>
                  Remove
                </button>
              </li>
            ))}
            <Link href="/pricing" className="inline-flex text-sm font-extrabold text-orange-dark">
              + Add more items
            </Link>
          </ul>
        )}

        {step === 1 && (
          <div>
            {addresses.length === 0 ? (
            <p className="text-muted">Add the pickup address, then press Continue.</p>
            ) : (
              <ul className="space-y-3">
                {addresses.map((a) => (
                  <li key={a.id}>
                    <label className={`neo-sm flex cursor-pointer gap-3 p-4 ${addressId === a.id ? "ring-2 ring-orange" : ""}`}>
                      <input type="radio" name="address" checked={addressId === a.id} onChange={() => setAddressId(a.id)} />
                      <span>
                        <span className="badge">{a.label}</span>
                        <span className="mt-1 block font-bold">{a.name}</span>
                        <span className="block text-sm text-muted">
                          {a.line1}
                          {a.area ? `, ${a.area}` : ""}, {a.city} {a.pincode}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <h3 className="mt-8 font-display text-xl font-extrabold">Add an address</h3>
            <AddressForm
              ref={addressFormRef}
              onSaved={(id) => {
                setAddressId(id);
                void loadAddresses();
              }}
            />
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-5">
            <label>
              <span className="field-label">Pickup date</span>
              <input
                className="input"
                type="date"
                min={minDate}
                max={maxDate}
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
              />
            </label>
            <fieldset>
              <legend className="field-label">Time window</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {pickupSlots.map((slot) => (
                  <label key={slot.id} className={`neo-sm cursor-pointer p-4 ${pickupSlot === slot.id ? "ring-2 ring-orange" : ""}`}>
                    <input type="radio" className="sr-only" checked={pickupSlot === slot.id} onChange={() => setPickupSlot(slot.id)} />
                    <span className="block font-extrabold">{slot.label}</span>
                    <span className="text-sm text-muted">
                      {slot.start} – {slot.end}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label>
              <span className="field-label">Notes (stains, valuables, gate code)</span>
              <textarea className="input min-h-24 py-3" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="neo p-6">
            <h3 className="font-display text-2xl font-extrabold">Confirm booking</h3>
            <p className="mt-2 text-sm text-muted">
              {totals.lines.length} items · {pickupDate} · {pickupSlots.find((s) => s.id === pickupSlot)?.label}
            </p>
            {firstOrderEligible && (
              <p className="mt-4 rounded-2xl bg-orange-tint px-4 py-3 text-sm font-bold text-orange-dark">
                {firstOrderOffer.percent}% first-order offer will be applied on the server.
              </p>
            )}
            {error && <p className="mt-4 text-sm font-semibold text-danger">{error}</p>}
            <button type="button" className="btn btn-primary mt-6 w-full" disabled={busy} onClick={() => void confirm()}>
              {busy ? "Placing order…" : "Confirm pickup"}
            </button>
          </div>
        )}

        <div className="btn-row mt-8">
          <button type="button" className="btn btn-secondary flex-1 sm:flex-none" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            Back
          </button>
          {step < 3 && (
            <button
              type="button"
              className="btn btn-primary flex-1 sm:flex-none"
              disabled={busy}
              onClick={async () => {
                if (step === 1 && !addressId) {
                  setBusy(true);
                  const id = await addressFormRef.current?.save();
                  setBusy(false);
                  if (!id) return;
                  setAddressId(id);
                }
                setStep((s) => s + 1);
              }}
            >
              {busy && step === 1 ? "Saving address…" : "Continue"}
            </button>
          )}
        </div>
      </div>

      <aside className="neo h-max p-5 sm:p-6 lg:sticky lg:top-[calc(var(--header-stack)+12px)]">
        <h2 className="font-display text-xl font-extrabold">Bill</h2>
        <div className="mt-5">
          <OrderTotals totals={totals} />
        </div>
        {firstOrderEligible ? (
          <p className="mt-4 text-xs font-semibold text-orange-dark">First-order {firstOrderOffer.percent}% off eligible.</p>
        ) : (
          <p className="mt-4 text-xs text-muted">First-order offer already used on this account.</p>
        )}
      </aside>
    </div>
  );
}
