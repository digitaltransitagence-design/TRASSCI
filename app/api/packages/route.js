import { NextResponse } from "next/server";
import {
  isInsforgeConfigured,
  insertPackageAndHistory,
  listPackages,
  fetchPackageWithHistory,
} from "@/lib/packages-api";
import { generatePackageId } from "@/lib/constants";

const MAX_PHOTO_CHARS = 2_500_000;

export async function GET(request) {
  if (!isInsforgeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Insforge non configuré (INSFORGE_API_URL, INSFORGE_API_KEY = clé « API Key » ik_ du dashboard)",
      },
      { status: 503 }
    );
  }
  const { searchParams } = new URL(request.url);
  const track = searchParams.get("track");
  try {
    if (track) {
      const data = await fetchPackageWithHistory(track.trim().toUpperCase());
      if (!data) {
        return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      }
      return NextResponse.json(data);
    }
    const all = await listPackages();
    return NextResponse.json({ packages: all });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  if (!isInsforgeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Insforge non configuré (INSFORGE_API_URL, INSFORGE_API_KEY = clé « API Key » ik_ du dashboard)",
      },
      { status: 503 }
    );
  }
  try {
    const body = await request.json();
    const id = (body.id || generatePackageId()).toUpperCase();
    const hasInsurance = Boolean(body.has_insurance);
    const declaredValue = Number(body.declared_value) || 0;

    if (hasInsurance && declaredValue <= 0) {
      return NextResponse.json(
        {
          error:
            "Assurance : indiquez une valeur déclarée estimée du colis (FCFA) supérieure à 0.",
        },
        { status: 400 }
      );
    }

    if (body.photo_url && String(body.photo_url).length > MAX_PHOTO_CHARS) {
      return NextResponse.json(
        { error: "Photo trop volumineuse (réduisez la taille ou utilisez un lien URL)." },
        { status: 400 }
      );
    }

    const payload = {
      id,
      sender_name: body.sender_name,
      sender_phone: body.sender_phone,
      receiver_name: body.receiver_name?.trim() || "",
      receiver_phone: body.receiver_phone,
      declared_value: declaredValue,
      destination: body.destination,
      nature: body.nature || "Document",
      delivery_mode: body.delivery_mode || "depot",
      has_insurance: hasInsurance,
      pickup_address: body.pickup_address || null,
      description: body.description || null,
      photo_url: body.photo_url || null,
    };
    if (
      !payload.sender_name ||
      !payload.sender_phone ||
      !payload.receiver_phone ||
      !payload.destination ||
      !payload.receiver_name
    ) {
      return NextResponse.json(
        {
          error:
            "Champs obligatoires : expéditeur, téléphones, nom du destinataire, destination.",
        },
        { status: 400 }
      );
    }
    const data = await insertPackageAndHistory(payload);
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e.message || "Erreur création" },
      { status: 500 }
    );
  }
}
