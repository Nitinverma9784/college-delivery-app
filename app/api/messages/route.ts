import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 15;

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  const cursor = searchParams.get("cursor"); // ISO timestamp of oldest loaded message

  if (!roomId) {
    return NextResponse.json({ error: "roomId is required" }, { status: 400 });
  }

  // Verify the requesting user is a participant in this room
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: roomRow, error: roomError } = await supabase
    .from("chat_rooms")
    .select("id, created_by, accepted_by")
    .eq("id", roomId)
    .maybeSingle();

  if (roomError || !roomRow) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  if (
    roomRow.created_by !== user.id &&
    roomRow.accepted_by !== user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Build paginated query — newest first, cursor pages backwards in time
  let query = supabase
    .from("chat_messages")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data || []).map((row: any) => ({
    id: row.id,
    roomId: row.room_id,
    senderId: row.sender_id,
    type: row.type,
    content: row.content,
    imageUrl: row.image_url || null,
    location: row.location || null,
    price: row.price ? Number(row.price) : null,
    timestamp: row.created_at,
    deleted: row.deleted ?? false,
  }));

  const nextCursor =
    items.length === PAGE_SIZE ? items[items.length - 1].timestamp : null;

  return NextResponse.json({ items, nextCursor });
}
