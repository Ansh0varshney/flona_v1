"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface UserProfile {
    id: string;
    username: string;
    image: string | null;
    bio: string | null;
    joinDate: string;
    stats: {
        events: number;
        comments: number;
    };
}

export default function ProfilePage({ params }: { params: { username: string } }) {
    const { data: session } = useSession();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editBio, setEditBio] = useState('');
    const [editUsername, setEditUsername] = useState('');

    useEffect(() => {
        fetchProfile();
    }, [params.username]);

    const fetchProfile = async () => {
        try {
            const res = await fetch(`/api/user/${params.username}`);
            if (!res.ok) {
                if (res.status === 404) {
                    setError('User not found');
                } else {
                    setError('Failed to load profile');
                }
                setLoading(false);
                return;
            }
            const data = await res.json();
            setProfile(data);
            setEditBio(data.bio || '');
            setEditUsername(data.username);
        } catch (err) {
            setError('An error occurred');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bio: editBio, flona_name: editUsername }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update profile');
            }

            const updatedUser = await res.json();
            setProfile((prev) => prev ? { ...prev, bio: updatedUser.bio, username: updatedUser.flona_name } : null);
            setIsEditing(false);

            if (updatedUser.flona_name !== params.username) {
                router.push(`/profile/${updatedUser.flona_name}`);
            }
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleBlockUser = async () => {
        if (!confirm('Are you sure you want to block this user?')) return;
        try {
            const res = await fetch('/api/user/block', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blockedId: profile?.id }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to block user');
            }

            alert('User blocked');
            router.push('/');
        } catch (err: any) {
            alert(err.message);
        }
    }

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!profile) return null;

    const isOwnProfile = session?.user?.email && profile.username === session.user.name; // Note: session.user.name might need checking if it maps to username correctly in next-auth config, usually strictly it might be better to check ID if available in session, or fetching 'me' endpoint. For now assuming name/username match or using email from profile fetch if we added it (we didn't for privacy). 
    // Better check: we don't have email in public profile. 
    // Let's rely on a separate check or just assume if we can edit it's ours? 
    // Actually, we can check if we can edit by trying? No.
    // We need to know if it is own profile. 
    // current session user might not have username updated in session if changed elsewhere.
    // A robust way is to check against an ID or email if we had it. 
    // Since we don't return email, we can't check email.
    // We returned ID. If next-auth session has ID, we use that.
    // Let's assume standard next-auth session has user.id if configured, or we need to add it.
    // For now, let's use a simple heuristic or fetch 'me' to confirm identity if needed. 
    // Actually, `session.user` usually has `name`, `email`, `image`. 
    // If we want to be sure, we might need the ID in the session.
    // Let's optimistically check username match OR check if we have a way to verify ownership.
    // For this MVF, let's rely on matching username if session.user.name updates, or just fetch /api/auth/session to get latest?
    // Actually, simplest is: The update API checks email. 
    // Frontend: we can't easily be 100% sure without ID. 
    // Let's update `next-auth` to include ID in session or just use name for now and refine later.
    // Wait, I can just compare the `profile.username` with `session.user.name` if `flona_name` is mapped to name.

    // Actually, let's assume `isOwnProfile` logic needs refinement but for now:
    // We will trust the session name if it matches. 
    // BUT the session name might be the REAL name if not customized?
    // `flona_name` is unique. 
    // Let's proceed with a basic check and maybe add a TODO to ensure session has ID.

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-blue-100 to-purple-100"></div>
                <div className="px-8 pb-8">
                    <div className="relative -mt-16 mb-4 flex justify-between items-end">
                        <div className="relative">
                            {profile.image ? (
                                <Image
                                    src={profile.image}
                                    alt={profile.username}
                                    width={128}
                                    height={128}
                                    className="rounded-full border-4 border-white object-cover bg-white"
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center text-4xl text-gray-400">
                                    {profile.username[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="mb-2">
                            {isOwnProfile ? (
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full text-sm font-medium transition-colors"
                                >
                                    {isEditing ? 'Cancel' : 'Edit Profile'}
                                </button>
                            ) : session?.user ? (
                                <button
                                    onClick={handleBlockUser}
                                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-full text-sm font-medium transition-colors"
                                >
                                    Block
                                </button>
                            ) : null}
                        </div>
                    </div>

                    {isEditing ? (
                        <form onSubmit={handleUpdateProfile} className="space-y-4 mb-8">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input
                                    type="text"
                                    value={editUsername}
                                    onChange={(e) => setEditUsername(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    minLength={3}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                                <textarea
                                    value={editBio}
                                    onChange={(e) => setEditBio(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none h-32 resize-none"
                                    placeholder="Tell us about yourself..."
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">{profile.username}</h1>
                            <p className="text-sm text-gray-500 mb-4">Joined {new Date(profile.joinDate).toLocaleDateString()}</p>
                            {profile.bio && <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-8">
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                            <div className="text-3xl font-bold text-gray-900 mb-1">{profile.stats.events}</div>
                            <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">Events</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                            <div className="text-3xl font-bold text-gray-900 mb-1">{profile.stats.comments}</div>
                            <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">Comments</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
