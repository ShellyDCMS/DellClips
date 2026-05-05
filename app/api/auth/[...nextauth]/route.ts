import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;

export async function HEAD() {
  return new Response(null, { status: 200 });
}
