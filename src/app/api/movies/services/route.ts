import { NextResponse } from "next/server";
import servicesData from "@/data/services.json";

export async function GET() {
  const services = (servicesData as string[]).map((name, i) => ({
    id: i + 1,
    service_name: name,
    is_active: true,
  }));
  return NextResponse.json({ services });
}
