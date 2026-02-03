import User from '../models/User.js';
import { getSupabaseAdmin } from '../config/supabaseClient.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.replace('Bearer ', '').trim()
      : null;

    if (!token) {
      return res.status(401).json({ message: 'Missing Bearer token' });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ message: 'Invalid auth token' });
    }

    const supabaseUser = data.user;
    let user = await User.findOne({ supabaseId: supabaseUser.id });

    if (!user) {
      // Check if user exists by email (for pre-created staff/admin users)
      user = await User.findOne({ email: supabaseUser.email });
      
      if (user) {
        // Update existing user with supabaseId
        console.log('🔄 Linking existing user:', user.email, 'Role:', user.role);
        user.supabaseId = supabaseUser.id;
        await user.save();
      } else {
        // Create new user - check role from signup metadata
        const signupRole = supabaseUser.user_metadata?.role || 'student';
        const regno = supabaseUser.user_metadata?.registration_no || null;
        console.log('➕ Creating new', signupRole, 'user:', supabaseUser.email);
        user = await User.create({
          supabaseId: supabaseUser.id,
          email: supabaseUser.email,
          name: supabaseUser.user_metadata?.full_name || supabaseUser.email || 'New User',
          regno: regno,
          role: signupRole,
          canUpload: signupRole === 'student' ? true : false, // Staff needs approval
        });
      }
    } else {
      console.log('✅ Found user:', user.email, 'Role:', user.role);
    }

    req.authUser = supabaseUser;
    req.user = user;

    return next();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Auth error:', err);
    return res.status(500).json({ message: 'Authentication failed' });
  }
};

export const requireRole = (roles = []) => {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }

    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden for this role' });
    }

    return next();
  };
};

export const requireUploader = () => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthenticated' });
  }

  if (req.user.role === 'admin' || req.user.role === 'staff') {
    return next();
  }

  if (req.user.canUpload) {
    return next();
  }

  return res.status(403).json({ message: 'Upload rights are required' });
};
