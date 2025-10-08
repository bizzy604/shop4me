"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertTriangle, Globe, Loader2 } from "lucide-react";

import { createOrderDraft } from "@/app/checkout/actions";
import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/currency";

export function CheckoutForm() {
  const router = useRouter();
  const { items, subtotal, serviceFee, total, clear } = useCart();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  /**
   * Get GPS Location
   * 
   * Uses browser's Geolocation API to capture user's current coordinates
   * and automatically populate latitude and longitude fields.
   * 
   * Why this is important:
   * - Reduces manual entry errors for delivery locations
   * - Improves delivery accuracy for riders
   * - Enhances user experience with one-tap location capture
   */
  const handleGetLocation = () => {
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latInput = document.getElementById("latitude") as HTMLInputElement;
        const lonInput = document.getElementById("longitude") as HTMLInputElement;
        
        if (latInput && lonInput) {
          latInput.value = position.coords.latitude.toFixed(6);
          lonInput.value = position.coords.longitude.toFixed(6);
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access in your browser.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        
        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (items.length === 0) {
      setFormError("Your cart is empty. Add items before checking out.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const cartPayload = {
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        unit: item.unit ?? null,
      })),
      serviceFee,
      subtotal,
      total,
    };

    formData.set("cart", JSON.stringify(cartPayload));

    setFormError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await createOrderDraft(formData);
      if (result.ok) {
        clear();
        router.push(`/checkout/confirmation?orderId=${result.orderId}`);
      } else {
        setFormError(result.formError ?? null);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  };

  return (
    <div className="grid gap-6 sm:gap-8 lg:grid-cols-[2fr_1fr]">
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">Contact details</CardTitle>
            <CardDescription className="text-xs sm:text-sm">We&apos;ll use this to reach you if the shopper has any questions.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <div className="md:col-span-1">
              <label htmlFor="customerName" className="text-xs sm:text-sm font-medium">
                Full name <span className="text-destructive">*</span>
              </label>
              <Input id="customerName" name="customerName" placeholder="Mary A. Lomed" required aria-invalid={Boolean(fieldErrors.customerName)} className="text-sm" />
              {fieldErrors.customerName ? (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.customerName}</p>
              ) : null}
            </div>
            <div className="md:col-span-1">
              <label htmlFor="customerPhone" className="text-xs sm:text-sm font-medium">
                M-Pesa phone number <span className="text-destructive">*</span>
              </label>
              <Input
                id="customerPhone"
                name="customerPhone"
                type="tel"
                inputMode="tel"
                placeholder="07xx xxx xxx"
                required
                aria-invalid={Boolean(fieldErrors.customerPhone)}
                className="text-sm"
              />
              {fieldErrors.customerPhone ? (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.customerPhone}</p>
              ) : null}
            </div>
            <div className="md:col-span-1">
              <label htmlFor="contactName" className="text-xs sm:text-sm font-medium">
                Delivery contact name
              </label>
              <Input id="contactName" name="contactName" placeholder="If different from you" className="text-sm" />
            </div>
            <div className="md:col-span-1">
              <label htmlFor="contactPhone" className="text-xs sm:text-sm font-medium">
                Delivery contact phone
              </label>
              <Input id="contactPhone" name="contactPhone" type="tel" inputMode="tel" placeholder="Optional" className="text-sm" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">Delivery location</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Provide as much detail as possible so our shopper can reach you faster.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="landmark" className="text-xs sm:text-sm font-medium">
                Landmark / estate / building
              </label>
              <Input id="landmark" name="landmark" placeholder="Opposite Lodwar Boys, next to KCB" className="text-sm" />
            </div>
            <div className="md:col-span-1">
              <label htmlFor="plusCode" className="text-xs sm:text-sm font-medium">
                Google Plus Code or GPS pin
              </label>
              <Input id="plusCode" name="plusCode" placeholder="e.g. 7M5P+3R Lodwar" className="text-sm" />
            </div>
            <div className="md:col-span-1">
              <div className="flex items-end justify-between gap-2 mb-2">
                <label htmlFor="latitude" className="text-xs sm:text-sm font-medium">
                  GPS Coordinates
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGetLocation}
                  disabled={isGettingLocation}
                  className="h-7 text-xs"
                >
                  {isGettingLocation ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Getting...
                    </>
                  ) : (
                    <>
                      <Globe className="h-3 w-3 mr-1" />
                      Get My Location
                    </>
                  )}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input id="latitude" name="latitude" type="number" step="0.000001" placeholder="Latitude" className="text-sm" />
                </div>
                <div>
                  <Input id="longitude" name="longitude" type="number" step="0.000001" placeholder="Longitude" className="text-sm" />
                </div>
              </div>
              {locationError && (
                <p className="mt-1 text-xs text-destructive">{locationError}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label htmlFor="deliveryNotes" className="text-xs sm:text-sm font-medium">
                Delivery notes for the rider
              </label>
              <Textarea
                id="deliveryNotes"
                name="deliveryNotes"
                placeholder=" Gate code, colour of your door, landmarks, or anything else we should know"
                rows={3}
                className="text-sm"
              />
            </div>
            <div className="md:col-span-1">
              <label htmlFor="preferredDeliverySlot" className="text-xs sm:text-sm font-medium">
                Preferred delivery window
              </label>
              <select
                id="preferredDeliverySlot"
                name="preferredDeliverySlot"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                defaultValue="ASAP"
              >
                <option value="ASAP">As soon as possible (within 1 hours)</option>
                <option value="TODAY_BEFORE_6PM">Today before 6:00 pm</option>
                <option value="MORNING">Tomorrow morning (8:00-11:00 am)</option>
                <option value="AFTERNOON">Tomorrow afternoon (12:00-4:00 pm)</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label htmlFor="deliveryFeeEstimated" className="text-xs sm:text-sm font-medium">
                Delivery fee estimate (KES)
              </label>
              <Input id="deliveryFeeEstimated" name="deliveryFeeEstimated" type="number" min={0} step={50} placeholder="e.g. 150" className="text-sm" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment review</CardTitle>
            <CardDescription>
              We&apos;ll initiate an M-Pesa STK push after the shopper confirms availability. You only pay once the request appears on your phone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Items subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Service fee</span>
              <span className="font-medium">{formatCurrency(serviceFee)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2 text-base font-semibold">
              <span>Estimated total</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Final amount may adjust after shopping. We&apos;ll reconcile differences before delivery and send an updated receipt.
            </p>
          </CardContent>
        </Card>

        {formError ? (
          <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>{formError}</span>
          </div>
        ) : null}

        <input type="hidden" name="cart" value="" />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…
              </>
            ) : (
              "Submit order request"
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            By continuing you agree to our Terms, Privacy Policy, and Refund Policy.
          </p>
        </div>
      </form>

      <Card className="self-start">
        <CardHeader>
          <CardTitle>Your basket</CardTitle>
          <CardDescription>Tap back to cart to edit quantities if needed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {items.length === 0 ? (
            <p className="text-muted-foreground">No items selected yet.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium leading-tight">{item.name}</p>
                    {item.unit ? <p className="text-xs text-muted-foreground">{item.unit}</p> : null}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">x{item.quantity}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
