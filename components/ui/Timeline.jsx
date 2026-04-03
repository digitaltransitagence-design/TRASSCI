"use client";

import { Activity } from "lucide-react";
import { STATUS_FLOW } from "@/lib/constants";

/**
 * Timeline verticale de suivi colis — alignée sur STATUS_FLOW.
 */
export default function Timeline({ currentStatus, history = [] }) {
  const currentStepIndex = STATUS_FLOW.findIndex((s) => s.id === currentStatus);

  const historyByStatus = Object.fromEntries(
    history.map((h) => [h.status, h])
  );

  return (
    <div>
      <h3 className="mb-6 flex items-center gap-2 font-extrabold text-slate-800">
        <Activity className="h-5 w-5" aria-hidden />
        Suivi en temps réel
      </h3>
      <div className="relative ml-3 space-y-8 border-l-2 border-slate-200">
        {STATUS_FLOW.map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const historyData = historyByStatus[step.id];

          return (
            <div key={step.id} className="relative pl-8">
              <div
                className={`absolute -left-[11px] top-0.5 h-5 w-5 rounded-full border-4 border-white shadow-sm ${
                  isCompleted ? "bg-orange-500" : "bg-slate-200"
                } ${isCurrent ? "ring-4 ring-orange-100" : ""}`}
              />
              <div>
                <h4
                  className={`text-sm font-bold ${
                    isCompleted ? "text-slate-800" : "text-slate-400"
                  }`}
                >
                  {step.label}
                </h4>
                <p
                  className={`mt-0.5 text-xs ${
                    isCompleted ? "text-slate-600" : "text-slate-400"
                  }`}
                >
                  {step.id === "DELIVERED" && isCompleted
                    ? "Identité (CNI) vérifiée à la remise."
                    : step.desc}
                </p>
                {historyData && (
                  <div className="mt-2 inline-flex items-center gap-2 rounded border border-slate-100 bg-slate-50 px-2 py-1 font-mono text-[10px] text-slate-500">
                    <span>{historyData.date}</span>
                    <span className="text-slate-300">|</span>
                    <span>{historyData.author}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
