import { NextRequest, NextResponse } from "next/server";

const RABBITMQ_API = process.env.RABBITMQ_API ?? "http://localhost:15672/api";
const RABBITMQ_USER = process.env.RABBITMQ_USER ?? "guest";
const RABBITMQ_PASS = process.env.RABBITMQ_PASS ?? "guest";

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "path required" }, { status: 400 });
  }

  const auth = Buffer.from(`${RABBITMQ_USER}:${RABBITMQ_PASS}`).toString("base64");
  const res = await fetch(`${RABBITMQ_API}${path}`, {
    headers: { Authorization: `Basic ${auth}` },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
