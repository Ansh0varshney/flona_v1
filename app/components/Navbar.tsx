"use client";

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import UserSearch from './UserSearch';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';

function NavigationButtons() {
    const pathname = usePathname();
    const isEventsPage = pathname === '/events';

    return (
        <Link
            href={isEventsPage ? '/' : '/events'}
            className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition hidden md:block"
        >
            {isEventsPage ? 'Back to Chat' : 'Events Map'}
        </Link>
    );
}

export default function Navbar() {
    const { data: session } = useSession();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

    useEffect(() => {
        if (isMenuOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right
            });
        }
    }, [isMenuOpen]);

    return (
        <nav className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-[100]">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                <Link href="/" className="text-2xl font-bold text-black">
                    Flona
                </Link>

                {session && (
                    <>
                        <div className="flex-1 max-w-md hidden md:block">
                            <UserSearch />
                        </div>

                        <NavigationButtons />
                    </>
                )}

                <div className="flex items-center gap-4">
                    {session ? (
                        <div className="relative">
                            <button
                                ref={buttonRef}
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex items-center gap-2 hover:bg-gray-50 p-1 pr-3 rounded-full transition-colors"
                            >
                                {session.user?.image ? (
                                    <Image
                                        src={session.user.image}
                                        alt="Profile"
                                        width={32}
                                        height={32}
                                        className="rounded-full"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center text-sm font-bold">
                                        {session.user?.flonaName?.[0]?.toUpperCase() || session.user?.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                )}
                                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                                    {session.user?.flonaName || session.user?.name}
                                </span>
                            </button>

                            {isMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-[9998]"
                                        onClick={() => setIsMenuOpen(false)}
                                    ></div>
                                    <div
                                        className="fixed w-48 bg-white rounded-xl shadow-xl border-2 border-gray-200 py-2 z-[9999]"
                                        style={{
                                            top: `${menuPosition.top}px`,
                                            right: `${menuPosition.right}px`
                                        }}
                                    >
                                        <div className="px-4 py-2 border-b border-gray-100 md:hidden">
                                            <UserSearch />
                                        </div>
                                        <Link
                                            href={`/profile/${session.user?.flonaName || session.user?.name}`}
                                            className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 font-medium"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            Your Profile
                                        </Link>
                                        <button
                                            onClick={() => signOut()}
                                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-full transition-colors"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
            {session && (
                <div className="mt-3 md:hidden">
                    {/* Mobile search if needed, but put in menu for cleaner look or here? 
                Let's put it here for better accessibility on mobile 
            */}
                    <UserSearch />
                </div>
            )}
        </nav>
    );
}
