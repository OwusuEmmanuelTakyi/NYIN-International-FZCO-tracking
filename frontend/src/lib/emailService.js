import { supabase } from './supabase.js'

export async function sendOrderNotification({ type, order, recipientEmail, recipientName }) {
  try {
    const { error } = await supabase.functions.invoke('send-notification', {
      body: { type, order, recipientEmail, recipientName }
    })
    if (error) console.warn('Email notification failed (non-blocking):', error)
  } catch (err) {
    console.warn('Email notification failed (non-blocking):', err)
  }
}