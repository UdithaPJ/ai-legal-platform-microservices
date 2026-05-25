"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const lawyers = [
  { id: "1", name: "Sarah Mitchell", specialization: "Corporate Law", fee: 250 },
  { id: "2", name: "James Okafor", specialization: "Criminal Law", fee: 300 },
  { id: "4", name: "Michael Torres", specialization: "IP Law", fee: 350 },
  { id: "5", name: "Aisha Patel", specialization: "Real Estate Law", fee: 220 },
];

export default function NewAppointmentPage() {
  const [selectedLawyer, setSelectedLawyer] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-green-100">
          <ChevronRight className="size-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Request Sent!</h2>
        <p className="mt-2 text-sm text-gray-500">
          Your appointment request has been sent. The lawyer will respond shortly.
        </p>
        <Link
          href="/client/appointments"
          className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          View Appointments
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link href="/client/lawyers" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="size-4" /> Back to lawyers
      </Link>

      <Card>
        <CardHeader><CardTitle>Book an Appointment</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {/* Lawyer selection */}
          <div className="space-y-2">
            <Label>Select Lawyer</Label>
            <div className="space-y-2">
              {lawyers.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setSelectedLawyer(l.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedLawyer === l.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{l.name}</p>
                      <p className="text-xs text-gray-500">{l.specialization}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">${l.fee}/hr</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Describe your legal matter</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Briefly describe what you need help with…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button
            type="button"
            disabled={!selectedLawyer || !description.trim()}
            onClick={() => setSubmitted(true)}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send Request
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
