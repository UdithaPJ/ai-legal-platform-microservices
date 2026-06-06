"use client";

import { useSession } from "next-auth/react";
import { Clock, CheckCircle2, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PendingReviewPage() {
  const { data: session } = useSession();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8">
      <div className="flex size-20 items-center justify-center rounded-full bg-amber-100">
        <Clock className="size-10 text-amber-600" />
      </div>

      <div className="max-w-md space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          Your application is under review
        </h1>
        <p className="text-sm text-gray-500">
          Hi{session?.user?.name ? ` ${session.user.name.split(" ")[0]}` : ""},
          our admin team is currently reviewing your profile and uploaded
          documents. This typically takes 1–3 business days.
        </p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-base">What happens next?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              icon: CheckCircle2,
              color: "text-green-500",
              title: "Profile submitted",
              desc: "Your professional information and documents have been received.",
              done: true,
            },
            {
              icon: Clock,
              color: "text-amber-500",
              title: "Admin review",
              desc: "Our team verifies your bar registration and credentials.",
              done: false,
            },
            {
              icon: Mail,
              color: "text-blue-500",
              title: "Decision notification",
              desc: "You will be notified by email once a decision is made.",
              done: false,
            },
          ].map(({ icon: Icon, color, title, desc, done }) => (
            <div key={title} className="flex items-start gap-3">
              <Icon className={`mt-0.5 size-5 shrink-0 ${color}`} />
              <div>
                <p className={`text-sm font-medium ${done ? "text-gray-900" : "text-gray-500"}`}>
                  {title}
                </p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-xs text-gray-400">
        Questions? Contact{" "}
        <a href="mailto:support@legalplatform.com" className="underline">
          support@legalplatform.com
        </a>
      </p>
    </div>
  );
}
