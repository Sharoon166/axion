import NextAuth, { DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import Admin from '@/models/Admin';   // 
import bcrypt from 'bcryptjs';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';

interface UserData {
  id: string;
  name?: string | null;
  email?: string | null;
  role: 'user' | 'admin';
  address?: string | null;

  image?: string | null;
  isAdmin?: boolean;
}

declare module 'next-auth' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface User extends UserData { }
  interface Session extends DefaultSession {
    user: UserData;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'user' | 'admin';
    isAdmin: boolean;
    // Include common NextAuth fields to satisfy strong typing when copying to session
    email?: string | null;
    name?: string | null;
    image?: string | null;
  }
}

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: 'user', // Default role for Google users
          isAdmin: false
        };
      }
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
          throw new Error('Email and password are required');
        }

        await dbConnect();

        // Try finding user in normal users
        interface DbUser {
          _id: { toString(): string };
          email: string;
          name?: string;
          address?: string;
          password: string;
          avatar?: string;
        }

        let userDoc = (await User.findOne({ email }).select('+password +avatar').lean()) as unknown as DbUser | null;

        // If not found, try admins
        let role: 'user' | 'admin' = 'user';
        if (!userDoc) {
          userDoc = (await Admin.findOne({ email }).select('+password +avatar').lean()) as unknown as DbUser | null;
          if (userDoc) {
            role = 'admin';
          }
        }

        if (!userDoc) {
          throw new Error('No account found with this email');
        }

        const isPasswordValid = await bcrypt.compare(password, userDoc.password);
        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        return {
          id: userDoc._id.toString(),
          email: userDoc.email,
          name: userDoc.name,
          role,
          image: userDoc.avatar || null,
          address: userDoc.address || null,

          isAdmin: role === 'admin',
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
  },
  pages: {
    signIn: '/auth/signin', // Custom sign-in page
    error: '/auth/error', // Error code passed in query string as ?error=
  },
  callbacks: {
    async jwt({ token, user }: { token: import('next-auth/jwt').JWT; user?: import('next-auth').User }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isAdmin = user.role === 'admin';
        // Include all user data in the token
        if (user.email) token.email = user.email;
        if (user.name) token.name = user.name;
        if (user.image) token.image = user.image;
        if (user.address) token.address = user.address;
      }
      return token;
    },
    async session({ session, token }: { session: import('next-auth').Session; token: import('next-auth/jwt').JWT }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.isAdmin = token.isAdmin;
        // Ensure we have the user's name and email in session
        if (typeof token.email === 'string') session.user.email = token.email;
        if (typeof token.name === 'string') session.user.name = token.name;
        if (typeof token.image === 'string') session.user.image = token.image;
        if (typeof token.address === 'string') session.user.address = token.address;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
