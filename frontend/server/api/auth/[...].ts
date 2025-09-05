/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore - NuxtAuthHandler import issue with verbatimModuleSyntax
import { NuxtAuthHandler } from '#auth'
import Auth0Provider from 'next-auth/providers/auth0'
import CredentialsProvider from "next-auth/providers/credentials"
import type { Provider } from "next-auth/providers/index"
import type { Session } from 'next-auth'
import type { JWT } from 'next-auth/jwt'

// NextAuthの型定義
interface User {
  id: string
  email?: string | null
  name?: string | null
  image?: string | null
}

interface Account {
  access_token?: string
  id_token?: string
  refresh_token?: string
}

const isDevelopment = process.env.NODE_ENV !== 'production'

// プロバイダー配列を明示的に型定義
const providers: Provider[] = isDevelopment ? [
    // @ts-expect-error Import is exported on .default during SSR, so we need to call it this way. May be fixed via Vite at some point
    CredentialsProvider.default({
        id: 'mock',
        name: 'Credentials',
        credentials: {
            email: {label: "Email", type: "email", placeholder: "dev@example.com"},
            password: {label: "Password", type: "password"}
        },
        async authorize(credentials: { email?: string, password?: string }) {
            if (!credentials?.email) return null

            return {
                id: 'dev-user-001',
                email: credentials.email,
                name: credentials.email.split('@')[0] || 'Dev User',
                role: credentials.email.includes('admin') ? 'ADMIN' : 'USER'
            }
        }
    })
] : [
    Auth0Provider({
        clientId: process.env.AUTH0_CLIENT_ID!,
        clientSecret: process.env.AUTH0_CLIENT_SECRET!,
        issuer: process.env.AUTH0_ISSUER!,
        authorization: {
            params: {
                audience: process.env.AUTH0_AUDIENCE,
                scope: 'openid profile email offline_access'
            }
        }
    })
]

export default NuxtAuthHandler({
    secret: process.env.AUTH_SECRET || 'dev-secret-change-in-production',
    providers,
    pages: {
        signIn: '/signin',
        error: '/signin'
    },
    callbacks: {
        async jwt({ 
            token, 
            user, 
            account 
        }: {
            token: JWT
            user?: User
            account?: Account | null
        }): Promise<JWT> {
            // 開発環境の場合
            if (isDevelopment && user) {
                token.accessToken = 'dev-mock-jwt-token'
                token.sub = user.id
            }
            // 本番環境（Auth0）の場合
            else if (account) {
                token.accessToken = account.access_token
                token.idToken = account.id_token
                token.refreshToken = account.refresh_token
            }

            return token
        },

        async session({ 
            session, 
            token 
        }: {
            session: Session
            token: JWT
        }): Promise<Session> {
            // 開発環境用のモックロールと権限
            const userRole = token.role as string || 'USER'
            const mockRoles = [{
                id: `role-${userRole.toLowerCase()}`,
                name: userRole,
                displayName: userRole === 'ADMIN' ? '管理者' : 'ユーザー',
                permissions: userRole === 'ADMIN' 
                    ? ['users.view', 'users.edit', 'settings.edit', 'all'] as const
                    : ['users.view', 'self.edit'] as const
            }]
            
            const mockPermissions = mockRoles.flatMap(role => role.permissions)
            
            return {
                ...session,
                accessToken: token.accessToken as string,
                user: {
                    ...(session.user || {}),
                    // Use type assertion to add custom properties
                    ...(mockRoles.length > 0 ? { roles: mockRoles } : {}),
                    ...(mockPermissions.length > 0 ? { permissions: mockPermissions } : {}),
                    isActive: true
                }
            } as Session
        }
    },

    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60
    }
})