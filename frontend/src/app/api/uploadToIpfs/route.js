import { NextResponse } from "next/server";

export const POST = async (req) => {
  try {
    const pinataJWT = process.env.PINATA_JWT; // keep it in .env.local
    if (!pinataJWT) throw new Error("Pinata JWT not found");

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    // Convert file to a Buffer for fetch
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const form = new FormData();
    form.append("file", new Blob([buffer]), file.name);

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: form,
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Pinata error:", data);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    return NextResponse.json(data); // { IpfsHash: "Qm..." }
  } catch (err) {
    console.error("UploadToIPFS route error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
};
