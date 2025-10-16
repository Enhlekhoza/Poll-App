import { NextRequest, NextResponse } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';

export async function POST(req: NextRequest) {
  try {
    const { event, room, data } = await req.json();

    // Get the Socket.IO server instance
    const io = (global as any).io;
    
    if (!io) {
      return NextResponse.json({ error: 'Socket.IO server not initialized' }, { status: 500 });
    }

    // Emit to a specific room if provided, otherwise broadcast to all
    if (room) {
      io.to(room).emit(event, data);
    } else {
      io.emit(event, data);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Socket emit error:', error);
    return NextResponse.json({ error: 'Failed to emit socket event' }, { status: 500 });
  }
}