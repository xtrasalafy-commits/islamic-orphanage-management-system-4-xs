"use client";

import { useState } from "react";
import { Check, Coffee, Copy, Download, ExternalLink, Heart } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Modal } from "@/components/ui";
import { rupiah } from "@/lib/utils";

const TRAKTEER_URL = "https://trakteer.id/perpus_opera/";
const AMOUNTS = [6000, 12000, 18000, 24000, 30000, 60000];

export function TrakteerWidget() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(6000);
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(TRAKTEER_URL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Traktir Kopi"
        title="Web app ini gratis & bebas iklan. Kopi kecil, server tetap jalan"
        className="group fixed bottom-5 right-5 z-40 flex items-center gap-2.5 rounded-full bg-pine-700 py-3 pl-3.5 pr-4 text-sm font-bold text-white shadow-lg shadow-pine-900/40 transition-all hover:bg-pine-800 hover:shadow-xl active:scale-95 sm:bottom-6 sm:right-6"
      >
        <Coffee size={18} className="shrink-0 text-amber-300 transition-transform group-hover:scale-110" />
        <span className="hidden sm:inline">Traktir Kopi</span>
        <span className="inline sm:hidden">Traktir</span>
        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-pine-950">
          <Heart size={11} fill="currentColor" />
        </span>
      </button>

      {/* Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Dukung Pengembangan"
        subtitle="SIMPAAN — Sistem Manajemen Panti Asuhan"
      >
        <div className="space-y-5">
          {/* Message */}
          <div className="rounded-2xl bg-gradient-to-br from-pine-50 to-amber-50 p-4 text-center">
            <p className="text-sm font-semibold leading-relaxed text-pine-800">
              Web app ini gratis &amp; bebas iklan.
              <br />
              Kopi kecil, server tetap jalan ☕
            </p>
          </div>

          {/* Amount selection */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">
              Pilih Nominal Traktiran
            </p>
            <div className="grid grid-cols-3 gap-2">
              {AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setSelected(amt)}
                  className={`rounded-xl border px-2 py-2.5 text-sm font-bold transition ${
                    selected === amt
                      ? "border-pine-500 bg-pine-50 text-pine-800 ring-1 ring-pine-500/30"
                      : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50"
                  }`}
                >
                  {rupiah(amt)}
                </button>
              ))}
            </div>
            <p className="mt-2 text-center text-xs text-stone-400">
              Nominal dipilih: <span className="font-bold text-pine-700">{rupiah(selected)}</span> — pembayaran
              dilakukan di halaman Trakteer
            </p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-2xl border-2 border-stone-100 bg-white p-4 shadow-sm">
              <QRCodeSVG
                value={TRAKTEER_URL}
                size={176}
                level="M"
                marginSize={0}
                fgColor="#1d553f"
                className="h-auto w-44"
              />
            </div>
            <p className="text-center text-xs leading-relaxed text-stone-500">
              Scan QR code dengan kamera HP <br /> untuk traktir via Trakteer
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <a
              href={TRAKTEER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-pine-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-pine-800 active:scale-[0.98]"
            >
              <Coffee size={16} className="text-amber-300" />
              Traktir via Trakteer
              <ExternalLink size={14} className="opacity-70" />
            </a>
            <button
              type="button"
              onClick={copyLink}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-600 transition hover:border-pine-400 hover:text-pine-700"
            >
              {copied ? <Check size={15} className="text-pine-600" /> : <Copy size={15} />}
              {copied ? "Link berhasil disalin!" : "Salin Link Trakteer"}
            </button>
          </div>

          {/* Footer — Open Source & Download */}
          <div className="border-t border-stone-100 pt-4 text-center">
            <p className="text-xs font-semibold text-stone-400">
              Open Source oleh <span className="font-bold text-stone-600">MZF</span> — 2026
            </p>
            <a
              href="/api/download-source"
              className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-pine-600 transition hover:text-pine-800 hover:underline"
            >
              <Download size={12} /> Download Source Code Lengkap
            </a>
          </div>
        </div>
      </Modal>
    </>
  );
}
