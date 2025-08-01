import { redirect, fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from './$types';
import { fetchApiClientSettings } from '$lib/models/apiClient';

export const load: PageServerLoad = async ({ locals }) => {
  const { pb, user } = locals;
  
  // Protect this route - only authenticated users can access it
  if (!user) {
    throw redirect(303, "/login");
  }
  
  let apiClientSettings = null;
  let callLogs = [];
  
  try {
    apiClientSettings = await fetchApiClientSettings(pb, user.id);
  } catch (error) {
    console.error('Error fetching API client settings:', error);
  }
  
  try {
    // Fetch call logs for the current user with expanded relations
    console.log('Fetching call logs for user:', user.id);
    const records = await pb.collection('call_logs').getList(1, 50, {
      filter: `user="${user.id}"`,
      sort: '-created',
      expand: 'client_name' // Expand the client relation to get client data
    });
    
    console.log('Found call logs:', records.items.length);
    
    callLogs = records.items.map(record => ({
      id: record.id,
      clientName: record.expand?.client_name?.name || 'Unknown',
      phoneNumber: record.expand?.client_name?.phone || '',
      created: record.created,
      duration: record.duration || 0,
      status: record.status || 'completed'
    }));
  } catch (error) {
    console.error('Error fetching call logs:', error);
    console.error('Error details:', error);
  }
  
  return {
    user,
    apiClientSettings,
    callLogs
  };
};

export const actions: Actions = {
  endCall: async ({ locals, request }) => {
    const { pb, user } = locals;

    if (!user) {
      throw redirect(303, "/login");
    }

    const formData = await request.formData();
    const callLogId = formData.get('callLogId')?.toString();

    if (!callLogId) {
      return fail(400, {
        success: false,
        message: "Call log ID is required"
      });
    }

    try {
      // Update the most recent call log status to 'Ended'
      const records = await pb.collection('call_logs').getList(1, 1, {
        filter: `user="${user.id}" && status="Initiated"`,
        sort: '-created'
      });

      if (records.items.length > 0) {
        await pb.collection('call_logs').update(records.items[0].id, {
          status: 'Ended'
        });
        
        console.log('Updated call log status to Ended:', records.items[0].id);
      }

      return {
        success: true,
        message: "Call ended successfully"
      };
    } catch (error) {
      console.error('Error ending call:', error);
      return fail(500, {
        success: false,
        message: `Error ending call: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  },
  logCall: async ({ locals, request }) => {
    const { pb, user } = locals;

    if (!user) {
      throw redirect(303, "/login");
    }

    const formData = await request.formData();
    const clientName = formData.get('clientName')?.toString();
    const phoneNumber = formData.get('phoneNumber')?.toString();

    if (!clientName || !phoneNumber) {
      return fail(400, {
        success: false,
        message: "Client name and phone number are required"
      });
    }

    try {
      console.log('Creating call log with data:', {
        user: user.id,
        clientName,
        phoneNumber
      });

      // Find existing client by phone number (and name if not Manual Dial)
      let clientRecord;
      
      // Normalize phone number for comparison (remove +, 0 prefix, spaces, dashes)
      function normalizePhone(phone) {
        return phone.replace(/[^\d]/g, '').replace(/^0+/, '');
      }
      
      const normalizedInputPhone = normalizePhone(phoneNumber);
      console.log('Normalized input phone:', normalizedInputPhone);
      
      try {
        let clients;
        
        if (clientName === 'Manual Dial') {
          // For manual dial, search all clients by phone number only
          console.log('Manual dial - searching all clients by phone');
          clients = await pb.collection('clients').getFullList();
        } else {
          // For contact calls, search by name first
          console.log('Contact call - searching by name:', clientName);
          clients = await pb.collection('clients').getFullList({
            filter: `name="${clientName}"`
          });
        }
        
        console.log('Found clients to check:', clients.length);
        
        // Find client with matching phone using substring matching
        clientRecord = clients.find(client => {
          const normalizedClientPhone = normalizePhone(client.phone || '');
          console.log('Comparing:', normalizedInputPhone, 'vs', normalizedClientPhone, 'for client:', client.name);
          
          // Check if either phone contains the other (for cases like 0774463442 vs 40774463442)
          const phoneMatch = normalizedInputPhone.includes(normalizedClientPhone) || 
                           normalizedClientPhone.includes(normalizedInputPhone) ||
                           normalizedInputPhone === normalizedClientPhone;
          
          if (phoneMatch) {
            console.log('Phone match found for client:', client.name);
          }
          
          return phoneMatch;
        });
        
        if (!clientRecord) {
          throw new Error('No matching client found');
        }
        
        console.log('Found existing client:', clientRecord.id, clientRecord.name);
      } catch (error) {
        console.log('Client not found in database:', error.message);
        return fail(400, {
          success: false,
          message: "Client not found. Please add the client to your contacts first."
        });
      }
      
      const record = await pb.collection('call_logs').create({
        user: user.id,
        client_name: clientRecord.id,
        status: 'Initiated'
      });
      
      console.log('Call log created successfully:', record.id);
      
      return {
        success: true,
        message: "Call logged successfully"
      };
    } catch (error) {
      console.error('Error logging call:', error);
      console.error('Error details:', error);
      return fail(500, {
        success: false,
        message: `Error logging call: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
};