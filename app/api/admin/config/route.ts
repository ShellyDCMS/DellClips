import { auth } from "@/lib/auth";
import { databaseService } from "@/lib/services";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/config — Get all config values
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await databaseService.getUserById(session.user.id);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const config = await databaseService.getAllConfig();
    return NextResponse.json({ config });
  } catch (error) {
    console.error("[api/admin/config] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch config" }, { status: 500 });
  }
}

// PUT /api/admin/config — Update a config value
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await databaseService.getUserById(session.user.id);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { key, value } = await request.json();

    if (!key || value === undefined) {
      return NextResponse.json({ error: "key and value are required" }, { status: 400 });
    }

    await databaseService.setConfigValue(key, String(value), session.user.id);

    return NextResponse.json({ updated: true, key, value });
  } catch (error) {
    console.error("[api/admin/config] PUT error:", error);
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
  }
}
