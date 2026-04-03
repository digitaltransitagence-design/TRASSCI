import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  isInsforgeConfigured,
  fetchPackageWithHistory,
  patchPackage,
} from "@/lib/packages-api";

/** Seule la note client (1–5) est autorisée sans code admin (si ADMIN_SECRET est défini). */
function isClientRatingPatch(patch) {
  const keys = Object.keys(patch).filter(
    (k) => patch[k] !== undefined && patch[k] !== null && patch[k] !== ""
  );
  if (keys.length !== 1 || keys[0] !== "rating") return false;
  const r = Number(patch.rating);
  return Number.isInteger(r) && r >= 1 && r <= 5;
}

function statusForPackageError(message) {
  if (message === "Colis introuvable") return 404;
  if (
    /^(Note |La note)/i.test(message || "") ||
    /invalide/i.test(message || "")
  ) {
    return 400;
  }
  return 500;
}

export async function GET(request, { params }) {
  if (!isInsforgeConfigured()) {
    return NextResponse.json({ error: "Insforge non configuré" }, { status: 503 });
  }
  const { id } = await params;
  try {
    const data = await fetchPackageWithHistory(decodeURIComponent(id));
    if (!data) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e.message || "Erreur" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  if (!isInsforgeConfigured()) {
    return NextResponse.json({ error: "Insforge non configuré" }, { status: 503 });
  }
  const { id } = await params;
  try {
    const body = await request.json();
    const { author, appendHistory, ...patch } = body;
    if (!isClientRatingPatch(patch)) {
      const denied = requireAdmin(request, { permission: "dispatch" });
      if (denied) return denied;
    }
    const data = await patchPackage(decodeURIComponent(id), patch, {
      author: author || "Système",
      appendHistory: appendHistory !== false,
    });
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    const msg = e.message || "Erreur";
    const status = statusForPackageError(msg);
    return NextResponse.json({ error: msg }, { status });
  }
}
