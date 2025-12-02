import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

const hasSupabase = !!supabaseUrl && !!supabaseAnonKey;
if (!hasSupabase) {
  console.error('Missing Supabase credentials in environment variables');
}

export const supabase = hasSupabase ? createClient(supabaseUrl, supabaseAnonKey) : (null as any);

function supabaseNotConfiguredError() {
  return new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your deployment environment.');
}

// ==================== AUTH FUNCTIONS ====================

export const signUp = async (email: string, password: string, fullName: string) => {
  if (!hasSupabase) {
    const error = supabaseNotConfiguredError();
    console.error('Sign up error:', error);
    return { user: null, error };
  }
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });
    
    if (error) throw error;
    return { user: data.user, error: null };
  } catch (error) {
    console.error('Sign up error:', error);
    return { user: null, error };
  }
};

export const signIn = async (email: string, password: string) => {
  if (!hasSupabase) {
    const error = supabaseNotConfiguredError();
    console.error('Sign in error:', error);
    return { user: null, error };
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return { user: data.user, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    return { user: null, error };
  }
};

export const signOut = async () => {
  if (!hasSupabase) {
    const error = supabaseNotConfiguredError();
    console.error('Sign out error:', error);
    return { error };
  }
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Sign out error:', error);
    return { error };
  }
};

export const getCurrentUser = async () => {
  if (!hasSupabase) {
    const error = supabaseNotConfiguredError();
    console.error('Get current user error:', error);
    return { user: null, error };
  }
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user, error: null };
  } catch (error) {
    console.error('Get current user error:', error);
    return { user: null, error };
  }
};

export const onAuthStateChange = (callback: (user: any) => void) => {
  if (!hasSupabase) {
    // return a noop-like subscription object to avoid callers breaking
    return { data: { subscription: { unsubscribe: () => {} } } } as any;
  }
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
};

// ==================== USER PROFILE FUNCTIONS ====================

export const createUserProfile = async (userId: string, fullName: string, email: string) => {
  if (!hasSupabase) {
    const error = supabaseNotConfiguredError();
    console.error('Create user profile error:', error);
    return { data: null, error };
  }
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          full_name: fullName,
          email: email,
          created_at: new Date()
        }
      ])
      .select();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Create user profile error:', error);
    return { data: null, error };
  }
};

export const getUserProfile = async (userId: string) => {
  if (!hasSupabase) {
    const error = supabaseNotConfiguredError();
    console.error('Get user profile error:', error);
    return { data: null, error };
  }
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Get user profile error:', error);
    return { data: null, error };
  }
};

// ==================== WORKFLOWS FUNCTIONS ====================

export const createWorkflow = async (
  userId: string,
  title: string,
  description: string,
  steps: any[]
) => {
  if (!hasSupabase) {
    const error = supabaseNotConfiguredError();
    console.error('Create workflow error:', error);
    return { data: null, error };
  }
  try {
    const { data, error } = await supabase
      .from('workflows')
      .insert([
        {
          created_by: userId,
          title,
          description,
          steps: steps,
          created_at: new Date(),
          updated_at: new Date()
        }
      ])
      .select();
    
    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    console.error('Create workflow error:', error);
    return { data: null, error };
  }
};

export const getUserWorkflows = async (userId: string) => {
  if (!hasSupabase) {
    const error = supabaseNotConfiguredError();
    console.error('Get user workflows error:', error);
    return { data: null, error };
  }
  try {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Get user workflows error:', error);
    return { data: null, error };
  }
};

export const updateWorkflow = async (
  workflowId: string,
  title: string,
  description: string,
  steps: any[]
) => {
  if (!hasSupabase) {
    const error = supabaseNotConfiguredError();
    console.error('Update workflow error:', error);
    return { data: null, error };
  }
  try {
    const { data, error } = await supabase
      .from('workflows')
      .update({
        title,
        description,
        steps: steps,
        updated_at: new Date()
      })
      .eq('id', workflowId)
      .select();
    
    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    console.error('Update workflow error:', error);
    return { data: null, error };
  }
};

export const deleteWorkflow = async (workflowId: string) => {
  if (!hasSupabase) {
    const error = supabaseNotConfiguredError();
    console.error('Delete workflow error:', error);
    return { error };
  }
  try {
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', workflowId);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Delete workflow error:', error);
    return { error };
  }
};

// ==================== GROUPS FUNCTIONS ====================

