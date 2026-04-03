import { NextResponse } from "next/server";
import {
  isInsforgeConfigured,
  fetchPackageWithHistory,
  patchPackage,
} from "@/lib/packages-api";

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
    const data = await patchPackage(decodeURIComponent(id), patch, {
      author: author || "Système",
      appendHistory: appendHistory !== false,
    });
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    const status = e.message === "Colis introuvable" ? 404 : 500;
    return NextResponse.json(
      { error: e.message || "Erreur" },
      { status }
    );
  }
}
