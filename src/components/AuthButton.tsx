'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { Menu } from '@headlessui/react';
import Link from 'next/link';
import Image from 'next/image';

export default function AuthButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <Menu as="div" className="relative ml-3">
        <div>
          <Menu.Button className="flex rounded-full bg-indigo-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 h-8 w-8 items-center justify-center">
            <span className="sr-only">Open user menu</span>
            {session.user?.image ? (
              <Image
                className="h-8 w-8 rounded-full"
                src={session.user.image}
                alt={session.user?.name || 'User'}
                fill
              />
            ) : (
              <span className="text-sm font-medium">
                {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
              </span>
            )}
          </Menu.Button>
        </div>
        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <Menu.Item>
            {({ active }: { active: boolean }) => (
              <Link
                href="/profile"
                className={`block px-4 py-2 text-sm ${
                  active ? 'bg-gray-100' : ''
                }`}
              >
                Your Profile
              </Link>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }: { active: boolean }) => (
              <button
                onClick={() => signOut()}
                className={`w-full text-left px-4 py-2 text-sm ${
                  active ? 'bg-gray-100' : ''
                }`}
              >
                Sign out
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Menu>
    );
  }

  return (
    <button
      onClick={() => signIn()}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      Sign in
    </button>
  );
}
