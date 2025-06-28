// Email utilities for AIventory
// Note: Email confirmations are now handled automatically by Supabase Auth
// This file contains utility functions for potential future email notifications

/**
 * Email confirmation is now handled automatically by Supabase Auth.
 * When users sign up, Supabase will:
 * 1. Send a confirmation email automatically
 * 2. Use the template defined in supabase/templates/confirm.html
 * 3. For local development: emails are captured in Inbucket (http://localhost:54324)
 * 4. For production: configure SMTP in Supabase Dashboard if needed
 */

// Utility function to get email confirmation status
export const getEmailConfirmationStatus = (user: any) => {
  return {
    isConfirmed: user?.email_confirmed_at !== null,
    email: user?.email,
    confirmationSentAt: user?.confirmation_sent_at
  };
};

// Utility function to resend confirmation email (handled by Supabase)
export const resendConfirmationEmail = async (email: string) => {
  // This would be handled by Supabase Auth's resend confirmation
  // Implementation depends on your auth flow
  console.log(`Confirmation email resend requested for: ${email}`);
  // You can implement this using supabase.auth.resend() if needed
};

// Future: Custom notification emails can be added here
// For now, all authentication emails are handled by Supabase automatically