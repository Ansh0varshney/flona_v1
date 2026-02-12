import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function PATCH(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { bio, flona_name } = await request.json();

        // Basic validation
        if (flona_name && flona_name.length < 3) {
            return NextResponse.json(
                { error: 'Username must be at least 3 characters long' },
                { status: 400 }
            );
        }

        // Check if username is taken if changing it
        if (flona_name) {
            const existingUser = await prisma.user.findUnique({
                where: { flona_name },
            });

            if (existingUser && existingUser.email !== session.user.email) {
                return NextResponse.json(
                    { error: 'Username already taken' },
                    { status: 400 }
                );
            }
        }

        const updatedUser = await prisma.user.update({
            where: {
                email: session.user.email,
            },
            data: {
                bio,
                flona_name,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
