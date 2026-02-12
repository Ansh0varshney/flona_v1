import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    // Trigger rebuild
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 3) {
        return NextResponse.json([]);
    }

    try {
        const users = await prisma.user.findMany({
            where: {
                flona_name: {
                    contains: query,
                    mode: 'insensitive',
                },
            },
            select: {
                flona_name: true,
                image: true,
                bio: true,
            },
            take: 10,
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Error searching users:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}
