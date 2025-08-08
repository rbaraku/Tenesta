// Shared Security Utilities for Supabase Edge Functions
// Input validation, sanitization, and security headers

export interface SecurityConfig {
  enableRateLimit: boolean;
  maxRequestsPerMinute: number;
  requireAuth: boolean;
  validateInput: boolean;
}

// Input sanitization helpers
export const sanitizeString = (input: string, maxLength: number = 1000): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove HTML tags and potentially dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>?/gm, '')
    .replace(/[<>'"&]/g, (char) => {
      const htmlEntities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return htmlEntities[char] || char;
    })
    .trim()
    .substring(0, maxLength);
};

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Password strength validation
export const isValidPassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!password || password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Rate limiting using in-memory store (for production, use Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (
  identifier: string,
  maxRequests: number = 60,
  windowMinutes: number = 1
): { allowed: boolean; remaining: number; resetTime: number } => {
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  const key = identifier;
  
  const record = requestCounts.get(key);
  
  if (!record || now > record.resetTime) {
    // New window or expired window
    const resetTime = now + windowMs;
    requestCounts.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: maxRequests - 1, resetTime };
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }
  
  record.count += 1;
  requestCounts.set(key, record);
  
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime
  };
};

// Security headers for responses
export const getSecurityHeaders = () => ({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
});

// Input validation for API requests
export const validateApiInput = (data: any, schema: Record<string, any>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    // Required field check
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`Field '${field}' is required`);
      continue;
    }
    
    // Skip further validation if field is not provided and not required
    if (value === undefined || value === null) {
      continue;
    }
    
    // Type validation
    if (rules.type && typeof value !== rules.type) {
      errors.push(`Field '${field}' must be of type ${rules.type}`);
      continue;
    }
    
    // String length validation
    if (rules.type === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`Field '${field}' must be at least ${rules.minLength} characters`);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`Field '${field}' must not exceed ${rules.maxLength} characters`);
      }
    }
    
    // Number validation
    if (rules.type === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`Field '${field}' must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`Field '${field}' must not exceed ${rules.max}`);
      }
    }
    
    // Email validation
    if (rules.format === 'email' && !isValidEmail(value)) {
      errors.push(`Field '${field}' must be a valid email address`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Authentication helper
export const validateAuth = async (request: Request, supabaseClient: any): Promise<{ user: any; error?: string }> => {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid authorization header' };
  }
  
  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    
    if (error || !user) {
      return { user: null, error: 'Invalid or expired token' };
    }
    
    return { user, error: undefined };
  } catch (err) {
    return { user: null, error: 'Authentication verification failed' };
  }
};

// Cleanup old rate limit records (call periodically)
export const cleanupRateLimit = () => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key);
    }
  }
};