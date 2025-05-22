'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { Database } from '../../types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']
type Message = Database['public']['Tables']['messages']['Row']

export default function ChatsPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        setError(null)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          setError('Authentication error. Please try logging in again.')
          return
        }

        if (!session) {
          router.push('/login')
          return
        }

        console.log('Current session user:', session.user)

        // First, check if the profile exists
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking profile:', checkError)
          setError('Failed to check profile. Please try again.')
          return
        }

        // If profile doesn't exist, create it
        if (!existingProfile) {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              username: session.user.email?.split('@')[0] || 'user',
              full_name: session.user.user_metadata?.full_name || 'User',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (createError) {
            console.error('Error creating profile:', createError)
            setError('Failed to create profile. Please try again.')
            return
          }

          setCurrentUser(newProfile)
        } else {
          setCurrentUser(existingProfile)
        }

        // Fetch all other users
        const { data: otherUsers, error: usersError } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', session.user.id)
        
        if (usersError) {
          console.error('Error fetching other users:', usersError)
          setError('Failed to load other users. Please try again.')
          return
        }

        console.log('Other users found:', otherUsers)
        setUsers(otherUsers || [])
      } catch (error) {
        console.error('Error in checkUser:', error)
        setError('An unexpected error occurred. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [router])

  useEffect(() => {
    if (!selectedUser || !currentUser) return

    const fetchMessages = async () => {
      try {
        // Get or create conversation
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .select('id')
          .or(`and(participants.cs.{${currentUser.id}},participants.cs.{${selectedUser.id}})`)
          .single()

        if (convError && convError.code !== 'PGRST116') throw convError

        if (conversation) {
          const { data: messages, error: msgError } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: true })

          if (msgError) throw msgError
          setMessages(messages || [])
        } else {
          setMessages([])
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
        alert('Error loading messages')
      }
    }

    fetchMessages()

    // Subscribe to new messages
    const subscription = supabase
      .channel(`messages:${selectedUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedUser.id}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [selectedUser, currentUser])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUser || !currentUser) return

    try {
      // Get or create conversation
      let conversationId: string
      const { data: existingConversation, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participants.cs.{${currentUser.id}},participants.cs.{${selectedUser.id}})`)
        .single()

      if (convError && convError.code !== 'PGRST116') throw convError

      if (existingConversation) {
        conversationId = existingConversation.id
      } else {
        const { data: newConversation, error: newConvError } = await supabase
          .from('conversations')
          .insert({
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_message_at: new Date().toISOString(),
          })
          .select()
          .single()
        
        if (newConvError) throw newConvError
        if (!newConversation) throw new Error('Failed to create conversation')
        
        conversationId = newConversation.id

        // Add participants
        const { error: participantsError } = await supabase
          .from('conversation_participants')
          .insert([
            { conversation_id: conversationId, user_id: currentUser.id },
            { conversation_id: conversationId, user_id: selectedUser.id },
          ])

        if (participantsError) throw participantsError
      }

      // Send message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUser.id,
          content: newMessage.trim(),
          is_read: false,
        })

      if (messageError) throw messageError
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Error sending message')
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-1/4 bg-white border-r">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Chats</h2>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-4rem)]">
          {users.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No users found
            </div>
          ) : (
            users.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`w-full p-4 text-left hover:bg-gray-50 ${
                  selectedUser?.id === user.id ? 'bg-gray-100' : ''
                }`}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="w-full h-full rounded-full"
                      />
                    ) : (
                      <span className="text-gray-500">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="ml-3">
                    <div className="font-medium">{user.full_name}</div>
                    <div className="text-sm text-gray-500">@{user.username}</div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  {selectedUser.avatar_url ? (
                    <img
                      src={selectedUser.avatar_url}
                      alt={selectedUser.username}
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    <span className="text-gray-500">
                      {selectedUser.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="ml-3">
                  <div className="font-medium">{selectedUser.full_name}</div>
                  <div className="text-sm text-gray-500">@{selectedUser.username}</div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender_id === currentUser?.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="p-4 border-t bg-white">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-gray-500">Select a chat to start messaging</div>
          </div>
        )}
      </div>
    </div>
  )
} 