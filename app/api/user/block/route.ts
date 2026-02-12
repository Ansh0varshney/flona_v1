import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { blockedId } = await request.json();

    if (!blockedId) {
        return NextResponse.json({ error: 'Blocked user ID is required' }, { status: 400 });
    }

    try {
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (currentUser.id === blockedId) {
            return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
        }

        const block = await prisma.block.create({
            data: {
                blockerId: currentUser.id,
                blockedId: blockedId,
            },
        });

        return NextResponse.json(block);
    } catch (error) {
        console.error('Error blocking user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const blockedId = searchParams.get('blockedId');

    if (!blockedId) {
        return NextResponse.json({ error: 'Blocked user ID is required' }, { status: 400 });
    }

    try {
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        await prisma.block.deleteMany({
            where: {
                blockerId: currentUser.id,
                blockedId: blockedId,
            },
        });

        return NextResponse.json({ message: 'User unblocked' });
    } catch (error) {
        console.error('Error unblocking user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
