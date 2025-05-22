# WhatsApp UI Clone

A WhatsApp UI clone built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- Real-time messaging using Supabase
- User authentication
- Chat list with user avatars
- Message history
- Responsive design
- Modern UI with Tailwind CSS

## Prerequisites

- Node.js 18+ and npm
- Supabase account

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd whatsapp-ui
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Set up your Supabase database with the following tables:

### profiles
- id (uuid, primary key)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)
- username (text)
- full_name (text)
- avatar_url (text, nullable)

### conversations
- id (uuid, primary key)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)
- last_message_at (timestamp with time zone)

### conversation_participants
- conversation_id (uuid, foreign key to conversations.id)
- user_id (uuid, foreign key to profiles.id)
- created_at (timestamp with time zone)

### messages
- id (uuid, primary key)
- created_at (timestamp with time zone)
- conversation_id (uuid, foreign key to conversations.id)
- sender_id (uuid, foreign key to profiles.id)
- content (text)
- is_read (boolean)

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Technologies Used

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase
- React
- ESLint 