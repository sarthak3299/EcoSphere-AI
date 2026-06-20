import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) { return handleProxy(req); }
export async function POST(req: NextRequest) { return handleProxy(req); }
export async function PUT(req: NextRequest) { return handleProxy(req); }
export async function DELETE(req: NextRequest) { return handleProxy(req); }
export async function PATCH(req: NextRequest) { return handleProxy(req); }

async function handleProxy(req: NextRequest) {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
  const targetUrl = `${backendUrl}${req.nextUrl.pathname}${req.nextUrl.search}`;
  
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "host") {
      headers.set(key, value);
    }
  });

  try {
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: headers,
    };

    // Forward the request body for modifications
    if (req.method !== "GET" && req.method !== "HEAD") {
      fetchOptions.body = await req.blob();
    }

    const response = await fetch(targetUrl, fetchOptions);

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to proxy request", detail: errorMessage }, { status: 500 });
  }
}