export const createGroup = async (
  userId: string,
  name: string,
  description: string,
  privacy: 'private' | 'public' = 'private'
) => {
  if (!hasSupabase) {
    const error = supabaseNotConfiguredError();
    console.error('Create group error:', error);
    return { data: null, error };
  }
  try {
    const { data, error } = await supabase
      .from('groups')
      .insert([
        {
          name,
          description,
          created_by: userId,
          privacy,
          created_at: new Date()
        }
      ])
      .select();
    
    if (error) throw error;
    
    // Add creator as admin member
    if (data?.[0]?.id) {
      await addGroupMember(data[0].id, userId, 'admin');
    }
    
    return { data: data?.[0], error: null };
  } catch (error) {
    console.error('Create group error:', error);
    return { data: null, error };
  }
};

export const getUserGroups = async (userId: string) => {
  if (!hasSupabase) {
    const error = supabaseNotConfiguredError();
    console.error('Get user groups error:', error);
    return { data: null, error };
  }
  try {
    const { data, error } = await supabase
      .from('group_members')
      .select('group_id, groups(*)')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });
    
    if (error) throw error;
    return { data: data?.map(item => item.groups), error: null };
  } catch (error) {
    console.error('Get user groups error:', error);
    return { data: null, error };
  }
};

export const addGroupMember = async (
  groupId: string,
  userId: string,
  role: 'admin' | 'member' = 'member'
) => {
  if (!hasSupabase) {
    const error = supabaseNotConfiguredError();
    console.error('Add group member error:', error);
    return { data: null, error };
  }
  try {
    const { data, error } = await supabase
      .from('group_members')
      .insert([
        {
          group_id: groupId,
          user_id: userId,
          role,
          joined_at: new Date()
        }
      ])
      .select();
    
    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    console.error('Add group member error:', error);
    return { data: null, error };
  }
};

export const getGroupMembers = async (groupId: string) => {
  if (!hasSupabase) {
    const error = supabaseNotConfiguredError();
    console.error('Get group members error:', error);
    return { data: null, error };
  }
  try {
    const { data, error } = await supabase
      .from('group_members')
      .select('*, users(*)')
      .eq('group_id', groupId);
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Get group members error:', error);
    return { data: null, error };
  }
};

export const removeGroupMember = async (groupId: string, userId: string) => {
  if (!hasSupabase) {
    const error = supabaseNotConfiguredError();
    console.error('Remove group member error:', error);
    return { error };
  }
  try {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Remove group member error:', error);
    return { error };
  }
};

// ==================== WORKFLOW SHARING FUNCTIONS ====================

export const shareWorkflow = async (
  workflowId: string,
  shareType: 'private' | 'group' | 'public',
  sharedWithUserId?: string,
  sharedWithGroupId?: string
) => {
  if (!hasSupabase) {
    const error = supabaseNotConfiguredError();
    console.error('Share workflow error:', error);
    return { data: null, error };
  }
  try {
    const { data, error } = await supabase
      .from('workflow_sharing')
      .insert([
        {
          workflow_id: workflowId,
          shared_with_user_id: sharedWithUserId || null,
          shared_with_group_id: sharedWithGroupId || null,
          share_type: shareType,
          shared_at: new Date()
        }
      ])
      .select();
    
    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    console.error('Share workflow error:', error);
    return { data: null, error };
  }
};

export const getSharedWorkflows = async (userId: string) => {
  if (!hasSupabase) {
    const error = supabaseNotConfiguredError();
    console.error('Get shared workflows error:', error);
    return { data: null, error };
  }
  try {
    const { data, error } = await supabase
      .from('workflow_sharing')
      .select('*, workflows(*)')
      .or(`shared_with_user_id.eq.${userId},share_type.eq.public`)
      .order('shared_at', { ascending: false });
    
    if (error) throw error;
    return { data: data?.map(item => item.workflows), error: null };
  } catch (error) {
    console.error('Get shared workflows error:', error);
    return { data: null, error };
  }
};

// ==================== SEARCH FUNCTIONS ====================

export const searchWorkflows = async (query: string) => {
  if (!hasSupabase) {
    const error = supabaseNotConfiguredError();
    console.error('Search workflows error:', error);
    return { data: null, error };
  }
  try {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Search workflows error:', error);
    return { data: null, error };
  }
};

export const searchPublicWorkflows = async (query: string) => {
  if (!hasSupabase) {
    const error = supabaseNotConfiguredError();
    console.error('Search public workflows error:', error);
    return { data: null, error };
  }
  try {
    const { data, error } = await supabase
      .from('workflow_sharing')
      .select('*, workflows(*)')
      .eq('share_type', 'public')
      .or(`workflows.title.ilike.%${query}%,workflows.description.ilike.%${query}%`)
      .order('shared_at', { ascending: false });
    
    if (error) throw error;
    return { data: data?.map(item => item.workflows), error: null };
  } catch (error) {
    console.error('Search public workflows error:', error);
    return { data: null, error };
  }
};
