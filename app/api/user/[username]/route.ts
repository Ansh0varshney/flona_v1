import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
    request: Request,
    { params }: { params: { username: string } }
) {
    const username = params.username;

    try {
        const user = await prisma.user.findUnique({
            where: {
                flona_name: username,
            },
            select: {
                id: true,
                flona_name: true,
                image: true,
                bio: true,
                createdAt: true,
                _count: {
                    select: {
                        events: true,
                        comments: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const userData = {
            id: user.id,
            username: user.flona_name,
            image: user.image,
            bio: user.bio,
            joinDate: user.createdAt,
            stats: {
                events: user._count.events,
                comments: user._count.comments,
            },
        };

        return NextResponse.json(userData);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
