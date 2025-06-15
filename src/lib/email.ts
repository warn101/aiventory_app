// Email service integration with Supabase Edge Functions
interface EmailTemplate {
  welcome: {
    subject: string;
    templateId: string;
  };
  toolSubmission: {
    subject: string;
    templateId: string;
  };
  passwordReset: {
    subject: string;
    templateId: string;
  };
}

const EMAIL_TEMPLATES: EmailTemplate = {
  welcome: {
    subject: 'Welcome to AIventory!',
    templateId: 'welcome-template'
  },
  toolSubmission: {
    subject: 'New Tool Submission - AIventory',
    templateId: 'tool-submission-template'
  },
  passwordReset: {
    subject: 'Reset Your AIventory Password',
    templateId: 'password-reset-template'
  }
};

export const sendEmail = async (
  type: keyof EmailTemplate,
  to: string,
  templateData: Record<string, any> = {}
) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing');
  }

  const template = EMAIL_TEMPLATES[type];
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject: template.subject,
        templateId: template.templateId,
        templateData
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send email');
    }

    return await response.json();
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

// Specific email functions
export const sendWelcomeEmail = async (userEmail: string, userName: string) => {
  return sendEmail('welcome', userEmail, {
    user_name: userName,
    login_url: `${window.location.origin}/login`
  });
};

export const sendToolSubmissionNotification = async (
  adminEmail: string,
  toolData: {
    name: string;
    submitterEmail: string;
    category: string;
    url: string;
  }
) => {
  return sendEmail('toolSubmission', adminEmail, {
    tool_name: toolData.name,
    submitter_email: toolData.submitterEmail,
    category: toolData.category,
    tool_url: toolData.url,
    review_url: `${window.location.origin}/admin/tools`
  });
};

export const sendPasswordResetEmail = async (userEmail: string, resetLink: string) => {
  return sendEmail('passwordReset', userEmail, {
    reset_link: resetLink,
    user_email: userEmail
  });
};