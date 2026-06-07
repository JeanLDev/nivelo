import { supabase } from "../lib/supabase"

const storage = {
    getUser: async () => {
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      console.log(error)
      return null
    }

    return data.user
  },
  getCollaboratorPermissions: async (role_id) => {

    const { data, error } = await supabase
    .from('permissions_collaborators')
    .select('*')
    .eq('role_id', role_id)
    .maybeSingle()

    if (error) {
      console.log(error)
      return null
    }

    return data    
  },
  getCollaborator: async () => {

    const user = await storage.getUser()

    const { data, error } = await supabase
    .from('collaborators')
    .select('*')
    .eq('email', user.email)
    .maybeSingle()


    if (error) {
      console.log(error)
      return null
    }

    return data    
  },
  getEvents: async () => {
    const collab = await storage.getCollaborator();

    const { data, error } = await supabase
      .from("eventos")
      .select("*")
      .eq("user_id", collab?.user_id)
      .order("created_at", { ascending: false });

    if (error) throw console.error(error);

    return data || [];
  },
  getEventById: async (id) => {

    const collab = await storage.getCollaborator()
    const { data, error } = await supabase
      .from("eventos")
      .select("*, discount_event(*)")
      .eq("id", id)
      .eq('user_id', collab?.user_id)
      .single();

    if (error) throw error;

    return data;
  },
   getRegistrations: async (eventId) => {

    let query = supabase
      .from("registrations_events")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  },
  deleteRegistration: async (regId) => {

    const { error } = await supabase
      .from("registrations_events")
      .delete()
      .eq("id", regId)

    if (error) throw error;

    return true;
  },
}
export default storage