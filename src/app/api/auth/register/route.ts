import { db } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new NextResponse("Email and password are required", { status: 400 });
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return new NextResponse("User with this email already exists", { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // Optionally, create a session automatically using NextAuth
    const session = await getServerSession(authOptions);

    // Return JSON with redirect URL
    return NextResponse.json({
      message: "User registered successfully",
      redirectTo: "/dashboard/polls",
      user: { id: user.id, email: user.email },
      session: session ?? null,
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}