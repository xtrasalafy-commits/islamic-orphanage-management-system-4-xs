import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";

export async function GET() {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  return NextResponse.json({ user });
}
