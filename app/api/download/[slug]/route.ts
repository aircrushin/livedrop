import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2/client";
import { createClient } from "@/lib/supabase/server";
import { incrementDownloadCount } from "@/lib/supabase/statistics";
import JSZip from "jszip";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for large downloads

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  try {
    const body = await request.json();
    const { 
      photoIds, 
      dateFrom, 
      dateTo,
      downloadAll = false 
    } = body as {
      photoIds?: string[];
      dateFrom?: string;
      dateTo?: string;
      downloadAll?: boolean;
    };

    const supabase = await createClient();

    // Get event info
    const { data: eventData } = await supabase
      .from("events")
      .select("id, name")
      .eq("slug", slug)
      .single();

    if (!eventData) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const event = eventData;

    // Build query for photos
    let query = supabase
      .from("photos")
      .select("id, storage_path, created_at")
      .eq("event_id", event.id);

    // Apply filters
    if (photoIds && photoIds.length > 0) {
      query = query.in("id", photoIds);
    } else if (downloadAll) {
      // Download all visible photos for guests, all photos for host
      // For now, we download all photos (host view)
    }

    // Apply date filters
    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }
    if (dateTo) {
      // Add one day to include the entire end date
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      query = query.lt("created_at", endDate.toISOString());
    }

    const { data: photos, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 });
    }

    if (!photos || photos.length === 0) {
      return NextResponse.json({ error: "No photos found" }, { status: 404 });
    }

    // Create ZIP file
    const zip = new JSZip();
    const folder = zip.folder(event.name || "photos");

    if (!folder) {
      return NextResponse.json({ error: "Failed to create ZIP folder" }, { status: 500 });
    }

    // Download each photo and add to ZIP
    const downloadPromises = photos.map(async (photo: { id: string; storage_path: string; created_at: string }, index: number) => {
      try {
        const command = new GetObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: photo.storage_path,
        });

        const response = await r2Client.send(command);
        
        if (!response.Body) {
          console.warn(`Photo ${photo.id} has no body`);
          return null;
        }

        const bytes = await response.Body.transformToByteArray();
        
        // Generate filename with timestamp and index
        const date = new Date(photo.created_at);
        const timestamp = date.toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const extension = photo.storage_path.split(".").pop() || "jpg";
        const filename = `${timestamp}_${String(index + 1).padStart(3, "0")}.${extension}`;
        
        folder.file(filename, bytes);
        
        return { id: photo.id, filename, success: true };
      } catch (err) {
        console.error(`Failed to download photo ${photo.id}:`, err);
        return { id: photo.id, success: false };
      }
    });

    const results = await Promise.all(downloadPromises);
    const successful = results.filter((r: { id: string; filename?: string; success: boolean } | null) => r?.success);
    
    if (successful.length === 0) {
      return NextResponse.json({ error: "Failed to download any photos" }, { status: 500 });
    }

    // Track download counts for successfully downloaded photos
    const downloadTrackingPromises = successful
      .filter((r): r is { id: string; filename: string; success: boolean } => r !== null)
      .map((r) => incrementDownloadCount(r.id));
    
    // Don't wait for tracking to complete
    void Promise.all(downloadTrackingPromises).catch((err) => {
      console.error("Failed to track download counts:", err);
    });

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    
    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 10);
    const zipFilename = `${event.name || "photos"}_${timestamp}_${successful.length}-photos.zip`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(zipFilename)}"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("ZIP generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate ZIP file" },
      { status: 500 }
    );
  }
}
